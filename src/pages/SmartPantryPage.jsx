import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserContext } from '../App.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { FaSearch, FaPlus, FaBarcode, FaCamera, FaImage, FaEdit, FaTrash, FaRobot, FaDollarSign, FaClock, FaClipboardList, FaLock, FaTimes } from 'react-icons/fa';

// --- Helper: Pantry Item Modal for Add/Edit ---
const PantryItemModal = ({ isOpen, onClose, onSave, item }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('Other');
    const [expiryDate, setExpiryDate] = useState('');

    useEffect(() => {
        if (item) {
            setName(item.name);
            setQuantity(item.quantity);
            setCategory(item.category || 'Other');
            setExpiryDate(item.expiryDate || '');
        } else {
            // Reset for new item
            setName('');
            setQuantity('');
            setCategory('Other');
            setExpiryDate('');
        }
    }, [item, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim()) {
            toast.error("Item name cannot be empty.");
            return;
        }
        onSave({ ...item, name, quantity, category, expiryDate });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"><FaTimes /></button>
                <h3 className="text-xl font-bold mb-4">{item ? 'Edit Pantry Item' : 'Add New Pantry Item'}</h3>
                <div className="space-y-4">
                    <input type="text" placeholder="Item Name (e.g., Chicken Breast)" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md" />
                    <input type="text" placeholder="Quantity (e.g., 2 packs)" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-2 border rounded-md" />
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                        <option>Produce</option><option>Meat</option><option>Dairy</option><option>Grains</option><option>Other</option>
                    </select>
                    <div>
                        <label className="text-sm text-gray-600">Expiry Date (Optional)</label>
                        <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full p-2 border rounded-md" />
                    </div>
                </div>
                <button onClick={handleSave} className="w-full bg-primary-accent text-white font-bold py-2 px-4 rounded-full mt-6 hover:opacity-90">
                    {item ? 'Save Changes' : 'Add to Pantry'}
                </button>
            </div>
        </div>
    );
};


function SmartPantryPage() {
    const navigate = useNavigate();
    const { isLoggedIn, isPremium, pantryItems, addPantryItem, updatePantryItem, removePantryItem } = useContext(UserContext);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('expiry');
    const [filterCategory, setFilterCategory] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // AI State
    const [useItUpRecipes, setUseItUpRecipes] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);

    const GEMINI_API_KEY = 'AIzaSyBY_vymFVwPIUDlVMT6WtAEynWYTukOv2Y';
    const SPOONACULAR_API_KEY = '86285605e22449ba9fae9dcc14530542';

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/auth', { state: { from: '/smart-pantry' } });
        }
    }, [isLoggedIn, navigate]);

    // --- Date & Expiry Logic ---
    const calculateExpiryDays = (expiryDate) => {
        if (!expiryDate) return Infinity;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    };

    const getExpiryColor = (days) => {
        if (days <= 0) return 'text-red-500';
        if (days <= 3) return 'text-primary-accent';
        return 'text-secondary-green';
    };

    const getExpiryText = (days) => {
        if (days === Infinity) return 'No Expiry Date';
        if (days === 0) return 'Expires Today';
        if (days < 0) return `Expired ${Math.abs(days)} days ago`;
        if (days === 1) return '1 day left';
        return `${days} days left`;
    };

    const filteredAndSortedItems = pantryItems
        .map(item => ({ ...item, expiryDays: calculateExpiryDays(item.expiryDate) }))
        .filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'expiry') return a.expiryDays - b.expiryDays;
            if (sortBy === 'category') return a.category.localeCompare(b.category);
            return 0;
        });

    const nearExpiryItems = filteredAndSortedItems.filter(item => item.expiryDays <= 7 && item.expiryDays !== Infinity);

    // --- CRUD Handlers ---
    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveItem = (itemData) => {
        if (itemData.id) {
            updatePantryItem(itemData);
        } else {
            addPantryItem(itemData);
        }
    };

    // --- AI Feature Handlers ---
    // ✅ THIS IS THE FIX: The dependency array for this function was causing an infinite loop.
    // By creating a stable string of IDs, we ensure this function is only re-created when the actual items change.
    const nearExpiryIds = nearExpiryItems.map(item => item.id).join(',');

    const fetchUseItUpRecipes = useCallback(async () => {
        if (!isPremium || nearExpiryItems.length === 0) {
            setUseItUpRecipes([]);
            return;
        }
        setIsAiLoading(true);
        const ingredients = nearExpiryItems.map(item => item.name).join(',');
        try {
            const response = await fetch(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=3&ranking=2&apiKey=${SPOONACULAR_API_KEY}`);
            if (!response.ok) throw new Error("Failed to fetch recipes.");
            const data = await response.json();
            setUseItUpRecipes(data);
        } catch (error) {
            console.error("Use It Up fetch error:", error);
            toast.error("Could not get recipe suggestions.");
        } finally {
            setIsAiLoading(false);
        }
    }, [isPremium, nearExpiryIds, SPOONACULAR_API_KEY]); // Using the stable 'nearExpiryIds' string here

    useEffect(() => {
        fetchUseItUpRecipes();
    }, [fetchUseItUpRecipes]); // This is now safe because fetchUseItUpRecipes is stable

    const handleImageUpload = (event) => {
        if (!isPremium) {
            toast.error("Image recognition is a premium feature!");
            return;
        }
        const file = event.target.files[0];
        if (!file) return;

        setIsImageLoading(true);
        toast.success("AI is analyzing your image...");
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64ImageData = reader.result.split(',')[1];
            
            const prompt = "Analyze this image of a pantry or fridge. Identify all the distinct food items you can see. Provide the output as a simple JSON array of strings. For example: [\"Milk\", \"Eggs\", \"Ketchup\"]";

            try {
                const payload = { contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: file.type, data: base64ImageData } }] }] };
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!response.ok) throw new Error("AI image analysis failed.");

                const result = await response.json();
                const text = result.candidates[0].content.parts[0].text;
                const items = JSON.parse(text.replace(/```json\n?/, "").replace(/```/, ""));

                items.forEach(itemName => addPantryItem({ name: itemName }));
                toast.success(`Added ${items.length} items from your photo!`);

            } catch (error) {
                console.error("AI Image Recognition error:", error);
                toast.error("Could not identify items from the image.");
            } finally {
                setIsImageLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <DashboardLayout>
            <PantryItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} item={editingItem} />
            <div className="space-y-8">
                <h2 className="text-4xl font-serif font-bold text-primary-accent mb-6 text-center">Smart Pantry</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow-md border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Items in Pantry</p><p className="text-2xl font-bold text-secondary-green">{pantryItems.length}</p></div><FaClipboardList className="text-3xl text-secondary-green opacity-70" /></div></div>
                    <div className="bg-white p-4 rounded-lg shadow-md border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Items Expiring Soon</p><p className="text-2xl font-bold text-primary-accent">{nearExpiryItems.length}</p></div><FaClock className="text-3xl text-primary-accent opacity-70" /></div></div>
                    <div className="bg-white p-4 rounded-lg shadow-md border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Recipes to Make</p><p className="text-2xl font-bold text-text-dark">{isPremium ? useItUpRecipes.length : 'Locked'}</p></div><FaRobot className="text-3xl text-text-dark opacity-70" /></div></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-6 rounded-lg shadow-md border">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                                <div className="flex gap-2"><select className="border rounded-full py-2 px-4" value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="expiry">Sort: Expiry</option><option value="category">Sort: Category</option></select><select className="border rounded-full py-2 px-4" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}><option value="All">Filter: All</option><option value="Vegetables">Vegetables</option><option value="Meat">Meat</option><option value="Dairy">Dairy</option><option value="Other">Other</option></select></div>
                                <div className="flex items-center space-x-2 border rounded-full py-2 px-4 shadow-sm"><FaSearch className="text-gray-400" /><input type="text" className="focus:outline-none" placeholder="Search pantry..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredAndSortedItems.length > 0 ? (filteredAndSortedItems.map(item => (<div key={item.id} className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col items-center text-center border hover:shadow-md"><img src={`https://placehold.co/50x50/4CAF50/FFFFFF?text=${item.name.substring(0,2)}`} alt={item.name} className="w-16 h-16 object-cover rounded-full mb-2"/><h4 className="text-lg font-semibold">{item.name}</h4><p className="text-sm text-gray-600">{item.quantity}</p><p className={`text-sm font-bold ${getExpiryColor(item.expiryDays)}`}>{getExpiryText(item.expiryDays)}</p><div className="mt-3 flex space-x-2"><button onClick={() => handleOpenModal(item)} className="text-secondary-green hover:text-primary-accent text-lg"><FaEdit /></button><button onClick={() => removePantryItem(item.id)} className="text-red-500 hover:text-primary-accent text-lg"><FaTrash /></button></div></div>))) : (<p className="text-center text-gray-600 col-span-full">Your pantry is empty or no items match your search.</p>)}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border text-center relative">
                            <h3 className="text-xl font-bold mb-4">Add New Item to Pantry</h3>
                            <button onClick={() => handleOpenModal()} className="bg-primary-accent hover:opacity-90 text-white font-bold py-3 px-8 rounded-full text-lg shadow-md flex items-center justify-center mx-auto mb-4"><FaPlus className="mr-2" />Add Manually</button>
                            <div className={`flex justify-center space-x-6 text-gray-600 text-sm relative ${!isPremium ? 'blur-sm pointer-events-none' : ''}`}>
                                <button onClick={() => toast.success("Receipt scanning coming soon!")} className="flex flex-col items-center"><FaCamera className="text-2xl mb-1" /><p>Scan Receipt</p></button>
                                <button onClick={() => toast.success("Barcode scanning coming soon!")} className="flex flex-col items-center"><FaBarcode className="text-2xl mb-1" /><p>Scan Barcode</p></button>
                                <label className="flex flex-col items-center cursor-pointer"><FaImage className="text-2xl mb-1" /><p>Photo of Fridge</p><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
                            </div>
                             {!isPremium && (<div className="absolute inset-0 bg-gray-200 bg-opacity-60 flex flex-col items-center justify-center z-10 p-4 text-center rounded-lg"><FaLock className="text-gray-500 text-3xl mb-2" /><p className="font-semibold text-gray-700">Unlock AI Features</p><button onClick={() => navigate('/billing')} className="mt-2 bg-primary-accent text-white font-bold py-1 px-4 rounded-full text-sm">Upgrade</button></div>)}
                             {isImageLoading && (<div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-20 rounded-lg"><p className="font-semibold">AI is analyzing...</p></div>)}
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white p-6 rounded-lg shadow-md border relative">
                             {!isPremium && (<div className="absolute inset-0 bg-gray-200 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg"><button onClick={() => navigate('/billing')} className="bg-primary-accent text-white font-bold py-2 px-4 rounded-full">Unlock Alerts</button></div>)}
                            <h3 className="text-xl font-bold text-primary-accent mb-4 flex items-center"><FaRobot className="mr-2" /> Expiry Alerts</h3>
                            <ul className={`space-y-3 ${!isPremium ? 'blur-sm' : ''}`}>{nearExpiryItems.length > 0 ? nearExpiryItems.map(item => (<li key={item.id} className="p-3 rounded-lg flex justify-between items-center bg-red-50 border-l-4 border-red-500"><span className="font-semibold text-red-700">{item.name}</span><span className="text-sm text-red-600">{getExpiryText(item.expiryDays)}</span></li>)) : <p className="text-sm text-gray-500">No items are expiring in the next 7 days.</p>}</ul>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border relative">
                             {!isPremium && (<div className="absolute inset-0 bg-gray-200 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg"><button onClick={() => navigate('/billing')} className="bg-secondary-green text-white font-bold py-2 px-4 rounded-full">Unlock Recipes</button></div>)}
                            <h3 className="text-xl font-bold mb-4 flex items-center"><FaRobot className="mr-2 text-secondary-green" /> Use It Up! Recipes</h3>
                            <div className={`space-y-4 ${!isPremium ? 'blur-sm' : ''}`}>
                                {isAiLoading ? <p>Finding recipes...</p> : useItUpRecipes.length > 0 ? useItUpRecipes.map(recipe => (<div key={recipe.id} className="bg-gray-50 p-3 rounded-lg shadow-sm text-center cursor-pointer" onClick={() => navigate(`/recipe/${recipe.id}`)}><img src={recipe.image} alt={recipe.title} className="w-full h-20 object-cover rounded-md mb-2"/><p className="text-sm font-semibold">{recipe.title}</p></div>)) : <p className="text-sm text-gray-500">No recipes found for expiring items. Add more items to your pantry!</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default SmartPantryPage;
