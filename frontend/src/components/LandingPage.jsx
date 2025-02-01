import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Sparkles, Shield, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching:', searchQuery);
  };

  const connectWallet = () => {
    console.log('Connecting wallet...');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 relative overflow-hidden">
      {}
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(120,87,255,0.15)_1.5px,_transparent_1.5px)] bg-[length:24px_24px]"></div>

      {}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 40%)`,
        }}
      />

      <div className="fixed top-0 left-0 right-0 z-50 px-4">
        <nav className="max-w-7xl mx-auto my-4 px-6 py-4 flex justify-between items-center rounded-xl bg-white/70 backdrop-blur-md shadow-lg border border-purple-100">
          <div className="text-xl font-bold text-purple-900 flex items-center gap-2">
            <Sparkles className="text-purple-500" />
            Seiyuko
          </div>
          <div className="space-x-4">
            <button onClick={connectWallet} 
              className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg">
              Connect Wallet
            </button>
            <button onClick={() => navigate('/documentation')}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all border border-purple-200 shadow-md hover:shadow-lg">
              Docs
            </button>
          </div>
        </nav>
      </div>

      <main className="max-w-4xl mx-auto px-6 pt-40 pb-16 text-center relative">
        <h1 className="text-6xl font-bold mb-6 text-purple-900">
          Bet Locally with Friends.{' '}
          <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-transparent bg-clip-text">
            Win Globally
          </span>
          {' '}with Ethereum.
        </h1>
        
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Create, join, and resolve bets securely on the blockchain. Transparent and trustless.
        </p>

        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-12">
          <input
            type="text"
            className="w-full px-6 py-4 text-lg bg-white/80 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-700 placeholder-gray-400 shadow-md"
            placeholder="Search active bets or create your own..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md"
          >
            <Search size={24} />
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
        <button 
            onClick={() => navigate('/create-bet')}
            className="group px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center transition-all shadow-md hover:shadow-lg"
        >
            Create Bet
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
        </button>
          <button 
                      className="group px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 flex items-center transition-all border border-purple-200 shadow-md hover:shadow-lg">
            Join Bet
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100 shadow-md hover:shadow-lg transition-all">
            <Shield className="text-purple-500 mb-4" size={32} />
            <h3 className="text-xl font-semibold text-purple-900 mb-2">Secure & Trustless</h3>
            <p className="text-gray-600">Smart contracts ensure fair and automatic bet resolution.</p>
          </div>
          <div className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100 shadow-md hover:shadow-lg transition-all">
            <Users className="text-purple-500 mb-4" size={32} />
            <h3 className="text-xl font-semibold text-purple-900 mb-2">Social Betting</h3>
            <p className="text-gray-600">Bet with friends and build your reputation in the community.</p>
          </div>
          <div className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100 shadow-md hover:shadow-lg transition-all">
            <Sparkles className="text-purple-500 mb-4" size={32} />
            <h3 className="text-xl font-semibold text-purple-900 mb-2">Global Rewards</h3>
            <p className="text-gray-600">Win ETH and exclusive rewards for successful predictions.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

// Add these animations to your global CSS file (index.css)
const cssToAdd = `
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
}

@keyframes float-slow {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-30px); }
  100% { transform: translateY(0px); }
}

@keyframes float-slower {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-slow {
  animation: float-slow 8s ease-in-out infinite;
}

.animate-float-slower {
  animation: float-slower 10s ease-in-out infinite;
}
`;

export default LandingPage;