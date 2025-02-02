import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Sparkles, Shield, Users, Unplug, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [userDetails, setUserDetails] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      setUserDetails(JSON.parse(savedUserData));
    }

    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        await checkExistingConnection();
      } else {
        console.log('MetaMask is not installed');
        setConnectionError('MetaMask is not installed. Please install MetaMask to continue.');
      }
    };

    checkWallet();
  }, []);

  const checkExistingConnection = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        handleConnect(accounts[0]);
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
      setConnectionError('Failed to check wallet connection. Please try again.');
    }
  };

  const handleConnect = (address) => {
    console.log('Connected with address:', address);
    setWalletConnected(true);
    setUserAddress(address);
    setConnectionError('');
    setConnectionStatus('connected');
    localStorage.setItem('walletAddress', address);
  };

  const connectWallet = async () => {
    console.log('Attempting to connect wallet...');
    setConnectionStatus('connecting');
    setConnectionError('');

    if (typeof window.ethereum === 'undefined') {
      setConnectionError('MetaMask is not installed. Please install MetaMask to continue.');
      setConnectionStatus('error');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      console.log('Received accounts:', accounts);
      if (accounts.length > 0) {
        handleConnect(accounts[0]);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      let errorMessage = 'Failed to connect wallet. Please try again.';
      
      if (error.code === 4001) {
        errorMessage = 'You rejected the connection request. Please try again.';
      } else if (error.code === -32002) {
        errorMessage = 'Connection request already pending. Please check MetaMask.';
      }
      
      setConnectionError(errorMessage);
      setConnectionStatus('error');
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setUserAddress('');
    setUserDetails(null);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userData');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const userData = {
      address: userAddress,
      name: formData.name,
      email: formData.email,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('userData', JSON.stringify(userData));
    setUserDetails(userData);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search here
    console.log('Search query:', searchQuery);
  };

  if (!walletConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-purple-100 w-full max-w-md">
          <div className="mb-6">
            <Sparkles className="text-purple-500 w-12 h-12 mb-4" />
            <h1 className="text-3xl font-bold text-purple-900">Connect Wallet</h1>
            <p className="text-gray-600 mb-4">
              To access the features of the application, please connect your Ethereum wallet using MetaMask.
            </p>
          </div>
          
          <button
            onClick={connectWallet}
            disabled={connectionStatus === 'connecting'}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shield className="w-5 h-5 mr-2" />
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
          </button>
          
          {connectionError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{connectionError}</p>
            </div>
          )}
          
          {!window.ethereum && (
            <div className="mt-4 text-sm text-gray-600">
              <p>MetaMask not detected. Please:</p>
              <ol className="list-decimal ml-4 mt-2">
                <li>Install MetaMask from <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700">metamask.io</a></li>
                <li>Refresh this page after installation</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-purple-100 w-full max-w-md">
          <div className="text-center mb-6">
            <CheckCircle className="text-green-500 w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-purple-900 mb-2">Wallet Connected!</h2>
            <p className="text-gray-600 text-sm">{userAddress}</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div>
              <label className="block text-purple-900 font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-purple-900 font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Complete Setup
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(120,87,255,0.15)_1.5px,_transparent_1.5px)] bg-[length:24px_24px]"></div>
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
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => { window.location.href = '/documentation' }}
              className="px-4 py-2 bg-white hover:bg-purple-50 text-purple-600 font-medium rounded-lg transition-colors flex items-center border border-purple-200"
            >
              <FileText className="w-5 h-5 mr-2" />
              Docs
            </button>
            <button 
              onClick={disconnectWallet}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center"
            >
              <span className="mr-2">{`${userAddress.substring(0, 6)}...${userAddress.slice(-4)}`}</span>
              <Unplug className="w-5 h-5" />
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pt-40 pb-16 text-center relative">
        <h1 className="text-6xl font-bold mb-6 text-purple-900">
          Bet Locally with Friends.{' '}
          <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-transparent bg-clip-text">
            Win Globally
          </span>{' '}
          with Ethereum.
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
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-md"
          >
            <Search size={24} />
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <button 
            onClick={() => navigate('/create-bet')}
            className="group px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center shadow-md hover:shadow-lg"
          >
            Create Bet
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/listing')}
            className="group px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 flex items-center transition-all border border-purple-200 shadow-md hover:shadow-lg"
          >
            Join Bet
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform w-5 h-5" />
          </button>
        </div>

        {/* Feature Cards */}
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

export default LandingPage;