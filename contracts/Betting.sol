// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAaveLendingPool.sol";
import "./interfaces/IWETH.sol";

contract BettingWithInsuranceAndYield is ReentrancyGuard, Ownable {
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
        bool cancelled;
    }

    mapping(uint256 => Bet) public bets;
    uint256 public betCounter;
    IAaveLendingPool public lendingPool;
    IERC20 public depositToken;
    IERC20 public insuranceToken;
    IWETH public weth;
    address public insuranceFund;
    address public arbitrator;
    
    uint256 public insurancePremiumRate = 500; // 5% = 500 basis points
    uint256 public constant MAX_INSURANCE_PREMIUM_RATE = 1000; // 10%
    uint256 public betExpiryPeriod = 24 hours;
    uint256 public maxBetDuration = 30 days;

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
        address _weth,
        address _insuranceFund,
        address _arbitrator
    ) {
        require(_lendingPool != address(0), "Invalid lending pool address");
        require(_depositToken != address(0), "Invalid deposit token address");
        require(_insuranceToken != address(0), "Invalid insurance token address");
        require(_weth != address(0), "Invalid WETH address");
        require(_insuranceFund != address(0), "Invalid insurance fund address");
        require(_arbitrator != address(0), "Invalid arbitrator address");

        lendingPool = IAaveLendingPool(_lendingPool);
        depositToken = IERC20(_depositToken);
        insuranceToken = IERC20(_insuranceToken);
        weth = IWETH(_weth);
        insuranceFund = _insuranceFund;
        arbitrator = _arbitrator;
        
        depositToken.approve(_lendingPool, type(uint256).max);
        weth.approve(_lendingPool, type(uint256).max);
    }

    modifier onlyCreator(uint256 _betId) {
        require(msg.sender == bets[_betId].creator, "Only creator");
        _;
    }

    modifier onlyParticipant(uint256 _betId) {
        require(msg.sender == bets[_betId].participant, "Only participant");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only arbitrator");
        _;
    }

    modifier betExists(uint256 _betId) {
        require(_betId < betCounter, "Bet doesn't exist");
        _;
    }

    modifier betNotResolved(uint256 _betId) {
        require(!bets[_betId].resolved, "Bet resolved");
        require(!bets[_betId].cancelled, "Bet cancelled");
        _;
    }

    function setArbitrator(address _arbitrator) external onlyOwner {
        require(_arbitrator != address(0), "Invalid arbitrator");
        arbitrator = _arbitrator;
    }

    function setInsurancePremiumRate(uint256 _rate) external onlyOwner {
        require(_rate <= MAX_INSURANCE_PREMIUM_RATE, "Rate too high");
        insurancePremiumRate = _rate;
    }

    function setBetExpiryPeriod(uint256 _period) external onlyOwner {
        require(_period > 0, "Invalid period");
        betExpiryPeriod = _period;
    }

    function createBet(
        address _participant,
        bool _creatorInsuranceOpted,
        bool _participantInsuranceOpted
    ) external payable nonReentrant {
        require(msg.value > 0, "Zero amount");
        require(_participant != address(0), "Invalid participant");
        require(_participant != msg.sender, "Self betting");

        uint256 amount = msg.value;

        // Convert ETH to WETH
        weth.deposit{value: amount}();

        // Deposit the creator's stake into Aave
        lendingPool.deposit(address(weth), amount, address(this), 0);

        // Handle creator's insurance premium if opted
        if (_creatorInsuranceOpted) {
            uint256 creatorPremium = (amount * insurancePremiumRate) / 10000;
            require(
                insuranceToken.transferFrom(msg.sender, insuranceFund, creatorPremium),
                "Premium transfer failed"
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
            creatorInsuranceOpted: _creatorInsuranceOpted,
            participantInsuranceOpted: _participantInsuranceOpted,
            insuranceClaimed: false,
            cancelled: false
        });

        emit BetCreated(betCounter, msg.sender, _participant, amount, _creatorInsuranceOpted, _participantInsuranceOpted);
        betCounter++;
    }

    function joinBet(uint256 _betId) 
        external 
        payable 
        betExists(_betId)
        betNotResolved(_betId)
        onlyParticipant(_betId) 
        nonReentrant 
    {
        Bet storage bet = bets[_betId];
        require(msg.value == bet.amount, "Amount mismatch");
        require(
            block.timestamp <= bet.createdAt + maxBetDuration,
            "Bet expired"
        );

        // Convert ETH to WETH
        weth.deposit{value: msg.value}();

        // Deposit the matched amount into Aave
        lendingPool.deposit(address(weth), msg.value, address(this), 0);

        // Handle participant's insurance premium if opted
        if (bet.participantInsuranceOpted) {
            uint256 participantPremium = (msg.value * insurancePremiumRate) / 10000;
            require(
                insuranceToken.transferFrom(msg.sender, insuranceFund, participantPremium),
                "Premium transfer failed"
            );
        }

        emit ParticipantJoined(_betId, msg.sender);
    }

    function confirmWinner(uint256 _betId, address _winner) 
        external 
        betExists(_betId)
        betNotResolved(_betId)
    {
        Bet storage bet = bets[_betId];
        require(!bet.disputed, "Under dispute");
        require(
            _winner == bet.creator || _winner == bet.participant,
            "Invalid winner"
        );
        require(
            msg.sender == bet.creator || msg.sender == bet.participant,
            "Not a participant"
        );

        if (msg.sender == bet.creator) {
            bet.creatorConfirmed = _winner;
        } else {
            bet.participantConfirmed = _winner;
        }

        // If both participants confirm the same winner, resolve the bet
        if (bet.creatorConfirmed == bet.participantConfirmed && 
            bet.creatorConfirmed != address(0)) {
            _resolveBet(_betId, _winner);
        }
    }

    function disputeBet(uint256 _betId) 
        external 
        betExists(_betId)
        betNotResolved(_betId)
    {
        Bet storage bet = bets[_betId];
        require(
            msg.sender == bet.creator || msg.sender == bet.participant,
            "Not a participant"
        );
        require(!bet.disputed, "Already disputed");

        bet.disputed = true;
        emit BetDisputed(_betId);
    }

    function resolveDispute(uint256 _betId, address _winner) 
        external 
        betExists(_betId)
        betNotResolved(_betId)
        onlyArbitrator 
    {
        Bet storage bet = bets[_betId];
        require(bet.disputed, "Not disputed");
        require(
            _winner == bet.creator || _winner == bet.participant,
            "Invalid winner"
        );

        _resolveBet(_betId, _winner);
        emit DisputeResolved(_betId, _winner);
    }

    function _resolveBet(uint256 _betId, address _winner) internal {
        Bet storage bet = bets[_betId];
        bet.resolved = true;
        bet.winner = _winner;

        uint256 totalBalance = lendingPool.withdraw(
            address(weth),
            type(uint256).max,
            address(this)
        );

        // Convert WETH back to ETH and send to winner
        weth.withdraw(totalBalance);
        (bool success, ) = _winner.call{value: totalBalance}("");
        require(success, "ETH transfer failed");

        emit BetResolved(_betId, _winner, totalBalance);
    }

    function cancelBet(uint256 _betId) 
        external 
        betExists(_betId)
        betNotResolved(_betId)
        onlyCreator(_betId) 
    {
        Bet storage bet = bets[_betId];
        require(
            block.timestamp > bet.createdAt + betExpiryPeriod,
            "Cannot cancel yet"
        );
        require(!bet.disputed, "Under dispute");

        uint256 totalBalance = lendingPool.withdraw(
            address(weth),
            type(uint256).max,
            address(this)
        );

        // Convert WETH back to ETH and return to creator
        weth.withdraw(totalBalance);
        (bool success, ) = bet.creator.call{value: totalBalance}("");
        require(success, "ETH transfer failed");

        bet.cancelled = true;
        emit BetCancelled(_betId);
    }

    function claimInsurance(uint256 _betId) 
        external 
        betExists(_betId)
        nonReentrant 
    {
        Bet storage bet = bets[_betId];
        require(!bet.resolved && !bet.cancelled, "Bet not active");
        require(!bet.insuranceClaimed, "Already claimed");
        
        bool isInsured = false;
        if (msg.sender == bet.creator && bet.creatorInsuranceOpted) {
            isInsured = true;
        }
        if (msg.sender == bet.participant && bet.participantInsuranceOpted) {
            isInsured = true;
        }
        
        require(isInsured, "Not insured");

        bet.insuranceClaimed = true;
        uint256 payout = bet.amount * 2; // Full refund if covered by insurance
        require(
            insuranceToken.transfer(msg.sender, payout),
            "Insurance payout failed"
        );

        emit InsuranceClaimed(_betId, msg.sender, payout);
    }

    // Emergency withdrawal function for owner
    function emergencyWithdraw(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "No balance");
        require(
            IERC20(_token).transfer(owner(), balance),
            "Transfer failed"
        );
    }

    receive() external payable {}
}