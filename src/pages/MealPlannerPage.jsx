import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserContext } from '../App.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { FaCalendarAlt, FaPlus, FaPen, FaTrashAlt, FaUtensils, FaTimes, FaBook, FaEdit, FaRobot, FaLock, FaThumbtack, FaSyncAlt, FaEraser, FaListAlt, FaBookOpen, FaCartPlus } from 'react-icons/fa';
import MealPlanGeneratorModal from '../components/MealPlanGeneratorModal.jsx';

// Inline definition of the RecipeDetailsModal component from the user's provided code
const RecipeDetailsModal = ({ isOpen, onClose, meal }) => {
    // Access the addMultipleToGroceryList function from UserContext
    const { addMultipleToGroceryList } = useContext(UserContext);

    if (!isOpen || !meal) return null;

    const handleAddIngredientsToGroceryList = () => {
        if (meal.extendedIngredients && meal.extendedIngredients.length > 0) {
            // Pass the ingredients to the context function
            addMultipleToGroceryList(meal.extendedIngredients);
            onClose(); // Close the modal after adding
            toast.success("Ingredients added to your grocery list!");
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

const AddMealOptionsModal = ({ isOpen, onClose, onSelectOption }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"><FaTimes /></button>
                <h3 className="text-xl font-bold mb-6 text-center">How would you like to add a meal?</h3>
                <div className="flex justify-around gap-4">
                    <button onClick={() => onSelectOption('recipe')} className="flex flex-col items-center justify-center p-4 w-1/2 bg-gray-100 hover:bg-secondary-green hover:text-white rounded-lg transition-all">
                        <FaBook size={24} className="mb-2"/>
                        <span className="font-semibold">From Recipes</span>
                    </button>
                    <button onClick={() => onSelectOption('custom')} className="flex flex-col items-center justify-center p-4 w-1/2 bg-gray-100 hover:bg-primary-accent hover:text-white rounded-lg transition-all">
                        <FaEdit size={24} className="mb-2"/>
                        <span className="font-semibold">Custom Meal</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditMealModal = ({ isOpen, onClose, onSave, initialMealTitle = '' }) => {
    const [title, setTitle] = useState('');
    useEffect(() => { if (isOpen) setTitle(initialMealTitle); }, [isOpen, initialMealTitle]);
    if (!isOpen) return null;
    const handleSave = () => {
        if (!title.trim()) { toast.error("Meal name cannot be empty."); return; }
        onSave(title.trim());
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"><FaTimes /></button>
                <h3 className="text-xl font-bold mb-4">{initialMealTitle ? 'Edit Meal' : 'Add Custom Meal'}</h3>
                <input
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Scrambled Eggs on Toast"
                    className="w-full p-2 border rounded-md mb-4" autoFocus
                />
                <button onClick={handleSave} className="w-full bg-secondary-green text-white font-bold py-2 px-4 rounded-full hover:opacity-90">
                    Save Meal
                </button>
            </div>
        </div>
    );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                <p className="text-lg mb-4">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-md text-white bg-primary-accent hover:opacity-90">
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};


function MealPlannerPage() {
    const navigate = useNavigate();
    const { isPremium, mealPlan, updateMealInPlan, removeMealFromPlan, userSettings, clearMealPlan } = useContext(UserContext);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddOptionsModalOpen, setIsAddOptionsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [currentTarget, setCurrentTarget] = useState(null);
    const [actionToConfirm, setActionToConfirm] = useState(null);

    const [isAiPlanning, setIsAiPlanning] = useState(false);
    const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
    const [isClearAllConfirmModalOpen, setIsClearAllConfirmModalOpen] = useState(false);

    // New state for the RecipeDetailsModal
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState(null);
    
    // API keys are provided by the Canvas runtime environment. Leave them as empty strings.
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
    // EDAMAM_APP_ID and EDAMAM_API_KEY are no longer needed as Edamam API is removed.

    const dates = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
    });

    const handleTogglePin = (date, mealType) => {
        const meal = mealPlan[date]?.[mealType];
        if (!meal) return;
        const updatedMeal = { ...meal, pinned: !meal.pinned };
        updateMealInPlan(date, mealType, updatedMeal);
        toast.success(updatedMeal.pinned ? 'Meal pinned!' : 'Meal unpinned!');
    };
    
    const callAiMealPlanner = useCallback(async (prompt) => {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };
        const apiKey = GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        // Exponential backoff retry logic
        let attempts = 0;
        const maxAttempts = 5;
        const baseDelay = 1000; // 1 second

        while (attempts < maxAttempts) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    if (response.status === 429 || response.status >= 500) { // Too Many Requests or Server Error
                        attempts++;
                        const delay = baseDelay * Math.pow(2, attempts - 1);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue; // Retry
                    }
                    throw new Error(`AI API error! status: ${response.status} - ${response.statusText}`);
                }

                const result = await response.json();
                const rawJson = result.candidates[0].content.parts[0].text;
                
                try {
                    return JSON.parse(rawJson);
                } catch (e) {
                    console.error("Failed to parse AI JSON response:", rawJson);
                    throw new Error("AI returned a non-JSON response.");
                }
            } catch (error) {
                console.error("Fetch error during AI call:", error);
                if (attempts === maxAttempts - 1) throw error; // Re-throw on last attempt
                attempts++;
                const delay = baseDelay * Math.pow(2, attempts - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error("Max retry attempts reached for AI API call.");
    }, [GEMINI_API_KEY]);

    const handleGenerate = useCallback(async (formData) => {
        if (!isPremium) {
            toast.error("AI Generation is a Premium feature!");
            return;
        }
        setIsAiPlanning(true);
        setIsGeneratorModalOpen(false);
        toast.success("AI is creating your personalized meal plan...");
        
        const { days, location, dietaryPref, goal, householdSize, mealCount, cookingTime, budget, allergies } = formData;
        const mealsPerDay = mealCount;
        const totalMeals = days * mealsPerDay;

        const cookingTimeMap = { 'under_30': 'under 30 minutes', 'under_60': 'under 60 minutes', 'any': 'any' };

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        const todayDateFormatted = `${year}-${month}-${day}`;

        // Updated prompt to explicitly tell Gemini the starting date
        const prompt = `You are a professional chef. Generate a healthy and varied ${days}-day meal plan for ${householdSize} people. The plan should include ${mealsPerDay} meals per day. Use Nigerian food ideas and dishes.
        User preferences: 
        - Location: ${location || 'No preference'}.
        - Dietary preference: ${dietaryPref !== 'none' ? dietaryPref : 'none'}.
        - Health goal: ${goal || 'no specific goal'}.
        - Cooking time: ${cookingTimeMap[cookingTime] || 'any'}.
        - Budget: ${budget || 'moderate'}.
        - Allergies/Avoids: ${allergies || 'none'}.
        
        The plan should start on ${todayDateFormatted}. For each subsequent day, increment the date by one.
        The output must be a single JSON object with a key 'mealPlan' which is an array of ${totalMeals} objects. Each object in the 'mealPlan' array must have these keys:
        'mealTitle': A specific, full meal title.
        'date': (YYYY-MM-DD) starting from ${todayDateFormatted} and incrementing for subsequent days.
        'mealType': (Breakfast, Lunch, or Dinner).
        'image': A placeholder image URL (e.g., "https://placehold.co/150x150/808080/FFFFFF?text=MEAL").
        'extendedIngredients': An array of strings, each representing an ingredient line for the meal.
        'instructions': A single string containing detailed cooking instructions for the meal.
        Ensure all fields are populated for each meal.`;

        try {
            const aiResult = await callAiMealPlanner(prompt);
            const mealIdeas = aiResult.mealPlan;
            if (!Array.isArray(mealIdeas) || mealIdeas.length !== totalMeals) {
                throw new Error("AI returned an invalid plan format or incorrect number of meals.");
            }
            
            const newMealPlanUpdates = {};

            // Re-generate currentDates to ensure it matches the AI's expected range
            const currentDates = Array.from({ length: days }, (_, i) => {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                return date.toISOString().split('T')[0];
            });

            for (const mealData of mealIdeas) {
                const { mealTitle, date, mealType, image, extendedIngredients, instructions } = mealData;
                
                // Only process meals for dates that are actually in our expected range
                if (!currentDates.includes(date)) {
                    console.warn(`AI generated a meal for an unexpected date: ${date}. Skipping.`);
                    continue; // Skip this meal if the date doesn't match our expected sequence
                }

                // Construct the meal object directly from AI response
                const finalMeal = { 
                    id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Unique ID for AI-generated meal
                    title: mealTitle, 
                    image: image || `https://placehold.co/150x150/808080/FFFFFF?text=${mealTitle.substring(0, 2).toUpperCase()}`, // Fallback placeholder
                    readyInMinutes: 'N/A', // AI doesn't provide this, set to N/A
                    extendedIngredients: extendedIngredients || [],
                    instructions: instructions || 'No detailed instructions provided.',
                    source: 'AI Generated',
                    custom: true, // AI-generated meals are not "custom" in the manual sense
                    pinned: false 
                };

                if (!newMealPlanUpdates[date]) {
                    newMealPlanUpdates[date] = {};
                }
                newMealPlanUpdates[date][mealType] = finalMeal;
            }

            // Apply all updates
            Object.keys(newMealPlanUpdates).forEach(date => {
                Object.keys(newMealPlanUpdates[date]).forEach(mealType => {
                    updateMealInPlan(date, mealType, newMealPlanUpdates[date][mealType]);
                });
            });

            toast.success("Your personalized meal plan has been generated!");
        } catch (error) {
            console.error("AI Meal Plan fetch error:", error);
            toast.error("Could not generate AI meal plan. Please try again.");
        } finally {
            setIsAiPlanning(false);
        }
    }, [isPremium, updateMealInPlan, callAiMealPlanner]);

    const handleAiReshuffle = useCallback(async () => {
        if (!isPremium) {
            toast.error("AI Reshuffle is a Premium feature!");
            return;
        }
        setIsAiPlanning(true);
        toast.success("Reshuffling your meals with new ideas...");

        const weekDates = dates.slice(0, 7);
        let pinnedMealsInfo = [];
        let unpinnedMealsToReplace = [];
        let existingMealTitles = new Set();

        weekDates.forEach(date => {
            ['Breakfast', 'Lunch', 'Dinner'].forEach(mealType => {
                const meal = mealPlan[date]?.[mealType];
                if (meal) {
                    existingMealTitles.add(meal.title);
                    if (meal.pinned) {
                        pinnedMealsInfo.push({ title: meal.title, date, mealType });
                    } else {
                        unpinnedMealsToReplace.push({ title: "Empty Slot", date, mealType });
                    }
                } else {
                    unpinnedMealsToReplace.push({ title: "Empty Slot", date, mealType });
                }
            });
        });

        // Get the first date of the week for reshuffling
        const firstWeekDate = weekDates[0];

        // Updated prompt for reshuffle to get full meal details from Gemini
        const prompt = `You are a meal planner. A user wants to reshuffle their 7-day meal plan.
        Current meals to avoid repeating: ${[...existingMealTitles].map(t => `"${t}"`).join(', ') || 'None'}.
        Generate ${unpinnedMealsToReplace.length} new, creative, and varied meal ideas to fill the unpinned slots.
        The new meals should be for the dates starting from ${firstWeekDate}. For each subsequent meal slot, increment the date by one if it's for a new day.
        Ensure the new ideas are distinctly different from all the current meals.
        The output must be a JSON object with a single key "newMeals" which is an array of ${unpinnedMealsToReplace.length} objects. Each object must have these keys:
        'mealTitle': A specific, full meal title.
        'date': (YYYY-MM-DD) corresponding to the slot it's filling.
        'mealType': (Breakfast, Lunch, or Dinner) corresponding to the slot it's filling.
        'image': A placeholder image URL (e.g., "https://placehold.co/150x150/808080/FFFFFF?text=MEAL").
        'extendedIngredients': An array of strings, each representing an ingredient line for the meal.
        'instructions': A single string containing detailed cooking instructions for the meal.
        Ensure all fields are populated for each new meal.`;

        try {
            const result = await callAiMealPlanner(prompt);
            const newMealIdeas = result.newMeals;
            
            if (!Array.isArray(newMealIdeas) || newMealIdeas.length !== unpinnedMealsToReplace.length) {
                throw new Error("AI returned an invalid format or incorrect number of new meals.");
            }

            const newMealUpdates = {};

            for (let i = 0; i < unpinnedMealsToReplace.length; i++) {
                const slot = unpinnedMealsToReplace[i];
                const newMealData = newMealIdeas[i]; // This now contains full meal details

                // Validate the date from AI response against the expected slot date
                if (newMealData.date !== slot.date || newMealData.mealType !== slot.mealType) {
                    console.warn(`AI generated meal for unexpected slot (date: ${newMealData.date}, type: ${newMealData.mealType}) for expected slot (date: ${slot.date}, type: ${slot.mealType}). Skipping.`);
                    continue; // Skip if the AI didn't match the slot correctly
                }

                const finalMeal = { 
                    id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Unique ID for AI-generated meal
                    title: newMealData.mealTitle, 
                    image: newMealData.image || `https://placehold.co/150x150/808080/FFFFFF?text=${newMealData.mealTitle.substring(0, 2).toUpperCase()}`, // Fallback placeholder
                    readyInMinutes: 'N/A', // AI doesn't provide this, set to N/A
                    extendedIngredients: newMealData.extendedIngredients || [],
                    instructions: newMealData.instructions || 'No detailed instructions provided.',
                    source: 'AI Generated',
                    custom: false,
                    pinned: false 
                };

                if (!newMealUpdates[slot.date]) {
                    newMealUpdates[slot.date] = {};
                }
                newMealUpdates[slot.date][slot.mealType] = finalMeal;
            }

            // Apply all updates
            Object.keys(newMealUpdates).forEach(date => {
                Object.keys(newMealUpdates[date]).forEach(mealType => {
                    updateMealInPlan(date, mealType, newMealUpdates[date][mealType]);
                });
            });

            toast.success("Your unpinned meals have been reshuffled!");
        } catch (error) {
            console.error("AI Reshuffle error:", error);
            toast.error("Could not reshuffle meals. Please try again.");
        } finally {
            setIsAiPlanning(false);
        }
    }, [isPremium, dates, mealPlan, updateMealInPlan, callAiMealPlanner]);

    const handleOpenAddOptions = (date, mealType) => {
        setCurrentTarget({ date, mealType, meal: null });
        setIsAddOptionsModalOpen(true);
    };
    
    const handleSelectAddOption = (option) => {
        setIsAddOptionsModalOpen(false);
        if (!currentTarget) return;

        if (option === 'custom') {
            setCurrentTarget(ct => ({...ct, meal: null}));
            setIsEditModalOpen(true);
        }
        if (option === 'recipe') {
            navigate('/quick-find', { state: { fromPlanner: true, date: currentTarget.date, mealType: currentTarget.mealType } });
        }
    };
    
    const handleEditClick = (date, mealType, meal) => {
        setCurrentTarget({ date, mealType, meal });
        setIsEditModalOpen(true);
    };

    const handleSaveMeal = (newTitle) => {
        if (!currentTarget) return;
        const { date, mealType, meal } = currentTarget;
        
        const newMealData = {
            id: meal?.id || `custom_${Date.now()}`,
            title: newTitle,
            custom: true,
            pinned: meal?.pinned || false,
            image: `https://placehold.co/150x150/808080/FFFFFF?text=${newTitle.substring(0, 2).toUpperCase()}`
        };
        updateMealInPlan(date, mealType, newMealData);
        toast.success(`Meal ${meal ? 'updated' : 'added'} successfully!`);
        setIsEditModalOpen(false);
    };

    const handleConfirmAction = () => {
        if (actionToConfirm) actionToConfirm();
        setIsConfirmModalOpen(false); // Close after action
    };

    const handleRemoveClick = (date, mealType) => {
        const removeAction = () => {
            removeMealFromPlan(date, mealType);
            toast.success("Meal removed from plan.");
        };
        setActionToConfirm(() => removeAction);
        setIsConfirmModalOpen(true);
    };

    // Modified handleRecipeClick to open the RecipeDetailsModal
    const handleRecipeClick = (meal) => {
        if (meal.custom) {
            toast.error("Cannot view details for custom meals. Use the edit button to change the title.");
        } else {
            setSelectedMeal(meal);
            setIsRecipeModalOpen(true);
        }
    };

    const handleClearAllMealPlans = () => {
        setIsClearAllConfirmModalOpen(true);
    };

    const confirmClearAllMealPlans = () => {
        if (clearMealPlan) {
            clearMealPlan();
            toast.success("All meal plans cleared!");
        } else {
            toast.error("Clear meal plan functionality not available.");
            console.error("clearMealPlan function is not available in UserContext.");
        }
        setIsClearAllConfirmModalOpen(false);
    };
    
    return (
        <DashboardLayout>
            <MealPlanGeneratorModal 
                key={isGeneratorModalOpen ? "open" : "closed"}
                isOpen={isGeneratorModalOpen}
                onClose={() => setIsGeneratorModalOpen(false)}
                onGenerate={handleGenerate}
                isGenerating={isAiPlanning}
            />
            <AddMealOptionsModal isOpen={isAddOptionsModalOpen} onClose={() => setIsAddOptionsModalOpen(false)} onSelectOption={handleSelectAddOption} />
            <EditMealModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveMeal} initialMealTitle={currentTarget?.meal?.title || ''} />
            <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmAction} message="Are you sure you want to remove this meal?" />
            <ConfirmationModal 
                isOpen={isClearAllConfirmModalOpen} 
                onClose={() => setIsClearAllConfirmModalOpen(false)} 
                onConfirm={confirmClearAllMealPlans} 
                message="Are you sure you want to clear ALL meal plans? This action cannot be undone." 
            />
            
            {/* The inline RecipeDetailsModal has been added here */}
            <RecipeDetailsModal 
                isOpen={isRecipeModalOpen}
                onClose={() => setIsRecipeModalOpen(false)}
                meal={selectedMeal}
            />

            <div className="space-y-8">
                <h2 className="text-4xl font-serif font-bold text-primary-accent mb-2 flex items-center">
                    <FaCalendarAlt className="mr-3 text-3xl" /> Meal Planner
                </h2>

                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 relative">
                    {!isPremium && (
                        <div className="absolute inset-0 bg-gray-200 bg-opacity-60 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center rounded-lg">
                            <FaLock className="text-gray-500 text-3xl mb-2" />
                            <p className="font-semibold text-gray-700">Unlock AI Planning</p>
                            <button onClick={() => navigate('/billing')} className="mt-2 bg-primary-accent text-white font-bold py-1 px-4 rounded-full text-sm">Upgrade Now</button>
                        </div>
                    )}
                    <div className={`flex flex-col md:flex-row items-center justify-between gap-4 ${!isPremium ? 'blur-sm' : ''}`}>
                        <div>
                            <h3 className="text-xl font-bold text-dark-gray flex items-center"><FaRobot className="mr-2 text-secondary-green" /> AI Smart Suggestions</h3>
                            <p className="text-gray-600">Let AI create or reshuffle your meal plan for the week.</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button 
                                onClick={() => setIsGeneratorModalOpen(true)}
                                disabled={isAiPlanning || !isPremium}
                                className="flex-1 bg-secondary-green text-white font-bold py-2 px-6 rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <FaPlus /> {isAiPlanning ? 'Generating...' : 'Start'}
                            </button>
                            <button 
                                onClick={handleAiReshuffle} 
                                disabled={isAiPlanning || !isPremium}
                                className="flex-1 bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <FaSyncAlt className={isAiPlanning ? 'animate-spin' : ''}/> {isAiPlanning ? 'Working...' : 'Reshuffle'}
                            </button>
                            {/* Clear Meal Plans Button - now part of the button group */}
                            <button 
                                onClick={handleClearAllMealPlans}
                                className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors flex items-center justify-center"
                                title="Clear All Meal Plans"
                            >
                                <FaEraser size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-100">
                    <div className="space-y-6">
                        {dates.map(date => {
                            const dayPlan = mealPlan[date] || {};
                            return (
                                <div key={date}>
                                    <h3 className="text-xl font-bold p-3 bg-gray-100 rounded-t-lg border-b">
                                        {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border border-t-0 rounded-b-lg">
                                        {['Breakfast', 'Lunch', 'Dinner'].map(mealType => {
                                            const meal = dayPlan[mealType];
                                            return (
                                                <div key={mealType} className="bg-gray-50 rounded-lg p-3 shadow-sm">
                                                    <h4 className="font-semibold text-gray-600 mb-3">{mealType}</h4>
                                                    <div className="min-h-[120px] flex flex-col justify-center items-center relative group bg-white rounded-md border">
                                                        {meal ? (
                                                            <div className="w-full text-center p-2 rounded-md">
                                                                <button onClick={() => handleTogglePin(date, mealType)} className={`absolute top-2 left-2 p-1 rounded-full z-10 ${meal.pinned ? 'text-blue-500' : 'text-gray-300 hover:text-blue-400'}`}>
                                                                    <FaThumbtack size={16} style={{ transform: meal.pinned ? 'rotate(0deg)' : 'rotate(0deg)' }}/>
                                                                </button>
                                                                {/* Modified the onClick to call handleRecipeClick with just the meal object */}
                                                                <div onClick={() => handleRecipeClick(meal)} className="cursor-pointer">
                                                                    {meal.custom ? ( <FaUtensils className="w-20 h-20 text-gray-400 mx-auto mb-2" /> ) : ( <img src={meal.image} alt={meal.title} className="w-20 h-20 rounded-lg object-cover mx-auto mb-2" onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/150x150/ff0000/FFFFFF?text=Error`; }}/> )}
                                                                    <p className="font-medium text-text-dark leading-tight break-words px-2">{meal.title}</p>
                                                                </div>
                                                                <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => handleEditClick(date, mealType, meal)} className="p-2 bg-white rounded-full shadow text-gray-600 hover:text-secondary-green hover:scale-110 transition-transform"><FaPen className="text-xs" /></button>
                                                                    <button onClick={() => handleRemoveClick(date, mealType)} className="p-2 bg-white rounded-full shadow text-gray-600 hover:text-primary-accent hover:scale-110 transition-transform"><FaTrashAlt className="text-xs" /></button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => handleOpenAddOptions(date, mealType)} className="w-full h-full flex items-center justify-center text-gray-300 hover:text-primary-accent hover:bg-gray-100 rounded-md transition-colors">
                                                                <FaPlus size={24} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default MealPlannerPage;
