// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Betting {
    struct Bet {
        address creator;
        address participant;
        uint amount;
        bool resolved;
        address winner;
        uint createdAt;
        bool disputed;
        address creatorConfirmed; // Winner address confirmed by the creator
        address participantConfirmed; // Winner address confirmed by the participant
    }

    mapping(uint => Bet) public bets;
    uint public betCounter;
    address public arbitrator;

    event BetCreated(uint betId, address creator, address participant, uint amount);
    event BetResolved(uint betId, address winner, uint amount);
    event ParticipantJoined(uint betId, address participant);
    event BetCancelled(uint betId);
    event BetDisputed(uint betId);
    event DisputeResolved(uint betId, address winner);

    modifier onlyCreator(uint _betId) {
        require(msg.sender == bets[_betId].creator, "Only the creator can perform this action");
        _;
    }

    modifier onlyParticipant(uint _betId) {
        require(msg.sender == bets[_betId].participant, "Only the participant can perform this action");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only the arbitrator can perform this action");
        _;
    }

    constructor(address _arbitrator) {
        require(_arbitrator != address(0), "Arbitrator address cannot be zero");
        arbitrator = _arbitrator;
    }

    function createBet(address _participant) public payable {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(_participant != address(0), "Participant address cannot be zero");
        require(_participant != msg.sender, "Creator cannot be the participant");

        bets[betCounter] = Bet({
            creator: msg.sender,
            participant: _participant,
            amount: msg.value,
            resolved: false,
            winner: address(0),
            createdAt: block.timestamp,
            disputed: false,
            creatorConfirmed: address(0),
            participantConfirmed: address(0)
        });

        emit BetCreated(betCounter, msg.sender, _participant, msg.value);
        betCounter++;
    }

    function joinBet(uint _betId) public payable onlyParticipant(_betId) {
        Bet storage bet = bets[_betId];
        require(msg.value == bet.amount, "Bet amount mismatch");
        require(!bet.resolved, "Bet already resolved");

        emit ParticipantJoined(_betId, msg.sender);
    }

    function confirmWinner(uint _betId, address _winner) public {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");
        require(!bet.disputed, "Bet is under dispute");
        require(_winner == bet.creator || _winner == bet.participant, "Winner must be a participant");
        require(msg.sender == bet.creator || msg.sender == bet.participant, "Only participants can confirm the winner");

        if (msg.sender == bet.creator) {
            bet.creatorConfirmed = _winner;
        } else if (msg.sender == bet.participant) {
            bet.participantConfirmed = _winner;
        }

        // If both participants confirm the same winner
        if (bet.creatorConfirmed == bet.participantConfirmed && bet.creatorConfirmed != address(0)) {
            bet.resolved = true;
            bet.winner = _winner;

            uint payout = bet.amount * 2;
            (bool success, ) = _winner.call{value: payout}("");
            require(success, "Transfer failed");

            emit BetResolved(_betId, _winner, payout);
        }
    }

    function disputeBet(uint _betId) public {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");
        require(msg.sender == bet.creator || msg.sender == bet.participant, "Only participants can dispute");
        require(!bet.disputed, "Bet is already under dispute");

        bet.disputed = true;
        emit BetDisputed(_betId);
    }

    function resolveDispute(uint _betId, address _winner) public onlyArbitrator {
        Bet storage bet = bets[_betId];
        require(bet.disputed, "Bet is not under dispute");
        require(!bet.resolved, "Bet already resolved");
        require(_winner == bet.creator || _winner == bet.participant, "Winner must be a participant");

        bet.resolved = true;
        bet.winner = _winner;
        bet.disputed = false;

        uint payout = bet.amount * 2;
        (bool success, ) = _winner.call{value: payout}("");
        require(success, "Transfer failed");

        emit DisputeResolved(_betId, _winner);
    }

    function cancelBet(uint _betId) public onlyCreator(_betId) {
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");
        require(block.timestamp > bet.createdAt + 1 days, "Cannot cancel before 24 hours");
        require(!bet.disputed, "Cannot cancel a disputed bet");

        payable(bet.creator).transfer(bet.amount);
        delete bets[_betId];

        emit BetCancelled(_betId);
    }

    receive() external payable {}
}
