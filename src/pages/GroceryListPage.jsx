// File: /src/pages/GroceryListPage.jsx

import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserContext } from '../App.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import ImageUploadModal from '../components/ImageUploadModal.jsx';
import {
    FaShoppingCart, FaCheck, FaPlus, FaLock, FaFilePdf, FaRobot,
    FaSearch, FaFilter, FaPen, FaTrash, FaLightbulb, FaTruck, FaExclamationCircle,
    FaCamera, FaBarcode, FaMicrophone, FaTimes, FaDollarSign, FaSyncAlt
} from 'react-icons/fa';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Offline Storage Utility ---
const saveOfflineList = (list) => localStorage.setItem('offlineGroceryList', JSON.stringify(list));
const getOfflineList = () => JSON.parse(localStorage.getItem('offlineGroceryList') || '[]');

// --- Item Component for Dnd-Kit ---
const SortableItem = ({ item, toggleGroceryItem, handleEditClick, removeItemFromGroceryList, storeAvailability, isPremium }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const storeInfo = storeAvailability[item.id];

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex items-center justify-between p-3 rounded-lg transition-all ${item.checked ? 'bg-green-50' : 'bg-white shadow-sm'}`}
        >
            <div className="flex items-center">
                <input type="checkbox" checked={item.checked} onChange={() => toggleGroceryItem(item.id)} className="h-5 w-5 rounded-full text-secondary-green focus:ring-secondary-green" />
                <div className="ml-4">
                    <span className={`font-medium ${item.checked ? 'line-through text-gray-500' : 'text-text-dark'}`}>{item.name}</span>
                    {item.quantity && <p className="text-sm text-gray-500">{item.quantity}</p>}
                    {isPremium && storeInfo && (
                        <div className="mt-1 text-xs text-gray-600">
                            <span className={`font-bold ${storeInfo.inStock ? 'text-green-600' : 'text-red-500'}`}>
                                {storeInfo.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                            </span>
                            <span className="ml-2"><FaDollarSign className="inline" /> {storeInfo.price}</span>
                            {storeInfo.alt && (
                                <p className="mt-1 text-xs text-blue-600">Alternative: {storeInfo.alt}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4">
                {item.pantryStatus === 'in_pantry' ? (
                    <span title="Already in Pantry" className="flex items-center text-xs text-green-600"><FaCheck className="mr-1" /> In Pantry</span>
                ) : (
                    <span title="Missing from Pantry" className="flex items-center text-xs text-primary-accent"><FaExclamationCircle className="mr-1" /> Missing</span>
                )}
                <button onClick={() => handleEditClick(item)} className="text-gray-400 hover:text-secondary-green">
                    <FaPen />
                </button>
                <button onClick={() => removeItemFromGroceryList(item.id)} className="text-gray-400 hover:text-red-500">
                    <FaTrash />
                </button>
            </div>
        </li>
    );
};

// --- Add/Edit Item Modal ---
const AddEditItemModal = ({ isOpen, onClose, onSave, itemToEdit, title }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('Other');
    const [originalItem, setOriginalItem] = useState(null);

    useEffect(() => {
        if (itemToEdit) {
            setName(itemToEdit.name);
            setQuantity(itemToEdit.quantity || '');
            setCategory(itemToEdit.category || 'Other');
            setOriginalItem(itemToEdit);
        } else {
            setName('');
            setQuantity('');
            setCategory('Other');
            setOriginalItem(null);
        }
    }, [itemToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim()) {
            toast.error("Item name cannot be empty.");
            return;
        }
        onSave({ ...(originalItem || {}), name, quantity, category });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"><FaTimes /></button>
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <div className="space-y-4">
                    <input type="text" placeholder="Item Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md" />
                    <input type="text" placeholder="Quantity (e.g. 1 lb, 2 units)" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-2 border rounded-md" />
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                        <option>Produce</option><option>Meat & Poultry</option><option>Dairy & Eggs</option>
                        <option>Grains</option><option>From Meal Plan</option><option>Other</option>
                    </select>
                </div>
                <button onClick={handleSave} className="w-full bg-secondary-green text-white font-bold py-2 px-4 rounded-full mt-6 hover:opacity-90">Save</button>
            </div>
        </div>
    );
};

// --- Main Component ---
function GroceryListPage() {
    const navigate = useNavigate();
    const {
        isLoggedIn, isPremium, mealPlan, groceryList, pantryItems,
        addItemToGroceryList, addMultipleToGroceryList, removeItemFromGroceryList, toggleGroceryItem, updateGroceryItem, updateStateAndSave
    } = useContext(UserContext);

    const [newItemName, setNewItemName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [showOnlyMissing, setShowOnlyMissing] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [storeAvailability, setStoreAvailability] = useState({});
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [offline, setOffline] = useState(!navigator.onLine);
    const [isListening, setIsListening] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const fileInputRef = useRef(null);

    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const WALMART_KEY = import.meta.env.VITE_WALMART_KEY;
    const KROGER_KEY = import.meta.env.VITE_KROGER_KEY;

    // dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (!isLoggedIn) navigate('/auth', { state: { from: '/grocery-list' } });

        const handleOnline = () => { setOffline(false); toast.success("Back Online! List Synced."); };
        const handleOffline = () => { setOffline(true); toast("Offline mode enabled", { icon: "📴" }); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        if (isPremium) fetchStoreAvailability();
    }, [isPremium]);

    useEffect(() => {
        if (groceryList) {
            saveOfflineList(groceryList);
        }
    }, [groceryList]);

    const handleAutoGenerate = useCallback(async () => {
        if (!isPremium) {
            toast.error("AI List Generation is a Premium feature!");
            return;
        }
        setIsGenerating(true);
        toast.success("Generating list from your meal plan...");
        try {
            const allMealsInPlan = Object.values(mealPlan).flatMap(day => Object.values(day)).filter(meal => meal && meal.extendedIngredients);
            if (allMealsInPlan.length === 0) {
                toast.error("No recipes in your meal plan to generate a list from.");
                return;
            }
            const allIngredients = new Set();
            allMealsInPlan.forEach(meal => {
                meal.extendedIngredients.forEach(ingredient => {
                    const ingredientName = ingredient.name || ingredient.original;
                    if (ingredientName) {
                        const formattedName = ingredientName.charAt(0).toUpperCase() + ingredientName.slice(1);
                        allIngredients.add(formattedName);
                    }
                });
            });
            let itemsAddedCount = 0;
            allIngredients.forEach(ingredientName => {
                const success = addItemToGroceryList({ name: ingredientName, category: "From Meal Plan", quantity: "1" });
                if (success) { itemsAddedCount++; }
            });
            if (itemsAddedCount > 0) { toast.success(`Added ${itemsAddedCount} new ingredients from your meal plan!`); }
            else { toast.success("Your list is already up to date with your meal plan!"); }
        } catch (error) {
            console.error("AI Auto-Generate error:", error);
            toast.error("Failed to generate list from meal plan.");
        } finally {
            setIsGenerating(false);
        }
    }, [isPremium, mealPlan, addItemToGroceryList]);

    const fetchStoreAvailability = useCallback(async () => {
        if (!isPremium || !groceryList.length) return;
        setLoadingAvailability(true);
        toast.success("Checking real-time store stock...");
        const results = {};
        for (const item of groceryList) {
            try {
                let storeData = null;
                if (KROGER_KEY) {
                    const res = await fetch(`https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(item.name)}`, {
                        headers: { Authorization: `Bearer ${KROGER_KEY}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data?.data?.length) {
                            storeData = { price: `$${(data.data[0].items[0].price?.regular || 3.5).toFixed(2)}`, inStock: data.data[0].items[0].inventory?.stockLevel > 0, alt: data.data[1]?.description || '' };
                        }
                    }
                }
                if (!storeData && WALMART_KEY) {
                    const res = await fetch(`https://api.walmart.com/products?query=${encodeURIComponent(item.name)}&apiKey=${WALMART_KEY}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data?.items?.length) {
                            storeData = { price: `$${(data.items[0].salePrice || 4.2).toFixed(2)}`, inStock: true, alt: data.items[1]?.name || '' };
                        }
                    }
                }
                if (!storeData && GEMINI_API_KEY) {
                    const prompt = `Provide store availability and prices for "${item.name}". Respond as JSON {inStock:boolean, price:string, alt:string}`;
                    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
                    });
                    if (aiRes.ok) {
                        const aiData = await aiRes.json();
                        const parsed = JSON.parse(aiData.candidates[0].content.parts[0].text);
                        storeData = { inStock: parsed.inStock, price: parsed.price, alt: parsed.alt };
                    }
                }
                results[item.id] = storeData || { inStock: true, price: 'N/A', alt: '' };
            } catch (err) {
                console.error('Availability error', err);
                results[item.id] = { inStock: true, price: 'N/A', alt: '' };
            }
        }
        setStoreAvailability(results);
        setLoadingAvailability(false);
    }, [groceryList, isPremium, GEMINI_API_KEY, WALMART_KEY, KROGER_KEY]);

    const handleOptimizeList = useCallback(async () => {
        if (!isPremium) {
            toast.error("AI Assistant is a Premium feature!");
            return;
        }
        setIsAiLoading(true);
        setAiSuggestions([]);
        toast.success("AI is analyzing your list...");

        const mealPlanSummary = Object.values(mealPlan).flatMap(day => Object.values(day).map(meal => meal.title)).join(', ');
        const groceryListSummary = groceryList.map(item => `${item.name} (${item.quantity || '1'})`).join(', ');
        const prompt = `You are a smart grocery optimizer. Meal plan: ${mealPlanSummary}. Current grocery list: ${groceryListSummary}. Provide 3 actionable suggestions to optimize the list. Suggestions can include: identifying missing items for the meal plan, suggesting a budget-friendly or healthier alternative, or recommending a common staple they might have forgotten. Return a JSON array of objects, where each object has a "suggestion" (string) and a "newItem" (string, the name of the item to add, or empty string if not applicable).`;

        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

            if (!response.ok) throw new Error('Failed to get AI suggestions.');

            const result = await response.json();
            const suggestions = JSON.parse(result.candidates[0].content.parts[0].text);

            setAiSuggestions(suggestions);
            toast.success("AI suggestions are ready!");
        } catch (error) {
            console.error("AI Optimize error:", error);
            toast.error("Couldn't get AI suggestions.");
        } finally {
            setIsAiLoading(false);
        }
    }, [isPremium, mealPlan, groceryList, GEMINI_API_KEY]);

    const handleVoiceInput = () => {
        if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
            toast.error("Voice input is not supported by your browser.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            toast.success("Listening for voice input...");
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setNewItemName(transcript);
            toast(`Recognized: "${transcript}"`, { icon: '🎤' });
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            toast.error("Voice input error. Please try again.");
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleAddItemFromModal = (item) => {
        addItemToGroceryList(item);
    };

    const handleAiAddItem = (itemName, category = 'From Meal Plan', quantity = '1') => {
        if (!itemName) return;
        addItemToGroceryList({ name: itemName, category, quantity });
        toast.success(`Added "${itemName}" to list.`);
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };
    
    const handleAddClick = () => {
        setEditingItem(null); // Clear item to indicate we are adding a new one
        setIsEditModalOpen(true);
    };

    const handleSaveItem = (updatedItem) => {
        if (updatedItem.id) {
            updateGroceryItem(updatedItem);
        } else {
            addItemToGroceryList(updatedItem);
        }
    };

    const handleDeleteItem = (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            removeItemFromGroceryList(itemId);
        }
    };

    const handleScanBarcode = () => toast.success("Barcode scanning coming soon!");
    const handleInstacart = () => toast.success("Instacart integration is coming soon!");

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.text("My Grocery List", 14, 20);

        const tableData = groceryList.map(item => [
            item.name,
            item.quantity || 'N/A',
            item.category || 'Other',
            item.checked ? '✓' : '✗'
        ]);

        doc.autoTable({
            startY: 25,
            head: [['Item Name', 'Quantity', 'Category', 'Checked']],
            body: tableData,
        });

        doc.save('grocery-list.pdf');
        toast.success("Grocery list exported as PDF!");
    };

    // Dnd-kit logic
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = groceryList.findIndex(item => item.id === active.id);
            const newIndex = groceryList.findIndex(item => item.id === over.id);

            const newGroceryList = arrayMove(groceryList, oldIndex, newIndex);
            updateStateAndSave({ groceryList: newGroceryList });
        }
    };

    const filteredItems = groceryList.map(item => {
        // Check if item is in pantry
        const isInPantry = pantryItems.some(pItem => pItem.name.toLowerCase() === item.name.toLowerCase());
        return { ...item, pantryStatus: isInPantry ? 'in_pantry' : 'missing' };
    }).filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
        const matchesMissing = !showOnlyMissing || item.pantryStatus === 'missing';
        return matchesSearch && matchesCategory && matchesMissing;
    });

    const groupedItems = filteredItems.reduce((acc, item) => {
        const category = item.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {});


    return (
        <DashboardLayout>
            {offline && <div className="bg-yellow-200 text-yellow-800 p-2 text-center text-sm">📴 You are offline. Changes will sync when online.</div>}
            
            <AddEditItemModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveItem}
                itemToEdit={editingItem}
                title={editingItem ? "Edit Grocery Item" : "Add New Grocery Item"}
            />
            
            <ImageUploadModal 
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onAddItems={addMultipleToGroceryList}
            />

            <div className="space-y-8">
                <div className="text-center">
                    <h2 className="text-4xl font-serif font-bold text-primary-accent mb-2 flex items-center justify-center">
                        <FaShoppingCart className="mr-3 text-3xl" /> Grocery List
                    </h2>
                    <p className="text-gray-600">Your shopping list, integrated with your pantry and meal plan.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 relative">
                            {!isPremium && (<div className="absolute inset-0 bg-gray-200 bg-opacity-60 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center rounded-lg"><FaLock className="text-gray-500 text-3xl mb-2" /><p className="font-semibold text-gray-700">Unlock Quick Add Features</p><button onClick={() => navigate('/billing')} className="mt-2 bg-primary-accent text-white font-bold py-1 px-4 rounded-full text-sm">Upgrade</button></div>)}
                            <div className="flex gap-2 justify-center items-center flex-wrap">
                                <button onClick={handleScanBarcode} className="bg-gray-200 text-gray-600 p-3 rounded-full hover:bg-gray-300"><FaBarcode /></button>
                                <button onClick={() => setIsUploadModalOpen(true)} className="bg-gray-200 text-gray-600 p-3 rounded-full hover:bg-gray-300"><FaCamera /></button>
                                <button onClick={handleVoiceInput} disabled={isListening} className={`${isListening ? "bg-red-500" : "bg-red-500 hover:bg-red-600"} text-white p-3 rounded-full`}><FaMicrophone /></button>
<button onClick={handleAddClick} disabled={!isPremium} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50">
                                    <FaPlus /> Add Manually
                                </button>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="relative"><FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 p-2 border rounded-full bg-gray-50 focus:ring-2 focus:ring-primary-accent" /></div>
                                <div className="relative"><FaFilter className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" /><select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full pl-10 p-2 border rounded-full bg-gray-50 appearance-none focus:ring-2 focus:ring-primary-accent"><option value="All">All Categories</option><option value="Produce">Produce</option><option value="Meat & Poultry">Meat & Poultry</option><option value="Dairy & Eggs">Dairy & Eggs</option><option value="Grains">Grains</option><option value="Other">Other</option></select></div>
                            </div>
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <label className="flex items-center text-sm text-gray-600"><input type="checkbox" checked={showOnlyMissing} onChange={e => setShowOnlyMissing(e.target.checked)} className="mr-2 h-4 w-4 rounded text-primary-accent focus:ring-primary-accent" />Show only missing items</label>
                                <button onClick={() => {
        if (window.confirm("Are you sure you want to delete all grocery items?")) {
            updateStateAndSave({ groceryList: [] });
        }
    }} className="bg-red-500 text-white rounded-full p-2 hover:bg-opacity-90 shadow flex items-center gap-2 px-4 py-2 text-sm font-semibold">
    <FaTrash /> Delete All
</button>
                            </div>
                        </div>

                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <div className="space-y-4">
                                {Object.keys(groupedItems).length > 0 ? (
                                    <SortableContext items={filteredItems.map(item => item.id)}>
                                        {Object.keys(groupedItems).map(category => (
                                            <div key={category}>
                                                <h3 className="text-lg font-bold text-text-dark mb-2 pb-1 border-b-2 border-gray-200">{category}</h3>
                                                <ul className="space-y-2">
                                                    {groupedItems[category].map(item => (
                                                        <SortableItem
                                                            key={item.id}
                                                            item={item}
                                                            toggleGroceryItem={toggleGroceryItem}
                                                            handleEditClick={handleEditClick}
                                                            removeItemFromGroceryList={handleDeleteItem}
                                                            storeAvailability={storeAvailability}
                                                            isPremium={isPremium}
                                                        />
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </SortableContext>
                                ) : (
                                    <div className="bg-white p-8 text-center rounded-lg shadow-md border"><FaShoppingCart className="mx-auto text-4xl text-gray-300 mb-4" /><p className="text-gray-500">Your grocery list is empty.</p><p className="text-sm text-gray-400">Add items manually or generate a list from your meal plan.</p></div>
                                )}
                            </div>
                        </DndContext>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 relative">
                            {!isPremium && (<div className="absolute inset-0 bg-gray-200 bg-opacity-60 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center rounded-lg"><FaLock className="text-gray-500 text-3xl mb-2" /><p className="font-semibold text-gray-700">Unlock AI Assistant</p><button onClick={() => navigate('/billing')} className="mt-2 bg-primary-accent text-white font-bold py-1 px-4 rounded-full text-sm">Upgrade</button></div>)}
                            <div className={`space-y-4 ${!isPremium ? 'blur-sm' : ''}`}>
                                <h3 className="text-xl font-bold text-text-dark flex items-center"><FaRobot className="mr-2 text-secondary-green" /> AI Shopping Assistant</h3>
                                <button onClick={handleAutoGenerate} disabled={isGenerating || !isPremium} className="w-full bg-blue-500 text-white font-bold py-2 rounded-full hover:bg-blue-600 transition-all disabled:opacity-50">{isGenerating ? 'Generating...' : 'Generate from Meal Plan'}</button>
                                <button onClick={handleOptimizeList} disabled={isAiLoading || !isPremium} className="w-full bg-secondary-green text-white font-bold py-2 rounded-full hover:opacity-90 transition-all disabled:opacity-50">{isAiLoading ? 'Analyzing...' : 'Get Shopping Tips'}</button>
                                {isAiLoading && (<div className="space-y-2 text-sm">{[...Array(3)].map((_, i) => <div key={i} className="bg-gray-200 rounded-md h-12 animate-pulse"></div>)}</div>)}
                                <ul className="space-y-3 text-sm">
                                    {aiSuggestions.map((tip, index) => (
                                        <li key={index} className="p-2 bg-gray-50 rounded-md">
                                            <div className="flex items-start">
                                                <FaLightbulb className="text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                                                <span className="text-gray-700">{tip.suggestion}</span>
                                            </div>
                                            {tip.newItem && (
                                                <button onClick={() => handleAiAddItem(tip.newItem)} className="text-left text-blue-600 font-semibold text-xs mt-1 pl-6 hover:underline">
                                                    + Add "{tip.newItem}" to list
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <h3 className="text-xl font-bold text-text-dark mb-4 flex items-center"><FaTruck className="mr-2 text-primary-accent" /> Store Integration</h3>
                            <button onClick={fetchStoreAvailability} disabled={loadingAvailability} className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white font-bold py-2 rounded-full hover:bg-gray-700 disabled:opacity-50">
                                {loadingAvailability ? 'Checking Stock...' : 'Check All Stock & Prices'}
                            </button>
                            <div className="mt-4 space-y-2">
                                <button onClick={generatePDF} className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white font-bold py-2 rounded-full hover:bg-gray-700"><FaFilePdf /> Export PDF</button>
                                <button onClick={handleInstacart} className="w-full flex items-center justify-center gap-2 bg-primary-accent text-white font-bold py-2 rounded-full hover:opacity-90 relative disabled:bg-gray-300">
                                    {!isPremium && <FaLock className="absolute left-4" />}
                                    {isPremium ? 'Click to Order via Instacart' : 'Send to Delivery App'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default GroceryListPage;