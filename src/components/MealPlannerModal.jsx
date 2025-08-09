// src/components/MealPlannerModal.jsx
import React, { useState } from 'react';
import { FaTimes, FaRobot, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const MealPlannerModal = ({ meal, onClose, onSave, onReplaceMeal, onAddToGrocery }) => {
  const [date, setDate] = useState(meal?.date || new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState(meal?.mealType || 'Breakfast');

  const handleSave = () => {
    if (!date) return toast.error("Please select a date.");
    onSave(date, mealType);
  };

  const handleReplace = () => {
    toast('Fetching AI alternative...', { icon: '🤖' });
    onReplaceMeal(meal);
  };

  const handleAddIngredients = () => {
    if (!meal?.ingredients?.length) {
      toast.error("No ingredients found for this meal.");
      return;
    }
    onAddToGrocery(meal.ingredients);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative animate-slideUp">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 text-2xl">
          <FaTimes />
        </button>

        {/* Meal Image */}
        <img src={meal?.image || '/images/placeholder-food.jpg'} alt={meal?.mealTitle} className="w-full h-56 object-cover rounded-t-lg" />

        <div className="p-5">
          {/* Meal Title */}
          <h2 className="text-2xl font-bold text-primary-accent mb-2">{meal?.mealTitle}</h2>
          <p className="text-gray-600 text-sm mb-4">{mealType} • {date}</p>

          {/* Ingredients */}
          <h3 className="font-semibold mb-2">Ingredients</h3>
          <ul className="list-disc list-inside text-sm mb-4">
            {meal?.ingredients?.map((ing, idx) => <li key={idx}>{ing}</li>) || <li>No ingredients available.</li>}
          </ul>

          {/* Instructions */}
          <h3 className="font-semibold mb-2">Instructions</h3>
          <p className="text-sm whitespace-pre-line mb-4">{meal?.instructions || 'No instructions available.'}</p>

          {/* Date & Meal Type Selection */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium">Meal</label>
              <select value={mealType} onChange={e => setMealType(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button onClick={handleSave} className="bg-primary-accent text-white py-2 rounded-full font-bold hover:opacity-90">Save to Planner</button>
            <button onClick={handleReplace} className="bg-secondary-green text-white py-2 rounded-full flex items-center justify-center gap-2 hover:opacity-90">
              <FaRobot /> Replace Meal with AI
            </button>
            <button onClick={handleAddIngredients} className="bg-gray-200 text-gray-800 py-2 rounded-full flex items-center justify-center gap-2 hover:bg-gray-300">
              <FaShoppingCart /> Add Ingredients to Grocery
            </button>
            <button onClick={onClose} className="bg-gray-100 text-gray-600 py-2 rounded-full font-bold hover:bg-gray-200">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlannerModal;
