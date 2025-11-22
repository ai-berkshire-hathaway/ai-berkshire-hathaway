// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test } from "forge-std/Test.sol";

import { ArcDCAController, IERC20, IPyth } from "../src/ArcDCAController.sol";

contract MockUSDC is IERC20 {
    mapping(address => uint256) public override balanceOf;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transferFrom(address from, address to, uint256 value) external override returns (bool) {
        require(balanceOf[from] >= value, "insufficient balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        return true;
    }

    function transfer(address to, uint256 value) external override returns (bool) {
        require(balanceOf[msg.sender] >= value, "insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        return true;
    }
}

contract MockPyth is IPyth {
    int64 public price;
    int32 public expo;
    uint64 public publishTime;

    uint256 public lastUpdateValue;
    bytes[] public lastUpdateData;

    function setPrice(int64 _price, int32 _expo, uint64 _publishTime) external {
        price = _price;
        expo = _expo;
        publishTime = _publishTime;
    }

    function updatePriceFeeds(bytes[] calldata updateData) external payable override {
        lastUpdateValue = msg.value;
        delete lastUpdateData;
        for (uint256 i = 0; i < updateData.length; i++) {
            lastUpdateData.push(updateData[i]);
        }
    }

    function getPriceUnsafe(bytes32) external view override returns (int64, int32, uint64) {
        return (price, expo, publishTime);
    }
}

contract ArcDCAControllerTest is Test {
    ArcDCAController public controller;
    MockUSDC public usdc;
    MockPyth public pyth;

    address public owner = address(this);
    address public user = address(0x1);

    bytes32 public constant BTC_USD_ID = keccak256("BTC/USD");

    uint256[] public thresholds;
    uint256[] public amounts;

    function setUp() public {
        usdc = new MockUSDC();
        pyth = new MockPyth();

        thresholds = new uint256[](3);
        thresholds[0] = 60000 * 1e2;
        thresholds[1] = 55000 * 1e2;
        thresholds[2] = 50000 * 1e2;

        amounts = new uint256[](3);
        amounts[0] = 100e6;
        amounts[1] = 200e6;
        amounts[2] = 300e6;

        controller = new ArcDCAController(address(usdc), address(pyth), BTC_USD_ID, thresholds, amounts);

        usdc.mint(user, 1000e6);
    }

    function test_constructor_sets_state() public {
        assertEq(address(controller.usdc()), address(usdc));
        assertEq(address(controller.pyth()), address(pyth));
        assertEq(controller.btcUsdPriceId(), BTC_USD_ID);
        assertEq(controller.owner(), owner);
        assertEq(controller.planLength(), thresholds.length);
    }

    function test_deposit_transfers_usdc_from_user() public {
        vm.startPrank(user);
        controller.deposit(300e6);
        vm.stopPrank();

        assertEq(usdc.balanceOf(user), 700e6);
        assertEq(usdc.balanceOf(address(controller)), 300e6);
    }

    function test_withdraw_onlyOwner() public {
        usdc.mint(address(controller), 500e6);

        vm.prank(user);
        vm.expectRevert("not owner");
        controller.withdraw(100e6);

        controller.withdraw(200e6);
        assertEq(usdc.balanceOf(address(controller)), 300e6);
        assertEq(usdc.balanceOf(owner), 200e6);
    }

    function test_resetExecuted_resets_flags() public {
        usdc.mint(address(controller), 1000e6);

        bytes[] memory data = new bytes[](0);
        pyth.setPrice(55000 * int64(1e2), -2, uint64(block.timestamp));

        controller.updatePriceAndMaybeInvest{value: 0}(data);

        assertTrue(controller.executed(0));
        assertTrue(controller.executed(1));
        assertFalse(controller.executed(2));

        controller.resetExecuted();

        assertFalse(controller.executed(0));
        assertFalse(controller.executed(1));
        assertFalse(controller.executed(2));
    }

    function test_updatePriceAndMaybeInvest_emits_for_matching_thresholds() public {
        usdc.mint(address(controller), 1000e6);

        bytes[] memory data = new bytes[](1);
        data[0] = bytes("dummy");

        pyth.setPrice(55000 * int64(1e2), -2, uint64(block.timestamp));

        vm.expectEmit(true, false, false, true);
        emit ArcDCAController.PriceUpdated(55000 * int64(1e2), -2, uint64(block.timestamp));
        controller.updatePriceAndMaybeInvest{value: 1}(data);

        assertEq(pyth.lastUpdateValue(), 1);
        assertTrue(controller.executed(0));
        assertTrue(controller.executed(1));
        assertFalse(controller.executed(2));
    }

    function test_updatePriceAndMaybeInvest_reverts_when_insufficient_balance() public {
        bytes[] memory data = new bytes[](0);
        pyth.setPrice(50000 * int64(1e2), -2, uint64(block.timestamp));

        vm.expectRevert(bytes("insufficient USDC"));
        controller.updatePriceAndMaybeInvest{value: 0}(data);
    }

    function test_updatePriceAndMaybeInvest_does_not_double_execute() public {
        usdc.mint(address(controller), 1000e6);

        bytes[] memory data = new bytes[](0);
        pyth.setPrice(50000 * int64(1e2), -2, uint64(block.timestamp));

        controller.updatePriceAndMaybeInvest{value: 0}(data);

        assertTrue(controller.executed(0));
        assertTrue(controller.executed(1));
        assertTrue(controller.executed(2));

        controller.updatePriceAndMaybeInvest{value: 0}(data);

        assertTrue(controller.executed(0));
        assertTrue(controller.executed(1));
        assertTrue(controller.executed(2));
    }

    function test_setPlan_updates_thresholds_and_amounts() public {
        uint256[] memory newThresholds = new uint256[](2);
        newThresholds[0] = 45000 * 1e2;
        newThresholds[1] = 40000 * 1e2;

        uint256[] memory newAmounts = new uint256[](2);
        newAmounts[0] = 150e6;
        newAmounts[1] = 250e6;

        controller.setPlan(newThresholds, newAmounts);

        assertEq(controller.planLength(), 2);
    }
}
