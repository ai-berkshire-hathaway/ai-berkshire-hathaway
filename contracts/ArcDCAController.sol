
```solidity
// contracts/ArcDCAController.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal ERC20 interface for USDC
interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

/// @notice Minimal Pyth interface placeholder
/// Replace with the official interface for Arc once available.
interface IPyth {
    function updatePriceFeeds(bytes[] calldata updateData) external payable;
    function getPriceUnsafe(bytes32 id) external view returns (int64 price, int32 expo, uint64 publishTime);
}

/// @title ArcDCAController
/// @notice Holds USDC on Arc, reads BTC/USD from Pyth, and emits DCA events for backend execution
contract ArcDCAController {
    IERC20 public immutable usdc;
    IPyth  public immutable pyth;
    bytes32 public immutable btcUsdPriceId;

    address public owner;

    // Thresholds in normalized integer format (e.g. USD * 10^2)
    uint256[] public thresholds;
    uint256[] public amounts; // USDC to invest per threshold (6 decimals)

    mapping(uint256 => bool) public executed; // threshold index => executed in current cycle

    int64   public lastPrice;
    int32   public lastExpo;
    uint64  public lastPublishTime;

    event PriceUpdated(int64 price, int32 expo, uint64 publishTime);

    event DCARequested(
        uint256 indexed planId,
        uint256 indexed thresholdIndex,
        uint256 usdcAmount,
        int64   price,
        int32   expo,
        uint64  publishTime
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(
        address _usdc,
        address _pyth,
        bytes32 _btcUsdPriceId,
        uint256[] memory _thresholds,
        uint256[] memory _amounts
    ) {
        require(_thresholds.length == _amounts.length, "length mismatch");
        owner = msg.sender;
        usdc = IERC20(_usdc);
        pyth = IPyth(_pyth);
        btcUsdPriceId = _btcUsdPriceId;
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

    /// @notice Called by backend every ~10 minutes with Pyth price update data
    function updatePriceAndMaybeInvest(bytes[] calldata priceUpdateData) external payable {
        // 1. Update price feeds on-chain. Pyth usually requires msg.value as fee.
        if (priceUpdateData.length > 0) {
            pyth.updatePriceFeeds{value: msg.value}(priceUpdateData);
        }

        // 2. Read BTC/USD price
        (int64 price, int32 expo, uint64 publishTime) = pyth.getPriceUnsafe(btcUsdPriceId);
        lastPrice = price;
        lastExpo  = expo;
        lastPublishTime = publishTime;

        emit PriceUpdated(price, expo, publishTime);

        int256 normalizedPrice = _normalizePrice(price, expo);

        // 3. Iterate thresholds and emit DCA requests
        for (uint256 i = 0; i < thresholds.length; i++) {
            if (!executed[i] && normalizedPrice <= int256(thresholds[i])) {
                uint256 amountUsdc = amounts[i];
                require(usdc.balanceOf(address(this)) >= amountUsdc, "insufficient USDC");

                executed[i] = true;

                emit DCARequested(
                    block.number, // planId placeholder
                    i,
                    amountUsdc,
                    price,
                    expo,
                    publishTime
                );

                // Actual cross-chain + swap is handled off-chain by backend.
            }
        }
    }

    /// @dev Normalize Pyth price to a common exponent (e.g. USD * 10^2)
    function _normalizePrice(int64 price, int32 expo) internal pure returns (int256) {
        int256 p = int256(price);
        int32 targetExpo = -2; // price with 2 decimal places

        if (expo == targetExpo) {
            return p;
        } else if (expo > targetExpo) {
            // fewer decimals => multiply
            uint32 diff = uint32(uint32(expo - targetExpo));
            return p * int256(10 ** diff);
        } else {
            // more decimals => divide
            uint32 diff = uint32(uint32(targetExpo - expo));
            return p / int256(10 ** diff);
        }
    }

    /// @notice Update thresholds and amounts (e.g. for new strategy parameters)
    function setPlan(uint256[] calldata _thresholds, uint256[] calldata _amounts) external onlyOwner {
        require(_thresholds.length == _amounts.length, "length mismatch");
        thresholds = _thresholds;
        amounts = _amounts;
    }

    function planLength() external view returns (uint256) {
        return thresholds.length;
    }
}