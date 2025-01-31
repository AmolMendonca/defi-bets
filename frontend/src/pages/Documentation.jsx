import React, { useState } from 'react';
import { 
  Book, 
  Shield, 
  Coins, 
  Code, 
  Network,
  AlertTriangle,
} from 'lucide-react';
import DocumentationContent from './DocumentationContent';

const Documentation = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const navItems = [
    { id: 'overview', icon: Book, label: 'Protocol Overview' },
    { id: 'security', icon: Shield, label: 'Security Model' },
    { id: 'yield', icon: Coins, label: 'Yield Generation' },
    { id: 'implementation', icon: Code, label: 'Implementation' },
    { id: 'architecture', icon: Network, label: 'Architecture' },
    { id: 'risks', icon: AlertTriangle, label: 'Risk Analysis' }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 p-4 fixed h-full overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Seiyuko</h2>
          <p className="text-sm text-gray-600">Smart Contract Documentation v1.0.0</p>
        </div>
        
        <nav className="space-y-1">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center px-3 py-2 w-full rounded-md ${
                activeSection === id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-72 flex-1 p-8">
        <DocumentationContent activeSection={activeSection} />
      </div>
    </div>
  );
};

export default Documentation;