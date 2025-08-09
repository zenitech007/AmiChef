import React, { useState, useEffect } from "react";
import { UserContext } from "../App.jsx";
import { toast } from 'react-hot-toast';

const GrocerySearch = () => {
  const { addItemToGroceryList } = React.useContext(UserContext);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [category, setCategory] = useState("all");
  const [zipCode, setZipCode] = useState("10001");
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Firebase function URL - update this when deployed
  const FIREBASE_FUNCTION_URL = "https://us-central1-amichef-5df3e.cloudfunctions.net/api/kroger";

  const categories = ["all", "dairy", "meat", "vegetables", "fruits", "beverages", "snacks"];

  const handleSearch = async (append = false) => {
    if (!query && category === "all") return;
    setLoading(true);

    try {
      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          category,
          priceRange,
          location: zipCode,
          page: append ? page : 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const data = await response.json();
      const newResults = data?.items || [];
      setResults(prev => (append ? [...prev, ...newResults] : newResults));

    } catch (err) {
      console.error("Search error:", err);
      toast.error("Failed to fetch search results. Please check your network and Firebase function URL.");
    }

    setLoading(false);
  };

  const handleAddToGroceryList = item => {
    addItemToGroceryList({
      name: item.description,
      quantity: "1",
      category: category === "all" ? "Other" : category,
      brand: item.brand,
    });
    toast.success(`🛒 Added "${item.description}" to your grocery list!`);
  };

  const handleSmartSuggest = async input => {
    if (!input || input.length < 2) {
      setSmartSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          location: zipCode,
          page: 1,
        }),
      });

      const data = await response.json();
      const suggestions = data?.items?.map(i => i.description).slice(0, 5) || [];
      setSmartSuggestions([...new Set(suggestions)]);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Suggestion error:", error);
    }
  };

  useEffect(() => {
    if (query.length > 1) {
      handleSmartSuggest(query);
    }
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">🛒 Smart Grocery Search</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search groceries..."
          className="flex-1 border p-2 rounded"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border p-2 rounded"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat[0].toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={zipCode}
          onChange={e => setZipCode(e.target.value)}
          className="border p-2 rounded w-24"
          placeholder="Zip"
        />
      </div>

      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2">
          💲 Min:
          <input
            type="number"
            value={priceRange[0]}
            onChange={e => setPriceRange([+e.target.value, priceRange[1]])}
            className="border p-1 rounded w-20"
          />
        </label>
        <label className="flex items-center gap-2">
          💰 Max:
          <input
            type="number"
            value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], +e.target.value])}
            className="border p-1 rounded w-20"
          />
        </label>
        <button
          onClick={() => {
            setPage(1);
            handleSearch(false);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {showSuggestions && smartSuggestions.length > 0 && (
        <div className="mb-4 bg-gray-100 p-2 rounded shadow">
          <strong className="block mb-1">Smart Suggestions:</strong>
          <div className="flex gap-2 flex-wrap">
            {smartSuggestions.map((sug, idx) => (
              <button
                key={idx}
                className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                onClick={() => {
                  setQuery(sug);
                  setShowSuggestions(false);
                  setPage(1);
                  handleSearch(false);
                }}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center my-8">🔄 Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {results.length === 0 && <p>No results found.</p>}
          {results.map((item, idx) => (
            <div
              key={idx}
              className="border p-4 rounded shadow hover:shadow-lg transition"
            >
              <h2 className="font-semibold text-lg mb-1">{item.description}</h2>
              <p className="text-sm text-gray-600 mb-2">{item.brand}</p>
              <p className="text-green-700 font-medium mb-2">
                ${item.items?.[0]?.price?.regular?.toFixed(2) || "N/A"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToGroceryList(item)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Add to Grocery List
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setPage(prev => prev + 1);
              handleSearch(true);
            }}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default GrocerySearch;