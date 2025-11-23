// contracts/EnhancedDCAController.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRouterClient} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/ccip/libraries/Client.sol";
import {VRFCoordinatorV2Interface} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
// Chainlink Price Feed Interface
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 price,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

// ERC20 Interface
interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

/// @notice Enhanced DCA Controller with CCIP and VRF integration
/// @dev Demonstrates multiple Chainlink services for ETHGlobal Buenos Aires
contract EnhancedDCAController is VRFConsumerBaseV2 {

    
    // State variables
    IERC20 public immutable usdc;
    AggregatorV3Interface public immutable btcUsdPriceFeed;
    IRouterClient public immutable ccipRouter;
    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    
    address public owner;
    
    // CCIP Configuration
    uint64 public destinationChainSelector; // For cross-chain operations
    address public destinationReceiver;
    
    // VRF Configuration  
    uint64 public vrfSubscriptionId;
    bytes32 public vrfKeyHash;
    uint32 public vrfCallbackGasLimit = 100000;
    uint16 public vrfRequestConfirmations = 3;
    
    // DCA Configuration
    uint256[] public thresholds;
    uint256[] public amounts;
    mapping(uint256 => bool) public executed;
    
    // Enhanced features
    mapping(uint256 => bool) public randomizedExecutions; // VRF-based randomization
    mapping(uint256 => uint256) public vrfRequestToThreshold; // VRF request tracking
    
    // Cross-chain execution tracking
    struct CrossChainExecution {
        uint64 destinationChain;
        address destinationContract;
        uint256 amount;
        uint256 timestamp;
        bytes32 messageId;
    }
    
    mapping(uint256 => CrossChainExecution) public crossChainExecutions;
    uint256 public executionCounter;
    
    // Events
    event DCARequested(
        uint256 indexed planId,
        uint256 indexed thresholdIndex,
        uint256 usdcAmount,
        int256 price,
        uint256 updatedAt,
        bool randomized
    );
    
    event CrossChainDCAInitiated(
        uint256 indexed executionId,
        uint64 indexed destinationChain,
        address indexed destinationContract,
        uint256 amount,
        bytes32 messageId
    );
    
    event RandomnessRequested(
        bytes32 indexed requestId,
        uint256 indexed thresholdIndex
    );
    
    event RandomnessReceived(
        bytes32 indexed requestId,
        uint256 randomness,
        bool shouldExecute
    );
    
    // Errors
    error PriceStale(uint256 updatedAt, uint256 threshold);
    error PriceOutOfBounds(int256 price, int256 min, int256 max);
    error InsufficientBalance(uint256 required, uint256 available);
    error Unauthorized();
    error InvalidChainSelector();
    error CCIPExecutionFailed(bytes32 messageId);
    
    constructor(
        address _usdc,
        address _btcUsdPriceFeed,
        address _ccipRouter,
        address _vrfCoordinator,
        uint64 _vrfSubscriptionId,
        bytes32 _vrfKeyHash,
        uint256[] memory _thresholds,
        uint256[] memory _amounts
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        require(_thresholds.length == _amounts.length, "Length mismatch");
        
        owner = msg.sender;
        usdc = IERC20(_usdc);
        btcUsdPriceFeed = AggregatorV3Interface(_btcUsdPriceFeed);
        ccipRouter = IRouterClient(_ccipRouter);
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        
        vrfSubscriptionId = _vrfSubscriptionId;
        vrfKeyHash = _vrfKeyHash;
        thresholds = _thresholds;
        amounts = _amounts;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    /// @notice Enhanced price update with randomization and cross-chain execution
    function updatePriceAndMaybeInvest() external {
        // Get latest price from Chainlink
        (
            uint80 roundId,
            int256 price,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = btcUsdPriceFeed.latestRoundData();
        
        // Validate price data
        _validatePrice(price, updatedAt);
        
        // Check thresholds and potentially execute DCA
        _checkThresholdsAndInvest(price, updatedAt);
    }
    
    /// @notice Execute DCA with VRF randomization for timing optimization
    function executeRandomizedDCA(uint256 thresholdIndex) external onlyOwner {
        require(thresholdIndex < thresholds.length, "Invalid threshold index");
        
        // Request randomness from Chainlink VRF
        uint256 requestId = vrfCoordinator.requestRandomWords(
            vrfKeyHash,
            vrfSubscriptionId,
            vrfRequestConfirmations,
            vrfCallbackGasLimit,
            1 // Number of random words
        );
        
        vrfRequestToThreshold[requestId] = thresholdIndex;
        
        emit RandomnessRequested(bytes32(requestId), thresholdIndex);
    }
    
    /// @notice VRF callback - executes DCA based on randomness
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 thresholdIndex = vrfRequestToThreshold[requestId];
        uint256 randomness = randomWords[0];
        
        // Use randomness to determine execution timing (0-30% chance based on market conditions)
        bool shouldExecute = (randomness % 100) < 30;
        
        emit RandomnessReceived(bytes32(requestId), randomness, shouldExecute);
        
        if (shouldExecute && !executed[thresholdIndex]) {
            _executeDCA(thresholdIndex, true); // Mark as randomized execution
        }
    }
    
    /// @notice Execute DCA on destination chain using CCIP
    function executeCrossChainDCA(
        uint64 _destinationChainSelector,
        address _destinationReceiver,
        uint256 _amount
    ) external onlyOwner returns (bytes32 messageId) {
        if (_destinationChainSelector == 0) revert InvalidChainSelector();
        
        // Prepare CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(_destinationReceiver),
            data: abi.encodeWithSignature(
                "executeDCA(uint256,address)",
                _amount,
                msg.sender
            ),
            tokenAmounts: new Client.EVMTokenAmount[](1),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 300000})
            ),
            feeToken: address(0) // Pay fees in native token
        });
        
        // Configure token transfer
        message.tokenAmounts[0] = Client.EVMTokenAmount({
            token: address(usdc),
            amount: _amount
        });
        
        // Approve CCIP router to spend USDC
        usdc.approve(address(ccipRouter), _amount);
        
        // Calculate and pay CCIP fees
        uint256 fees = ccipRouter.getFee(_destinationChainSelector, message);
        require(address(this).balance >= fees, "Insufficient fee balance");
        
        // Send CCIP message
        messageId = ccipRouter.ccipSend{value: fees}(
            _destinationChainSelector,
            message
        );
        
        // Track cross-chain execution
        executionCounter++;
        crossChainExecutions[executionCounter] = CrossChainExecution({
            destinationChain: _destinationChainSelector,
            destinationContract: _destinationReceiver,
            amount: _amount,
            timestamp: block.timestamp,
            messageId: messageId
        });
        
        emit CrossChainDCAInitiated(
            executionCounter,
            _destinationChainSelector,
            _destinationReceiver,
            _amount,
            messageId
        );
        
        return messageId;
    }
    
    /// @notice Internal function to execute DCA
    function _executeDCA(uint256 thresholdIndex, bool randomized) internal {
        uint256 amountUsdc = amounts[thresholdIndex];
        uint256 availableBalance = usdc.balanceOf(address(this));
        
        if (availableBalance < amountUsdc) {
            revert InsufficientBalance(amountUsdc, availableBalance);
        }
        
        executed[thresholdIndex] = true;
        if (randomized) {
            randomizedExecutions[thresholdIndex] = true;
        }
        
        // Get current price for event
        (, int256 price, , uint256 updatedAt, ) = btcUsdPriceFeed.latestRoundData();
        
        emit DCARequested(
            block.number,
            thresholdIndex,
            amountUsdc,
            price,
            updatedAt,
            randomized
        );
    }
    
    /// @notice Check thresholds and execute DCA if conditions are met
    function _checkThresholdsAndInvest(int256 price, uint256 updatedAt) internal {
        uint256 priceUint = uint256(price);
        
        for (uint256 i = 0; i < thresholds.length; i++) {
            if (!executed[i] && priceUint <= thresholds[i]) {
                _executeDCA(i, false); // Not randomized
            }
        }
    }
    
    /// @notice Validate price data from Chainlink
    function _validatePrice(int256 price, uint256 updatedAt) internal view {
        // Check staleness (1 hour threshold)
        if (block.timestamp - updatedAt > 3600) {
            revert PriceStale(updatedAt, 3600);
        }
        
        // Check price bounds (assuming 8 decimals)
        int256 minPrice = 10000 * 10**8; // $10,000
        int256 maxPrice = 500000 * 10**8; // $500,000
        
        if (price < minPrice || price > maxPrice) {
            revert PriceOutOfBounds(price, minPrice, maxPrice);
        }
    }
    
    /// @notice Configure CCIP destination
    function setCCIPDestination(
        uint64 _chainSelector,
        address _receiver
    ) external onlyOwner {
        destinationChainSelector = _chainSelector;
        destinationReceiver = _receiver;
    }
    
    /// @notice Update VRF configuration
    function updateVRFConfig(
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit
    ) external onlyOwner {
        vrfSubscriptionId = _subscriptionId;
        vrfKeyHash = _keyHash;
        vrfCallbackGasLimit = _callbackGasLimit;
    }
    
    /// @notice Reset execution flags for new cycle
    function resetExecuted() external onlyOwner {
        for (uint256 i = 0; i < thresholds.length; i++) {
            executed[i] = false;
            randomizedExecutions[i] = false;
        }
    }
    
    /// @notice Withdraw USDC (owner only)
    function withdraw(uint256 amount) external onlyOwner {
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
    }
    
    /// @notice Deposit USDC
    function deposit(uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "TransferFrom failed");
    }
    
    /// @notice Receive ETH for CCIP fees
    receive() external payable {}
    
    /// @notice Get current BTC price
    function getCurrentPrice() external view returns (int256 price, uint256 updatedAt) {
        (, price, , updatedAt, ) = btcUsdPriceFeed.latestRoundData();
    }
    
    /// @notice Get cross-chain execution details
    function getCrossChainExecution(uint256 executionId) external view returns (CrossChainExecution memory) {
        return crossChainExecutions[executionId];
    }
}
