import React from 'react';
import Modal from './MealPlannerModal'; // Assuming you have a generic Modal component

const AddMealOptionsModal = ({ isOpen, onClose, onCustomMeal, onAiGenerate }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Meal">
      <p className="mb-4 text-gray-600">Choose how you would like to add a meal to your plan.</p>
      <div className="flex flex-col space-y-4">
        <button
          onClick={onAiGenerate}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition"
        >
          Generate with AI
        </button>
        <button
          onClick={onCustomMeal}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md shadow-sm hover:bg-gray-700 transition"
        >
          Add My Own Meal
        </button>
      </div>
    </Modal>
  );
};

export default AddMealOptionsModal;