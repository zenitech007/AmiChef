// File: /src/components/RecipeModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaBookOpen, FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// ✅ Sub-modal for adding to meal planner
const MealPlannerSubModal = ({ recipeTitle, onClose, onSave }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [mealType, setMealType] = useState('Breakfast');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-slideUp">
                <h3 className="text-xl font-bold mb-4">Add to Meal Plan</h3>
                <p className="mb-4 text-gray-700">Schedule "<strong>{recipeTitle}</strong>" for a specific meal.</p>

                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="mt-1 mb-4 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary-accent" />

                <label className="block text-sm font-medium text-gray-700">Meal Type</label>
                <select value={mealType} onChange={(e) => setMealType(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md mb-6">
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                </select>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
                    <button onClick={() => { onSave({ date, mealType }); onClose(); }}
                        className="px-4 py-2 rounded-md bg-primary-accent text-white hover:opacity-90">Save</button>
                </div>
            </div>
        </div>
    );
};

const RecipeModal = ({ recipe, onClose, onAddToPlanner, onAddToGroceryList }) => {
    const [isPlannerOpen, setIsPlannerOpen] = useState(false);
    const modalRef = useRef(null);
    const touchStartY = useRef(0);
    const touchEndY = useRef(0);

    // ✅ Close modal on ESC key
    useEffect(() => {
        const handleEsc = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // ✅ Swipe-to-close (mobile)
    const handleTouchStart = (e) => (touchStartY.current = e.touches[0].clientY);
    const handleTouchMove = (e) => (touchEndY.current = e.touches[0].clientY);
    const handleTouchEnd = () => {
        if (touchEndY.current - touchStartY.current > 100) onClose();
    };

    const handleAddAllIngredients = () => {
        if (!recipe.extendedIngredients?.length) {
            toast.error("No ingredients to add.");
            return;
        }
        onAddToGroceryList(recipe.extendedIngredients);
        toast.success("All ingredients added to Grocery List!");
    };

    return (
        <>
            {isPlannerOpen && (
                <MealPlannerSubModal
                    recipeTitle={recipe.title}
                    onClose={() => setIsPlannerOpen(false)}
                    onSave={(data) => { onAddToPlanner(data); onClose(); }}
                />
            )}

            {/* ✅ Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                {/* ✅ Modal Container with Slide Animation */}
                <div ref={modalRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
                    
                    {/* ✅ Header */}
                    <div className="p-4 flex justify-between items-center border-b">
                        <h2 className="text-2xl font-bold text-primary-accent">{recipe.title}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><FaTimes size={22} /></button>
                    </div>

                    {/* ✅ Content */}
                    <div className="p-6">
                        <img src={recipe.image} alt={recipe.title}
                            className="w-full h-64 object-cover rounded-lg mb-4 shadow" />

                        {/* ✅ Ingredients */}
                        <h3 className="font-bold mb-2 text-lg">Ingredients</h3>
                        <ul className="space-y-2">
                            {recipe.extendedIngredients?.length ? recipe.extendedIngredients.map((ing) => (
                                <li key={ing.id} className="flex items-center gap-2 text-sm text-gray-700">
                                    <FaCheckCircle className="text-secondary-green" /> {ing.original}
                                </li>
                            )) : <li className="text-gray-500">No ingredient data available.</li>}
                        </ul>

                        {/* ✅ Instructions */}
                        <h3 className="font-bold mt-6 mb-2 text-lg">Instructions</h3>
                        <div className="text-sm space-y-2 text-gray-700"
                            dangerouslySetInnerHTML={{ __html: recipe.instructions || '<p>No instructions available.</p>' }} />

                        {/* ✅ Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-6">
                            <button onClick={() => setIsPlannerOpen(true)}
                                className="w-full bg-secondary-green text-white font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2 hover:opacity-90">
                                <FaBookOpen /> Add to Meal Planner
                            </button>
                            <button onClick={handleAddAllIngredients}
                                className="w-full bg-primary-accent text-white font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2 hover:opacity-90">
                                <FaShoppingCart /> Add All to Grocery List
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RecipeModal;
