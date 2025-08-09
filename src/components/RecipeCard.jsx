// File: src/components/RecipeCard.jsx

import React from 'react';
import { FaClock, FaUsers, FaLock, FaHeart, FaArrowRight } from 'react-icons/fa';

const RecipeCard = ({
  recipe,
  onSelect,
  isLocked = false,
  onUpgrade,
  isFavorite,
  onToggleFavorite,
  showFloatingButton = true,   // ✅ NEW PROP (toggle floating button)
  buttonText = "View Details", // ✅ NEW PROP (custom button text)
  isFavoritesList = false,     // ✅ NEW PROP (indicates if this is in favorites list)
}) => {
  // ✅ Safely check if recipe is a favorite
  const isCurrentlyFavorite = isFavoritesList || (isFavorite ? isFavorite(recipe.id) : false);

  const handleCardClick = () => {
    if (!isLocked && onSelect) onSelect(recipe);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(recipe);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-all flex flex-col border border-gray-100 hover:shadow-lg">

      {/* 🔒 Premium Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
          <FaLock className="text-white text-3xl mb-3 animate-pulse" />
          <p className="text-white mb-3 text-sm">Premium recipe – upgrade to unlock</p>
          <button
            onClick={(e) => { e.stopPropagation(); if (onUpgrade) onUpgrade(); }}
            className="bg-primary-accent hover:bg-primary-accent/90 text-white font-semibold py-1 px-4 rounded-full transition">
            Upgrade to View
          </button>
        </div>
      )}

      {/* ✅ Recipe Image */}
      <img
        src={recipe.image || '/placeholder-recipe.jpg'}
        alt={recipe.title || 'Recipe Image'}
        className="w-full h-44 object-cover"
      />

      {/* ✅ Recipe Info */}
      <div className="p-4 flex flex-col flex-grow relative">
        <h3 className="text-lg font-bold text-dark-gray truncate">{recipe.title || 'Untitled Recipe'}</h3>

        <div className="flex items-center text-sm text-gray-500 mt-2 gap-4">
          <span className="flex items-center">
            <FaClock className="mr-1" /> {recipe.readyInMinutes || 'N/A'} min
          </span>
          <span className="flex items-center">
            <FaUsers className="mr-1" /> {recipe.ingredientsCount || recipe.extendedIngredients?.length || 'N/A'} Ingredients
          </span>
        </div>

        <div className="flex-grow" />

        {/* ✅ Bottom Favorite + View Section */}
        <div className="flex justify-between items-center mt-4">
          <button className="text-primary-accent font-bold hover:underline hidden sm:inline">
            {buttonText}
          </button>

          {/* ❤️ Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            aria-label="Toggle Favorite"
            className={`p-2 rounded-full transition ${isCurrentlyFavorite ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}>
            <FaHeart />
          </button>
        </div>

        {/* ✅ Floating Button (for mobile & hover) */}
        {showFloatingButton && !isLocked && (
          <button
            onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
            className="absolute bottom-3 right-3 bg-primary-accent hover:bg-primary-accent/90 text-white flex items-center gap-2 px-3 py-2 rounded-full shadow-md text-sm font-semibold sm:hidden">
            {buttonText} <FaArrowRight className="text-xs" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RecipeCard;
