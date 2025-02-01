import React from 'react';
import { GitBranch } from 'lucide-react';

const DocumentationContent = ({ activeSection }) => {
  const renderMathFormula = (formula) => (
    <div className="p-4 bg-gray-50 rounded-lg my-4 overflow-x-auto">
      <code className="text-sm font-mono">{formula}</code>
    </div>
  );

  const renderCodeBlock = (code) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto">
      <code className="text-sm font-mono">{code}</code>
    </pre>
  );

  const renderOverviewSection = () => (
    <div>
      <h1 className="text-3xl font-bold mb-6">Protocol Overview</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Contract Architecture</h2>
        </div>
        <div>
          <p className="text-gray-700 mb-4">
            Seiyuko is a decentralized betting protocol that combines traditional peer-to-peer betting with DeFi yield generation and optional insurance coverage. The protocol leverages Aave's lending protocol to generate yield during bet lockup periods while ensuring maximum security through game theory mechanisms.
          </p>
          
          <div className="flex items-center space-x-4 mb-4">
            <GitBranch className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium">Protocol Version: 1.0.0</span>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3">Core Components</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Betting Engine</h4>
              <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
                <li>Peer-to-peer bet creation and matching</li>
                <li>Automated settlement mechanism</li>
                <li>Dispute resolution system</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Yield Module</h4>
              <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
                <li>Aave integration for yield generation</li>
                <li>Dynamic interest rate management</li>
                <li>Automated reinvestment strategies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Protocol Mathematics</h2>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">Economic Model</h3>
          {renderMathFormula(`P(settlement) = 1 - \\frac{\\text{disputed\\_bets}}{\\text{total\\_bets}}`)}
          
          <h4 className="font-semibold mt-4 mb-2">Insurance Premium</h4>
          {renderMathFormula(`Premium = Stake \\times \\left(\\frac{\\text{base\\_rate}}{100} + \\frac{\\text{risk\\_factor}}{100}\\right)`)}
          
          <h4 className="font-semibold mt-4 mb-2">Expected Return</h4>
          {renderMathFormula(`E(R) = P(win) \\times (2 \\times Stake + Yield) - Stake - Premium`)}
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div>
      <h1 className="text-3xl font-bold mb-6">Security Model</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Game Theory Security Model</h2>
        </div>
        <div>
          <p className="text-gray-700 mb-4">
            The security model is based on Nash equilibrium and mechanism design theory to ensure honest behavior is the dominant strategy.
          </p>
          
          <h3 className="text-lg font-semibold mt-4 mb-3">Nash Equilibrium Proof</h3>
          {renderMathFormula(`E(honest) > E(dishonest) \\iff \\frac{R + S}{2} > \\frac{R - P}{2}`)}
          
          <h3 className="text-lg font-semibold mt-6 mb-3">Security Parameters</h3>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Slashing Mechanism</h4>
              {renderMathFormula(`Slash_{amount} = min(Stake \\times Severity, MaxSlash)`)}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Insurance Coverage</h4>
              {renderMathFormula(`Coverage = min(Stake \\times 2, MaxCoverage)`)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Smart Contract Security</h2>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">Access Control Matrix</h3>
          {renderCodeBlock(`
// Access control modifiers
modifier onlyCreator(uint256 _betId) {
    require(msg.sender == bets[_betId].creator, 
        "Only creator can perform this action");
    _;
}

modifier onlyParticipant(uint256 _betId) {
    require(msg.sender == bets[_betId].participant, 
        "Only participant can perform this action");
    _;
}

modifier onlyArbitrator() {
    require(msg.sender == arbitrator, 
        "Only arbitrator can perform this action");
    _;
}`)}
        </div>
      </div>
    </div>
  );

  const renderYieldSection = () => (
    <div>
      <h1 className="text-3xl font-bold mb-6">Yield Generation</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Aave Integration</h2>
        </div>
        <div>
          <p className="text-gray-700 mb-4">
            Yield is generated by depositing bet stakes into Aave's lending protocol during the lockup period.
          </p>
          
          <h3 className="text-lg font-semibold mt-4 mb-3">Yield Calculation</h3>
          {renderMathFormula(`A = P(1 + \\frac{r}{n})^{nt}`)}
          
          <h3 className="text-lg font-semibold mt-6 mb-3">Implementation</h3>
          {renderCodeBlock(`
// Deposit funds into Aave
function _depositToAave(uint256 amount) internal {
    require(amount > 0, "Amount must be positive");
    depositToken.approve(address(lendingPool), amount);
    lendingPool.deposit(
        address(depositToken),
        amount,
        address(this),
        0
    );
}`)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Yield Distribution</h2>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">Distribution Formula</h3>
          {renderMathFormula(`Yield_{user} = \\frac{Stake_{user}}{Total\\_Stake} \\times Total\\_Yield`)}
          
          <h3 className="text-lg font-semibold mt-6 mb-3">Implementation</h3>
          {renderCodeBlock(`
function distributeYield(uint256 _betId) internal {
    Bet storage bet = bets[_betId];
    uint256 yield = _calculateYield(
        bet.amount,
        block.timestamp - bet.createdAt
    );
    
    // Transfer yield to winner
    require(
        depositToken.transfer(bet.winner, yield),
        "Yield transfer failed"
    );
}`)}
        </div>
      </div>
    </div>
  );

  const renderImplementationSection = () => (
    <div>
      <h1 className="text-3xl font-bold mb-6">Implementation Details</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Core Functions</h2>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">Bet Creation</h3>
          {renderCodeBlock(`
function createBet(
    address _participant,
    bool _insuranceOpted
) public payable {
    require(msg.value > 0, "Bet amount must be greater than 0");
    require(_participant != address(0), "Invalid participant");
    require(_participant != msg.sender, "Self-betting not allowed");

    // Handle insurance if opted
    if (_insuranceOpted) {
        uint256 premium = calculatePremium(msg.value);
        require(
            insuranceToken.transferFrom(
                msg.sender,
                insuranceFund,
                premium
            ),
            "Premium transfer failed"
        );
    }

    // Create bet struct
    bets[betCounter] = Bet({
        creator: msg.sender,
        participant: _participant,
        amount: msg.value,
        resolved: false,
        winner: address(0),
        createdAt: block.timestamp,
        insuranceOpted: _insuranceOpted,
        insuranceClaimed: false
    });

    // Deposit stake into Aave
    _depositToAave(msg.value);
    
    emit BetCreated(
        betCounter,
        msg.sender,
        _participant,
        msg.value,
        _insuranceOpted
    );
    betCounter++;
}`)}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverviewSection();
      case 'security':
        return renderSecuritySection();
      case 'yield':
        return renderYieldSection();
      case 'implementation':
        return renderImplementationSection();
      default:
        return renderOverviewSection();
    }
  };

  return renderContent();
};

export default DocumentationContent;