import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { FaChartPie, FaFire, FaDrumstickBite, FaBreadSlice, FaOilCan, FaLock, FaStar, FaLightbulb } from 'react-icons/fa';

/**
 * A helper function to fetch data with exponential backoff for retries.
 * This makes the API calls more resilient to temporary network issues.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options.
 * @param {number} retries - Number of retries.
 */
async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status >= 500) {
                    throw new Error(`Server error: ${response.status}`);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
                }
            }
            return response;
        } catch (error) {
            if (i < retries - 1) {
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
}

function NutritionPage() {
    const navigate = useNavigate();
    const { isLoggedIn, isPremium, mealPlan } = useContext(UserContext);

    const [nutritionData, setNutritionData] = useState(null);
    const [aiTip, setAiTip] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Using a more robust fallback for environment variables.
    const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY || '';
    const EDAMAM_APP_ID = import.meta.env.VITE_EDAMAM_APP_ID || '';
    const EDAMAM_API_KEY = import.meta.env.VITE_EDAMAM_API_KEY || '';
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

    const generateAiTip = useCallback(async (weeklyAvg) => {
        try {
            const prompt = `You are a nutrition coach. Based on these daily averages: Calories: ${Math.round(weeklyAvg.calories)}, Protein: ${Math.round(weeklyAvg.protein)}g, Fat: ${Math.round(weeklyAvg.fat)}g, Carbs: ${Math.round(weeklyAvg.carbohydrates)}g. Give a short, friendly tip to improve this diet.`;
            const payload = { contents: [{ parts: [{ text: prompt }] }] };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetchWithRetry(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            // Sanitize potential markdown from the tip.
            const tip = data?.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/\*\*/g, '') || 'Eat a balanced diet and stay hydrated!';
            setAiTip(tip);
        } catch (err) {
            console.error("AI Tip generation failed:", err);
            setAiTip('Tip unavailable, please try again later.');
        }
    }, [GEMINI_API_KEY]);

    const getEdamamNutrition = useCallback(async (recipeId) => {
        try {
            const url = `https://api.edamam.com/api/recipes/v2/${recipeId}?type=public&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_API_KEY}`;
            const response = await fetchWithRetry(url);
            const data = await response.json();

            if (!data || !data.recipe) {
                console.error(`Invalid Edamam response for recipe ID ${recipeId}`);
                return null;
            }

            const { totalNutrientsKCal, totalNutrients } = data.recipe;
            return {
                id: `e_${recipeId}`,
                title: data.recipe.label,
                nutrition: {
                    nutrients: [
                        { name: 'Calories', amount: totalNutrientsKCal?.ENERC_KCAL?.quantity || 0 },
                        { name: 'Protein', amount: totalNutrients?.PROCNT?.quantity || 0 },
                        { name: 'Fat', amount: totalNutrients?.FAT?.quantity || 0 },
                        { name: 'Carbohydrates', amount: totalNutrients?.CHOCDF?.quantity || 0 }
                    ]
                }
            };
        } catch (error) {
            console.error(`Edamam nutrition fetch error for recipe ID ${recipeId}:`, error);
            return null;
        }
    }, [EDAMAM_APP_ID, EDAMAM_API_KEY]);

    const callGeminiForNutrition = useCallback(async (mealId, recipeTitle) => {
        const prompt = `Provide an estimated nutritional breakdown for "${recipeTitle}". Respond ONLY with a JSON object. The object must have a single key "nutrition" which is an object containing 'calories', 'protein', 'fat', and 'carbohydrates' as numeric values. Do not include units or other text.`;
        try {
            const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetchWithRetry(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (!result || !result.candidates || result.candidates.length === 0 || !result.candidates[0].content || !result.candidates[0].content.parts || result.candidates[0].content.parts.length === 0) {
                console.error("Gemini nutrition fetch error: API response was malformed or empty.");
                return null;
            }

            const jsonText = result.candidates[0].content.parts[0].text;
            let parsed;

            try {
                parsed = JSON.parse(jsonText);
            } catch (jsonError) {
                console.error("Gemini nutrition fetch error: Failed to parse JSON response.", jsonError);
                return null;
            }
            
            if (parsed && parsed.nutrition) {
                return {
                    id: mealId,
                    title: recipeTitle,
                    nutrition: {
                        nutrients: [
                            { name: 'Calories', amount: parsed.nutrition.calories || 0 },
                            { name: 'Protein', amount: parsed.nutrition.protein || 0 },
                            { name: 'Fat', amount: parsed.nutrition.fat || 0 },
                            { name: 'Carbohydrates', amount: parsed.nutrition.carbohydrates || 0 },
                        ]
                    }
                };
            }
            return null;
        } catch (error) {
            console.error("Gemini nutrition fetch error:", error);
            return null;
        }
    }, [GEMINI_API_KEY]);

    const processNutritionData = useCallback((nutritionDetails, currentMealPlan) => {
        const dailyTotals = {};
        const nutritionDataMap = new Map(nutritionDetails.map(item => [item.id, item]));

        for (const date in currentMealPlan) {
            const dayPlan = currentMealPlan[date];
            let dayHasAnalyzableMeal = false;
            const dayTotals = { calories: 0, protein: 0, fat: 0, carbohydrates: 0, meals: [] };

            for (const mealType in dayPlan) {
                const meal = dayPlan[mealType];
                if (!meal) continue;

                const mealNutrition = nutritionDataMap.get(meal.id);
                if (mealNutrition && mealNutrition.nutrition?.nutrients) {
                    dayHasAnalyzableMeal = true;
                    const nutrients = mealNutrition.nutrition.nutrients;
                    dayTotals.calories += nutrients.find(n => n.name === 'Calories')?.amount || 0;
                    dayTotals.protein += nutrients.find(n => n.name === 'Protein')?.amount || 0;
                    dayTotals.fat += nutrients.find(n => n.name === 'Fat')?.amount || 0;
                    dayTotals.carbohydrates += nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0;
                    dayTotals.meals.push(meal.title);
                }
            }

            if (dayHasAnalyzableMeal) {
                dailyTotals[date] = dayTotals;
            }
        }

        const weeklyTotals = { calories: 0, protein: 0, fat: 0, carbohydrates: 0, dayCount: 0 };
        Object.values(dailyTotals).forEach(day => {
            weeklyTotals.calories += day.calories;
            weeklyTotals.protein += day.protein;
            weeklyTotals.fat += day.fat;
            weeklyTotals.carbohydrates += day.carbohydrates;
            weeklyTotals.dayCount++;
        });

        const weeklyAvg = {
            calories: weeklyTotals.dayCount > 0 ? weeklyTotals.calories / weeklyTotals.dayCount : 0,
            protein: weeklyTotals.dayCount > 0 ? weeklyTotals.protein / weeklyTotals.dayCount : 0,
            fat: weeklyTotals.dayCount > 0 ? weeklyTotals.fat / weeklyTotals.dayCount : 0,
            carbohydrates: weeklyTotals.dayCount > 0 ? weeklyTotals.carbohydrates / weeklyTotals.dayCount : 0,
        };

        return { daily: dailyTotals, weeklyAvg };
    }, []);

    const fetchNutrition = useCallback(async () => {
        if (!isPremium) {
            setIsLoading(false);
            return;
        }

        // Add a check for null/undefined mealPlan to prevent .flatMap error
        if (!mealPlan || Object.keys(mealPlan).length === 0) {
            setIsLoading(false);
            setError('No analyzable recipes found in your meal plan.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setNutritionData(null);
        setAiTip('');

        const mealsToAnalyze = Object.values(mealPlan).flatMap(day => Object.values(day)).filter(meal => meal);
        if (mealsToAnalyze.length === 0) {
            setIsLoading(false);
            return;
        }

        const nutritionPromises = mealsToAnalyze.map(meal => {
            const id = meal.id;
            // Explicitly check for a valid ID to prevent errors
            if (!id || typeof id !== 'string') {
                return Promise.resolve(null);
            }

            if (id.startsWith('s_') && SPOONACULAR_API_KEY) {
                const spoonacularId = id.substring(2);
                const url = `https://api.spoonacular.com/recipes/${spoonacularId}/information?includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`;
                return fetchWithRetry(url)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.nutrition) {
                            const nutrients = data.nutrition.nutrients.reduce((acc, curr) => {
                                acc[curr.title] = curr.amount;
                                return acc;
                            }, {});
                            return {
                                id,
                                title: meal.title,
                                nutrition: {
                                    nutrients: [
                                        { name: 'Calories', amount: nutrients.Calories || 0 },
                                        { name: 'Protein', amount: nutrients.Protein || 0 },
                                        { name: 'Fat', amount: nutrients.Fat || 0 },
                                        { name: 'Carbohydrates', amount: nutrients.Carbohydrates || 0 }
                                    ]
                                }
                            };
                        }
                        return null;
                    })
                    .catch((err) => {
                        console.error(`Spoonacular fetch error for ID ${id}:`, err);
                        return null;
                    });
            }
            if (id.startsWith('e_') && EDAMAM_API_KEY) {
                const edamamId = id.substring(2);
                return getEdamamNutrition(edamamId);
            }
    if ((meal.custom || id.startsWith('ai_') || meal.source === 'AI Generated') && GEMINI_API_KEY) {
        return callGeminiForNutrition(meal.id, meal.title);
    }
    return Promise.resolve(null);
});

        try {
            const allNutritionDetails = (await Promise.all(nutritionPromises)).filter(Boolean);

            if (allNutritionDetails.length === 0) {
                setNutritionData(null);
                setIsLoading(false);
                setError('No analyzable recipes found in your meal plan.');
                return;
            }

            const processedData = processNutritionData(allNutritionDetails, mealPlan);
            setNutritionData(processedData);
            generateAiTip(processedData.weeklyAvg);
        } catch (err) {
            setError('An error occurred while fetching nutrition data. Please try again.');
            console.error('Main nutrition fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isPremium, mealPlan, SPOONACULAR_API_KEY, EDAMAM_API_KEY, GEMINI_API_KEY, processNutritionData, callGeminiForNutrition, getEdamamNutrition, generateAiTip]);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/auth', { state: { from: '/nutrition' } });
            return;
        }
        fetchNutrition();
    }, [isLoggedIn, navigate, fetchNutrition]);

    if (!isPremium) {
        return (
            <DashboardLayout>
                <div className="relative text-center p-8 bg-white rounded-lg shadow-lg">
                    <div className="absolute inset-0 bg-gray-200 bg-opacity-60 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 rounded-lg">
                        <FaLock className="text-gray-500 text-5xl mb-4" />
                        <h3 className="text-2xl font-bold text-gray-700">Unlock Nutritional Tracking</h3>
                        <p className="text-gray-600 mt-2 mb-4">Upgrade to Premium to analyze your meal plan's nutritional content and reach your health goals.</p>
                        <button onClick={() => navigate('/billing')} className="bg-primary-accent text-white font-bold py-2 px-6 rounded-full text-lg hover:opacity-90 transition-all">
                            <FaStar className="inline mr-2" /> Upgrade Now
                        </button>
                    </div>
                    <div className="blur-sm">
                        <h2 className="text-4xl font-serif font-bold text-primary-accent mb-2">Nutrition Overview</h2>
                        <p className="text-gray-600">Analyze your weekly and daily nutritional intake.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Memoize chart data to prevent unnecessary recalculations on re-render.
    const pieData = useMemo(() => (nutritionData?.weeklyAvg ? [
        { name: 'Protein', value: nutritionData.weeklyAvg.protein },
        { name: 'Fat', value: nutritionData.weeklyAvg.fat },
        { name: 'Carbs', value: nutritionData.weeklyAvg.carbohydrates }
    ] : []), [nutritionData]);

    const barData = useMemo(() => (nutritionData?.daily ? Object.entries(nutritionData.daily).map(([d, v]) => ({
        date: new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }),
        calories: v.calories
    })) : []), [nutritionData]);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="text-center">
                    <h2 className="text-4xl font-serif font-bold text-primary-accent mb-2 flex items-center justify-center"><FaChartPie className="mr-3 text-3xl" /> Nutrition Overview</h2>
                    <p className="text-gray-600">Analyze your weekly and daily nutritional intake based on your meal plan.</p>
                    <p className="text-xs text-gray-400 mt-1">(Note: Nutrition analysis is available for recipes from our primary databases and AI estimates).</p>
                </div>

                {isLoading ? (
                    <p className="text-center text-lg font-semibold text-primary-accent">Calculating nutrition...</p>
                ) : error ? (
                    <p className="text-center text-red-500 font-semibold text-lg">{error}</p>
                ) : !nutritionData || Object.keys(nutritionData.daily).length === 0 ? (
                    <div className="text-center bg-white p-8 rounded-lg shadow-md">
                        <p className="text-gray-600">No analyzable recipes found in your meal plan.</p>
                        <p className="text-sm text-gray-500 mt-2">Add some recipes to your Meal Planner to see your nutritional breakdown!</p>
                        <button onClick={() => navigate('/meal-planner')} className="mt-4 bg-secondary-green text-white font-bold py-2 px-4 rounded-full hover:opacity-90 transition-all">Go to Meal Planner</button>
                    </div>
                ) : (
                    <>
                        {aiTip && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm flex items-start">
                                <FaLightbulb className="text-yellow-500 mt-1 mr-3"/>
                                <p className="text-gray-700 text-sm">{aiTip}</p>
                            </div>
                        )}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-bold mb-4">Weekly Average (Per Day)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div className="p-4 bg-red-50 rounded-lg"><FaFire className="mx-auto text-red-500 text-2xl mb-1" /><p className="font-bold text-xl">{Math.round(nutritionData.weeklyAvg.calories)} kcal</p><p className="text-sm text-gray-600">Calories</p></div>
                                <div className="p-4 bg-blue-50 rounded-lg"><FaDrumstickBite className="mx-auto text-blue-500 text-2xl mb-1" /><p className="font-bold text-xl">{Math.round(nutritionData.weeklyAvg.protein)}g</p><p className="text-sm text-gray-600">Protein</p></div>
                                <div className="p-4 bg-yellow-50 rounded-lg"><FaOilCan className="mx-auto text-yellow-500 text-2xl mb-1" /><p className="font-bold text-xl">{Math.round(nutritionData.weeklyAvg.fat)}g</p><p className="text-sm text-gray-600">Fat</p></div>
                                <div className="p-4 bg-green-50 rounded-lg"><FaBreadSlice className="mx-auto text-green-500 text-2xl mb-1" /><p className="font-bold text-xl">{Math.round(nutritionData.weeklyAvg.carbohydrates)}g</p><p className="text-sm text-gray-600">Carbs</p></div>
                            </div>
                            <ResponsiveContainer width="100%" height={200} className="mt-4">
                                <PieChart>
                                    <Pie dataKey="value" isAnimationActive={false} data={pieData} cx="50%" cy="50%" outerRadius={80} label>
                                        <Cell fill="#4CAF50" />
                                        <Cell fill="#FFC107" />
                                        <Cell fill="#03A9F4" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-4 text-center">Daily Breakdown</h3>
                            <div className="space-y-6">
                                {Object.entries(nutritionData.daily).map(([date, dayData]) => (
                                    <div key={date} className="bg-white p-6 rounded-lg shadow-md">
                                        <h4 className="text-lg font-bold mb-3">{new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm mb-4">
                                            <p><strong>Calories:</strong> {Math.round(dayData.calories)} kcal</p>
                                            <p><strong>Protein:</strong> {Math.round(dayData.protein)}g</p>
                                            <p><strong>Fat:</strong> {Math.round(dayData.fat)}g</p>
                                            <p><strong>Carbs:</strong> {Math.round(dayData.carbohydrates)}g</p>
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-sm mb-1">Meals:</h5>
                                            <p className="text-sm text-gray-600">{dayData.meals.join(', ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h3 className="font-bold mb-2">Daily Calories Trend</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={barData}>
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="calories" fill="#FF6F00" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <button onClick={() => navigate('/meal-planner')} className="bg-secondary-green text-white px-6 py-2 rounded-full text-lg w-full md:w-auto hover:opacity-90 transition-all">
                            Optimize My Meal Plan with AI
                        </button>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

export default NutritionPage;
