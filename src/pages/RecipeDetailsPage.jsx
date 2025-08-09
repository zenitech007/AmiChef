// File: /src/pages/RecipeDetailsPage.jsx
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../App.jsx';
import { toast } from 'react-hot-toast';
import {
    FaLock, FaShoppingCart, FaBookOpen, FaFire,
    FaDrumstickBite, FaOilCan, FaBreadSlice, FaRobot
} from 'react-icons/fa';

function RecipeDetailsPage() {
    const { recipeId } = useParams();
    const navigate = useNavigate();
    const { isLoggedIn, isPremium, addItemToGroceryList, addMealToPlanner } = useContext(UserContext);

    const [recipeDetails, setRecipeDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(true);
    const [detailsError, setDetailsError] = useState(null);

    const [nutrition, setNutrition] = useState(null);
    const [aiTips, setAiTips] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY || '86285605e22449ba9fae9dcc14530542';
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBY_vymFVwPIUDlVMT6WtAEynWYTukOv2Y';

    // Fetch Recipe Details
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/auth', { state: { from: `/recipe/${recipeId}` } });
            return;
        }

        const fetchRecipeDetails = async () => {
            setDetailsLoading(true);
            setDetailsError(null);
            try {
                const response = await fetch(
                    `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
                );
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setRecipeDetails(data);
                if (data.nutrition) {
                    setNutrition({
                        calories: data.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || 0,
                        protein: data.nutrition.nutrients.find(n => n.name === 'Protein')?.amount || 0,
                        fat: data.nutrition.nutrients.find(n => n.name === 'Fat')?.amount || 0,
                        carbs: data.nutrition.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0,
                    });
                }
            } catch (err) {
                console.error("Error fetching recipe details:", err);
                setDetailsError("Failed to load recipe details. " + err.message);
            } finally {
                setDetailsLoading(false);
            }
        };
        fetchRecipeDetails();
    }, [recipeId, isLoggedIn, navigate, SPOONACULAR_API_KEY]);

    // Fetch AI Cooking Tips & Substitutions
    const fetchAiCookingTips = useCallback(async (title, ingredients) => {
        if (!isPremium) return;
        setIsAiLoading(true);
        const prompt = `Give 3 short cooking tips and 2 ingredient substitutions for the recipe "${title}" with ingredients: ${ingredients.join(', ')}. Respond as JSON: { "tips": ["..."], "substitutions": ["..."] }`;
        try {
            const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            const data = await res.json();
            const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
            setAiTips([...parsed.tips, ...parsed.substitutions]);
        } catch (e) {
            console.error("AI Tips Error:", e);
            toast.error("Couldn't load AI tips.");
        } finally {
            setIsAiLoading(false);
        }
    }, [isPremium, GEMINI_API_KEY]);

    useEffect(() => {
        if (recipeDetails?.title && recipeDetails?.extendedIngredients && isPremium) {
            fetchAiCookingTips(recipeDetails.title, recipeDetails.extendedIngredients.map(i => i.name));
        }
    }, [recipeDetails, fetchAiCookingTips, isPremium]);

    // Add Ingredients to Grocery List
    const handleAddIngredients = () => {
        if (!isPremium) {
            toast.error("Adding ingredients is a Premium feature!");
            return;
        }
        if (!recipeDetails?.extendedIngredients) return;
        recipeDetails.extendedIngredients.forEach(ing => addItemToGroceryList({ name: ing.original, category: 'From Recipe' }));
        toast.success("All ingredients added to Grocery List!");
    };

    // Add Recipe to Meal Planner
    const handleAddToMealPlanner = () => {
        if (!isPremium) {
            toast.error("Meal planning is a Premium feature!");
            return;
        }
        addMealToPlanner({ id: `s_${recipeDetails.id}`, title: recipeDetails.title, image: recipeDetails.image, extendedIngredients: recipeDetails.extendedIngredients });
        toast.success("Recipe added to Meal Planner!");
    };

    // --- UI Render Logic ---
    if (detailsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-background-light p-4 text-primary-accent text-lg">
                <svg className="animate-spin h-10 w-10 text-primary-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4">Loading Recipe Details...</p>
            </div>
        );
    }

    if (detailsError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-background-light p-4 text-red-500 text-lg text-center">
                <p>Error: {detailsError}</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-secondary-green hover:underline">Go Back</button>
            </div>
        );
    }

    if (!recipeDetails) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-background-light p-4 text-text-dark text-lg text-center">
                <p>No recipe details found.</p>
                <button onClick={() => navigate('/')} className="mt-4 text-secondary-green hover:underline">Back to Search</button>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-background-light p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl mx-auto p-6 relative">

                {/* Premium Lock Overlay for the entire page */}
                {!isPremium && (
                    <div className="absolute inset-0 bg-gray-200 bg-opacity-70 backdrop-blur-sm flex flex-col justify-center items-center z-10 rounded-lg text-center">
                        <FaLock className="text-4xl text-gray-600 mb-3" />
                        <p className="text-gray-700 font-semibold mb-2">Upgrade to unlock full recipe details, AI tips, and tools.</p>
                        <button onClick={() => navigate('/billing')} className="bg-primary-accent text-white px-4 py-2 rounded-full font-bold">Upgrade Now</button>
                    </div>
                )}

                <h2 className="text-3xl font-bold text-primary-accent mb-4 text-center">{recipeDetails.title}</h2>
                <img src={recipeDetails.image} alt={recipeDetails.title} className="w-full h-72 object-cover rounded-lg shadow mb-6" />

                {/* Nutrition Breakdown */}
                {nutrition && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-center">
                        <div className="p-3 bg-red-50 rounded"><FaFire className="mx-auto text-red-500" /><p className="font-bold">{Math.round(nutrition.calories)} kcal</p></div>
                        <div className="p-3 bg-blue-50 rounded"><FaDrumstickBite className="mx-auto text-blue-500" /><p className="font-bold">{Math.round(nutrition.protein)}g Protein</p></div>
                        <div className="p-3 bg-yellow-50 rounded"><FaOilCan className="mx-auto text-yellow-500" /><p className="font-bold">{Math.round(nutrition.fat)}g Fat</p></div>
                        <div className="p-3 bg-green-50 rounded"><FaBreadSlice className="mx-auto text-green-500" /><p className="font-bold">{Math.round(nutrition.carbs)}g Carbs</p></div>
                    </div>
                )}

                {/* Ingredients & Instructions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-bold mb-2">Ingredients</h3>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {recipeDetails.extendedIngredients?.map((ing, i) => <li key={i}>{ing.original}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">Instructions</h3>
                        <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: recipeDetails.instructions || 'No instructions available.' }} />
                        {recipeDetails.sourceUrl && (
                            <a href={recipeDetails.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-accent hover:underline mt-4 inline-block">
                                View Original Source
                            </a>
                        )}
                    </div>
                </div>

                {/* AI Tips */}
                {isPremium && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-inner">
                        <h3 className="text-lg font-bold mb-2 flex items-center"><FaRobot className="mr-2 text-secondary-green" /> AI Cooking Tips & Substitutions</h3>
                        {isAiLoading ? <p>Loading AI tips...</p> : (
                            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                                {aiTips.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                    <button onClick={handleAddIngredients} disabled={!isPremium} className="flex items-center justify-center gap-2 bg-primary-accent text-white px-4 py-2 rounded-full disabled:opacity-50">
                        <FaShoppingCart /> Add Ingredients to Grocery
                    </button>
                    <button onClick={handleAddToMealPlanner} disabled={!isPremium} className="flex items-center justify-center gap-2 bg-secondary-green text-white px-4 py-2 rounded-full disabled:opacity-50">
                        <FaBookOpen /> Add to Meal Planner
                    </button>
                </div>

                <div className="text-center mt-6">
                    <button onClick={() => navigate(-1)} className="text-gray-600 hover:underline">← Back</button>
                </div>
            </div>
        </div>
    );
}

export default RecipeDetailsPage;