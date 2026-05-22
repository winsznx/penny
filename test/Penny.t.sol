// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/Penny.sol";
import "./mocks/MockToken.sol";

contract PennyTest is Test {
    Penny p;
    MockToken token;

    address owner    = makeAddr("owner");
    address treasury = makeAddr("treasury");
    address relay    = makeAddr("relay");
    address userA    = makeAddr("userA");
    address userB    = makeAddr("userB");
    address userC    = makeAddr("userC");

    bytes32 constant HAIKU  = bytes32("haiku-4-5");
    bytes32 constant SONNET = bytes32("sonnet-4-6");
    bytes32 constant OPUS   = bytes32("opus-4-7");

    uint256 constant HAIKU_RATE  = 0.001 ether; // 0.001 cUSD
    uint256 constant SONNET_RATE = 0.005 ether;
    uint256 constant OPUS_RATE   = 0.020 ether;

    function setUp() public {
        token = new MockToken();
        vm.prank(owner);
        p = new Penny(IERC20(address(token)), treasury, relay);

        vm.startPrank(owner);
        p.registerTier(HAIKU,  uint128(HAIKU_RATE));
        p.registerTier(SONNET, uint128(SONNET_RATE));
        p.registerTier(OPUS,   uint128(OPUS_RATE));
        vm.stopPrank();

        token.mint(userA, 100 ether);
        token.mint(userB, 100 ether);
        token.mint(userC, 100 ether);

        vm.prank(userA); token.approve(address(p), type(uint256).max);
        vm.prank(userB); token.approve(address(p), type(uint256).max);
        vm.prank(userC); token.approve(address(p), type(uint256).max);
    }

    // ─── vault ──────────────────────────────────────────────────────────────

    function test_topUp_credits_account_balance() public {
        vm.prank(userA);
        p.topUp(5 ether);
        assertEq(p.balanceOfAccount(userA), 5 ether);
    }

    function test_topUpFor_funds_third_party() public {
        vm.prank(userA);
        p.topUpFor(userB, 1 ether);
        assertEq(p.balanceOfAccount(userB), 1 ether);
        assertEq(p.balanceOfAccount(userA), 0);
    }

    function test_topUp_zero_reverts() public {
        vm.prank(userA);
        vm.expectRevert(bytes("Penny: zero amount"));
        p.topUp(0);
    }

    function test_withdrawBalance_returns_remaining() public {
        vm.prank(userA);
        p.topUp(2 ether);

        uint256 before_ = token.balanceOf(userA);
        vm.prank(userA);
        p.withdrawBalance(0.5 ether);
        assertEq(token.balanceOf(userA) - before_, 0.5 ether);
        assertEq(p.balanceOfAccount(userA), 1.5 ether);
    }

    function test_withdrawBalance_over_balance_reverts() public {
        vm.prank(userA);
        p.topUp(1 ether);
        vm.prank(userA);
        vm.expectRevert(Penny.PennyInsufficientBalance.selector);
        p.withdrawBalance(2 ether);
    }

    // ─── tier admin ─────────────────────────────────────────────────────────

    function test_registerTier_recorded_and_tierId_indexed() public {
        bytes32 newId = bytes32("gpt-5-mini");
        vm.prank(owner);
        uint256 tierId = p.registerTier(newId, 0.002 ether);
        assertEq(tierId, 4);
        assertEq(p.tierIdOf(newId), 4);
    }

    function test_registerTier_duplicate_reverts() public {
        vm.prank(owner);
        vm.expectRevert(bytes("Penny: tier exists"));
        p.registerTier(HAIKU, 1 ether);
    }

    function test_updateTier_changes_cost_and_active() public {
        vm.prank(owner);
        p.updateTier(1, uint128(0.002 ether), false);
        (, uint128 cost, bool active) = p.tiers(1);
        assertEq(cost, 0.002 ether);
        assertFalse(active);
    }

    // ─── relay billing ──────────────────────────────────────────────────────

    function test_registerMessage_debits_balance_at_min(uint256 reported) public {
        // bound reported cost to a manageable range
        reported = bound(reported, 0, 1 ether);

        vm.prank(userA);
        p.topUp(2 ether);

        bytes32 h = keccak256("msg-1");
        vm.prank(relay);
        p.registerMessage(userA, h, HAIKU, reported);

        uint128 expected = reported > HAIKU_RATE ? uint128(HAIKU_RATE) : uint128(reported);
        assertEq(p.balanceOfAccount(userA), 2 ether - expected);
    }

    function test_registerMessage_only_relay() public {
        vm.prank(userA);
        p.topUp(1 ether);
        vm.prank(userA);
        vm.expectRevert(Penny.PennyOnlyRelay.selector);
        p.registerMessage(userA, keccak256("x"), HAIKU, HAIKU_RATE);
    }

    function test_registerMessage_unknown_tier_reverts() public {
        vm.prank(userA);
        p.topUp(1 ether);
        vm.prank(relay);
        vm.expectRevert(Penny.PennyTierUnknown.selector);
        p.registerMessage(userA, keccak256("x"), bytes32("missing-model"), HAIKU_RATE);
    }

    function test_registerMessage_insufficient_balance_reverts() public {
        // balance is 0, no top-up
        vm.prank(relay);
        vm.expectRevert(Penny.PennyInsufficientBalance.selector);
        p.registerMessage(userA, keccak256("x"), HAIKU, HAIKU_RATE);
    }

    function test_registerMessage_duplicate_msgHash_reverts() public {
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("dupe");
        vm.startPrank(relay);
        p.registerMessage(userA, h, HAIKU, HAIKU_RATE);
        vm.expectRevert(Penny.PennyAlreadyRegistered.selector);
        p.registerMessage(userA, h, HAIKU, HAIKU_RATE);
        vm.stopPrank();
    }

    function test_selfRegisterMessage_charges_msgSender() public {
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("self-1");
        vm.prank(userA);
        p.selfRegisterMessage(h, HAIKU, HAIKU_RATE);
        assertEq(p.balanceOfAccount(userA), 1 ether - HAIKU_RATE);
        (address u, , , , , , ) = p.pendingMessages(h);
        assertEq(u, userA);
    }

    function test_selfRegisterMessage_anyoneCallsForSelfOnly() public {
        vm.prank(userA);
        p.topUp(1 ether);
        // userB cannot self-register a message that would debit userA — selfRegister
        // always uses msg.sender, so userB ends up trying to debit their own (empty) balance.
        bytes32 h = keccak256("self-2");
        vm.prank(userB);
        vm.expectRevert(Penny.PennyInsufficientBalance.selector);
        p.selfRegisterMessage(h, HAIKU, HAIKU_RATE);
    }

    function test_confirmBatch_settles_pending_messages_to_treasury() public {
        vm.prank(userA);
        p.topUp(1 ether);

        bytes32 h1 = keccak256("a");
        bytes32 h2 = keccak256("b");
        vm.startPrank(relay);
        p.registerMessage(userA, h1, HAIKU, HAIKU_RATE);
        p.registerMessage(userA, h2, SONNET, SONNET_RATE);
        vm.stopPrank();

        bytes32[] memory hashes = new bytes32[](2);
        hashes[0] = h1;
        hashes[1] = h2;

        uint256 treasuryBefore = token.balanceOf(treasury);
        vm.prank(relay);
        p.confirmBatch(hashes);

        assertEq(token.balanceOf(treasury) - treasuryBefore, HAIKU_RATE + SONNET_RATE);
        assertEq(p.messagesOf(userA), 2);
    }

    function test_confirmBatch_skips_disputed_messages() public {
        vm.prank(userA);
        p.topUp(1 ether);

        bytes32 h = keccak256("c");
        vm.prank(relay);
        p.registerMessage(userA, h, HAIKU, HAIKU_RATE);

        vm.prank(userA);
        p.disputeMessage(h, "broken-output");

        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = h;
        uint256 before_ = token.balanceOf(treasury);
        vm.prank(relay);
        p.confirmBatch(hashes);
        // disputed → not forwarded, not resolved
        assertEq(token.balanceOf(treasury), before_);
        assertEq(p.messagesOf(userA), 0);
    }

    function test_settleStale_after_7d_movesToTreasury() public {
        vm.prank(userA);
        p.topUp(1 ether);

        bytes32 h = keccak256("ghost");
        vm.prank(relay);
        p.registerMessage(userA, h, HAIKU, HAIKU_RATE);

        vm.warp(block.timestamp + 8 days);

        uint256 before_ = token.balanceOf(treasury);
        // note: anyone can call this — caller is userB (a third party)
        vm.prank(userB);
        p.settleStale(h);
        assertEq(token.balanceOf(treasury) - before_, HAIKU_RATE);
        assertEq(p.messagesOf(userA), 1);
    }

    function test_settleStale_too_early_reverts() public {
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("fresh");
        vm.prank(relay);
        p.registerMessage(userA, h, HAIKU, HAIKU_RATE);

        vm.warp(block.timestamp + 6 days);
        vm.expectRevert(Penny.PennyNotStale.selector);
        p.settleStale(h);
    }

    function test_settleStale_disputed_blocks_public_settle() public {
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("d");
        vm.prank(relay);
        p.registerMessage(userA, h, HAIKU, HAIKU_RATE);
        vm.prank(userA);
        p.disputeMessage(h, "bad-output");

        vm.warp(block.timestamp + 8 days);
        vm.expectRevert(Penny.PennyDisputed.selector);
        p.settleStale(h);
    }

    // ─── disputes ───────────────────────────────────────────────────────────

    function test_disputeMessage_inside_window_marks_disputed() public {
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("e");
        vm.prank(relay);
        p.registerMessage(userA, h, HAIKU, HAIKU_RATE);

        vm.prank(userA);
        p.disputeMessage(h, "hallucinated");

        (, , , , , bool disputed, ) = p.pendingMessages(h);
        assertTrue(disputed);
    }

    function test_disputeMessage_outside_window_reverts() public {
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("f");
        vm.prank(relay);
        p.registerMessage(userA, h, HAIKU, HAIKU_RATE);

        vm.warp(block.timestamp + 25 hours);
        vm.prank(userA);
        vm.expectRevert(Penny.PennyDisputeWindowOver.selector);
        p.disputeMessage(h, "late");
    }

    function test_disputeMessage_by_non_owner_reverts() public {
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("g");
        vm.prank(relay);
        p.registerMessage(userA, h, HAIKU, HAIKU_RATE);
        vm.prank(userB);
        vm.expectRevert(Penny.PennyNotRegistered.selector);
        p.disputeMessage(h, "not-mine");
    }

    function test_resolveDispute_full_refund_returns_to_user_balance() public {
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("h");
        vm.prank(relay);
        p.registerMessage(userA, h, SONNET, SONNET_RATE);
        vm.prank(userA);
        p.disputeMessage(h, "model-down");

        vm.prank(owner);
        p.resolveDispute(h, SONNET_RATE);

        assertEq(p.balanceOfAccount(userA), 1 ether);
        assertEq(p.messagesOf(userA), 0);
    }

    function test_resolveDispute_refundHalf_refund_splits() public {
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("i");
        vm.prank(relay);
        p.registerMessage(userA, h, OPUS, OPUS_RATE);
        vm.prank(userA);
        p.disputeMessage(h, "refundHalf-output");

        uint256 refundHalf = OPUS_RATE / 2;
        uint256 treasuryBefore = token.balanceOf(treasury);
        vm.prank(owner);
        p.resolveDispute(h, refundHalf);

        assertEq(p.balanceOfAccount(userA), 1 ether - OPUS_RATE + refundHalf);
        assertEq(token.balanceOf(treasury) - treasuryBefore, OPUS_RATE - refundHalf);
        assertEq(p.messagesOf(userA), 1);
    }

    function test_resolveDispute_overrefund_reverts() public {
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("j");
        vm.prank(relay);
        p.registerMessage(userA, h, HAIKU, HAIKU_RATE);
        vm.prank(userA);
        p.disputeMessage(h, "too-much");
        vm.prank(owner);
        vm.expectRevert(bytes("Penny: over-refund"));
        p.resolveDispute(h, HAIKU_RATE * 2);
    }

    // ─── rate lock ──────────────────────────────────────────────────────────

    function test_lockRate_locks_at_current_tier_cost() public {
        vm.prank(userA);
        p.lockRate(SONNET, 1 days);
        (, , uint64 until, uint128 lockedRate) = p.accountOf(userA);
        assertEq(lockedRate, SONNET_RATE);
        assertEq(until, uint64(block.timestamp + 1 days));
    }

    function test_locked_rate_used_when_relay_charges_post_change() public {
        // user locks rate at SONNET 0.005
        vm.prank(userA);
        p.lockRate(SONNET, 1 days);
        // owner doubles SONNET cost mid-session
        vm.prank(owner);
        p.updateTier(2, uint128(0.010 ether), true);
        // user tops up + sends a message; locked rate (0.005) should apply
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("locked");
        vm.prank(relay);
        p.registerMessage(userA, h, SONNET, 0.010 ether);
        assertEq(p.balanceOfAccount(userA), 1 ether - SONNET_RATE);
    }

    function test_lockRate_zero_or_overlong_reverts() public {
        vm.prank(userA);
        vm.expectRevert(bytes("Penny: lock window"));
        p.lockRate(SONNET, 0);

        vm.prank(userA);
        vm.expectRevert(bytes("Penny: lock window"));
        p.lockRate(SONNET, 30 days);
    }

    // ─── retention ──────────────────────────────────────────────────────────

    function test_tap_first_call_streak_one() public {
        vm.prank(userA);
        p.tap();
        assertEq(p.tapStreak(userA), 1);
        assertEq(p.extraCredits(userA), 1);
    }

    function test_tap_too_soon_reverts() public {
        vm.prank(userA);
        p.tap();
        vm.warp(block.timestamp + 8 hours);
        vm.prank(userA);
        vm.expectRevert(Penny.PennyTooSoonToTap.selector);
        p.tap();
    }

    function test_tap_streaks_continue_within_grace() public {
        vm.prank(userA);
        p.tap();
        vm.warp(block.timestamp + 24 hours);
        vm.prank(userA);
        p.tap();
        assertEq(p.tapStreak(userA), 2);
    }

    function test_tap_streaks_reset_after_grace() public {
        vm.prank(userA);
        p.tap();
        vm.warp(block.timestamp + 50 hours);
        vm.prank(userA);
        p.tap();
        assertEq(p.tapStreak(userA), 1);
    }

    function test_tap_5day_streak_gives_2() public {
        for (uint256 i; i < 5; i++) {
            vm.warp(block.timestamp + 24 hours);
            vm.prank(userA);
            p.tap();
        }
        assertEq(p.tapStreak(userA), 5);
        // credits: 1+1+1+1+2 = 6
        assertEq(p.extraCredits(userA), 6);
    }

    function test_tap_10day_streak_gives_5() public {
        for (uint256 i; i < 10; i++) {
            vm.warp(block.timestamp + 24 hours);
            vm.prank(userA);
            p.tap();
        }
        // credits: 1+1+1+1+2+1+1+1+1+5 = 15
        assertEq(p.extraCredits(userA), 15);
    }

    function test_introduce_records_and_credits_introducer() public {
        vm.prank(userA);
        p.introduce(userB);
        assertEq(p.introducer(userA), userB);
        assertEq(p.introductionCount(userB), 1);
        assertEq(p.extraCredits(userB), 5);
    }

    function test_introduce_self_reverts() public {
        vm.prank(userA);
        vm.expectRevert(Penny.PennyCannotIntroduceSelf.selector);
        p.introduce(userA);
    }

    function test_introduce_twice_reverts() public {
        vm.prank(userA);
        p.introduce(userB);
        vm.prank(userA);
        vm.expectRevert(Penny.PennyAlreadyIntroduced.selector);
        p.introduce(userC);
    }

    // ─── milestones ─────────────────────────────────────────────────────────

    function test_claimMilestone_at_10_messages_mints_nft() public {
        _drive10Messages(userA);
        vm.prank(userA);
        uint256 tokenId = p.claimMilestone(10);
        assertEq(p.ownerOf(tokenId), userA);
        assertTrue(p.claimedMilestone(userA, 10));
    }

    function test_claimMilestone_below_threshold_reverts() public {
        // only 1 settled message
        vm.prank(userA);
        p.topUp(1 ether);
        bytes32 h = keccak256("m1");
        vm.prank(relay);
        p.registerMessage(userA, h, HAIKU, HAIKU_RATE);
        bytes32[] memory hh = new bytes32[](1);
        hh[0] = h;
        vm.prank(relay);
        p.confirmBatch(hh);

        vm.prank(userA);
        vm.expectRevert(Penny.PennyMilestoneNotReached.selector);
        p.claimMilestone(10);
    }

    function test_claimMilestone_invalid_threshold_reverts() public {
        _drive10Messages(userA);
        vm.prank(userA);
        vm.expectRevert(bytes("Penny: bad threshold"));
        p.claimMilestone(50);
    }

    function test_claimMilestone_twice_reverts() public {
        _drive10Messages(userA);
        vm.startPrank(userA);
        p.claimMilestone(10);
        vm.expectRevert(Penny.PennyMilestoneAlreadyClaimed.selector);
        p.claimMilestone(10);
        vm.stopPrank();
    }

    // ─── pause ──────────────────────────────────────────────────────────────

    function test_pause_blocks_topUp() public {
        vm.prank(owner);
        p.pause();
        vm.prank(userA);
        vm.expectRevert();
        p.topUp(1 ether);
    }

    function test_unpause_restores_topUp() public {
        vm.prank(owner);
        p.pause();
        vm.prank(owner);
        p.unpause();
        vm.prank(userA);
        p.topUp(0.5 ether);
        assertEq(p.balanceOfAccount(userA), 0.5 ether);
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    function _drive10Messages(address user) internal {
        vm.prank(user);
        p.topUp(10 ether);
        bytes32[] memory hashes = new bytes32[](10);
        for (uint256 i; i < 10; i++) {
            bytes32 h = keccak256(abi.encode("m", i, user));
            vm.prank(relay);
            p.registerMessage(user, h, HAIKU, HAIKU_RATE);
            hashes[i] = h;
        }
        vm.prank(relay);
        p.confirmBatch(hashes);
    }
}
