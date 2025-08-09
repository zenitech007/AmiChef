import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserContext } from '../App.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import RecipeModal from '../components/RecipeModal.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import {
    FaSearch, FaRobot, FaLock, FaCamera, FaBarcode, FaMicrophone,
    FaHeart
} from 'react-icons/fa';

// --- API Keys and IDs ---
const EDAMAM_APP_ID = import.meta.env.VITE_EDAMAM_APP_ID || 'c7d0d08f';
const EDAMAM_API_KEY = import.meta.env.VITE_EDAMAM_API_KEY || '49538c9c59c5853217fd4cbaee949c87';
const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY || '86285605e22449ba9fae9dcc14530542';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBY_vymFVwPIUDlVMT6WtAEynWYTukOv2Y';

// --- Data Normalization Helpers (outside component) ---
const normalizeTheMealDB = (meal) => {
    if (!meal) return null;
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ingredient) {
            ingredients.push({
                id: `t_${meal.idMeal}_${i}`,
                original: `${measure || ''} ${ingredient}`.trim(),
            });
        }
    }
    return {
        id: `t_${meal.idMeal}`,
        title: meal.strMeal,
        image: meal.strMealThumb,
        readyInMinutes: 'N/A',
        extendedIngredients: ingredients,
        instructions: meal.strInstructions?.replace(/\r\n/g, '<br />'),
        source: 'TheMealDB',
    };
};

const normalizeEdamam = (hit) => {
    const { recipe } = hit;
    const uriId = recipe.uri.split('#recipe_')[1] || new Date().getTime() + Math.random();
    return {
        id: `e_${uriId}`,
        title: recipe.label,
        image: recipe.image,
        readyInMinutes: recipe.totalTime > 0 ? recipe.totalTime : 'N/A',
        extendedIngredients: recipe.ingredientLines.map((line, index) => ({
            id: `e_${uriId}_${index}`,
            original: line,
        })),
        instructions: `Full instructions are available at the original source: <a href="${recipe.url}" target="_blank" rel="noopener noreferrer">${recipe.source}</a>`,
        source: 'Edamam',
    };
};

const normalizeSpoonacular = (recipe) => ({
    ...recipe,
    id: `s_${recipe.id}`,
    source: 'Spoonacular',
});

// --- Main Page Component ---
function QuickRecipeFindPage() {
    const navigate = useNavigate();
    const userContext = useContext(UserContext);
    if (!userContext) return null;

    const {
        isLoggedIn, isPremium, isFavorite, toggleFavorite, favoriteRecipes,
        updateMealInPlan, addMultipleToGroceryList
    } = userContext;

    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recipes, setRecipes] = useState([]);
    const [filters, setFilters] = useState({ diet: '', mealType: '', time: 240, usePantry: true });
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [error, setError] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isVoiceLoading, setIsVoiceLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);

    const searchRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- Reordered the functions to fix the `ReferenceError` ---
    
    const fetchAiSuggestions = useCallback(async (currentSearchTerm) => {
        if (!currentSearchTerm) { setAiSuggestions([]); return; }
        setIsAiLoading(true);
        const prompt = `Based on "${currentSearchTerm}", suggest 3 creative recipe ideas. For each, provide a "name" and a brief "reason" (max 15 words). Format as a valid JSON array of objects.`;
        try {
            const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
            // Using a new, likely supported Gemini model for vision
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`AI API error! status: ${response.status}`);
            const result = await response.json();
            const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
            setAiSuggestions(parsedJson);
        } catch (error) {
            console.error("AI suggestions fetch error:", error);
            toast.error("Could not get AI suggestions.");
            setAiSuggestions([]);
        } finally { setIsAiLoading(false); }
    }, [GEMINI_API_KEY]);

    const fetchRecipes = useCallback(async (query = searchTerm) => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setRecipes([]);
        setHasSearched(true);
        fetchAiSuggestions(query);
        try {
            let fetchedRecipes = [];

            try {
                const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${query}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_API_KEY}&random=true`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Edamam API request failed: ${response.status}`);
                const data = await response.json();
                fetchedRecipes = data.hits ? data.hits.map(normalizeEdamam) : [];
                if (fetchedRecipes.length > 0) { setRecipes(fetchedRecipes); return; }
            } catch (err) { console.error("Edamam API failed, trying next:", err); }

            try {
                const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('TheMealDB API request failed.');
                const data = await response.json();
                fetchedRecipes = Array.isArray(data.meals) ? data.meals.map(normalizeTheMealDB) : [];
                if (fetchedRecipes.length > 0) { setRecipes(fetchedRecipes); return; }
            } catch (err) { console.error("TheMealDB API failed, trying next:", err); }

            try {
                const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&query=${query}&number=30`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Spoonacular API request failed: ${response.status}`);
                const data = await response.json();
                fetchedRecipes = data.results ? data.results.map(normalizeSpoonacular) : [];
                if (fetchedRecipes.length > 0) { setRecipes(fetchedRecipes); return; }
            } catch (err) { console.error("Spoonacular API failed:", err); }

            setError("Could not retrieve recipes from any source. Please try again later.");
            toast.error("No recipes found from any API. Please try a different search term.");

        } catch (err) {
            console.error("A critical error occurred during recipe fetching:", err);
            setError("An error occurred while searching. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, fetchAiSuggestions, EDAMAM_APP_ID, EDAMAM_API_KEY, SPOONACULAR_API_KEY]);

    const handleImageSearch = useCallback(async (imageData) => {
        setIsImageLoading(true);
        try {
            const prompt = "Identify the food items in this image. List only the key ingredients as a comma-separated list, e.g., 'chicken, tomatoes, onions'. If no ingredients are obvious, return an empty string.";
            const payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: imageData.type, data: imageData.data } }
                    ]
                }]
            };
            // Using a new, likely supported Gemini model for vision
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Gemini API Error Response:", errorBody);
                throw new Error(`Image API error: ${response.status}`);
            }
            const result = await response.json();
            const ingredients = result.candidates[0].content.parts[0].text.trim();
            if (ingredients) {
                setSearchTerm(ingredients);
                toast.success(`Found ingredients: ${ingredients}`);
                fetchRecipes(ingredients);
            } else {
                toast.error("Could not identify any ingredients in the image.");
            }
        } catch (error) {
            console.error("Image search error:", error);
            toast.error("An error occurred with image search. Check the console for details.");
        } finally {
            setIsImageLoading(false);
        }
    }, [GEMINI_API_KEY, fetchRecipes]);

    const handleVoiceSearch = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error("Voice search is not supported in this browser.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsVoiceLoading(true);
            toast.success("Listening for your recipe idea...");
        };

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript;
            if (transcript) {
                setSearchTerm(transcript);
                toast.success(`Heard: "${transcript}". Searching now...`);
                fetchRecipes(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Voice recognition error:", event.error);
            toast.error(`Voice recognition failed: ${event.error}`);
            setIsVoiceLoading(false);
        };
        
        recognition.onend = () => {
            setIsVoiceLoading(false);
        };
        
        recognition.start();
    }, [searchTerm, fetchRecipes]);

    const fetchSuggestions = useCallback(async (query) => {
        if (query.length < 2) { setSuggestions([]); return; }
        try {
            const response = await fetch(`https://api.spoonacular.com/food/ingredients/autocomplete?query=${query}&number=5&apiKey=${SPOONACULAR_API_KEY}`);
            if (!response.ok) return;
            const data = await response.json();
            setSuggestions(data);
        } catch (error) { console.error("Autocomplete fetch error:", error); }
    }, [SPOONACULAR_API_KEY]);

    useEffect(() => {
        const handler = setTimeout(() => { fetchSuggestions(searchTerm); }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, fetchSuggestions]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFindRecipes = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) { toast.error("Please enter a search term."); return; }
        fetchRecipes();
    };

    const handleToggleFavorite = (recipe) => {
        toggleFavorite(recipe);
    };

    const handleSaveToPlanner = useCallback((recipe, date, mealType) => {
        const mealToAdd = { id: recipe.id, title: recipe.title, image: recipe.image, custom: false };
        updateMealInPlan(date, mealType, mealToAdd);
        setSelectedRecipe(null);
        toast.success(`Added ${recipe.title} to your meal plan!`);
    }, [updateMealInPlan]);

    const handleAddMissingIngredients = useCallback((recipe) => {
        if (recipe.extendedIngredients?.length > 0) {
            addMultipleToGroceryList(recipe.extendedIngredients);
            setSelectedRecipe(null);
            toast.success("Ingredients added to your grocery list!");
        } else {
            toast.error("No ingredient information to add.");
        }
    }, [addMultipleToGroceryList]);

    const getLockedRecipes = useCallback((allRecipes) => {
        return new Set();
    }, []);
    
    const lockedRecipeIndexes = getLockedRecipes(recipes); 

    const favoriteRecipesArray = favoriteRecipes ? Object.values(favoriteRecipes) : [];

    const isAnyLoading = isLoading || isAiLoading || isVoiceLoading || isImageLoading;

    return (
        <DashboardLayout>
            {selectedRecipe && (
                <RecipeModal
                    recipe={selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                    onAddToPlanner={(date, mealType) => handleSaveToPlanner(selectedRecipe, date, mealType)}
                    onAddToGroceryList={() => handleAddMissingIngredients(selectedRecipe)}
                />
            )}

            <div className="space-y-8">
                <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold text-dark-gray mb-4 flex items-center justify-center"><FaSearch className="mr-2" /> Quick Recipe Finder</h2>
                    <form onSubmit={handleFindRecipes} className="max-w-2xl mx-auto relative" ref={searchRef}>
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search for chicken, pasta, soup..." className="w-full p-4 text-lg border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-primary-accent" />
                        {suggestions.length > 0 && (<ul className="absolute w-full bg-white border rounded-lg mt-1 z-20 text-left">{suggestions.map(s => (<li key={s.id} onClick={() => { setSearchTerm(s.name); setSuggestions([]); fetchRecipes(); }} className="p-2 hover:bg-gray-100 cursor-pointer">{s.name}</li>))}</ul>)}
                        <div className="flex justify-center items-center gap-4 mt-4">
                            <button type="button" onClick={handleVoiceSearch} className="flex flex-col items-center text-gray-600 hover:text-primary-accent relative" disabled={isAnyLoading}>
                                {isVoiceLoading ? <span className="loader-sm" /> : <FaMicrophone size={20} />}
                                <span className="text-xs mt-1">Voice</span>
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            const base64Data = reader.result.split(',')[1];
                                            handleImageSearch({ data: base64Data, type: file.type });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                            />
                            <button type="button" onClick={() => fileInputRef.current.click()} className="flex flex-col items-center text-gray-600 hover:text-primary-accent relative" disabled={isAnyLoading}>
                                {isImageLoading ? <span className="loader-sm" /> : <FaCamera size={20} />}
                                <span className="text-xs mt-1">Image</span>
                            </button>
                            <button type="submit" disabled={isAnyLoading} className="bg-primary-accent text-white font-bold py-3 px-8 rounded-full text-lg hover:opacity-90 transition-all disabled:opacity-50">
                                {isLoading ? 'Searching...' : 'Find Recipes'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-4 items-center">
                            <select name="diet" value={filters.diet} onChange={(e) => setFilters(p => ({ ...p, diet: e.target.value }))} className="p-2 border rounded-full w-full md:w-auto"><option value="">Any Diet</option><option value="Vegan">Vegan</option><option value="Ketogenic">Keto</option><option value="Vegetarian">Vegetarian</option><option value="Gluten Free">Gluten Free</option></select>
                            <select name="mealType" value={filters.mealType} onChange={(e) => setFilters(p => ({ ...p, mealType: e.target.value }))} className="p-2 border rounded-full w-full md:w-auto"><option value="">Any Meal</option><option value="main course">Main Course</option><option value="breakfast">Breakfast</option><option value="dessert">Dessert</option><option value="snack">Snack</option></select>
                            <div className="w-full md:w-auto flex-grow"><label className="text-sm">Max Cook Time: ≤{filters.time} min</label><input type="range" name="time" min="10" max="240" step="5" value={filters.time} onChange={(e) => setFilters(p => ({ ...p, time: parseInt(e.target.value) }))} className="w-full accent-primary-accent" /></div>
                            <label className={`flex items-center text-sm gap-2`}>
                                <ToggleSwitch enabled={filters.usePantry} onChange={() => setFilters(p => ({ ...p, usePantry: !p.usePantry }))} />
                                Only Use Pantry Items
                            </label>
                        </div>

                        {error && <div className="col-span-full text-center text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>}

                        {hasSearched ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {isAnyLoading ?
                                    (Array(9).fill(0).map((_, index) => <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>)) :
                                    (recipes.map((recipe, index) => <RecipeCard key={recipe.id} recipe={recipe} onSelect={setSelectedRecipe} isLocked={lockedRecipeIndexes.has(index)} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />))
                                }
                                {recipes.length === 0 && !isAnyLoading && !error && <div className="col-span-full text-center py-12"><p className="text-gray-600 text-lg">No recipes found. Try a different search or filters!</p></div>}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <FaSearch className="text-gray-400 text-5xl mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">Start by searching for an ingredient or dish!</p>
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
                            <div>
                                <h3 className="text-xl font-bold text-dark-gray mb-4 flex items-center"><FaRobot className="mr-2 text-secondary-green" /> AI Smart Suggestions</h3>
                                <p className="text-sm text-gray-600 mb-4">"Based on your search for '{searchTerm || "popular recipes"}', here are some ideas..."</p>
                                {isAiLoading ? (<div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-gray-200 rounded-lg p-3 h-16 animate-pulse"></div>)}</div>) : aiSuggestions.length > 0 ? (<div className="space-y-3">{aiSuggestions.map((s, i) => <div key={i} className="bg-gray-100 p-3 rounded-md text-sm cursor-pointer hover:bg-gray-200" onClick={() => setSearchTerm(s.name)}><p className="font-semibold">{s.name}</p><p className="text-xs text-gray-500">{s.reason}</p></div>)}</div>) : (<p className="text-sm text-gray-500">Enter a search term to get AI ideas.</p>)}
                                <button onClick={() => fetchAiSuggestions(searchTerm)} disabled={isAiLoading || !searchTerm} className="w-full bg-secondary-green text-white font-bold py-2 rounded-full mt-4 hover:opacity-90 disabled:opacity-50">{isAiLoading ? 'Generating...' : 'Regenerate Suggestions'}</button>
                            </div>
                        </div>
                    </div>
                </div>

                {favoriteRecipesArray.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                        <h3 className="text-xl font-bold text-dark-gray mb-4 flex items-center"><FaHeart className="mr-2 text-red-500" /> Your Favorite Recipes</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {favoriteRecipesArray.map(recipe => (
                                <RecipeCard
                                    key={`fav-${recipe.id}`}
                                    recipe={recipe}
                                    onSelect={setSelectedRecipe}
                                    isFavorite={isFavorite}
                                    onToggleFavorite={toggleFavorite}
                                    isFavoritesList={true}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <footer className="text-center py-6 mt-8 border-t border-gray-200">
                    <div className="space-x-6 text-sm">
                        <a href="#terms" className="text-gray-500 hover:text-primary-accent">Terms</a>
                        <a href="#privacy" className="text-gray-500 hover:text-primary-accent">Privacy</a>
                        <a href="#contact" className="text-gray-500 hover:text-primary-accent">Contact</a>
                    </div>
                </footer>
            </div>
        </DashboardLayout>
    );
}

export default QuickRecipeFindPage;