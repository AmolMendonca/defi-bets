import React, { useState } from 'react';
import { Calendar, DollarSign, Tags, Book, AlertCircle, Eye, Sparkles } from 'lucide-react';

const CreateBetPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    stake: '',
    deadline: '',
    rules: '',
    payoutType: 'winner_takes_all'
  });

  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting bet:', formData);
    // Add blockchain integration here
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const categories = [
    'Sports', 'Politics', 'Entertainment', 'Crypto', 'Events', 'Other'
  ];

  const payoutTypes = [
    { id: 'winner_takes_all', label: 'Winner Takes All' },
    { id: 'split_pot', label: 'Split Pot' },
    { id: 'proportional', label: 'Proportional to Stake' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 relative">
      {}
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(120,87,255,0.15)_1.5px,_transparent_1.5px)] bg-[length:24px_24px]"></div>

      {}
      <div className="max-w-4xl mx-auto pt-32 pb-16 px-4 relative">
        {}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-purple-900 mb-4">Create Your Bet</h1>
          <p className="text-gray-600">Set up your betting terms and conditions</p>
        </div>

        {}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-100">
            {}
            <div className="mb-6">
              <label className="block text-purple-900 font-medium mb-2">Bet Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Enter a clear, concise title"
              />
            </div>

            {}
            <div className="mb-6">
              <label className="block text-purple-900 font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Describe your bet in detail"
              />
            </div>

            {}
            <div className="grid md:grid-cols-2 gap-6">
              {}
              <div>
                <label className="block text-purple-900 font-medium mb-2">Category</label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                    ))}
                  </select>
                  <Tags className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                </div>
              </div>

              {}
              <div>
                <label className="block text-purple-900 font-medium mb-2">Stake Amount (ETH)</label>
                <div className="relative">
                  <input
                    type="number"
                    name="stake"
                    value={formData.stake}
                    onChange={handleChange}
                    step="0.001"
                    className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="0.00"
                  />
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                </div>
              </div>

              {}
              <div>
                <label className="block text-purple-900 font-medium mb-2">Deadline</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                </div>
              </div>

              {}
              <div>
                <label className="block text-purple-900 font-medium mb-2">Payout Type</label>
                <div className="relative">
                  <select
                    name="payoutType"
                    value={formData.payoutType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none bg-white"
                  >
                    {payoutTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                </div>
              </div>
            </div>

            {}
            <div className="mt-6">
              <label className="block text-purple-900 font-medium mb-2">Rules & Resolution Criteria</label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Specify how the bet outcome will be determined..."
              />
            </div>
          </div>

          {}
          <div className="bg-purple-50 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-purple-500 mt-1" size={20} />
            <p className="text-sm text-gray-600">
              All bets are final and will be executed on the blockchain. Make sure all information is correct before submitting.
            </p>
          </div>

          {}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 flex items-center gap-2 transition-all border border-purple-200 shadow-md hover:shadow-lg"
            >
              <Eye size={20} />
              Preview Bet
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles size={20} />
              Create Bet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBetPage;