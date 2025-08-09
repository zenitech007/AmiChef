import React, { useState, useEffect } from 'react';
import Modal from './MealPlannerModal'; // Assuming you have a generic Modal component

const EditMealModal = ({ isOpen, onClose, onSave, meal }) => {
  const [formData, setFormData] = useState({
    mealTitle: '',
    mealType: '',
    date: '',
    image: '',
    ingredients: '',
    instructions: '',
  });

  useEffect(() => {
    if (meal) {
      setFormData({
        mealTitle: meal.mealTitle || '',
        mealType: meal.mealType || '',
        date: meal.date || '',
        image: meal.image || '',
        // Join arrays into strings for form fields
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients.join('\n') : '',
        instructions: Array.isArray(meal.instructions) ? meal.instructions.join('\n') : '',
      });
    }
  }, [meal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedMeal = {
      ...meal,
      ...formData,
      // Split strings back into arrays for saving
      ingredients: formData.ingredients.split('\n').filter(Boolean),
      instructions: formData.instructions.split('\n').filter(Boolean),
    };
    onSave(updatedMeal);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={meal?.custom ? 'Edit Meal' : 'Add Custom Meal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Meal Title</label>
          <input
            type="text"
            name="mealTitle"
            value={formData.mealTitle}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Meal Type</label>
          <select
            name="mealType"
            value={formData.mealType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Meal Type</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <select
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Day</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Image URL</label>
          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ingredients (one per line)</label>
          <textarea
            name="ingredients"
            value={formData.ingredients}
            onChange={handleChange}
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Instructions (one step per line)</label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          ></textarea>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Save Meal
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditMealModal;