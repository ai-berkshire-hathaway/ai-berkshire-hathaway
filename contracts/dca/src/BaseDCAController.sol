// contracts/BaseDCAController.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal ERC20 interface for USDC
interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

/// @notice Chainlink Aggregator V3 Interface
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 price,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

/// @title BaseDCAController
/// @notice DCA Controller deployed on Base, using Chainlink BTC/USD price feeds
/// @dev This replaces the Arc-based Pyth solution with native Base + Chainlink integration
contract BaseDCAController {
    IERC20 public immutable usdc;
    AggregatorV3Interface public immutable btcUsdPriceFeed;
    
    address public owner;
    
    // Price staleness threshold (in seconds)
    uint256 public constant PRICE_STALENESS_THRESHOLD = 3600; // 1 hour
    
    // Price sanity check bounds (in USD with 8 decimals, matching Chainlink)
    int256 public constant MIN_REASONABLE_PRICE = 10000 * 10**8; // $10,000
    int256 public constant MAX_REASONABLE_PRICE = 500000 * 10**8; // $500,000
    
    // Thresholds in USD with 8 decimals (matching Chainlink format)
    uint256[] public thresholds;
    uint256[] public amounts; // USDC to invest per threshold (6 decimals)
    
    mapping(uint256 => bool) public executed; // threshold index => executed in current cycle
    
    // Last price data for reference
    int256 public lastPrice;
    uint256 public lastUpdatedAt;
    uint80 public lastRoundId;
    
    // Proof of Reserve data
    struct ReserveProof {
        uint256 timestamp;
        uint256 usdcBalance;
        uint256 totalInvested;
        int256 btcPrice;
        uint256 portfolioValueUsd; // in USD with 6 decimals
    }
    
    ReserveProof[] public reserveProofs;
    
    event PriceUpdated(int256 price, uint256 updatedAt, uint80 roundId);
    
    event DCARequested(
        uint256 indexed planId,
        uint256 indexed thresholdIndex,
        uint256 usdcAmount,
        int256 price,
        uint256 updatedAt
    );
    
    event ReserveProofGenerated(
        uint256 indexed proofId,
        uint256 timestamp,
        uint256 usdcBalance,
        uint256 totalInvested,
        int256 btcPrice,
        uint256 portfolioValueUsd
    );
    
    error PriceStale(uint256 updatedAt, uint256 threshold);
    error PriceOutOfBounds(int256 price, int256 min, int256 max);
    error InsufficientBalance(uint256 required, uint256 available);
    error Unauthorized();
    error InvalidInput();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    constructor(
        address _usdc,
        address _btcUsdPriceFeed,
        uint256[] memory _thresholds,
        uint256[] memory _amounts
    ) {
        if (_thresholds.length != _amounts.length) revert InvalidInput();
        
        owner = msg.sender;
        usdc = IERC20(_usdc);
        btcUsdPriceFeed = AggregatorV3Interface(_btcUsdPriceFeed);
        thresholds = _thresholds;
        amounts = _amounts;
    }
    
    /// @notice Deposit USDC into the strategy vault
    function deposit(uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
    }
    
    /// @notice Owner can withdraw USDC (e.g. for upgrades or closing strategy)
    function withdraw(uint256 amount) external onlyOwner {
        require(usdc.transfer(msg.sender, amount), "transfer failed");
    }
    
    /// @notice Reset all threshold execution flags for a new cycle
    function resetExecuted() external onlyOwner {
        for (uint256 i = 0; i < thresholds.length; i++) {
            executed[i] = false;
        }
    }
    
    /// @notice Update price from Chainlink and check for DCA opportunities
    /// @dev No external price data needed - reads directly from Chainlink
    function updatePriceAndMaybeInvest() external {
        // 1. Read latest price from Chainlink
        (
            uint80 roundId,
            int256 price,
            ,
            uint256 updatedAt,
        ) = btcUsdPriceFeed.latestRoundData();
        
        // 2. Validate price data
        _validatePrice(price, updatedAt);
        
        // 3. Update state
        lastPrice = price;
        lastUpdatedAt = updatedAt;
        lastRoundId = roundId;
        
        emit PriceUpdated(price, updatedAt, roundId);
        
        // 4. Check thresholds and emit DCA requests
        _checkThresholdsAndInvest(price, updatedAt);
    }
    
    /// @notice Generate proof of reserves
    /// @param totalInvestedUsd Total amount invested in BTC (in USD with 6 decimals)
    function generateReserveProof(uint256 totalInvestedUsd) external onlyOwner {
        uint256 usdcBalance = usdc.balanceOf(address(this));
        
        // Get current BTC price
        (, int256 currentPrice, , uint256 updatedAt,) = btcUsdPriceFeed.latestRoundData();
        _validatePrice(currentPrice, updatedAt);
        
        // Calculate portfolio value: USDC balance + invested amount
        uint256 portfolioValueUsd = usdcBalance + totalInvestedUsd;
        
        ReserveProof memory proof = ReserveProof({
            timestamp: block.timestamp,
            usdcBalance: usdcBalance,
            totalInvested: totalInvestedUsd,
            btcPrice: currentPrice,
            portfolioValueUsd: portfolioValueUsd
        });
        
        reserveProofs.push(proof);
        
        emit ReserveProofGenerated(
            reserveProofs.length - 1,
            proof.timestamp,
            proof.usdcBalance,
            proof.totalInvested,
            proof.btcPrice,
            proof.portfolioValueUsd
        );
    }
    
    /// @notice Get the latest reserve proof
    function getLatestReserveProof() external view returns (ReserveProof memory) {
        require(reserveProofs.length > 0, "No proofs available");
        return reserveProofs[reserveProofs.length - 1];
    }
    
    /// @notice Get reserve proof by index
    function getReserveProof(uint256 index) external view returns (ReserveProof memory) {
        require(index < reserveProofs.length, "Index out of bounds");
        return reserveProofs[index];
    }
    
    /// @notice Get total number of reserve proofs
    function getReserveProofCount() external view returns (uint256) {
        return reserveProofs.length;
    }
    
    /// @dev Validate price data from Chainlink
    function _validatePrice(int256 price, uint256 updatedAt) internal view {
        // Check staleness
        if (block.timestamp - updatedAt > PRICE_STALENESS_THRESHOLD) {
            revert PriceStale(updatedAt, PRICE_STALENESS_THRESHOLD);
        }
        
        // Check price bounds
        if (price < MIN_REASONABLE_PRICE || price > MAX_REASONABLE_PRICE) {
            revert PriceOutOfBounds(price, MIN_REASONABLE_PRICE, MAX_REASONABLE_PRICE);
        }
    }
    
    /// @dev Check thresholds and emit DCA events
    function _checkThresholdsAndInvest(int256 price, uint256 updatedAt) internal {
        // Convert Chainlink price (8 decimals) to our threshold format (8 decimals)
        uint256 priceUint = uint256(price);
        
        for (uint256 i = 0; i < thresholds.length; i++) {
            if (!executed[i] && priceUint <= thresholds[i]) {
                uint256 amountUsdc = amounts[i];
                uint256 availableBalance = usdc.balanceOf(address(this));
                
                if (availableBalance < amountUsdc) {
                    revert InsufficientBalance(amountUsdc, availableBalance);
                }
                
                executed[i] = true;
                
                emit DCARequested(
                    block.number, // planId placeholder
                    i,
                    amountUsdc,
                    price,
                    updatedAt
                );
            }
        }
    }
    
    /// @notice Update thresholds and amounts (e.g. for new strategy parameters)
    function setPlan(uint256[] calldata _thresholds, uint256[] calldata _amounts) external onlyOwner {
        if (_thresholds.length != _amounts.length) revert InvalidInput();
        thresholds = _thresholds;
        amounts = _amounts;
    }
    
    /// @notice Get plan length
    function planLength() external view returns (uint256) {
        return thresholds.length;
    }
    
    /// @notice Get current BTC price from Chainlink (for external queries)
    function getCurrentPrice() external view returns (int256 price, uint256 updatedAt) {
        (, price, , updatedAt,) = btcUsdPriceFeed.latestRoundData();
    }
}
