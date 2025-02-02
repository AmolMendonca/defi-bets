import React, { useState } from "react";
import {
  Shield,
  Wallet,
  PenLine,
  Coins,
  AlertCircle,
  ArrowRight,
  Check,
} from "lucide-react";

const CreateBetPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    insurance: false
  });

  // Mock wallet address - in real app would come from wallet connection
  const walletAddress = "0x1234...5678";
  const insuranceFee = 0.05; // 5% insurance fee

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 1. Implement the create bet call
  const handleCreateBet = async () => {
    setIsSubmitting(true);

    try {
      // Prepare the body data to match your /create-bet endpoint
      const bodyData = {
        participant: walletAddress,
        title: formData.title, // <-- Fix: assign formData.title here
        amount: formData.amount, // in ETH (string or number)
        insuranceOpted: includeInsurance,
      };

      // Adjust the endpoint URL if your server runs on a different port
      const response = await fetch("http://localhost:5001/create-bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      console.log("Bet created successfully:", data);

      // Optionally clear form or show success message
      setFormData({ title: "", amount: "" });
    } catch (error) {
      console.error("Error creating bet:", error);
      alert(`Error creating bet: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = formData.amount
    ? (includeInsurance
        ? parseFloat(formData.amount) +
          parseFloat(formData.amount) * insuranceFee
        : parseFloat(formData.amount)
      ).toFixed(3)
    : "0.000";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 relative overflow-y-auto pt-20 px-4 pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(120,87,255,0.15)_1.5px,_transparent_1.5px)] bg-[length:24px_24px]"></div>
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 40%)`,
        }}
      />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-purple-600" />
          <p className="text-purple-600">
            Create a new bet and set your stake amount
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md shadow-xl border border-purple-100 rounded-xl p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-purple-900 mb-2">
              Create a bet
            </h1>
            <p className="text-gray-600">
              Set up your bet details and stake amount
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <Wallet className="text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Connected Wallet</p>
                <p className="text-purple-900 font-medium">{walletAddress}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-purple-900">
                <PenLine className="w-4 h-4" />
                Bet Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter your bet title"
                className="w-full px-4 py-2 rounded-lg border border-purple-100 focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 bg-white/50"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-purple-900">
                <Coins className="w-4 h-4" />
                Stake Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.000"
                  step="0.001"
                  min="0"
                  className="w-full px-4 py-2 rounded-lg border border-purple-100 focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 bg-white/50 pr-12"
                />
                <span className="absolute right-4 top-2 text-gray-500">
                  ETH
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-purple-100">
              <div className="flex-shrink-0 mt-0.5">
                <Shield className="text-purple-500" size={20} />
              </div>
              <div className="flex-grow">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="block text-sm font-medium text-purple-900 mb-1">
                      Stake Insurance
                    </span>
                    <span className="block text-xs text-gray-500">
                      Protect your stake with 5% insurance fee
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeInsurance}
                    onChange={(e) => setIncludeInsurance(e.target.checked)}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                </label>
              </div>
            </div>

            {/* Total Amount Display */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Base Amount</span>
                <span className="text-purple-900 font-medium">
                  {formData.amount || "0.000"} ETH
                </span>
              </div>

              {includeInsurance && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Insurance Fee (5%)</span>
                  <span className="text-purple-900 font-medium">
                    {formData.amount
                      ? (parseFloat(formData.amount) * insuranceFee).toFixed(3)
                      : "0.000"}{" "}
                    ETH
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center font-medium pt-2 border-t border-purple-100">
                <span className="text-purple-900">Total</span>
                <span className="text-purple-900">{totalAmount} ETH</span>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateBet}
              disabled={isSubmitting || !formData.title || !formData.amount}
              className="w-full group px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:bg-purple-600"
            >
              {isSubmitting ? (
                "Creating Bet..."
              ) : (
                <>
                  Create
                  <ArrowRight
                    className="group-hover:translate-x-1 transition-transform"
                    size={20}
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBetPage;
