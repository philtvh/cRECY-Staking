// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Partial interface for Uniswap V3 NonfungiblePositionManager
interface INonfungiblePositionManager {
    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function positions(uint256 tokenId)
        external
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );

    function collect(CollectParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);

    function ownerOf(uint256 tokenId) external view returns (address);
}

/// @notice Partial interface for Uniswap V3 SwapRouter
interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

/**
 * @title cRECY Milestone Staking Engine & Uniswap V3 LP Fee Redirector
 * @notice Combines a 15.0% liquid base yield + 1.75% quarterly milestone bonus (+7% APY eq.)
 *         with an automated Uniswap V3 LP fee-sharing module and time-weighted milestone protections.
 */
contract CRECYStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // --- Tokens and Protocol Interfaces ---
    IERC20 public immutable crecyToken;
    INonfungiblePositionManager public immutable positionManager;
    ISwapRouter public swapRouter;

    // --- Staking Capacity and Pool State ---
    uint256 public maxCapacity = 300_000 * 1e18; 
    uint256 public totalStaked;
    uint256 public rewardsPool;

    // --- Yield Parameters (Basis Points: 10000 = 100%) ---
    uint256 public baseApyBps = 1500;        
    uint256 public milestoneBonusBps = 175;  

    // --- Constants ---
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant SECS_PER_YEAR = 365 days;
    uint256 public constant MILESTONE_DURATION = 90 days;

    // --- Staker Position Data ---
    struct UserStake {
        uint256 amount;             
        uint256 lastAccrualTime;    
        uint256 pendingBaseRewards; 
        uint256 lastMilestoneTime;  
    }

    mapping(address => UserStake) public userStakes;

    // --- Uniswap V3 LP Redirection Data ---
    struct LpRegistration {
        address originalRegistrant; 
        uint16 feeSplitBps;         
        bool autoSwapOtherToken;    
        bool active;                
    }

    mapping(uint256 => LpRegistration) public lpRegistrations;

    // --- System Events ---
    event Staked(address indexed user, uint256 amount, uint256 newWeightedMilestoneTime);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 baseAmount, uint256 milestoneAmount);
    event RewardsFunded(address indexed funder, uint256 amount);
    event CapacityCapUpdated(uint256 oldCap, uint256 newCap);
    event YieldRatesUpdated(uint256 newBaseApyBps, uint256 newMilestoneBonusBps);
    event SwapRouterUpdated(address indexed oldRouter, address indexed newRouter);
    event LpPositionLinked(uint256 indexed tokenId, address indexed lpOwner, uint16 feeSplitBps, bool autoSwap);
    event LpPositionUpdated(uint256 indexed tokenId, uint16 newFeeSplitBps, bool autoSwap, bool active);
    event LpFeesRedirected(
        uint256 indexed tokenId,
        address indexed lpOwner,
        uint256 redirectedToStakers,
        uint256 returnedToLp,
        uint256 unswappedOtherTokenReturned
    );

    constructor(
        address _crecyToken,
        address _positionManager,
        address _swapRouter
    ) Ownable(msg.sender) {
        require(_crecyToken != address(0), "Invalid cRECY address");
        require(_positionManager != address(0), "Invalid PositionManager address");

        crecyToken = IERC20(_crecyToken);
        positionManager = INonfungiblePositionManager(_positionManager);
        swapRouter = ISwapRouter(_swapRouter);
    }

    // --- Core Staking Logic ---

    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0 tokens");
        require(totalStaked + _amount <= maxCapacity, "Exceeds maximum staking capacity cap");

        UserStake storage user = userStakes[msg.sender];

        if (user.amount > 0) {
            // Claim/update existing rewards prior to altering principal
            _updateUserRewards(msg.sender);

            // Execute Time-Weighted Average to prevent Day-89 Exploit
            uint256 currentElapsed = block.timestamp - user.lastMilestoneTime;
            uint256 weightedElapsed = (currentElapsed * user.amount) / (user.amount + _amount);
            user.lastMilestoneTime = block.timestamp - weightedElapsed;
        } else {
            user.lastAccrualTime = block.timestamp;
            user.lastMilestoneTime = block.timestamp;
        }

        crecyToken.safeTransferFrom(msg.sender, address(this), _amount);

        user.amount += _amount;
        totalStaked += _amount;

        emit Staked(msg.sender, _amount, user.lastMilestoneTime);
    }

    function unstake(uint256 _amount) external nonReentrant {
        UserStake storage user = userStakes[msg.sender];
        require(user.amount >= _amount, "Insufficient staked balance");
        require(_amount > 0, "Cannot unstake 0 tokens");

        (uint256 baseClaim, uint256 milestoneClaim, uint256 milestonesPassed) = _calculatePendingRewards(msg.sender);

        user.pendingBaseRewards = 0;
        user.lastAccrualTime = block.timestamp;

        if (milestonesPassed > 0) {
            user.lastMilestoneTime += milestonesPassed * MILESTONE_DURATION;
        }

        // Note: user.lastMilestoneTime is intentionally NOT reset here.
        // Withdrawing early organically forfeits the future bonus on the _amount withdrawn, 
        // without punishing the time accumulated by the remaining principal.

        uint256 totalRewards = baseClaim + milestoneClaim;
        require(rewardsPool >= totalRewards, "Insufficient reward pool liquidity");

        user.amount -= _amount;
        totalStaked -= _amount;
        rewardsPool -= totalRewards;

        uint256 totalPayout = _amount + totalRewards;
        crecyToken.safeTransfer(msg.sender, totalPayout);

        emit Unstaked(msg.sender, _amount);
        emit RewardsClaimed(msg.sender, baseClaim, milestoneClaim);
    }

    function claimRewards() external nonReentrant {
        UserStake storage user = userStakes[msg.sender];
        require(user.amount > 0 || user.pendingBaseRewards > 0, "No active stake or pending rewards");

        (uint256 baseClaim, uint256 milestoneClaim, uint256 milestonesPassed) = _calculatePendingRewards(msg.sender);
        uint256 totalRewards = baseClaim + milestoneClaim;

        require(totalRewards > 0, "No claimable rewards available");
        require(rewardsPool >= totalRewards, "Insufficient reward pool liquidity");

        user.pendingBaseRewards = 0;
        user.lastAccrualTime = block.timestamp;

        if (milestonesPassed > 0) {
            user.lastMilestoneTime += milestonesPassed * MILESTONE_DURATION;
        }

        rewardsPool -= totalRewards;
        crecyToken.safeTransfer(msg.sender, totalRewards);

        emit RewardsClaimed(msg.sender, baseClaim, milestoneClaim);
    }

    function fundRewardsPool(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot fund 0 tokens");
        crecyToken.safeTransferFrom(msg.sender, address(this), _amount);
        rewardsPool += _amount;

        emit RewardsFunded(msg.sender, _amount);
    }

    // --- Uniswap V3 LP Fee Redirection Engine ---

    function registerLpPosition(
        uint256 _tokenId,
        uint16 _feeSplitBps,
        bool _autoSwapOtherToken
    ) external {
        require(positionManager.ownerOf(_tokenId) == msg.sender, "Caller does not own LP position NFT");
        require(_feeSplitBps <= BPS_DENOMINATOR, "Fee split exceeds 100%");

        (, , address token0, address token1, , , , , , , , ) = positionManager.positions(_tokenId);
        require(token0 == address(crecyToken) || token1 == address(crecyToken), "Position must include cRECY");

        lpRegistrations[_tokenId] = LpRegistration({
            originalRegistrant: msg.sender,
            feeSplitBps: _feeSplitBps,
            autoSwapOtherToken: _autoSwapOtherToken,
            active: true
        });

        emit LpPositionLinked(_tokenId, msg.sender, _feeSplitBps, _autoSwapOtherToken);
    }

    function updateLpPosition(
        uint256 _tokenId,
        uint16 _newFeeSplitBps,
        bool _autoSwapOtherToken,
        bool _active
    ) external {
        require(positionManager.ownerOf(_tokenId) == msg.sender, "Caller does not own LP position NFT");
        require(_newFeeSplitBps <= BPS_DENOMINATOR, "Fee split exceeds 100%");
        require(lpRegistrations[_tokenId].originalRegistrant != address(0), "Position not linked");

        LpRegistration storage config = lpRegistrations[_tokenId];
        config.feeSplitBps = _newFeeSplitBps;
        config.autoSwapOtherToken = _autoSwapOtherToken;
        config.active = _active;

        emit LpPositionUpdated(_tokenId, _newFeeSplitBps, _autoSwapOtherToken, _active);
    }

    function collectAndRedirectLpFees(
        uint256 _tokenId, 
        uint256 _amountOutMinForSwap,
        uint256 _deadline
    ) external nonReentrant {
        LpRegistration memory config = lpRegistrations[_tokenId];
        require(config.active, "LP redirection not active for position");

        address currentLpOwner = positionManager.ownerOf(_tokenId);

        (, , address token0, address token1, uint24 poolFee, , , , , , , ) = positionManager.positions(_tokenId);

        (uint256 amount0, uint256 amount1) = positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: _tokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        require(amount0 > 0 || amount1 > 0, "No fees available to collect");

        uint256 totalCrecyCollected;
        uint256 unswappedOtherToken;
        address otherTokenAddress;

        if (token0 == address(crecyToken)) {
            totalCrecyCollected = amount0;
            unswappedOtherToken = amount1;
            otherTokenAddress = token1;
        } else {
            totalCrecyCollected = amount1;
            unswappedOtherToken = amount0;
            otherTokenAddress = token0;
        }

        if (config.autoSwapOtherToken && unswappedOtherToken > 0 && address(swapRouter) != address(0)) {
            IERC20(otherTokenAddress).forceApprove(address(swapRouter), unswappedOtherToken);

            try swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: otherTokenAddress,
                    tokenOut: address(crecyToken),
                    fee: poolFee,
                    recipient: address(this),
                    deadline: _deadline,
                    amountIn: unswappedOtherToken,
                    amountOutMinimum: _amountOutMinForSwap,
                    sqrtPriceLimitX96: 0
                })
            ) returns (uint256 swappedCrecy) {
                totalCrecyCollected += swappedCrecy;
                unswappedOtherToken = 0;
            } catch {
                IERC20(otherTokenAddress).forceApprove(address(swapRouter), 0);
            }
        }

        uint256 redirectedToStakers = (totalCrecyCollected * config.feeSplitBps) / BPS_DENOMINATOR;
        uint256 returnedToLp = totalCrecyCollected - redirectedToStakers;

        if (redirectedToStakers > 0) {
            rewardsPool += redirectedToStakers;
            emit RewardsFunded(currentLpOwner, redirectedToStakers);
        }

        if (returnedToLp > 0) {
            crecyToken.safeTransfer(currentLpOwner, returnedToLp);
        }

        if (unswappedOtherToken > 0) {
            IERC20(otherTokenAddress).safeTransfer(currentLpOwner, unswappedOtherToken);
        }

        emit LpFeesRedirected(
            _tokenId,
            currentLpOwner,
            redirectedToStakers,
            returnedToLp,
            unswappedOtherToken
        );
    }

    // --- On-Chain View Functions ---

    function getPendingRewards(address _account)
        external
        view
        returns (uint256 totalBase, uint256 totalMilestone, uint256 nextMilestoneTimestamp)
    {
        (totalBase, totalMilestone, ) = _calculatePendingRewards(_account);
        UserStake memory user = userStakes[_account];
        nextMilestoneTimestamp = user.lastMilestoneTime + MILESTONE_DURATION;
    }

    // --- Governance & Protocol Controls ---

    function updateMaxCapacity(uint256 _newMaxCapacity) external onlyOwner {
        require(_newMaxCapacity >= totalStaked, "Capacity cannot be lower than current totalStaked");
        emit CapacityCapUpdated(maxCapacity, _newMaxCapacity);
        maxCapacity = _newMaxCapacity;
    }

    function setYieldRates(uint256 _baseApyBps, uint256 _milestoneBonusBps) external onlyOwner {
        require(_baseApyBps <= 5000, "Base APY exceeds 50% safety parameter");
        require(_milestoneBonusBps <= 1000, "Milestone bonus exceeds 10% safety parameter");

        baseApyBps = _baseApyBps;
        milestoneBonusBps = _milestoneBonusBps;

        emit YieldRatesUpdated(_baseApyBps, _milestoneBonusBps);
    }

    function setSwapRouter(address _newSwapRouter) external onlyOwner {
        emit SwapRouterUpdated(address(swapRouter), _newSwapRouter);
        swapRouter = ISwapRouter(_newSwapRouter);
    }

    // --- Internal State Management ---

    function _updateUserRewards(address _account) internal {
        (uint256 baseClaim, uint256 milestoneClaim, uint256 milestonesPassed) = _calculatePendingRewards(_account);
        UserStake storage user = userStakes[_account];

        user.pendingBaseRewards = baseClaim + milestoneClaim;
        user.lastAccrualTime = block.timestamp;

        if (milestonesPassed > 0) {
            user.lastMilestoneTime += milestonesPassed * MILESTONE_DURATION;
        }
    }

    function _calculatePendingRewards(address _account)
        internal
        view
        returns (uint256 baseClaim, uint256 milestoneClaim, uint256 milestonesPassed)
    {
        UserStake memory user = userStakes[_account];
        if (user.amount == 0) {
            return (user.pendingBaseRewards, 0, 0);
        }

        uint256 timeElapsed = block.timestamp - user.lastAccrualTime;
        uint256 newlyAccruedBase = (user.amount * baseApyBps * timeElapsed) / (BPS_DENOMINATOR * SECS_PER_YEAR);
        baseClaim = user.pendingBaseRewards + newlyAccruedBase;

        if (block.timestamp >= user.lastMilestoneTime + MILESTONE_DURATION) {
            uint256 milestoneElapsed = block.timestamp - user.lastMilestoneTime;
            milestonesPassed = milestoneElapsed / MILESTONE_DURATION;
            milestoneClaim = (user.amount * milestoneBonusBps * milestonesPassed) / BPS_DENOMINATOR;
        } else {
            milestoneClaim = 0;
            milestonesPassed = 0;
        }
    }
}