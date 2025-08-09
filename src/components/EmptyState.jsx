import React from 'react';
import { BoltIcon, PlusIcon } from '@heroicons/react/24/outline';

const EmptyState = ({ onGenerate, onAdd }) => {
  return (
    <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-700">Your meal plan is empty.</h2>
      <p className="mt-2 text-gray-500">Get started by generating a new plan or adding a custom meal.</p>
      <div className="mt-6 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={onGenerate}
          className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition"
        >
          <BoltIcon className="h-5 w-5 mr-2" />
          Generate with AI
        </button>
        <button
          onClick={onAdd}
          className="flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add My Own Meal
        </button>
      </div>
    </div>
  );
};

export default EmptyState;