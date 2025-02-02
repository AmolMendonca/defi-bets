import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Globe, 
  Info, 
  Search, 
  ArrowRight, 
  Shield, 
  Sparkles,
  Clock,
  Coins,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BetListingPage = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [passkey, setPasskey] = useState('');
  const [showPasskeyInput, setShowPasskeyInput] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);

  // Track mouse position for gradient effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Mock data - would come from your API
  const bets = [
    {
      id: 1,
      title: "ICE arrests (5) students in Ann Arbor",
      amount: "0.5 ETH",
      creator: "0x1234...5678",
      timeRemaining: "22 hours",
      isPrivate: false,
      hasInsurance: true,
      participants: 12
    },
    {
      id: 2,
      title: "Tesla stock hits $500 by March",
      amount: "1.2 ETH",
      creator: "0x8765...4321",
      timeRemaining: "3 days",
      isPrivate: true,
      hasInsurance: false,
      participants: 8
    },
  ];

  const handleJoinBet = (bet) => {
    if (bet.isPrivate) {
      setSelectedBet(bet);
      setShowPasskeyInput(true);
    } else {
      navigate(`/bet/${bet.id}`);
    }
  };

  // Rest of your component remains the same...
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 relative overflow-y-auto pt-20 px-4 pb-20"
      onMouseMove={(e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Rest of your JSX remains exactly the same */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(120,87,255,0.15)_1.5px,_transparent_1.5px)] bg-[length:24px_24px]"></div>
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 40%)`,
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-900 mb-2">Available Bets</h1>
            <p className="text-gray-600">Join existing bets or find private games</p>
          </div>

          {/* Info Cards */}
          <div className="flex gap-4">
            <div className="group relative">
              <button className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors">
                <Sparkles size={20} />
              </button>
              {/* Yield Info Tooltip */}
              <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-white rounded-xl shadow-lg border border-purple-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <h3 className="text-purple-900 font-medium mb-2 flex items-center gap-2">
                  <Sparkles size={16} />
                  Yield Generation
                </h3>
                <p className="text-sm text-gray-600">
                  All staked funds are automatically deposited into Aave's lending protocol, 
                  generating yield until the bet is resolved. This earned interest is 
                  distributed proportionally to participants.
                </p>
              </div>
            </div>

            <div className="group relative">
              <button className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors">
                <Shield size={20} />
              </button>
              {/* Insurance Info Tooltip */}
              <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-white rounded-xl shadow-lg border border-purple-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <h3 className="text-purple-900 font-medium mb-2 flex items-center gap-2">
                  <Shield size={16} />
                  Bet Insurance
                </h3>
                <p className="text-sm text-gray-600">
                  Optional 5% insurance fee protects your stake. If you lose the bet,
                  you'll receive back 90% of your original stake. Insurance fees go to
                  the protocol's coverage pool.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search bets..."
              className="w-full px-4 py-3 pl-12 rounded-xl border border-purple-100 focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 bg-white/50"
            />
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          </div>
        </div>

        {/* Bet Listings */}
        <div className="space-y-4">
          {bets.map((bet) => (
            <div 
              key={bet.id}
              className="bg-white/80 backdrop-blur-md shadow-lg border border-purple-100 rounded-xl p-6 transition-all hover:shadow-xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-purple-900">
                      {bet.title}
                    </h2>
                    {bet.isPrivate ? (
                      <Lock className="text-purple-400" size={16} />
                    ) : (
                      <Globe className="text-purple-400" size={16} />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Created by {bet.creator}</p>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                  {bet.amount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} />
                    {bet.timeRemaining}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} />
                    {bet.participants} participants
                  </div>
                  {bet.hasInsurance && (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <Shield size={16} />
                      Insured
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleJoinBet(bet)}
                  className="group px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-all"
                >
                  Join Bet
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Private Bet Passkey Modal */}
        {showPasskeyInput && selectedBet && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-purple-100">
              <h3 className="text-xl font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Lock size={20} />
                Enter Passkey
              </h3>
              <p className="text-gray-600 mb-4">
                This is a private bet. Please enter the passkey to join.
              </p>
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter passkey"
                className="w-full px-4 py-2 rounded-lg border border-purple-100 focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasskeyInput(false);
                    setPasskey('');
                  }}
                  className="flex-1 px-4 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedBet) {
                      navigate(`/bet/${selectedBet.id}`);
                    }
                    setShowPasskeyInput(false);
                    setPasskey('');
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetListingPage;