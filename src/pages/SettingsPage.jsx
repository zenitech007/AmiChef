// File: /src/pages/SettingsPage.jsx
import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import {
    FaCog, FaUserCircle, FaBell, FaLock, FaKey, FaCreditCard,
    FaShieldAlt, FaQuestionCircle, FaRobot, FaTrash, FaDownload, FaLink,
    FaCheckCircle, FaChevronDown, FaExternalLinkAlt, FaGoogle, FaAmazon, FaApple, FaTimes
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// --- Reusable Helper Components ---

const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
        type="button"
        onClick={() => !disabled && onChange()}
        disabled={disabled}
        className={`${enabled ? 'bg-secondary-green' : 'bg-gray-300'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
    </button>
);

const SettingsCard = ({ icon, title, description, isOpen, onToggle, isPremiumFeature = false, isPremium = false, children }) => {
    const navigate = useNavigate();
    const isLocked = isPremiumFeature && !isPremium;
    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden relative dark:bg-gray-800 dark:border-gray-700">
            {isLocked && (
                <div className="absolute inset-0 bg-gray-200 bg-opacity-60 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center">
                    <FaLock className="text-gray-500 text-3xl mb-2" />
                    <p className="font-semibold text-gray-700">This is a Premium Feature</p>
                    <button onClick={() => navigate('/billing')} className="mt-2 bg-primary-accent text-white font-bold py-1 px-4 rounded-full text-sm">Upgrade to Unlock</button>
                </div>
            )}
            <div className="p-4 cursor-pointer flex justify-between items-center" onClick={onToggle}>
                <div className="flex items-center">
                    <div className="text-secondary-green text-xl mr-3">{icon}</div>
                    <div>
                        <h3 className="text-lg font-bold text-text-dark dark:text-gray-200">{title}</h3>
                        {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
                    </div>
                </div>
                <FaChevronDown className={`text-gray-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Confirmation Modal for Deletion ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    const [password, setPassword] = useState('');
    if (!isOpen) return null;

    const handleConfirm = () => {
        if (password) {
            onConfirm();
        } else {
            toast.error("Please enter your password to confirm.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                <h3 className="text-xl font-bold text-red-600 mb-2">Confirm Account Deletion</h3>
                <p className="text-gray-600 mb-4">This action is permanent. To confirm, please enter your password.</p>
                <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full p-2 border rounded-md mb-4"
                />
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Cancel</button>
                    <button onClick={handleConfirm} disabled={!password} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed">Delete Account</button>
                </div>
            </div>
        </div>
    );
};


// --- Main Settings Page Component ---
function SettingsPage() {
    const navigate = useNavigate();
    const { 
        isLoggedIn, isPremium, logout, userName, updateUserName,
        userSettings, updateUserSettings, userAvatar, updateUserAvatar, 
        userEmail // FIX: Accessing userEmail from UserContext
    } = useContext(UserContext);

    const [openSections, setOpenSections] = useState({ account: true, notifications: true, prefs: false, privacy: false, integrations: false, support: false });
    const [saveStatus, setSaveStatus] = useState('idle');
    const [feedback, setFeedback] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [localUserName, setLocalUserName] = useState(userName);
    const fileInputRef = useRef(null);
    const [localSettings, setLocalSettings] = useState(userSettings);

    // FIX: Apply dark mode on initial load
    useEffect(() => {
        if (userSettings?.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [userSettings?.darkMode]);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/auth', { state: { from: '/settings' } });
        }
        setLocalUserName(userName);
        if (userSettings) {
            setLocalSettings(userSettings);
        }
    }, [isLoggedIn, navigate, userName, userSettings]);

    const handleToggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // FIX: Updates local state which is then saved
    const handleSettingChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        // FIX: For dark mode, apply the change immediately
        if (key === 'darkMode') {
            if (value) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };
    
    // FIX: All changes are saved at once
    const handleSaveSettings = () => {
        setSaveStatus('saving');
        updateUserName(localUserName);
        updateUserSettings(localSettings);
        
        // No need to set darkMode here, it's already handled in handleSettingChange
        
        setTimeout(() => {
            setSaveStatus('saved');
            toast.success("All changes have been saved!");
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 1000);
    };

    const handleDeleteAccount = () => {
        toast.success("Account deleted successfully.");
        logout();
        navigate('/');
    };
    
    const handlePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateUserAvatar(reader.result);
                toast.success("Profile picture updated!");
            };
            reader.readAsDataURL(file);
        }
    };
    
    if (!isLoggedIn || !userSettings) {
        return <div className="flex justify-center items-center h-screen"><p>Loading Settings...</p></div>;
    }

    return (
        <DashboardLayout>
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteAccount} />
            <div className="max-w-4xl mx-auto space-y-8 pb-16">
                <div className="text-center">
                    <h2 className="text-4xl font-serif font-bold text-primary-accent mb-2 flex items-center justify-center dark:text-white"><FaCog className="mr-3 text-3xl" /> Settings</h2>
                    <p className="text-gray-600 dark:text-gray-400">Customize your app experience and manage your account.</p>
                </div>

                <div className="space-y-4">
                    <SettingsCard title="Account Settings" icon={<FaUserCircle />} isOpen={openSections.account} onToggle={() => handleToggleSection('account')}>
                        <div className="space-y-4 text-text-dark dark:text-gray-300">
                            <div className="flex items-center gap-4">
                                {/* FIX: Default profile picture logic */}
                                <img src={userAvatar || '/images/amichef-logo-header.svg'} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                                <input type="file" ref={fileInputRef} onChange={handlePictureChange} accept="image/*" className="hidden" />
                                <button onClick={() => fileInputRef.current.click()} className="text-sm font-semibold text-secondary-green hover:underline">Change Picture</button>
                            </div>
                            <div>
                                <label className="font-semibold">Name:</label>
                                <input type="text" value={localUserName} onChange={(e) => setLocalUserName(e.target.value)} className="w-full p-2 border rounded-md mt-1 dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            {/* FIX: Display user's real email from context */}
                            <div><label className="font-semibold">Email:</label><input type="email" value={userEmail} disabled className="w-full p-2 border rounded-md mt-1 bg-gray-100 cursor-not-allowed dark:bg-gray-900 dark:border-gray-700" /></div>
                            <div><label className="font-semibold">Password:</label><button onClick={() => toast.success('Password change screen coming soon!')} className="text-secondary-green hover:underline flex items-center mt-1"><FaKey className="mr-1" /> Change Password</button></div>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Subscription & Billing" icon={<FaCreditCard />} isOpen={openSections.billing} onToggle={() => handleToggleSection('billing')}>
                        <div className="space-y-4 text-text-dark dark:text-gray-300">
                               <p><strong>Current Plan:</strong> <span className={isPremium ? "text-secondary-green font-bold" : "font-bold"}>{isPremium ? 'Premium' : 'Free'}</span></p>
                               {isPremium ? (
                                   <>
                                       <p><strong>Next Billing Date:</strong> August 27, 2025</p>
                                       <button onClick={() => navigate('/billing')} className="text-sm text-secondary-green hover:underline">Manage Billing</button>
                                   </>
                               ) : (
                                   <div className="p-4 rounded-lg bg-primary-accent/10 text-center">
                                       <p className="font-semibold text-gray-800 dark:text-gray-200">Upgrade to unlock advanced features!</p>
                                       <button onClick={() => navigate('/billing')} className="mt-2 bg-primary-accent text-white font-bold py-2 px-4 rounded-full text-sm">Upgrade Now</button>
                                   </div>
                               )}
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Notifications" icon={<FaBell />} isOpen={openSections.notifications} onToggle={() => handleToggleSection('notifications')}>
                        <div className="space-y-4 text-text-dark dark:text-gray-300">
                            <div className="flex justify-between items-center"><p>Push Notifications (Expiry alerts, deals)</p><ToggleSwitch enabled={localSettings?.pushEnabled} onChange={() => handleSettingChange('pushEnabled', !localSettings.pushEnabled)} /></div>
                            <div className="flex justify-between items-center"><p>Email Reminders</p><ToggleSwitch enabled={localSettings?.emailEnabled} onChange={() => handleSettingChange('emailEnabled', !localSettings.emailEnabled)} /></div>
                            <div className="flex justify-between items-center"><p>Weekly Meal Suggestions</p><ToggleSwitch enabled={localSettings?.suggestionsEnabled} onChange={() => handleSettingChange('suggestionsEnabled', !localSettings.suggestionsEnabled)} /></div>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="AI & App Preferences" icon={<FaRobot />} isOpen={openSections.prefs} onToggle={() => handleToggleSection('prefs')} isPremiumFeature={true} isPremium={isPremium}>
                        <div className="space-y-4 text-text-dark dark:text-gray-300">
                            <div><label className="font-semibold">Dietary Preferences:</label><select value={localSettings?.dietaryPrefs} onChange={(e) => handleSettingChange('dietaryPrefs', e.target.value)} className="w-full p-2 border rounded-md mt-1 dark:bg-gray-700 dark:border-gray-600"><option value="none">None</option><option value="vegan">Vegan</option><option value="keto">Keto</option><option value="low-carb">Low-carb</option></select></div>
                            <div><label className="font-semibold">Recipe Complexity: <span className="text-primary-accent">{['Easy', 'Medium', 'Gourmet'][localSettings?.recipeComplexity - 1]}</span></label><input type="range" min="1" max="3" value={localSettings?.recipeComplexity} onChange={(e) => handleSettingChange('recipeComplexity', parseInt(e.target.value))} className="w-full mt-1 accent-primary-accent" /></div>
                            <div className="flex justify-between items-center"><p>Use only pantry items first (in Recipe Finder)</p><ToggleSwitch enabled={localSettings?.usePantryFirst} onChange={() => handleSettingChange('usePantryFirst', !localSettings.usePantryFirst)} /></div>
                            {/* FIX: Dark mode toggle */}
                            <div className="flex justify-between items-center"><p>Dark Mode</p><ToggleSwitch enabled={localSettings?.darkMode} onChange={() => handleSettingChange('darkMode', !localSettings.darkMode)} /></div>
                        </div>
                    </SettingsCard>
                    
                    <SettingsCard title="Integrations" description="Connect to external services" icon={<FaLink />} isOpen={openSections.integrations} onToggle={() => handleToggleSection('integrations')} isPremiumFeature={true} isPremium={isPremium}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-700"><p className="font-semibold flex items-center dark:text-gray-200"><FaAmazon className="mr-2 text-orange-500"/> Alexa</p><button onClick={() => toast.success('Coming soon!')} className="bg-gray-200 text-gray-700 py-1 px-3 text-sm rounded-full font-semibold dark:bg-gray-600 dark:text-gray-300">Coming Soon</button></div>
                            <div className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-700"><p className="font-semibold flex items-center dark:text-gray-200"><FaGoogle className="mr-2 text-blue-500"/> Google Assistant</p><button onClick={() => toast.success('Coming soon!')} className="bg-gray-200 text-gray-700 py-1 px-3 text-sm rounded-full font-semibold dark:bg-gray-600 dark:text-gray-300">Coming Soon</button></div>
                            <div className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-700"><p className="font-semibold flex items-center dark:text-gray-200"><FaApple className="mr-2 text-black dark:text-white"/> Apple Home</p><button onClick={() => toast.success('Coming soon!')} className="bg-gray-200 text-gray-700 py-1 px-3 text-sm rounded-full font-semibold dark:bg-gray-600 dark:text-gray-300">Coming Soon</button></div>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Support & Feedback" icon={<FaQuestionCircle />} isOpen={openSections.support} onToggle={() => handleToggleSection('support')}>
                        <div className="space-y-4">
                               <div className="flex items-center gap-6"><a href="#" className="text-secondary-green hover:underline flex items-center"><FaExternalLinkAlt className="mr-1"/> FAQ</a><a href="#" className="text-secondary-green hover:underline flex items-center"><FaExternalLinkAlt className="mr-1"/> Contact Support</a></div>
                               <div><label className="font-semibold dark:text-gray-200">Have a suggestion?</label><textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tell us how we can improve..." className="w-full p-2 border rounded-md mt-1 h-24 dark:bg-gray-700 dark:border-gray-600"></textarea><button onClick={() => {toast.success('Feedback submitted!'); setFeedback('');}} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-full text-sm mt-2">Submit Feedback</button></div>
                               <p className="text-xs text-gray-400 text-center pt-4 border-t dark:border-gray-700">App Version: 1.0.0 (2025.07.30)</p>
                        </div>
                    </SettingsCard>
                </div>

                <div className="border-2 border-red-500 rounded-lg p-6 bg-red-50 dark:bg-red-900/20 dark:border-red-500/50">
                    <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Danger Zone</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 mb-4">This action is permanent and cannot be undone.</p>
                    {/* FIX: Made the Delete Button smaller */}
                    <button onClick={() => setIsDeleteModalOpen(true)} className="bg-red-600 text-white font-bold py-1.5 px-4 rounded-full text-sm hover:bg-red-700">
                        <FaTrash className="inline mr-2"/> Delete My Account
                    </button>
                </div>

                <div className="text-center mt-8">
                    <button onClick={handleSaveSettings} disabled={saveStatus !== 'idle'} className="bg-primary-accent text-white font-bold py-3 px-8 rounded-full text-lg shadow-md hover:opacity-90 transition-all w-52 disabled:opacity-50">
                        {saveStatus === 'idle' && 'Save All Changes'}
                        {saveStatus === 'saving' && 'Saving...'}
                        {saveStatus === 'saved' && <span className="flex items-center justify-center"><FaCheckCircle className="mr-2"/> Saved!</span>}
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default SettingsPage;