// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAaveLendingPool.sol";

contract BettingWithInsuranceAndYield {
    struct Bet {
        address creator;
        address participant;
        uint256 amount;
        bool resolved;
        address winner;
        uint256 createdAt;
        bool disputed;
        address creatorConfirmed;
        address participantConfirmed;
        bool creatorInsuranceOpted;
        bool participantInsuranceOpted;
        bool insuranceClaimed;
    }

    mapping(uint256 => Bet) public bets;
    uint256 public betCounter;
    IAaveLendingPool public lendingPool;
    IERC20 public depositToken;
    IERC20 public insuranceToken;
    address public insuranceFund;
    address public arbitrator;

    event BetCreated(uint256 betId, address creator, address participant, uint256 amount, bool creatorInsuranceOpted, bool participantInsuranceOpted);
    event BetResolved(uint256 betId, address winner, uint256 payout);
    event BetCancelled(uint256 betId);
    event BetDisputed(uint256 betId);
    event DisputeResolved(uint256 betId, address winner);
    event InsuranceClaimed(uint256 betId, address claimant, uint256 payout);
    event ParticipantJoined(uint256 betId, address participant);

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

function createBet(address _participant, bool _creatorInsuranceOpted, bool _participantInsuranceOpted) public payable {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(_participant != address(0), "Participant address cannot be zero");
        require(_participant != msg.sender, "Creator cannot be the participant");

        uint256 amount = msg.value;

        // Deposit the creator's stake into Aave
        lendingPool.deposit{value: msg.value}(address(depositToken), amount, address(this), 0);

        // Handle creator's insurance premium
        if (_creatorInsuranceOpted) {
            uint256 creatorPremium = (amount * 5) / 100; // 5% premium
            require(
                insuranceToken.transferFrom(msg.sender, insuranceFund, creatorPremium),
                "Creator insurance premium transfer failed"
            );
        }

        // Note: participant's stake will be handled in joinBet
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
            creatorInsuranceOpted: _creatorInsuranceOpted,
            participantInsuranceOpted: _participantInsuranceOpted,
            insuranceClaimed: false
        });

        emit BetCreated(betCounter, msg.sender, _participant, amount, _creatorInsuranceOpted, _participantInsuranceOpted);
        betCounter++;
    }
    function joinBet(uint256 _betId) public payable onlyParticipant(_betId) {
        Bet storage bet = bets[_betId];
        require(msg.value == bet.amount, "Bet amount mismatch");
        require(!bet.resolved, "Bet already resolved");

        // Deposit the matched amount into Aave
        lendingPool.deposit(address(depositToken), msg.value, address(this), 0);

        emit ParticipantJoined(_betId, msg.sender);
    }

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

    function disputeBet(uint256 _betId) public {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");
        require(msg.sender == bet.creator || msg.sender == bet.participant, "Only participants can dispute");
        require(!bet.disputed, "Bet is already under dispute");

        bet.disputed = true;
        emit BetDisputed(_betId);
    }

    function resolveDispute(uint256 _betId, address _winner) public onlyArbitrator {
        resolveBet(_betId, _winner);
    }

    function resolveBet(uint256 _betId, address _winner) internal {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");

        bet.resolved = true;
        bet.winner = _winner;

        uint256 totalBalance = lendingPool.withdraw(address(depositToken), type(uint256).max, address(this));
        require(depositToken.transfer(_winner, totalBalance), "Payout transfer failed");

        emit BetResolved(_betId, _winner, totalBalance);
    }

    function cancelBet(uint256 _betId) public onlyCreator(_betId) {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");
        require(block.timestamp > bet.createdAt + 1 days, "Cannot cancel before 24 hours");
        require(!bet.disputed, "Cannot cancel a disputed bet");

        uint256 totalBalance = lendingPool.withdraw(address(depositToken), type(uint256).max, address(this));
        require(depositToken.transfer(bet.creator, totalBalance), "Refund transfer failed");

        delete bets[_betId];
        emit BetCancelled(_betId);
    }

    function claimInsurance(uint256 _betId) public {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Cannot claim insurance on resolved bets");
        
        bool isInsured = false;
        if (msg.sender == bet.creator && bet.creatorInsuranceOpted) isInsured = true;
        if (msg.sender == bet.participant && bet.participantInsuranceOpted) isInsured = true;
        
        require(isInsured, "No insurance opted for this participant");
        require(!bet.insuranceClaimed, "Insurance already claimed");

        bet.insuranceClaimed = true;
        uint256 payout = bet.amount * 2; // Full refund if covered by insurance
        require(insuranceToken.transfer(msg.sender, payout), "Insurance payout failed");

        emit InsuranceClaimed(_betId, msg.sender, payout);
    }

    receive() external payable {}
}