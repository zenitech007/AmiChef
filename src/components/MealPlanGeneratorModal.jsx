// File: /src/components/MealPlanGeneratorModal.jsx

import React, { useState, useEffect, useRef, useContext } from 'react'; // Added useContext
import { FaTimes, FaRobot } from 'react-icons/fa';
import countriesList from './countries.json';
import { UserContext } from '../App.jsx'; // Import UserContext

const MealPlanGeneratorModal = ({ isOpen, onClose, onGenerate, isGenerating }) => {
  // Access userSettings and updateUserSettings from UserContext
  const { userSettings, updateUserSettings } = useContext(UserContext);

  // Initialize formData state using values from userSettings or defaults
  const [formData, setFormData] = useState({
    days: userSettings.mp_days || 7,
    location: userSettings.mp_location || '',
    dietaryPref: userSettings.mp_dietaryPref || 'none',
    // Removed healthIssues as it was not in the prompt for AI, but keeping it in state if needed elsewhere
    healthIssues: '',
    goal: userSettings.mp_goal || 'No goal',
    householdSize: userSettings.mp_householdSize || 1,
    mealCount: userSettings.mp_mealCount || 3,
    cookingTime: userSettings.mp_cookingTime || 'under_30',
    budget: userSettings.mp_budget || 'moderate',
    allergies: userSettings.mp_allergies || '',
    // Removed exclusions as it was not in the prompt for AI, but keeping it in state if needed elsewhere
    exclusions: '',
  });

  const [filteredCountries, setFilteredCountries] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Effect to update form data if userSettings change from outside (e.g., initial load from Firebase)
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      days: userSettings.mp_days || 7,
      location: userSettings.mp_location || '',
      dietaryPref: userSettings.mp_dietaryPref || 'none',
      goal: userSettings.mp_goal || 'No goal',
      householdSize: userSettings.mp_householdSize || 1,
      mealCount: userSettings.mp_mealCount || 3,
      cookingTime: userSettings.mp_cookingTime || 'under_30',
      budget: userSettings.mp_budget || 'moderate',
      allergies: userSettings.mp_allergies || '',
    }));
  }, [userSettings]); // Re-run when userSettings object changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, location: value }));
    if (value.length > 1) {
      const filtered = countriesList.filter(c => c.name.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5);
      setFilteredCountries(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredCountries([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectLocation = (country) => {
    setFormData(prev => ({ ...prev, location: country }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => { // Made async to await updateUserSettings
    e.preventDefault();
    const dataToSave = {
      mp_days: formData.days,
      mp_location: formData.location,
      mp_dietaryPref: formData.dietaryPref,
      mp_goal: formData.goal,
      mp_householdSize: formData.householdSize,
      mp_mealCount: formData.mealCount,
      mp_cookingTime: formData.cookingTime,
      mp_budget: formData.budget,
      mp_allergies: formData.allergies,
    };
    
    // Save the current form data to user settings in Firestore
    await updateUserSettings(dataToSave);

    onGenerate(formData); // Pass the formData object to the parent
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-slideUp">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold flex items-center gap-2"><FaRobot className="text-secondary-green"/> AI Meal Planner Generator</h3>
          <button onClick={onClose}><FaTimes className="text-gray-600 text-2xl" /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <p className="text-gray-600 text-sm">Set your preferences for a smarter, AI-generated plan.</p>

          {/* Location + Suggestions */}
          <div className="relative">
            <label className="block text-sm font-semibold">Location</label>
            <input type="text" name="location" value={formData.location} onChange={handleLocationChange} placeholder="e.g. Nigeria" className="mt-1 w-full p-2 border rounded-md" />
            {showSuggestions && (
              <ul className="absolute w-full bg-white border rounded shadow mt-1 z-10">
                {filteredCountries.map(c => <li key={c.code} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelectLocation(c.name)}>{c.name}</li>)}
              </ul>
            )}
          </div>

          {/* Grid of Preferences */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label>Dietary Preference</label>
              <select name="dietaryPref" value={formData.dietaryPref} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                <option>none</option><option>Vegan</option><option>Keto</option><option>Vegetarian</option>
              </select>
            </div>
            <div>
              <label>Allergies</label>
              <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="e.g. no nuts" className="mt-1 w-full p-2 border rounded" />
            </div>
            <div>
              <label>Household Size</label>
              <input type="number" name="householdSize" min="1" value={formData.householdSize} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
            </div>
            <div>
              <label>Meals/Day</label>
              <select name="mealCount" value={formData.mealCount} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                <option>2</option><option>3</option><option>4</option>
              </select>
            </div>
            <div>
              <label>Goal</label>
              <select name="goal" value={formData.goal} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                <option>No goal</option><option>Lose Weight</option><option>Gain Muscle</option><option>Balanced Diet</option>
              </select>
            </div>
            <div>
              <label>Cooking Time</label>
              <select name="cookingTime" value={formData.cookingTime} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                <option>under_30</option><option>under_60</option><option>any</option>
              </select>
            </div>
            <div>
              <label>Budget</label>
              <select name="budget" value={formData.budget} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                <option>moderate</option><option>budget-friendly</option><option>gourmet</option>
              </select>
            </div>
            <div>
              <label>Days</label>
              <input type="number" name="days" min="1" max="7" value={formData.days} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
            <button type="submit" disabled={isGenerating} className="bg-secondary-green text-white px-4 py-2 rounded hover:opacity-90">{isGenerating ? 'Generating...' : 'Generate'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MealPlanGeneratorModal;
