import React, { useContext } from 'react';
import { UserContext } from '../App.jsx';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaPlus, FaTrash } from 'react-icons/fa';
import RecipeCard from './RecipeCard.jsx'; // Centralized component

// The component now accepts `onViewRecipe` as a prop from DashboardPage
function DashboardFavorites({ onViewRecipe }) {
    const { favoriteRecipes, isFavorite, toggleFavorite } = useContext(UserContext);
    const navigate = useNavigate();

    const favoriteRecipesArray = favoriteRecipes ? Object.values(favoriteRecipes) : [];
    const recentFavorites = favoriteRecipesArray.slice(0, 3);

    const handleViewAll = () => {
        navigate('/quick-find');
    };
    
    const DiscoverCard = () => (
        <div 
            onClick={handleViewAll}
            className="bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        >
            <FaPlus className="text-4xl text-gray-400 mb-2" />
            <h3 className="font-semibold text-lg text-gray-700">Discover New Recipes</h3>
            <p className="text-sm text-gray-500 mt-1">Search and add new favorites.</p>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-dark-gray flex items-center"><FaHeart className="mr-2 text-red-500" /> Your Favorite Recipes</h3>
                {favoriteRecipesArray.length > 3 && (
                    <button onClick={handleViewAll} className="text-sm font-semibold text-primary-accent hover:underline">View All</button>
                )}
            </div>
            
            {recentFavorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {recentFavorites.map(recipe => (
                        <div key={`dash-${recipe.id}`} className="relative group">
                            <RecipeCard
                                recipe={recipe}
                                onSelect={() => onViewRecipe(recipe)}
                                // ✅ FIX: Pass the isFavorite function itself, not its result
                                isFavorite={isFavorite}
                                onToggleFavorite={toggleFavorite}
                                isFavoritesList={true}
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe); }}
                                className="absolute top-2 right-2 text-red-500 p-2 rounded-full bg-white bg-opacity-70 group-hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                                title="Remove from Favorites"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                    {recentFavorites.length < 3 && <DiscoverCard />}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500 text-lg mb-4">You have no favorite recipes yet.</p>
                    <DiscoverCard />
                </div>
            )}
        </div>
    );
}

export default DashboardFavorites;
