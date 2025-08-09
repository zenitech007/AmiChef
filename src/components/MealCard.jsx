import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const MealCard = ({ meal, onDelete, onEdit, onSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:scale-[1.02]">
      <div className="relative">
        <img
          src={meal.image || 'https://via.placeholder.com/400x250.png?text=No+Image'}
          alt={meal.mealTitle}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={() => onSelect(meal)}
        />
        <div className="absolute top-2 right-2 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(meal);
            }}
            className="p-2 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(meal);
            }}
            className="p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3
          className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition"
          onClick={() => onSelect(meal)}
        >
          {meal.mealTitle}
        </h3>
        <p className="text-sm text-gray-500">{meal.mealType}</p>
      </div>
    </div>
  );
};

export default MealCard;