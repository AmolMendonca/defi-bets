// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAaveLendingPool.sol"; // Aave lending pool interface for deposit and withdrawal functions

// REQUIRES: The contract needs valid external dependencies such as Aave lending pool, deposit token, and insurance token.
// MODIFIES: The state of bets, insurance premiums, and user funds through various functions.
//
// EFFECTS:
//  - Allows users to create, participate, and resolve bets with optional insurance.
//  - Deposits funds into Aave's lending protocol during the bet period to generate yield.
//  - Optionally collects a premium for insurance, providing compensation in case of a covered event.
//  - Handles disputes via an arbitrator and ensures fair payouts to winners.
//  - Integrates both yield farming and risk protection mechanisms.

// NOTE: Ensure that external dependencies such as the Aave lending pool and insurance fund are properly configured.
// HINT: Understanding the flow of funds through deposit, yield generation, and payouts is critical to avoid logical errors.

contract BettingWithInsuranceAndYield {

    struct Bet {
        address creator;              // Address of the bet creator
        address participant;          // Address of the bet participant
        uint256 amount;               // Amount staked by the creator (and matched by the participant)
        bool resolved;                // Whether the bet has been resolved
        address winner;               // Address of the bet winner (set after resolution)
        uint256 createdAt;            // Timestamp when the bet was created
        bool disputed;                // Whether the bet is under dispute
        address creatorConfirmed;     // Address of the winner as confirmed by the creator
        address participantConfirmed; // Address of the winner as confirmed by the participant
        bool insuranceOpted;          // Whether the bet has optional insurance coverage
        bool insuranceClaimed;        // Whether insurance has been claimed (to prevent double claiming)
    }

    mapping(uint256 => Bet) public bets;  // Mapping of bet IDs to their respective Bet objects
    uint256 public betCounter;            // Counter to track the number of bets created

    IAaveLendingPool public lendingPool;  // Aave lending pool contract for yield farming
    IERC20 public depositToken;           // Token being deposited into Aave (e.g., DAI, WETH, etc.)
    IERC20 public insuranceToken;         // Token used for insurance premiums and payouts
    address public insuranceFund;         // Address where insurance premiums are sent and payouts are issued

    address public arbitrator;            // Address of the arbitrator who resolves disputes

    // Events to emit key actions in the contract
    event BetCreated(uint256 betId, address creator, address participant, uint256 amount, bool insuranceOpted);
    event BetResolved(uint256 betId, address winner, uint256 payout);
    event ParticipantJoined(uint256 betId, address participant);
    event BetCancelled(uint256 betId);
    event BetDisputed(uint256 betId);
    event DisputeResolved(uint256 betId, address winner);
    event InsuranceClaimed(uint256 betId, address claimant, uint256 payout);

    /**
     * @dev Initializes the contract with Aave, token addresses, and the arbitrator address.
     * @param _lendingPool Address of the Aave lending pool
     * @param _depositToken Address of the token being deposited (e.g., WETH/DAI)
     * @param _insuranceToken Address of the token used for insurance premiums/payouts
     * @param _insuranceFund Address of the insurance fund
     * @param _arbitrator Address of the arbitrator to handle disputes
     */

    // sets key external dependencies and addresses the contract will interact or communicate with

    constructor(
        address _lendingPool,
        address _depositToken,
        address _insuranceToken,
        address _insuranceFund,
        address _arbitrator
    ) {
        lendingPool = IAaveLendingPool(_lendingPool);
        depositToken = IERC20(_depositToken);
        insuranceToken = IERC20(_insuranceToken);
        insuranceFund = _insuranceFund;
        arbitrator = _arbitrator;

        // Approve max amount for lending pool
        depositToken.approve(_lendingPool, type(uint256).max);
    }

    // Modifiers for role-based access control
    modifier onlyCreator(uint256 _betId) {
        require(msg.sender == bets[_betId].creator, "Only the creator can perform this action");
        _;
    }

    modifier onlyParticipant(uint256 _betId) {
        require(msg.sender == bets[_betId].participant, "Only the participant can perform this action");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only the arbitrator can perform this action");
        _;
    }

    /**
     * @dev Allows a user to create a new bet with an optional insurance option.
     * The bet amount is deposited into Aave for yield generation.
     * @param _participant Address of the participant in the bet
     * @param _insuranceOpted Boolean indicating whether insurance is enabled for this bet
     */
     
    function createBet(address _participant, bool _insuranceOpted) public payable {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(_participant != address(0), "Participant address cannot be zero");
        require(_participant != msg.sender, "Creator cannot be the participant");

        uint256 amount = msg.value;

        // Deposit into Aave (approval is already done in constructor)
        lendingPool.deposit(address(depositToken), amount, address(this), 0);

        // Handle optional insurance
        if (_insuranceOpted) {
            uint256 premium = (amount * 5) / 100; // 5% premium
            require(
                insuranceToken.transferFrom(msg.sender, insuranceFund, premium),
                "Insurance premium transfer failed"
            );
        }

        bets[betCounter] = Bet({
            creator: msg.sender,
            participant: _participant,
            amount: amount,
            resolved: false,
            winner: address(0),
            createdAt: block.timestamp,
            disputed: false,
            creatorConfirmed: address(0),
            participantConfirmed: address(0),
            insuranceOpted: _insuranceOpted,
            insuranceClaimed: false
        });

        emit BetCreated(betCounter, msg.sender, _participant, amount, _insuranceOpted);
        betCounter++;
    }


    /**
     * @dev Allows the participant to join the bet and match the creator's stake.
     * @param _betId The ID of the bet being joined
     */
    function joinBet(uint256 _betId) public payable onlyParticipant(_betId) {
        Bet storage bet = bets[_betId];
        require(msg.value == bet.amount, "Bet amount mismatch");
        require(!bet.resolved, "Bet already resolved");

        // Deposit the matched amount into Aave
        lendingPool.deposit(address(depositToken), msg.value, address(this), 0);

        emit ParticipantJoined(_betId, msg.sender);
    }

    /**
     * @dev Allows participants to confirm the winner of the bet. If both agree, the bet is resolved.
     * @param _betId The ID of the bet being confirmed
     * @param _winner The address of the winner
     */

    function confirmWinner(uint256 _betId, address _winner) public {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");
        require(!bet.disputed, "Bet is under dispute");
        require(_winner == bet.creator || _winner == bet.participant, "Winner must be a participant");
        require(msg.sender == bet.creator || msg.sender == bet.participant, "Only participants can confirm the winner");

        if (msg.sender == bet.creator) {
            bet.creatorConfirmed = _winner;
        } else {
            bet.participantConfirmed = _winner;
        }

        // If both participants confirm the same winner, resolve the bet
        if (bet.creatorConfirmed == bet.participantConfirmed && bet.creatorConfirmed != address(0)) {
            resolveBet(_betId, _winner);
        }
    }

    /**
     * @dev Allows either participant to dispute the outcome of the bet.
     * @param _betId The ID of the bet being disputed
     */
    function disputeBet(uint256 _betId) public {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");
        require(msg.sender == bet.creator || msg.sender == bet.participant, "Only participants can dispute");
        require(!bet.disputed, "Bet is already under dispute");

        bet.disputed = true;
        emit BetDisputed(_betId);
    }

    /**
     * @dev Allows the arbitrator to resolve a disputed bet and transfer funds to the winner.
     * @param _betId The ID of the disputed bet
     * @param _winner The address of the winner determined by the arbitrator
     */
    function resolveDispute(uint256 _betId, address _winner) public onlyArbitrator {
        resolveBet(_betId, _winner);
    }

    /**
     * @dev Internal function to resolve a bet and transfer funds to the winner.
     * @param _betId The ID of the bet being resolved
     * @param _winner The address of the winner
     */

    function resolveBet(uint256 _betId, address _winner) internal {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");

        bet.resolved = true;
        bet.winner = _winner;

        // Withdraw funds from Aave and transfer to the winner
        uint256 totalBalance = lendingPool.withdraw(address(depositToken), type(uint256).max, address(this));
        require(depositToken.transfer(_winner, totalBalance), "Payout transfer failed");

        emit BetResolved(_betId, _winner, totalBalance);
    }

    /**
     * @dev Allows the creator to cancel the bet if conditions are met (not resolved, no disputes, 24 hours passed).
     * @param _betId The ID of the bet to cancel
     */

    function cancelBet(uint256 _betId) public onlyCreator(_betId) {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");
        require(block.timestamp > bet.createdAt + 1 days, "Cannot cancel before 24 hours");
        require(!bet.disputed, "Cannot cancel a disputed bet");

        // Withdraw funds from Aave and refund the creator
        uint256 totalBalance = lendingPool.withdraw(address(depositToken), type(uint256).max, address(this));
        require(depositToken.transfer(bet.creator, totalBalance), "Refund transfer failed");

        delete bets[_betId];
        emit BetCancelled(_betId);
    }

    /**
     * @dev Allows the user to claim insurance if the bet is not resolved and insurance was enabled.
     * @param _betId The ID of the bet for which insurance is being claimed
     */
    function claimInsurance(uint256 _betId) public {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Cannot claim insurance on resolved bets");
        require(bet.insuranceOpted, "No insurance opted for this bet");
        require(!bet.insuranceClaimed, "Insurance already claimed");

        bet.insuranceClaimed = true;
        uint256 payout = bet.amount * 2; // Full refund if covered by insurance
        require(insuranceToken.transfer(msg.sender, payout), "Insurance payout failed");

        emit InsuranceClaimed(_betId, msg.sender, payout);
    }

    // Allow the contract to receive ETH (if needed for certain implementations)
    receive() external payable {}
}