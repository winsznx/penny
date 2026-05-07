// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title  Penny
 * @notice Pay-per-message AI billing on Celo. Users top up cUSD once; the relay
 *         submits debits as messages settle. No subscription, no monthly cycle,
 *         and a 24-hour-ish dispute window for legitimately failed calls.
 *
 *         Milestone NFTs (10 / 100 / 1k / 10k messages) are minted directly from
 *         this contract — keeping it as one deployable unit on purpose.
 *
 *         Treasury here is the LLM operator address; settled message costs flow
 *         straight to it. There is no separate "protocol fee" — the cost IS the
 *         revenue.
 */
contract Penny is ERC721, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ━━━ constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    uint64 public constant DISPUTE_WINDOW = 24 hours;
    uint64 public constant STALE_PERIOD = 7 days;
    uint64 public constant TAP_COOLDOWN = 18 hours;
    uint64 public constant TAP_GRACE = 40 hours;
    uint64 public constant MAX_RATE_LOCK = 7 days;

    // ━━━ types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    struct Tier {
        bytes32 modelId;
        uint128 baseCostWei;
        bool active;
    }

    struct Account {
        uint128 balance;
        uint128 messageCount;
        uint64 rateLockUntil;
        uint128 lockedRate;
    }

    struct PendingMessage {
        address user;
        uint128 cost;
        uint64 registeredAt;
        uint64 settledAt;
        bytes32 modelId;
        bool disputed;
        bool resolved;
    }

    // ━━━ state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    IERC20 public immutable cUSD;
    address public treasury;
    address public relay;

    uint256 public nextTokenId;
    uint256 public nextTierId;

    string private _baseTokenURI;

    mapping(uint256 => Tier) public tiers;
    mapping(bytes32 => uint256) public tierIdOf;

    mapping(address => Account) public accountOf;
    mapping(bytes32 => PendingMessage) public pendingMessages;

    // milestones the user has minted for
    mapping(address => mapping(uint128 => bool)) public claimedMilestone;

    // retention
    mapping(address => uint64) public lastTap;
    mapping(address => uint16) public tapStreak;
    mapping(address => uint128) public extraCredits;
    mapping(address => address) public introducer;
    mapping(address => uint32) public introductionCount;

    // ━━━ events ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    event ToppedUp(address indexed account, address indexed funder, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);

    event MessageRegistered(
        bytes32 indexed msgHash, address indexed user, bytes32 indexed modelId, uint256 cost
    );
    event MessageSettled(bytes32 indexed msgHash, address indexed user, uint256 cost, address indexed settler);
    event MessageDisputed(bytes32 indexed msgHash, address indexed user, bytes32 reasonCode);
    event MessageResolved(
        bytes32 indexed msgHash, address indexed arbiter, uint256 refundAmount, uint256 toTreasury
    );

    event RateLocked(address indexed user, uint256 lockedRate, uint64 until);

    event TierRegistered(uint256 indexed tierId, bytes32 indexed modelId, uint256 baseCostWei);
    event TierUpdated(uint256 indexed tierId, uint256 newBaseCostWei, bool active);

    event Tapped(address indexed user, uint16 streak, uint128 reward);
    event Introduced(address indexed user, address indexed introducer);
    event MilestoneClaimed(address indexed user, uint128 threshold, uint256 indexed tokenId);

    event RelayUpdated(address oldRelay, address newRelay);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event BaseURIUpdated(string newBaseURI);

    // ━━━ errors / sentinels ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    error PennyOnlyRelay();
    error PennyTierUnknown();
    error PennyAlreadyRegistered();
    error PennyNotRegistered();
    error PennyResolved();
    error PennyAlreadyDisputed();
    error PennyDisputeWindowOver();
    error PennyMilestoneNotReached();
    error PennyMilestoneAlreadyClaimed();
    error PennyInsufficientBalance();
    error PennyTooSoonToTap();
    error PennyAlreadyIntroduced();
    error PennyCannotIntroduceSelf();
    error PennyNotStale();
    error PennyDisputed();

    // ━━━ constructor ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    constructor(IERC20 _cUSD, address _treasury, address _relay)
        ERC721("Penny Milestones", "PENNYM")
        Ownable(msg.sender)
    {
        require(address(_cUSD) != address(0), "Penny: cUSD addr");
        require(_treasury != address(0), "Penny: treasury addr");
        require(_relay != address(0), "Penny: relay addr");
        cUSD = _cUSD;
        treasury = _treasury;
        relay = _relay;
    }

    modifier onlyRelay() {
        if (msg.sender != relay) revert PennyOnlyRelay();
        _;
    }

    // ━━━ admin ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function setRelay(address newRelay) external onlyOwner {
        require(newRelay != address(0), "Penny: relay addr");
        emit RelayUpdated(relay, newRelay);
        relay = newRelay;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Penny: treasury addr");
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function registerTier(bytes32 modelId, uint128 baseCostWei) external onlyOwner returns (uint256 tierId) {
        require(modelId != bytes32(0), "Penny: model id");
        require(tierIdOf[modelId] == 0, "Penny: tier exists");
        tierId = ++nextTierId;
        tiers[tierId] = Tier(modelId, baseCostWei, true);
        tierIdOf[modelId] = tierId;
        emit TierRegistered(tierId, modelId, baseCostWei);
    }

    function updateTier(uint256 tierId, uint128 newBaseCostWei, bool active) external onlyOwner {
        require(tiers[tierId].modelId != bytes32(0), "Penny: tier missing");
        tiers[tierId].baseCostWei = newBaseCostWei;
        tiers[tierId].active = active;
        emit TierUpdated(tierId, newBaseCostWei, active);
    }

    // ━━━ vault ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function topUp(uint256 amount) external nonReentrant whenNotPaused {
        _credit(msg.sender, msg.sender, amount);
    }

    function topUpFor(address recipient, uint256 amount) external nonReentrant whenNotPaused {
        require(recipient != address(0), "Penny: zero recipient");
        _credit(recipient, msg.sender, amount);
    }

    function _credit(address account, address funder, uint256 amount) private {
        require(amount > 0, "Penny: zero amount");
        require(amount <= type(uint128).max, "Penny: amount overflow");
        cUSD.safeTransferFrom(funder, address(this), amount);
        accountOf[account].balance += uint128(amount);
        emit ToppedUp(account, funder, amount);
    }

    function withdrawBalance(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Penny: zero amount");
        Account storage a = accountOf[msg.sender];
        if (amount > a.balance) revert PennyInsufficientBalance();
        a.balance -= uint128(amount);
        cUSD.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // ━━━ relay billing ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /// @notice Relay registers a pending message after the upstream LLM call returns.
    ///         Cost is locked from the user's balance immediately.
    function registerMessage(address user, bytes32 msgHash, bytes32 modelId, uint256 reportedCost)
        external
        onlyRelay
        whenNotPaused
    {
        require(user != address(0), "Penny: zero user");
        if (pendingMessages[msgHash].user != address(0)) revert PennyAlreadyRegistered();

        Tier memory t = tiers[tierIdOf[modelId]];
        if (!t.active) revert PennyTierUnknown();

        Account storage a = accountOf[user];
        uint128 cost;
        if (a.rateLockUntil > block.timestamp) {
            cost = a.lockedRate;
        } else {
            cost = reportedCost > t.baseCostWei ? t.baseCostWei : uint128(reportedCost);
        }
        if (cost > a.balance) revert PennyInsufficientBalance();
        a.balance -= cost;

        pendingMessages[msgHash] = PendingMessage({
            user: user,
            cost: cost,
            registeredAt: uint64(block.timestamp),
            settledAt: 0,
            modelId: modelId,
            disputed: false,
            resolved: false
        });

        emit MessageRegistered(msgHash, user, modelId, cost);
    }

    /// @notice Relay confirms a batch. Each non-disputed pending message settles —
    ///         cost forwards to treasury, message becomes resolved.
    function confirmBatch(bytes32[] calldata msgHashes) external onlyRelay whenNotPaused {
        uint256 totalCost;
        for (uint256 i; i < msgHashes.length; i++) {
            bytes32 h = msgHashes[i];
            PendingMessage storage m = pendingMessages[h];
            if (m.user == address(0)) revert PennyNotRegistered();
            if (m.resolved) continue;
            if (m.disputed) continue;
            m.settledAt = uint64(block.timestamp);
            m.resolved = true;
            accountOf[m.user].messageCount++;
            totalCost += m.cost;
            emit MessageSettled(h, m.user, m.cost, msg.sender);
        }
        if (totalCost > 0) {
            cUSD.safeTransfer(treasury, totalCost);
        }
    }

    /// @notice Anyone can settle a stale (>=7d) pending message that the relay
    ///         hasn't confirmed. Prevents indefinite escrow if the relay disappears.
    function settleStale(bytes32 msgHash) external whenNotPaused {
        PendingMessage storage m = pendingMessages[msgHash];
        if (m.user == address(0)) revert PennyNotRegistered();
        if (m.resolved) revert PennyResolved();
        if (m.disputed) revert PennyDisputed();
        if (block.timestamp < m.registeredAt + STALE_PERIOD) revert PennyNotStale();

        m.settledAt = uint64(block.timestamp);
        m.resolved = true;
        accountOf[m.user].messageCount++;
        cUSD.safeTransfer(treasury, m.cost);
        emit MessageSettled(msgHash, m.user, m.cost, msg.sender);
    }

    function disputeMessage(bytes32 msgHash, bytes32 reasonCode) external whenNotPaused {
        PendingMessage storage m = pendingMessages[msgHash];
        if (m.user != msg.sender) revert PennyNotRegistered();
        if (m.resolved) revert PennyResolved();
        if (m.disputed) revert PennyAlreadyDisputed();
        if (block.timestamp > m.registeredAt + DISPUTE_WINDOW) revert PennyDisputeWindowOver();
        m.disputed = true;
        emit MessageDisputed(msgHash, msg.sender, reasonCode);
    }

    /// @notice Owner resolves a disputed message. `refundAmount` returns to the
    ///         user's balance; the remainder forwards to treasury.
    function resolveDispute(bytes32 msgHash, uint256 refundAmount) external onlyOwner {
        PendingMessage storage m = pendingMessages[msgHash];
        if (m.user == address(0)) revert PennyNotRegistered();
        require(m.disputed, "Penny: not disputed");
        require(!m.resolved, "Penny: already resolved");
        require(refundAmount <= m.cost, "Penny: over-refund");

        if (refundAmount > 0) {
            accountOf[m.user].balance += uint128(refundAmount);
        }
        uint256 toTreasury = uint256(m.cost) - refundAmount;
        if (toTreasury > 0) {
            cUSD.safeTransfer(treasury, toTreasury);
        }
        if (refundAmount < m.cost) {
            accountOf[m.user].messageCount++;
        }
        m.resolved = true;
        emit MessageResolved(msgHash, msg.sender, refundAmount, toTreasury);
    }

    // ━━━ rate lock (user-side feature) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function lockRate(bytes32 modelId, uint64 lockSeconds) external whenNotPaused {
        require(lockSeconds > 0 && lockSeconds <= MAX_RATE_LOCK, "Penny: lock window");
        Tier memory t = tiers[tierIdOf[modelId]];
        require(t.active, "Penny: tier inactive");
        Account storage a = accountOf[msg.sender];
        a.lockedRate = t.baseCostWei;
        a.rateLockUntil = uint64(block.timestamp + lockSeconds);
        emit RateLocked(msg.sender, t.baseCostWei, a.rateLockUntil);
    }

    // ━━━ retention ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function tap() external whenNotPaused {
        uint64 last = lastTap[msg.sender];
        uint64 nowTs = uint64(block.timestamp);
        if (last != 0 && nowTs < last + TAP_COOLDOWN) revert PennyTooSoonToTap();

        if (last == 0 || nowTs > last + TAP_GRACE) {
            tapStreak[msg.sender] = 1;
        } else {
            tapStreak[msg.sender]++;
        }
        lastTap[msg.sender] = nowTs;

        uint16 s = tapStreak[msg.sender];
        // five-tier streak rewards (different from Pot's two-tier shape):
        //   default: 1
        //   every 5: 2
        //   every 10: 5
        //   every 30: 15
        uint128 reward = 1;
        if (s % 30 == 0) reward = 15;
        else if (s % 10 == 0) reward = 5;
        else if (s % 5 == 0) reward = 2;

        extraCredits[msg.sender] += reward;
        emit Tapped(msg.sender, s, reward);
    }

    function introduce(address by) external whenNotPaused {
        if (introducer[msg.sender] != address(0)) revert PennyAlreadyIntroduced();
        if (by == msg.sender) revert PennyCannotIntroduceSelf();
        require(by != address(0), "Penny: zero introducer");

        introducer[msg.sender] = by;
        introductionCount[by]++;
        extraCredits[by] += 5;
        emit Introduced(msg.sender, by);
    }

    // ━━━ milestones (NFT) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function claimMilestone(uint128 threshold) external whenNotPaused returns (uint256 tokenId) {
        require(
            threshold == 10 || threshold == 100 || threshold == 1_000 || threshold == 10_000,
            "Penny: bad threshold"
        );
        if (accountOf[msg.sender].messageCount < threshold) revert PennyMilestoneNotReached();
        if (claimedMilestone[msg.sender][threshold]) revert PennyMilestoneAlreadyClaimed();
        claimedMilestone[msg.sender][threshold] = true;
        tokenId = ++nextTokenId;
        _safeMint(msg.sender, tokenId);
        emit MilestoneClaimed(msg.sender, threshold, tokenId);
    }

    // ━━━ views ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function getAccount(address user) external view returns (Account memory) {
        return accountOf[user];
    }

    function balanceOfAccount(address user) external view returns (uint128) {
        return accountOf[user].balance;
    }

    function messagesOf(address user) external view returns (uint128) {
        return accountOf[user].messageCount;
    }

    function effectiveRate(address user, bytes32 modelId) external view returns (uint256) {
        Account storage a = accountOf[user];
        if (a.rateLockUntil > block.timestamp) return a.lockedRate;
        return tiers[tierIdOf[modelId]].baseCostWei;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
