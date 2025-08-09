// File: /src/App.jsx

import React, { useState, createContext, useContext, useEffect, createRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, matchPath } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Toaster, toast } from 'react-hot-toast';

import { auth } from './firebase';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import Header from './components/Header.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PremiumDashboardPage from './pages/PremiumDashboardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import SmartPantryPage from './pages/SmartPantryPage.jsx';
import MealPlannerPage from './pages/MealPlannerPage.jsx';
import GroceryListPage from './pages/GroceryListPage.jsx';
import QuickRecipeFindPage from './pages/QuickRecipeFindPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import NutritionPage from './pages/NutritionPage.jsx';
import { FaBook } from 'react-icons/fa';

// This function returns the clean initial state.
const getInitialState = () => ({
    isLoggedIn: false,
    isPremium: false,
    userName: '',
    userEmail: '',
    userAvatar: '/images/amichef-logo-header.svg',
    favoriteRecipes: {},
    mealPlan: {}, // Initial empty meal plan
    groceryList: [],
    pantryItems: [],
    userSettings: { // Initial default user settings
        darkMode: false,
        pushEnabled: true,
        emailEnabled: false,
        suggestionsEnabled: true,
        usePantryFirst: true,
        dietaryPrefs: 'none',
        recipeComplexity: 2,
        // Add default values for meal planner generator modal here
        mp_days: 7, // Meal Planner: days
        mp_location: '', // Meal Planner: location
        mp_dietaryPref: 'none', // Meal Planner: dietaryPref
        mp_goal: '', // Meal Planner: goal
        mp_householdSize: 1, // Meal Planner: householdSize
        mp_mealCount: 3, // Meal Planner: mealCount
        mp_cookingTime: 'under_30', // Meal Planner: cookingTime
        mp_budget: 'moderate', // Meal Planner: budget
        mp_allergies: '', // Meal Planner: allergies
    },
    lastNotification: null,
});

export const UserContext = createContext(getInitialState());
const db = getFirestore(); // Initialize Firestore using your existing setup

export const UserProvider = ({ children }) => {
    const [appState, setAppState] = useState(getInitialState());
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentUser, setCurrentUser] = useState(auth.currentUser);

    // Effect for handling dark mode changes
    useEffect(() => {
        if (appState.userSettings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [appState.userSettings.darkMode]);

    // Effect for handling auth state changes (runs only once)
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (!user) {
                setAppState(getInitialState());
                setIsLoaded(true);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Effect for handling real-time Firestore listener (runs when user changes)
    useEffect(() => {
        if (!currentUser) {
            if (!isLoaded) {
                setAppState(getInitialState());
                setIsLoaded(true);
            }
            return;
        }

        const userDocRef = doc(db, "users", currentUser.uid);

        const unsubscribeFirestore = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const cloudData = docSnap.data();
                setAppState(prev => ({
                    ...prev,
                    ...cloudData,
                    isLoggedIn: true,
                    userName: cloudData.userName || currentUser.displayName || '',
                    userEmail: cloudData.userEmail || currentUser.email || '',
                    userAvatar: cloudData.userAvatar || currentUser.photoURL || '/images/amichef-logo-header.svg',
                    mealPlan: cloudData.mealPlan || getInitialState().mealPlan,
                    userSettings: {
                        ...getInitialState().userSettings,
                        ...cloudData.userSettings
                    }
                }));
                if (!isLoaded) {
                    toast.success("User data loaded from the cloud.");
                    setIsLoaded(true);
                }
            } else {
                const minimalUserData = {
                    userName: currentUser.displayName || '',
                    userEmail: currentUser.email,
                    userAvatar: currentUser.photoURL || '/images/amichef-logo-header.svg',
                    isPremium: false,
                    isLoggedIn: true,
                    mealPlan: getInitialState().mealPlan,
                    userSettings: getInitialState().userSettings,
                    favoriteRecipes: getInitialState().favoriteRecipes,
                    groceryList: getInitialState().groceryList,
                    pantryItems: getInitialState().pantryItems,
                    lastNotification: getInitialState().lastNotification
                };
                
                try {
                    await setDoc(userDocRef, minimalUserData, { merge: false });
                    setAppState(prev => ({
                        ...prev,
                        ...minimalUserData,
                    }));
                    if (!isLoaded) {
                        setIsLoaded(true);
                        toast.success("New user profile created in the cloud.");
                    }
                } catch (error) {
                    console.error("Error creating new user document:", error);
                    toast.error("Could not create new user profile.");
                    setIsLoaded(true);
                }
            }
        }, (error) => {
            console.error("Error listening to user data:", error);
            toast.error("Could not load real-time data.");
            setIsLoaded(true);
        });

        return () => unsubscribeFirestore();
    }, [currentUser, isLoaded]);

    const updateStateAndSave = useCallback(async (newState, showToast = false) => {
        setAppState(prevState => {
            const finalState = { ...prevState, ...newState };

            if (finalState.isLoggedIn && currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                setDoc(userDocRef, finalState, { merge: true })
                    .then(() => {
                        if (showToast) toast.success("Changes saved to the cloud!");
                    })
                    .catch((error) => {
                        console.error("Error saving to cloud:", error);
                        if (showToast) toast.error("Could not save to the cloud.");
                    });
            }
            return finalState;
        });
    }, [currentUser]);

    const setUserSession = useCallback((displayName, email, premiumStatus = false, photoURL = '/images/amichef-logo-header.svg') => {
        updateStateAndSave({
            isLoggedIn: true,
            userName: displayName,
            userEmail: email,
            isPremium: premiumStatus,
            userAvatar: photoURL,
        });
    }, [updateStateAndSave]);

    const logout = useCallback(() => {
        auth.signOut().then(() => {
            setAppState(getInitialState());
            toast.success("You have been logged out.");
        }).catch(error => {
            console.error("Error signing out:", error);
            toast.error("Error logging out.");
        });
    }, []);

    const upgradeToPremium = useCallback(() => updateStateAndSave({ isPremium: true }, true), [updateStateAndSave]);

    const toggleFavorite = useCallback((recipe) => {
        setAppState(prev => {
            const isAlreadyFavorite = !!prev.favoriteRecipes[recipe.id];
            let newFavorites;

            if (isAlreadyFavorite) {
                newFavorites = { ...prev.favoriteRecipes };
                delete newFavorites[recipe.id];
                toast.success("Removed from Favorites!");
            } else {
                newFavorites = {
                    ...prev.favoriteRecipes,
                    [recipe.id]: recipe
                };
                toast.success("Added to Favorites!");
            }
            updateStateAndSave({ favoriteRecipes: newFavorites });
            return { ...prev, favoriteRecipes: newFavorites };
        });
    }, [updateStateAndSave]);

    const isFavorite = useCallback((recipeId) => !!appState.favoriteRecipes[recipeId], [appState.favoriteRecipes]);

    const updateMealInPlan = useCallback((date, mealType, recipe) => {
        setAppState(prev => {
            const newMealPlan = { ...prev.mealPlan, [date]: { ...prev.mealPlan[date], [mealType]: recipe } };
            updateStateAndSave({ mealPlan: newMealPlan });
            return { ...prev, mealPlan: newMealPlan };
        });
    }, [updateStateAndSave]);

    const removeMealFromPlan = useCallback((date, mealType) => {
        setAppState(prev => {
            const newPlan = { ...prev.mealPlan };
            if (newPlan[date]) {
                delete newPlan[date][mealType];
                if (Object.keys(newPlan[date]).length === 0) delete newPlan[date];
            }
            updateStateAndSave({ mealPlan: newPlan });
            return { ...prev, mealPlan: newPlan };
        });
    }, [updateStateAndSave]);

    const clearMealPlan = useCallback(() => {
        setAppState(prev => {
            updateStateAndSave({ mealPlan: {} });
            return { ...prev, mealPlan: {} };
        });
        toast.success("All meal plans cleared!");
    }, [updateStateAndSave]);

    const addItemToGroceryList = useCallback((itemToAdd) => {
        setAppState(prev => {
            const itemExists = prev.groceryList.some(item => item.name.toLowerCase() === itemToAdd.name.toLowerCase());
            if (itemExists) {
                toast.error("Item already on the list!");
                return prev;
            }
            const newItem = { id: Date.now(), name: itemToAdd.name, quantity: itemToAdd.quantity || '1 unit', checked: false, category: itemToAdd.category || 'Other', pantryStatus: 'missing', priority: 'Optional' };
            toast.success(`Added ${newItem.name} to the list!`);
            const newGroceryList = [newItem, ...prev.groceryList];
            updateStateAndSave({ groceryList: newGroceryList });
            return { ...prev, groceryList: newGroceryList };
        });
    }, [updateStateAndSave]);

    const addMultipleToGroceryList = useCallback((ingredientsToAdd) => {
        setAppState(prev => {
            const existingItems = new Set(prev.groceryList.map(item => item.name.toLowerCase()));

            const newItems = ingredientsToAdd
                .map(ing => {
                    // Handle both string and object ingredient formats
                    const ingredientName = typeof ing === 'string' ? ing : (ing.original || ing.name || '').trim();
                    return {
                        id: uuid(),
                        name: ingredientName,
                        quantity: '1 unit', // Default quantity, can be refined later if needed
                        checked: true,
                        category: 'Other', // Default category, can be refined later if needed
                    };
                })
                .filter(item => {
                    const itemName = item.name.toLowerCase();
                    if (!itemName || existingItems.has(itemName)) {
                        return false;
                    }
                    existingItems.add(itemName);
                    return true;
                });

            if (newItems.length === 0) {
                toast.success("All ingredients are already on your list!");
                return prev;
            }

            const finalGroceryList = [...newItems, ...prev.groceryList];
            updateStateAndSave({ groceryList: finalGroceryList });
            toast.success(`Added ${newItems.length} new item(s) to the grocery list!`);
            return { ...prev, groceryList: finalGroceryList };
        });
    }, [updateStateAndSave]);

    const removeItemFromGroceryList = useCallback((itemId) => {
        setAppState(prev => {
            const newGroceryList = prev.groceryList.filter(item => item.id !== itemId);
            updateStateAndSave({ groceryList: newGroceryList });
            toast.success("Item removed.");
            return { ...prev, groceryList: newGroceryList };
        });
    }, [updateStateAndSave]);

    const toggleGroceryItem = useCallback((itemId) => {
        setAppState(prev => {
            const newGroceryList = prev.groceryList.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item);
            updateStateAndSave({ groceryList: newGroceryList });
            return { ...prev, groceryList: newGroceryList };
        });
    }, [updateStateAndSave]);

    const updateGroceryItem = useCallback((itemToUpdate) => {
        setAppState(prev => {
            const newGroceryList = prev.groceryList.map(item => item.id === itemToUpdate.id ? itemToUpdate : item);
            updateStateAndSave({ groceryList: newGroceryList });
            return { ...prev, groceryList: newGroceryList };
        });
    }, [updateStateAndSave]);

    const addPantryItem = useCallback((itemToAdd) => {
        setAppState(prev => {
            const newItem = { id: Date.now(), name: itemToAdd.name, quantity: itemToAdd.quantity || '1', category: itemToAdd.category || 'Other', expiryDate: itemToAdd.expiryDate || '' };
            toast.success(`Added ${newItem.name} to pantry!`);
            const newPantryItems = [newItem, ...prev.pantryItems];
            updateStateAndSave({ pantryItems: newPantryItems });
            return { ...prev, pantryItems: newPantryItems };
        });
    }, [updateStateAndSave]);

    const updatePantryItem = useCallback((itemToUpdate) => {
        setAppState(prev => {
            const newPantryItems = prev.pantryItems.map(item => item.id === itemToUpdate.id ? itemToUpdate : item);
            updateStateAndSave({ pantryItems: newPantryItems });
            return { ...prev, pantryItems: newPantryItems };
        });
    }, [updateStateAndSave]);

    const removePantryItem = useCallback((itemId) => {
        setAppState(prev => {
            const newPantryItems = prev.pantryItems.filter(item => item.id !== itemId);
            updateStateAndSave({ pantryItems: newPantryItems });
            toast.success("Item removed from pantry.");
            return { ...prev, pantryItems: newPantryItems };
        });
    }, [updateStateAndSave]);

    const updateUserSettings = useCallback((newSettings) => {
        setAppState(prev => {
            const updatedSettings = { ...prev.userSettings, ...newSettings };
            updateStateAndSave({ userSettings: updatedSettings }, true);
            return { ...prev, userSettings: updatedSettings };
        });
    }, [updateStateAndSave]);

    const updateUserName = useCallback((newName) => {
        setAppState(prev => {
            updateStateAndSave({ userName: newName }, true);
            return { ...prev, userName: newName };
        });
    }, [updateStateAndSave]);

    const updateUserAvatar = useCallback((newAvatar) => {
        setAppState(prev => {
            updateStateAndSave({ userAvatar: newAvatar }, true);
            return { ...prev, userAvatar: newAvatar };
        });
    }, [updateStateAndSave]);

    const setLastNotification = useCallback((notificationType) => {
        setAppState(prev => {
            updateStateAndSave({ lastNotification: notificationType });
            return { ...prev, lastNotification: notificationType };
        });
    }, [updateStateAndSave]);

    return (
        <UserContext.Provider value={{
            isLoggedIn: appState.isLoggedIn,
            isPremium: appState.isPremium,
            userName: appState.userName,
            userEmail: appState.userEmail,
            userAvatar: appState.userAvatar,
            favoriteRecipes: appState.favoriteRecipes,
            mealPlan: appState.mealPlan,
            groceryList: appState.groceryList,
            pantryItems: appState.pantryItems,
            userSettings: appState.userSettings,
            lastNotification: appState.lastNotification,
            setUserSession, logout, upgradeToPremium, toggleFavorite, isFavorite,
            updateMealInPlan, removeMealFromPlan, clearMealPlan,
            addItemToGroceryList,
            addMultipleToGroceryList, // Expose addMultipleToGroceryList
            removeItemFromGroceryList,
            toggleGroceryItem,
            updateGroceryItem,
            addPantryItem, updatePantryItem, removePantryItem,
            updateUserSettings, updateUserName, updateUserAvatar,
            setLastNotification,
            isLoaded: isLoaded,
        }}>
            {isLoaded ? children : <div className="flex justify-center items-center h-screen text-xl">Loading...</div>}
        </UserContext.Provider>
    );
};

const CookbooksPage = () => (
    <div className="text-center p-8">
        <FaBook className="mx-auto text-5xl text-gray-400 mb-4" />
        <h2 className="text-3xl font-bold">Community Cookbooks</h2>
        <p className="text-gray-600 mt-2">This feature is coming soon! Get ready to create and share your favorite recipe collections.</p>
    </div>
);


// --- Routing and App Component ---
function AppRoutes() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn, isPremium, isLoaded, setUserSession } = useContext(UserContext);
    
    const routesConfig = [
        { path: '/', Page: LandingPage }, { path: '/auth', Page: AuthPage }, { path: '/dashboard', Page: DashboardPage },
        { path: '/premium-dashboard', Page: PremiumDashboardPage }, { path: '/smart-pantry', Page: SmartPantryPage },
        { path: '/meal-planner', Page: MealPlannerPage }, { path: '/grocery-list', Page: GroceryListPage },
        { path: '/nutrition', Page: NutritionPage }, { path: '/cookbooks', Page: CookbooksPage },
        { path: '/settings', Page: SettingsPage }, { path: '/billing', Page: BillingPage },
        { path: '/quick-find', Page: QuickRecipeFindPage },
        { path: '*', Page: NotFoundPage },
    ].map(route => ({ ...route, nodeRef: createRef(null) }));

    const routes = routesConfig.map(route => {
        let element;
        if (route.path === '/auth') {
            element = <route.Page />;
        } else {
            element = <route.Page />;
        }
        return { ...route, element };
    });

    const currentRoute = routes.find(route => matchPath(route.path, location.pathname));
    
    const dashboardPaths = [
        '/dashboard', 
        '/premium-dashboard', 
        '/smart-pantry', 
        '/meal-planner',
        '/grocery-list', 
        '/quick-find', 
        '/settings', 
        '/billing', 
        '/nutrition', 
        '/cookbooks', 
    ];
    
    const showGlobalHeader = !dashboardPaths.some(path => matchPath(path, location.pathname));
    
    useEffect(() => {
        const protectedPaths = [
            '/dashboard', '/premium-dashboard', '/smart-pantry', '/meal-planner',
            '/grocery-list', '/settings', '/billing', 
            '/nutrition', '/cookbooks', 
        ];

        const isProtected = protectedPaths.some(path => matchPath(path, location.pathname));

        if (!isLoggedIn && isProtected) {
            toast.error("You must be logged in to view that page.");
            navigate('/auth', { replace: true, state: { from: location.pathname } });
        }
    }, [isLoggedIn, location.pathname, navigate]);
    
    const mainContentPaddingClass = '';
    const isLandingPage = location.pathname === '/';

    return (
        <div className={`min-h-screen flex flex-col relative ${mainContentPaddingClass}`}>
            {isLandingPage && (<><div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=2940&auto=format&fit=crop')" }} /><div className="absolute inset-0 bg-black/40 z-0" /></>)}
            <div className="relative z-10 flex flex-col flex-grow">
                {showGlobalHeader && <Header />}
                <main className="flex-grow relative">
                    <TransitionGroup>
                        <CSSTransition key={location.key} nodeRef={currentRoute?.nodeRef} timeout={300} classNames="fade" unmountOnExit>
                            <div ref={currentRoute?.nodeRef} className="absolute w-full h-full">
                                <Routes location={location}>
                                    {routes.map(({ path, element }) => (<Route key={path} path={path} element={element} />))}
                                </Routes>
                            </div>
                        </CSSTransition>
                    </TransitionGroup>
                </main>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <UserProvider>
                <AppRoutes />
                <Toaster position="top-right" reverseOrder={false} />
            </UserProvider>
        </Router>
    );
}
