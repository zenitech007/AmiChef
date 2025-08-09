import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import PremiumModal from '../components/PremiumModal.jsx';
import DashboardFavorites from '../components/DashboardFavorites.jsx';
import RecipeModal from '../components/RecipeModal.jsx';
import RecipeCard from '../components/RecipeCard.jsx'; // Updated import for the new component
import {
  FaDollarSign,
  FaClock,
  FaHeart,
  FaLock,
  FaCamera,
  FaBarcode,
  FaHandPointRight
} from 'react-icons/fa';
import { IoNotificationsSharp } from "react-icons/io5";
import { toast } from 'react-hot-toast';

// Extract static API keys outside the component
const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY || '86285605e22449ba9fae9dcc14530542';
const EDAMAM_APP_ID = import.meta.env.VITE_EDAMAM_APP_ID;
const EDAMAM_APP_KEY = import.meta.env.VITE_EDAMAM_API_KEY;

const formatSpoonacularRecipe = (r) => ({ id: `s_${r.id}`, title: r.title, image: r.image });
const formatEdamamRecipe = (hit) => ({ id: `e_${hit.recipe.uri.split('_')[1]}`, title: hit.recipe.label, image: hit.recipe.image, source: 'Edamam' });
const formatTheMealDBRecipe = (m) => ({ id: `t_${m.idMeal}`, title: m.strMeal, image: m.strMealThumb, source: 'TheMealDB' });

const LoadingSkeleton = () => (
  <div className="animate-pulse p-4 rounded-2xl bg-gray-200 h-60 w-full" />
);

function DashboardPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isPremium, favoriteRecipes, toggleFavorite, isFavorite } = useContext(UserContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dashboardRecipes, setDashboardRecipes] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const fetchDashboardRecipes = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);

    // Try to load from cache first
    const cached = localStorage.getItem("cached_dashboard_recipes");
    if (cached) {
      setDashboardRecipes(JSON.parse(cached));
      setDashboardLoading(false);
      return;
    }

    try {
      // First, try Spoonacular
      const response = await fetch(`https://api.spoonacular.com/recipes/random?number=6&apiKey=${SPOONACULAR_API_KEY}`);
      if (!response.ok) throw new Error("Spoonacular limit reached.");
      const data = await response.json();
      const recipes = data.recipes.map(formatSpoonacularRecipe);
      setDashboardRecipes(recipes);
      localStorage.setItem("cached_dashboard_recipes", JSON.stringify(recipes));
      return; // Exit if successful
    } catch (err) {
      console.warn("Spoonacular failed:", err.message);
    }

    try {
      // Second, try Edamam as a fallback
      toast('Trying Edamam...', { icon: '🍲' });
      const response = await fetch(`https://api.edamam.com/api/recipes/v2?type=public&q=popular&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`);
      const data = await response.json();
      const recipes = data.hits.slice(0, 6).map(formatEdamamRecipe);
      setDashboardRecipes(recipes);
      localStorage.setItem("cached_dashboard_recipes", JSON.stringify(recipes));
      return; // Exit if successful
    } catch (err) {
      console.warn("Edamam failed:", err.message);
    }

    try {
      // Third, try TheMealDB as a final fallback
      toast('Trying TheMealDB...', { icon: '🍽️' });
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=chicken`);
      const data = await response.json();
      const recipes = data.meals.slice(0, 6).map(formatTheMealDBRecipe);
      setDashboardRecipes(recipes);
      localStorage.setItem("cached_dashboard_recipes", JSON.stringify(recipes));
    } catch (err) {
      console.warn("MealDB failed:", err.message);
      setDashboardError("Couldn't load recipes from any source.");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Auth and routing checks
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth', { state: { from: '/dashboard' } });
    } else if (isPremium) {
      navigate('/premium-dashboard', { replace: true });
    }
  }, [isLoggedIn, isPremium, navigate]);

  // Initial recipe load
  useEffect(() => {
    if (isLoggedIn && !isPremium) {
      fetchDashboardRecipes();
    }
  }, [isLoggedIn, isPremium, fetchDashboardRecipes]);

  const handleUpgradeClick = () => setIsModalOpen(true);
  const handleProceedToBilling = () => {
    setIsModalOpen(false);
    navigate('/billing');
  };

  const handleRecipeCardClick = (recipeId, isLocked) => {
    if (isLocked) {
      handleUpgradeClick();
      return;
    }
    const source = recipeId.split('_')[0];
    if (source === 's') {
      navigate(`/recipe/${recipeId.substring(2)}`);
    } else {
      toast.error("Only Spoonacular recipes have a detail view.");
    }
  };

  const handleViewFavorite = (recipe) => setSelectedRecipe(recipe);
  const handleCloseRecipeModal = () => setSelectedRecipe(null);

  if (!isLoggedIn || isPremium) return null;

  return (
    <DashboardLayout>
      {isModalOpen && <PremiumModal onUpgrade={handleProceedToBilling} onClose={() => setIsModalOpen(false)} />}
      {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={handleCloseRecipeModal} />}

      <div className="space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-2xl border shadow-md flex justify-between items-center">
            <div><p className="text-sm text-gray-500">Money Saved</p><p className="text-2xl font-bold text-secondary-green">$0.00</p></div>
            <FaDollarSign className="text-secondary-green text-3xl" />
          </div>
          <div className="bg-white p-4 rounded-2xl border shadow-md flex justify-between items-center">
            <div><p className="text-sm text-gray-500">Items Expiring</p><p className="text-2xl font-bold text-primary-accent">0</p></div>
            <FaClock className="text-primary-accent text-3xl" />
          </div>
          <div className="bg-white p-4 rounded-2xl border shadow-md flex justify-between items-center">
            <div><p className="text-sm text-gray-500">Favorite Recipes</p><p className="text-2xl font-bold">{Object.values(favoriteRecipes).length}</p></div>
            <FaHeart className="text-rose-500 text-3xl" />
          </div>
        </div>

        {/* Locked Pantry Section */}
        <div className="bg-white p-6 rounded-2xl border shadow-md text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-400 bg-opacity-40 flex items-center justify-center z-10 rounded-2xl pointer-events-none">
            <FaLock className="text-white text-5xl opacity-80" />
          </div>
          <h3 className="text-xl font-bold text-gray-600 mb-4 opacity-50">Quick Add to Pantry</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50">
            <div className="p-4 bg-gray-100 rounded-lg text-gray-500 flex flex-col items-center"><FaCamera className="text-4xl mb-2" /><p>Scan Receipt</p></div>
            <div className="p-4 bg-gray-100 rounded-lg text-gray-500 flex flex-col items-center"><FaBarcode className="text-4xl mb-2" /><p>Scan Barcode</p></div>
            <div className="p-4 bg-gray-100 rounded-lg text-gray-500 flex flex-col items-center"><FaHandPointRight className="text-4xl mb-2" /><p>Fridge Photo</p></div>
          </div>
          <button onClick={handleUpgradeClick} className="mt-6 bg-primary-accent text-white font-bold py-2 px-6 rounded-full shadow-md relative z-20 hover:bg-primary-dark transition">Unlock Pantry Features</button>
        </div>

        {/* Alerts Section */}
        <div className="bg-white p-6 rounded-2xl shadow-md border">
          <h3 className="text-xl font-bold text-primary-accent mb-4 flex items-center"><IoNotificationsSharp className="mr-2 text-2xl" /> Expiry Alerts</h3>
          <p className="text-center text-gray-500">Upgrade to Premium to track expiry & receive alerts.</p>
        </div>

        {/* Favorites Section */}
        <DashboardFavorites onViewRecipe={handleViewFavorite} />

        {/* Discover Recipes Section */}
        <div className="bg-white p-6 rounded-2xl shadow-md border">
          <h3 className="text-xl font-bold mb-4">Discover New Recipes</h3>
          {dashboardLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, idx) => <LoadingSkeleton key={idx} />)}
            </div>
          ) : dashboardError ? (
            <p className="text-red-500 text-center">{dashboardError}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardRecipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isLocked={index >= 3}
                  onUpgrade={handleUpgradeClick}
                  onSelect={handleRecipeCardClick}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  showFloatingButton={true}
                  buttonText="View Recipe"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;
