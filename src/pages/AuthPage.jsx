// File: /src/pages/AuthPage.jsx

import React, { useState, useContext, useEffect } from 'react'; // Added useEffect
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { UserContext } from '../App.jsx';
import { FaEnvelope, FaLock, FaUser, FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

import { auth } from '../firebase';

import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile 
} from "firebase/auth";

import amichefLogo from '../assets/amichef-logo-header.svg';

function AuthPage() { // Removed onSuccessfulAuth prop
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { setUserSession, isLoggedIn } = useContext(UserContext); // Get setUserSession and isLoggedIn
    const navigate = useNavigate(); // Initialize useNavigate

    // Effect to redirect if user is already logged in
    useEffect(() => {
        if (isLoggedIn) {
            navigate('/dashboard', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        if (!email || !password) {
            setError("Email and password are required.");
            setLoading(false);
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }
        
        try {
            let userCredential;
            if (isLogin) {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
                toast.success("Welcome back!");
            } else {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const finalDisplayName = displayName.trim() || email.split('@')[0];
                await updateProfile(userCredential.user, { displayName: finalDisplayName });
                toast.success("Account created successfully!");
            }
            
            // Use setUserSession and navigate directly
            const user = userCredential.user;
            setUserSession(user.displayName, user.email, false, user.photoURL); // Assuming isPremium is false by default
            navigate('/dashboard'); // Navigate to dashboard after successful auth

        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists.');
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Incorrect email or password. Please try again.');
            } else {
                setError("An error occurred. Please try again.");
            }
            console.error("Firebase Auth Error:", err.code, err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, provider);
            toast.success("Signed in with Google!");
            
            // Use setUserSession and navigate directly
            const user = result.user;
            setUserSession(user.displayName, user.email, false, user.photoURL); // Assuming isPremium is false by default
            navigate('/dashboard'); // Navigate to dashboard after successful auth

        } catch (err) {
            setError("Could not sign in with Google. Please try again.");
            console.error("Google Sign-In Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // If already logged in, return null to prevent rendering the auth form
    if (isLoggedIn) {
        return null; 
    }

    return (
        <div className="min-h-screen font-sans flex items-center justify-center relative bg-gray-100">
            <div
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=2940&auto=format&fit=crop')" }}
            />
            <div className="absolute inset-0 bg-black/40 z-0" />

            <div className="relative z-10 w-full max-w-4xl flex rounded-xl shadow-2xl overflow-hidden my-8">
                <div className="hidden md:block w-1/2 bg-cover bg-center p-12 text-white" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1887')" }}>
                    <h1 className="text-4xl font-serif font-bold mb-4">Welcome to AmiChef</h1>
                    <p className="text-lg opacity-90">Unlock a world of culinary possibilities. Let's get cooking!</p>
                </div>

                <div className="w-full md:w-1/2 bg-white p-8 sm:p-12">
                    <div className="text-center mb-6">
                        <Link to="/">
                            <img src={amichefLogo} alt="AmiChef Logo" className="h-16 w-auto mx-auto" />
                        </Link>
                        <h2 className="text-3xl font-serif font-bold text-primary-accent mt-4">
                            {isLogin ? 'Welcome Back!' : 'Create Your Account'}
                        </h2>
                        <p className="text-text-dark mt-2">
                            {isLogin ? 'Log in to continue your culinary journey.' : 'Sign up to start cooking smarter.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="relative">
                                <FaUser className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                                <input type="text" id="displayName" placeholder="Your Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required={!isLogin} disabled={loading} className="w-full pl-12 pr-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-accent" />
                            </div>
                        )}
                        <div className="relative">
                            <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                            <input type="email" id="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="w-full pl-12 pr-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-accent" />
                        </div>
                        
                        <div className="relative">
                            <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                            <input 
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="w-full pl-12 pr-12 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-accent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        
                        {!isLogin && (
                            <div className="relative">
                                <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full pl-12 pr-12 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-accent"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <button type="submit" disabled={loading} className="w-full bg-primary-accent hover:opacity-90 text-white font-bold py-3 px-4 rounded-full text-lg shadow-md">
                            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="text-center my-4">
                        <span className="text-xs text-gray-400">OR</span>
                    </div>

                    <div className="space-y-3">
                        <button onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-2 border rounded-full py-3 hover:bg-gray-100"><FaGoogle /> Continue with Google</button>
                    </div>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-secondary-green hover:underline font-semibold">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;
