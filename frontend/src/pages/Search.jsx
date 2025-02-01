import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // When the component mounts or the searchParams change, check for an initial query.
  useEffect(() => {
    const initialQuery = searchParams.get("query") || "";
    if (initialQuery) {
      setQuery(initialQuery);
      fetchResults(initialQuery);
    }
  }, [searchParams]);

  const fetchResults = async (searchQuery) => {
    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) {
        throw new Error("No results found");
      }
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
      setResults([]);
    }
  };

  // Trigger a new search when the form is submitted.
  const handleSearch = async (e) => {
    e.preventDefault();
    // Update the URL with the new query parameter.
    navigate(`/search?query=${encodeURIComponent(query)}`);
    fetchResults(query);
  };

  const connectWallet = () => {
    console.log("Connecting wallet...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(120,87,255,0.15)_1.5px,_transparent_1.5px)] bg-[length:24px_24px]"></div>

      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4">
        <nav className="max-w-7xl mx-auto my-4 px-6 py-4 flex justify-between items-center rounded-xl bg-white/70 backdrop-blur-md shadow-lg border border-purple-100">
          <div className="text-xl font-bold text-purple-900 flex items-center gap-2">
            <Sparkles className="text-purple-500" />
            <Link to="/" className="hover:underline">
              Seiyuko
            </Link>
          </div>
          <div className="space-x-4">
            <button
              onClick={connectWallet}
              className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              Connect Wallet
            </button>
            <button className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all border border-purple-200 shadow-md hover:shadow-lg">
              Sign Up
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 pt-40 pb-16 text-center relative">
        <h1 className="text-5xl font-bold text-purple-900 mb-6">Search Bets</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-12">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title"
            className="w-full px-6 py-4 text-lg bg-white/80 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-700 placeholder-gray-400 shadow-md"
          />
          <button
            type="submit"
            className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-md"
          >
            Search
          </button>
        </form>

        {/* Search Results */}
        <div>
          {results.length > 0 ? (
            <ul className="space-y-4">
              {results.map((bet) => (
                <li
                  key={bet.id}
                  className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100 shadow-md hover:shadow-lg transition-all text-left"
                >
                  <h2 className="text-2xl font-bold text-purple-900 mb-2">
                    {bet.title}
                  </h2>
                  <p className="text-gray-600">{bet.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No results found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
