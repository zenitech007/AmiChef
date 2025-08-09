import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import DashboardFavorites from '../components/DashboardFavorites.jsx';
import RecipeModal from '../components/RecipeModal.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import {
    FaDollarSign, FaClock, FaClipboardList, FaCamera, FaBarcode, FaHandPointRight, FaHeart
} from 'react-icons/fa';
import { IoNotificationsSharp } from "react-icons/io5";
import { toast } from 'react-hot-toast';

// Extract API keys outside component for security and performance
const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;
const EDAMAM_APP_ID = import.meta.env.VITE_EDAMAM_APP_ID;
const EDAMAM_API_KEY = import.meta.env.VITE_EDAMAM_API_KEY;

// Helper function to normalize API response structure
const normalizeSpoonacular = (r) => ({ id: `s_${r.id}`, title: r.title, image: r.image, ...r });

// Helper function to calculate expiry days
const calculateExpiryDays = (expiryDate) => {
    if (!expiryDate) return Infinity;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to format expiry text
const getExpiryText = (days) => {
    if (days === 0) return 'Expires Today';
    if (days < 0) return `Expired`;
    return days === 1 ? '1 day left' : `${days} days left`;
};

// Loading state skeleton for a better user experience
const LoadingSkeleton = () => (
    <div className="animate-pulse bg-gray-200 rounded-2xl h-60 w-full" />
);

function PremiumDashboardPage() {
    const navigate = useNavigate();
    const { isLoggedIn, isPremium, toggleFavorite, isFavorite, pantryItems, favoriteRecipes } = useContext(UserContext);

    const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
    const [dashboardRecipes, setDashboardRecipes] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState(null);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    // Filter and sort pantry items nearing expiry
    const nearExpiryItems = pantryItems
        .map(item => ({ ...item, expiryDays: calculateExpiryDays(item.expiryDate) }))
        .filter(item => item.expiryDays <= 7 && item.expiryDays !== Infinity)
        .sort((a, b) => a.expiryDays - b.expiryDays);

    // Fetch recipes, with support for search and caching
    const fetchDashboardRecipes = useCallback(async (query = '') => {
        setDashboardLoading(true);
        setDashboardError(null);
        try {
            const url = query
                ? `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=6&apiKey=${SPOONACULAR_API_KEY}`
                : `https://api.spoonacular.com/recipes/random?number=6&apiKey=${SPOONACULAR_API_KEY}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Spoonacular API error");
            const data = await res.json();
            const results = data.results || data.recipes || [];
            setDashboardRecipes(results.map(normalizeSpoonacular));
            if (results.length === 0 && query) setDashboardError("No recipes found for your search.");
        } catch (err) {
            console.warn("Recipe fetch failed:", err.message);
            setDashboardError("Failed to load recipes. Please try again later.");
        } finally {
            setDashboardLoading(false);
        }
    }, [SPOONACULAR_API_KEY]);

    // Auth Redirect Logic
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/auth', { state: { from: '/premium-dashboard' } });
        } else if (!isPremium) {
            navigate('/dashboard');
        }
    }, [isLoggedIn, isPremium, navigate]);

    // Debounced Search Trigger for better performance
    useEffect(() => {
        const handler = setTimeout(() => fetchDashboardRecipes(dashboardSearchQuery), 500);
        return () => clearTimeout(handler);
    }, [dashboardSearchQuery, fetchDashboardRecipes]);

    // Handlers for UI interactions
    const handleViewFavorite = (recipe) => setSelectedRecipe(recipe);
    const handleCloseRecipeModal = () => setSelectedRecipe(null);
    const handleRecipeCardClick = (recipe) => {
        const fullRecipe = dashboardRecipes.find(r => r.id === recipe.id) || recipe;
        setSelectedRecipe(fullRecipe);
    };
    const handleUpgradeClick = () => toast.error("You already have Premium!");

    if (!isLoggedIn || !isPremium) {
        return <div className="flex items-center justify-center min-h-screen"><p className="text-lg">Redirecting...</p></div>;
    }

    return (
        <DashboardLayout>
            {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={handleCloseRecipeModal} />}

            <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-2xl shadow-md border flex justify-between">
                        <div><p className="text-sm text-gray-600">Pantry Items</p><p className="text-2xl font-bold text-green-600">{pantryItems.length}</p></div>
                        <FaClipboardList className="text-3xl text-green-600 opacity-70" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-md border flex justify-between">
                        <div><p className="text-sm text-gray-600">Items Expiring Soon</p><p className="text-2xl font-bold text-primary-accent">{nearExpiryItems.length}</p></div>
                        <FaClock className="text-3xl text-primary-accent opacity-70" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-md border flex justify-between">
                        <div><p className="text-sm text-gray-600">Favorite Recipes</p><p className="text-2xl font-bold">{Object.keys(favoriteRecipes).length}</p></div>
                        <FaHeart className="text-3xl text-rose-500 opacity-70" />
                    </div>
                </div>

                {/* Quick Add to Pantry */}
                <div className="bg-white p-6 rounded-2xl shadow-md border text-center">
                    <h3 className="text-xl font-bold text-green-700 mb-4">Quick Add to Pantry</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['Scan Receipt', 'Scan Barcode', 'Photo of Fridge'].map((label, idx) => (
                            <div key={idx} onClick={() => navigate('/smart-pantry')} className="p-4 bg-green-50 rounded-2xl flex flex-col items-center border-2 border-green-600 cursor-pointer hover:bg-green-100 transition">
                                {idx === 0 ? <FaCamera className="text-4xl mb-2 text-green-700" /> : idx === 1 ? <FaBarcode className="text-4xl mb-2 text-green-700" /> : <FaHandPointRight className="text-4xl mb-2 text-green-700" />}
                                <p className="font-semibold">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expiring Items */}
                <div className="bg-white p-6 rounded-2xl shadow-md border">
                    <h3 className="text-xl font-bold text-primary-accent mb-4 flex items-center"><IoNotificationsSharp className="mr-2 text-2xl" /> Items Expiring Soon</h3>
                    {nearExpiryItems.length ? (
                        <ul className="space-y-3">
                            {nearExpiryItems.map(item => (
                                <li key={item.id} className={`p-3 rounded-2xl flex justify-between items-center ${item.expiryDays <= 0 ? 'bg-red-50 border-l-4 border-red-500' : 'bg-green-50 border-l-4 border-green-600'}`}>
                                    <span className={item.expiryDays <= 0 ? 'text-red-700 font-semibold' : 'font-semibold'}>{item.name}</span>
                                    <span className="text-sm text-gray-600">{getExpiryText(item.expiryDays)}</span>
                                    <button onClick={() => setDashboardSearchQuery(item.name)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-sm transition">Find Recipe</button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-center text-gray-500">Your pantry is all clear!</p>}
                </div>

                {/* Favorites */}
                <DashboardFavorites onViewRecipe={handleViewFavorite} />

                {/* Discover Recipes */}
                <div className="bg-white p-6 rounded-2xl shadow-md border">
                    <h3 className="text-xl font-bold mb-4">Discover New Recipes</h3>
                    <input
                        type="text"
                        className="shadow border rounded-full w-full py-3 px-6 mb-6 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Search recipes by ingredient..."
                        value={dashboardSearchQuery}
                        onChange={(e) => setDashboardSearchQuery(e.target.value)}
                        disabled={dashboardLoading}
                    />

                    {dashboardLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => <LoadingSkeleton key={i} />)}
                        </div>
                    ) : dashboardError ? (
                        <p className="text-center text-red-500">{dashboardError}</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {dashboardRecipes.map(recipe => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    onSelect={handleRecipeCardClick}
                                    isLocked={false}
                                    onUpgrade={handleUpgradeClick}
                                    isFavorite={isFavorite}
                                    onToggleFavorite={toggleFavorite}
                                    showFloatingButton={true}
                                    buttonText="View Recipe"
                                />
                            ))}
                        </div>
                    )}
                    {!dashboardLoading && !dashboardError && dashboardRecipes.length === 0 && (
                        <p className="text-center text-gray-600">No recipes found. Try searching for something else!</p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default PremiumDashboardPage;
