// File: /src/components/RecipeDetailsModal.jsx

import React, { useContext } from 'react';
import { FaTimes, FaUtensils, FaListAlt, FaBookOpen, FaCartPlus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { UserContext } from '../App.jsx'; // Import UserContext to access addMultipleToGroceryList

const RecipeDetailsModal = ({ isOpen, onClose, meal }) => {
    // Access the addMultipleToGroceryList function from UserContext
    const { addMultipleToGroceryList } = useContext(UserContext);

    if (!isOpen || !meal) return null;

    const handleAddIngredientsToGroceryList = () => {
        if (meal.extendedIngredients && meal.extendedIngredients.length > 0) {
            // Pass the ingredients to the context function
            addMultipleToGroceryList(meal.extendedIngredients);
            onClose(); // Close the modal after adding
        } else {
            toast.error("No ingredients found for this meal.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-slideUp">
                {/* Header */}
                <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <FaUtensils className="text-primary-accent"/> {meal.title}
                    </h3>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-2xl">
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/2 flex justify-center items-center">
                            <img
                                src={meal.image}
                                alt={meal.title}
                                className="w-full max-w-sm h-auto rounded-lg shadow-md object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/400x300/ff0000/FFFFFF?text=Image+Error`; }}
                            />
                        </div>
                        <div className="md:w-1/2">
                            <h2 className="text-2xl font-semibold text-dark-gray mb-3 flex items-center">
                                <FaListAlt className="mr-2 text-secondary-green" /> Ingredients
                            </h2>
                            {meal.extendedIngredients && meal.extendedIngredients.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1 text-gray-700">
                                    {meal.extendedIngredients.map((ingredient, index) => (
                                        <li key={index}>{ingredient}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">No ingredients listed.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold text-dark-gray mb-3 flex items-center">
                            <FaBookOpen className="mr-2 text-secondary-green" /> Instructions
                        </h2>
                        {meal.instructions ? (
                            <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: meal.instructions.replace(/\n/g, '<br />') }} />
                        ) : (
                            <p className="text-gray-500">No instructions provided.</p>
                        )}
                    </div>

                    {meal.source && meal.source !== 'AI Generated' && (
                        <p className="text-sm text-gray-500 mt-4">Source: {meal.source}</p>
                    )}
                </div>

                {/* Footer with buttons */}
                <div className="p-5 border-t flex justify-end gap-3 sticky bottom-0 bg-white z-10">
                    <button
                        onClick={handleAddIngredientsToGroceryList}
                        className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 flex items-center gap-2"
                    >
                        <FaCartPlus /> Add Ingredients to Grocery List
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-full hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeDetailsModal;
