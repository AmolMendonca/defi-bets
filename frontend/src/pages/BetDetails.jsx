import React, { useState } from 'react';
import { Shield, Clock, Users, AlertCircle, ArrowRight, Coins } from 'lucide-react';

const BetDetailsPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isJoining, setIsJoining] = useState(false);

  const betDetails = {
    id: "1",
    creator: "0x1234...5678",
    amount: "0.5 ETH",
    createdAt: "2025-01-27T10:00:00",
    description: "ICE arrests (5) students in Ann Arbor",
    status: "Active",
    timeRemaining: "22 hours"
  };

  const handleJoinBet = () => {
    setIsJoining(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 relative overflow-y-auto pt-20 px-4 pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(120,87,255,0.15)_1.5px,_transparent_1.5px)] bg-[length:24px_24px]"></div>
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 40%)`,
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-purple-600" />
          <p className="text-purple-600">
            This bet requires {betDetails.amount} to join
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md shadow-xl border border-purple-100 rounded-xl p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-purple-900">
                {betDetails.description}
              </h1>
              <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                {betDetails.status}
              </span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Users className="text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Created by</p>
                  <p className="text-purple-900 font-medium">{betDetails.creator}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Coins className="text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Stake Amount</p>
                  <p className="text-purple-900 font-medium">{betDetails.amount}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Time Remaining</p>
                  <p className="text-purple-900 font-medium">{betDetails.timeRemaining}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-6">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-purple-900 font-medium mb-2 flex items-center gap-2">
                  <Shield className="text-purple-500" size={20} />
                  Security Guarantees
                </h3>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li>• Smart contract secures all funds</li>
                  <li>• Both parties must confirm the outcome</li>
                  <li>• Automated payout on resolution</li>
                </ul>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleJoinBet}
                  disabled={isJoining}
                  className="w-full group px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {isJoining ? (
                    'Connecting Wallet...'
                  ) : (
                    <>
                      Join Bet
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-gray-500">
                  You'll need {betDetails.amount} + gas fees to participate
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white/80 backdrop-blur-md shadow-lg border border-purple-100 rounded-xl p-6">
          <h2 className="text-xl text-purple-900 font-semibold mb-4">Terms & Conditions</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              This bet concerns the number of University of Michigan students arrested by U.S. Immigration and Customs Enforcement (ICE) during this week. The specific claim is that ICE will arrest five (5) University of Michigan students this week.
            </p>
            <p>
              Verification Criteria:
              • Official statements or press releases from ICE, University of Michigan, or relevant law enforcement agencies
              • Verified news reports from reputable sources
              • Public arrest records or official documentation
              
              Resolution Rules:
              • The bet will be resolved at 11:59 PM on [End Date of Current Week]
              • The total number of confirmed arrests must be exactly five (5) for the bet to be considered correct
              • Each arrested individual must be verifiably enrolled as a student at the University of Michigan at the time of arrest
              • If either party disputes the outcome, they must provide official documentation to support their claim
              • The arbitrator's decision will be based solely on publicly verifiable information
            </p>
            <p className="text-sm text-gray-500">
              Created on {new Date(betDetails.createdAt).toLocaleDateString()} at {new Date(betDetails.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetDetailsPage;