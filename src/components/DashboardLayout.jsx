// File: /src/components/DashboardLayout.jsx
import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../App.jsx';
import { toast } from 'react-hot-toast';
import {
    FaUserCircle, FaBell, FaUtensils, FaShoppingCart, FaCalendarAlt, FaCog,
    FaClipboardList, FaSearch, FaLock, FaExclamationTriangle, FaCheckCircle,
    FaPaperPlane, FaTimes, FaChartPie, FaBook, FaBars, FaArrowLeft
} from 'react-icons/fa';

// --- Custom Chef Robot Icon ---
const ChefBotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 2C9.243 2 7 4.243 7 7v3h10V7c0-2.757-2.243-5-5-5zM6 11h12v2H6v-2z" fill="#fff"/>
        <path d="M12 14c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8zm-3.5 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fill="#fff"/>
        <circle cx="9" cy="8" r="1" fill="#4a5568"/>
        <circle cx="15" cy="8" r="1" fill="#4a5568"/>
    </svg>
);

function DashboardLayout({ children }) {
    const {
        isLoggedIn, isPremium, logout, userName, userAvatar, pantryItems,
        addItemToGroceryList, updateMealInPlan, lastNotification, setLastNotification,
        isLoaded
    } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const notificationRef = useRef(null);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: 'ai', text: 'Hello! I am Ami. Try asking me to "add milk to the grocery list" or "add pizza for dinner tomorrow".' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatRef = useRef(null);
    const chatBodyRef = useRef(null);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const toggleSidebar = () => {
      // If we're on mobile, this toggles the mobile sidebar.
      // Otherwise, it toggles the main sidebar.
      if (window.innerWidth <= 768) {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
      } else {
        setIsSidebarCollapsed(!isSidebarCollapsed);
      }
    };

    // --- Notifications Logic ---
    useEffect(() => {
        // Only generate notifications if pantryItems data exists
        if (!pantryItems) return;

        const newNotificationsMap = new Map();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        pantryItems.forEach(item => {
            if (item.expiryDate) {
                const expiryDate = new Date(item.expiryDate);
                const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                if (daysLeft >= 0 && daysLeft <= 3) {
                    const notificationId = `expiry-${item.id}`;
                    newNotificationsMap.set(notificationId, {
                        id: notificationId,
                        type: 'expiry',
                        message: `Your ${item.name} expires in ${daysLeft} day(s)!`,
                        time: 'Just now',
                        read: false,
                        icon: <FaExclamationTriangle className="text-red-500" />
                    });
                }
            }
        });

        const tipId = 'tip-1';
        if (lastNotification !== 'tip-1') {
            newNotificationsMap.set(tipId, {
                id: tipId,
                type: 'tip',
                message: 'New AI recipe suggestion available for your pantry items.',
                time: '1h ago',
                read: false,
                icon: <FaCheckCircle className="text-green-500" />
            });
            setLastNotification('tip-1');
        }

        setNotifications(currentNotifications => {
            const updatedNotifications = [...currentNotifications];
            newNotificationsMap.forEach((newNotification, id) => {
                const existingIndex = updatedNotifications.findIndex(n => n.id === id);
                if (existingIndex !== -1) {
                    updatedNotifications[existingIndex] = { ...newNotification, read: updatedNotifications[existingIndex].read };
                } else {
                    updatedNotifications.push(newNotification);
                }
            });
            const allNotificationIds = new Set([...currentNotifications.map(n => n.id), ...newNotificationsMap.keys()]);
            return updatedNotifications.filter(n => allNotificationIds.has(n.id));
        });
    }, [pantryItems, lastNotification, setLastNotification]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleUserLogout = () => {
        logout();
        navigate('/');
    };

    const handleNotificationsClick = () => {
        const currentlyOpen = showNotifications;
        setShowNotifications(!currentlyOpen);
        if (!currentlyOpen && unreadCount > 0) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    };

    const handleProfileClick = () => navigate('/settings');

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (chatInput.trim() === '') return;

        const userMessage = { id: Date.now(), sender: 'user', text: chatInput };
        setChatMessages(prev => [...prev, userMessage]);
        const currentInput = chatInput;
        setChatInput('');
        setIsTyping(true);

        const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBY_vymFVwPIUDlVMT6WtAEynWYTukOv2Y';

        const prompt = `You are Ami, an AI chef assistant for a web application.
        Your primary goal is to perform actions based on a user's request. Your knowledge of recipes should include Nigerian foods.
        You can perform the following actions:
        - ADD_TO_GROCERY_LIST: triggered when a user wants to add an item to their grocery list. Parameters: {"itemName": "value"}.
        - ADD_TO_MEAL_PLAN: triggered when a user wants to add a meal to their meal plan. Parameters: {"mealName": "value", "date": "YYYY-MM-DD", "mealType": "Breakfast|Lunch|Dinner"}.

        If a user asks you to perform a premium feature (like adding to a meal plan or grocery list) but they are a free user, you must respond conversationally and encourage them to upgrade.

        If a specific action is requested, respond ONLY with a JSON object in the format:
        {"action": "ACTION_NAME", "parameters": {"param1": "value1", ...}}

        If no specific action is detected, or the request is general, provide a friendly, conversational response. Do not use Markdown formatting for your responses.

        The user's request is: "${currentInput}".`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        try {
            const payload = { contents: [{ parts: [{ text: prompt }] }] };
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error("AI response error.");

            const result = await response.json();
            const aiText = result.candidates[0].content.parts[0].text;

            try {
                const actionResponse = JSON.parse(aiText);
                if (actionResponse.action) {
                    let confirmationText = "I'm not sure how to do that.";

                    if (!isPremium) {
                        confirmationText = "I can do that for you, but adding items to your grocery list or meal plan is a premium feature. Would you like to upgrade to access it?";
                    } else if (actionResponse.action === 'ADD_TO_GROCERY_LIST') {
                        const { itemName } = actionResponse.parameters;
                        addItemToGroceryList({ name: itemName });
                        confirmationText = `Okay, I've added ${itemName} to your grocery list.`;
                    } else if (actionResponse.action === 'ADD_TO_MEAL_PLAN') {
                        const { mealName, date, mealType } = actionResponse.parameters;
                        const targetDate = date || new Date().toISOString().split('T')[0];
                        const meal = { id: `custom_${Date.now()}`, title: mealName, custom: true };
                        updateMealInPlan(targetDate, mealType, meal);
                        confirmationText = `Done! I've added ${mealName} for ${mealType} on ${targetDate}.`;
                    }
                    const aiResponse = { id: Date.now() + 1, sender: 'ai', text: confirmationText };
                    setChatMessages(prev => [...prev, aiResponse]);
                } else {
                    throw new Error("Not an action JSON.");
                }
            } catch (e) {
                const aiResponse = { id: Date.now() + 1, sender: 'ai', text: aiText };
                setChatMessages(prev => [...prev, aiResponse]);
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            const errorResponse = { id: Date.now() + 1, sender: 'ai', text: "Sorry, I'm having a little trouble connecting. Please try again in a moment." };
            setChatMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [chatMessages, isTyping]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notificationRef]);

    // Close mobile sidebar on navigation
    useEffect(() => {
      setIsMobileSidebarOpen(false);
    }, [location]);

    // If data is still loading, show a loading spinner or message
    if (!isLoaded) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="flex min-h-screen bg-background-light font-sans transition-all duration-300">
            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                bg-white shadow-xl p-6 flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300
                w-64
                md:w-[250px]
                lg:w-64
                ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                <div className="mb-8 text-center flex items-center justify-between">
                    <Link to="/" className="flex items-center justify-center">
                        <img src="/images/amichef-logo-header.svg" alt="AmiChef Icon" className={`h-10 w-auto transition-all duration-300 ${isSidebarCollapsed ? 'lg:mx-auto' : ''}`} />
                    </Link>
                    <button onClick={toggleSidebar} className="text-gray-600 text-2xl ml-auto lg:hidden">
                        {isMobileSidebarOpen ? <FaTimes /> : <FaBars />}
                    </button>
                    <button onClick={toggleSidebar} className={`hidden text-gray-600 text-2xl ml-auto lg:block`}>
                        {isSidebarCollapsed ? <FaBars /> : <FaArrowLeft />}
                    </button>
                </div>

                <nav className="flex-grow space-y-4">
                    <NavLink to={isPremium ? "/premium-dashboard" : "/dashboard"} icon={<FaUtensils />} label="Dashboard" isPremiumFeature={false} userIsPremium={isPremium} isCollapsed={isSidebarCollapsed} />
                    <NavLink to="/quick-find" icon={<FaSearch />} label="Quick Recipe Finder" isPremiumFeature={false} userIsPremium={isPremium} isCollapsed={isSidebarCollapsed} />
                    <NavLink to="/smart-pantry" icon={<FaClipboardList />} label="Smart Pantry" isPremiumFeature={true} userIsPremium={isPremium} isCollapsed={isSidebarCollapsed} />
                    <NavLink to="/meal-planner" icon={<FaCalendarAlt />} label="Meal Planner" isPremiumFeature={true} userIsPremium={isPremium} isCollapsed={isSidebarCollapsed} />
                    <NavLink to="/grocery-list" icon={<FaShoppingCart />} label="Grocery List" isPremiumFeature={true} userIsPremium={isPremium} isCollapsed={isSidebarCollapsed} />
                    <NavLink to="/nutrition" icon={<FaChartPie />} label="Nutrition" isPremiumFeature={true} userIsPremium={isPremium} isCollapsed={isSidebarCollapsed} />
                    <NavLink to="/cookbooks" icon={<FaBook />} label="Cookbooks" isPremiumFeature={true} userIsPremium={isPremium} isComingSoon={true} isCollapsed={isSidebarCollapsed} />
                    <NavLink to="/settings" icon={<FaCog />} label="Settings" isPremiumFeature={false} userIsPremium={isPremium} isCollapsed={isSidebarCollapsed} />
                </nav>
                {isLoggedIn && (
                    <div className="mt-auto pt-6 border-t">
                        <button onClick={handleUserLogout} className="w-full bg-gray-200 hover:bg-gray-300 text-text-dark font-semibold py-2 px-4 rounded-lg flex items-center justify-center">
                            <FaUserCircle className={`mr-2 transition-all duration-300 ${isSidebarCollapsed ? 'lg:mr-0' : ''}`} />
                            <span className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:opacity-0 lg:scale-x-0 lg:w-0' : 'lg:opacity-100 lg:scale-x-100 lg:w-auto'}`}>Sign Out</span>
                        </button>
                    </div>
                )}
            </aside>

            {/* Main content area */}
            <div className={`flex-grow transition-all duration-300 p-4 md:p-8
                ${isMobileSidebarOpen ? 'ml-0' : 'ml-0 lg:ml-64'}
                ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
            `}>
                <header className="bg-white rounded-lg shadow-md p-4 mb-8 flex justify-between items-center sticky top-0 z-30">
                    {/* Header for Mobile */}
                    <div className="flex items-center lg:hidden">
                        <button onClick={toggleSidebar} className="text-gray-600 text-2xl mr-4"><FaBars /></button>
                        <h2 className="text-xl font-semibold text-text-dark">Dashboard</h2>
                    </div>

                    {/* Header for Desktop */}
                    <h2 className="text-xl font-semibold text-text-dark hidden lg:block">Dashboard Overview</h2>
                    {isLoggedIn && (
                        <div className="flex items-center space-x-6">
                            <span className="font-semibold">{userName || 'Guest User'}</span>
                            <div className="relative" ref={notificationRef}>
                                <button onClick={handleNotificationsClick} className="relative text-gray-600 text-xl"><FaBell />{unreadCount > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>)}</button>
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
                                        <div className="p-3 border-b font-bold">Notifications</div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length > 0 ? notifications.map(n => (<div key={n.id} className={`p-3 flex items-start gap-3 border-b hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}><span className="mt-1">{n.icon}</span><div><p className="text-sm">{n.message}</p><p className="text-xs text-gray-500">Just now</p></div></div>)) : <p className="p-4 text-sm text-gray-500">No new notifications.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={handleProfileClick} className="w-10 h-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-accent">
                                {userAvatar ? (
                                    <img src={userAvatar} alt={`${userName}'s avatar`} className="w-full h-full object-cover" />
                                ) : (
                                    <FaUserCircle className="w-full h-full text-gray-600" />
                                )}
                            </button>
                        </div>
                    )}
                </header>
                <div className="p-4">{children}</div>
            </div>

            {/* Chat Widget */}
            <div ref={chatRef} className={`fixed z-50 transition-all duration-300
                right-4 md:right-6 bottom-4 md:bottom-6
                ${isChatOpen ? 'w-full h-full sm:w-96 sm:h-[32rem]' : 'w-16 h-16'}
            `}>
                {isChatOpen && (
                    <div className="w-full h-full bg-white rounded-lg shadow-2xl flex flex-col sm:w-96 sm:h-[32rem]">
                        <header className="bg-primary-accent text-white p-3 flex justify-between items-center rounded-t-lg"><h3 className="font-bold">AmiChef Assistant</h3><button onClick={() => setIsChatOpen(false)}><FaTimes /></button></header>
                        <div ref={chatBodyRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                            {chatMessages.map(msg => (<div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-xs rounded-lg px-3 py-2 ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>{msg.text}</div></div>))}
                            {isTyping && (<div className="flex justify-start"><div className="bg-gray-200 rounded-lg px-3 py-2 flex items-center"><span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></span><span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span></div></div>)}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-3 border-t flex items-center"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask Ami anything..." className="flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-accent" /><button type="submit" className="ml-3 bg-primary-accent text-white p-3 rounded-full hover:opacity-90 disabled:opacity-50" disabled={!chatInput.trim()}><FaPaperPlane /></button></form>
                    </div>
                )}
                {!isChatOpen && (<button onClick={() => setIsChatOpen(true)} className="bg-primary-accent text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-opacity-90 transition-transform hover:scale-110"><ChefBotIcon /></button>)}
            </div>
        </div>
    );
}

const NavLink = ({ to, icon, label, isPremiumFeature, userIsPremium, isComingSoon = false, isCollapsed }) => {
    const showLock = isPremiumFeature && !userIsPremium;
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = location.pathname === to;

    const handleClick = (e) => {
        if (showLock) {
            e.preventDefault();
            toast.error(`"${label}" is a Premium Feature! Please upgrade to access.`);
        }
        if (isComingSoon) {
            e.preventDefault();
            toast.success(`"${label}" is coming soon!`);
        }
    };

    const linkClasses = `flex items-center p-3 rounded-lg transition-colors duration-200 font-semibold ${
        showLock ? 'text-gray-400 cursor-not-allowed' :
        isActive ? 'bg-primary-accent text-white' :
        'text-gray-700 hover:bg-primary-accent hover:text-white'
    }`;

    return (
        <Link to={to} onClick={handleClick} className={linkClasses}>
            {icon && <span className={`mr-3 text-xl transition-all duration-300 ${isCollapsed ? 'lg:mr-0' : ''}`}>{icon}</span>}
            <span className={`transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:scale-x-0 lg:w-0' : 'lg:opacity-100 lg:scale-x-100 lg:w-auto'}`}>
                {label}
            </span>
            {showLock && !isCollapsed && <FaLock className="ml-auto text-sm" />}
            {isComingSoon && !showLock && !isCollapsed && <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Soon</span>}
        </Link>
    );
};

export default DashboardLayout;