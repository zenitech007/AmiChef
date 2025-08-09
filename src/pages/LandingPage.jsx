// ✅ ENHANCED LANDING PAGE WITH RESPONSIVE VIDEO & UI POLISH
// File: /src/pages/LandingPage.jsx

import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTiktok, FaRobot, FaUtensils, FaShoppingCart, FaPlusCircle, FaStar } from 'react-icons/fa';

import step1Pantry from '../assets/step1-pantry.svg';
import step2Recipes from '../assets/step2-recipes.svg';
import step3Cook from '../assets/step3-cook.svg';
import appStoreBadge from '../assets/app-store-badge.svg';
import googlePlayBadge from '../assets/google-play-badge.svg';
import amichefLogo from '../assets/amichef-logo-header.svg';

// ✅ Header
const LandingHeader = () => {
    const navigate = useNavigate();
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-3">
                <img src={amichefLogo} alt="AmiChef Logo" className="h-10 w-auto" />
                <nav className="hidden md:flex items-center space-x-6">
                    <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-primary-accent font-semibold">Features</button>
                    <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-primary-accent font-semibold">How It Works</button>
                    <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-primary-accent font-semibold">Pricing</button>
                    <button onClick={() => navigate('/auth')} className="text-gray-600 hover:text-primary-accent font-semibold">Login</button>
                    <button onClick={() => navigate('/auth')} className="bg-primary-accent text-white px-4 py-2 rounded-full font-semibold hover:opacity-90">Sign Up</button>
                </nav>
            </div>
        </header>
    );
};

const FeatureCard = ({ icon, title, description, premium }) => (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100 transform hover:scale-105 transition-transform duration-300 text-center">
        <div className="text-primary-accent text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-2 text-sm">{description}</p>
        {premium && <span className="inline-block text-xs bg-secondary-green text-white px-2 py-1 rounded-full mt-2">Premium</span>}
    </div>
);

const PricingCard = ({ title, price, features, cta, highlight, onCtaClick }) => (
    <div className={`p-6 rounded-xl shadow-xl flex flex-col justify-between h-full transition-transform duration-300 ${highlight ? 'bg-secondary-green border-2 border-primary-accent text-white scale-105' : 'bg-white/90 backdrop-blur-sm text-text-dark'}`}>
        <div>
            <h3 className="text-xl font-bold mb-2 text-center">{title}</h3>
            <p className={`text-3xl font-bold mb-4 text-center ${highlight ? 'text-white' : 'text-primary-accent'}`}>{price}</p>
            <ul className={`space-y-2 mb-6 text-sm ${highlight ? 'text-gray-100' : 'text-gray-700'}`}>
                {features.map((f, i) => <li key={i} className="flex items-center"><FaStar className="text-primary-accent mr-2" /> {f}</li>)}
            </ul>
        </div>
        <button onClick={onCtaClick} className={`w-full mt-4 px-4 py-3 rounded-xl text-lg font-semibold shadow-md ${highlight ? 'bg-primary-accent text-white hover:opacity-90' : 'bg-gray-200 text-text-dark hover:bg-gray-300'}`}>
            {cta}
        </button>
    </div>
);

// ✅ MAIN COMPONENT
export default function LandingPage() {
    const navigate = useNavigate();
    const [ingredients, setIngredients] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const API_KEY = '86285605e22449ba9fae9dcc14530542';

    const handleSearchClick = async () => {
        if (!ingredients.trim()) return setSearchError('Please enter at least one ingredient.');
        setSearchLoading(true); setSearchError(null); setRecipes([]);
        try {
            const res = await fetch(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=6&ignorePantry=true&ranking=1&apiKey=${API_KEY}`);
            if (!res.ok) throw new Error();
            const data = await res.json(); setRecipes(data);
        } catch { setSearchError("Failed to fetch recipes."); }
        finally { setSearchLoading(false); }
    };

    return (
        <div className="font-sans text-text-dark">
            <LandingHeader />

            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

                {/* ✅ HERO */}
                <section className="py-16 sm:py-20 text-center">
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-primary-accent mb-4">Reduce Food Waste. Cook Smarter.</h1>
                    <p className="text-lg sm:text-2xl mb-6 max-w-2xl mx-auto">AmiChef helps you use what you have, plan meals effortlessly, and shop intelligently with AI.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => navigate('/auth')} className="bg-primary-accent text-white px-8 py-3 rounded-full text-lg font-semibold hover:opacity-90 shadow-lg">Get Started Free</button>
                        <button onClick={() => document.getElementById('video-demo').scrollIntoView({ behavior: 'smooth' })} className="bg-white text-primary-accent px-8 py-3 rounded-full border-2 border-primary-accent hover:bg-orange-50">Watch Demo</button>
                    </div>
                </section>

                {/* ✅ NEW DEMO VIDEO SECTION */}
                <section id="video-demo" className="py-10 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">See AmiChef in Action</h2>
                    <video className="mx-auto rounded-2xl shadow-lg max-w-[320px] sm:max-w-md md:max-w-lg lg:max-w-2xl" controls playsInline>
                        <source src="/images/amichef-app-demo.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </section>

                {/* ✅ SEARCH SECTION (unchanged) */}
                <section className="py-16 text-center" id="demo">
                    <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-2xl mx-auto border border-gray-100">
                        <h2 className="text-3xl font-serif font-bold mb-4">What's in your pantry?</h2>
                        <input type="text" className="shadow-inner border rounded-full w-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-primary-accent text-lg" placeholder="e.g., chicken, rice, tomatoes" value={ingredients} onChange={(e) => setIngredients(e.target.value)} disabled={searchLoading} />
                        <button onClick={handleSearchClick} className="w-full mt-4 bg-primary-accent hover:opacity-90 text-white font-bold py-3 px-4 rounded-full text-lg shadow-md" disabled={searchLoading}>{searchLoading ? 'Searching...' : 'Find Recipes Now'}</button>
                    </div>
                    {searchError && <p className="text-red-500 mt-4">{searchError}</p>}
                    {recipes.length > 0 && (
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recipes.map((r) => (
                                <div key={r.id} className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-md text-center transform hover:scale-105" onClick={() => navigate('/auth', { state: { fromRecipe: r.id } })}>
                                    <img src={r.image} alt={r.title} className="w-full h-40 object-cover rounded-md mb-3" />
                                    <h4 className="font-semibold">{r.title}</h4>
                                    <p className="text-sm text-gray-500">Missing: {r.missedIngredientCount}</p>
                                    <span className="mt-2 text-primary-accent font-medium text-sm">Sign Up to View Recipe</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ✅ FEATURES SECTION */}
                <section id="features" className="py-16">
                    <h2 className="text-3xl font-serif font-bold text-center mb-12 text-secondary-green">Everything You Need to Master Your Kitchen</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard icon={<FaRobot />} title="AI Recipe Finder" description="Get instant recipes based on ingredients you already have." />
                        <FeatureCard icon={<FaUtensils />} title="Smart Meal Planner" description="Plan your week with AI suggestions tailored to your taste." premium />
                        <FeatureCard icon={<FaShoppingCart />} title="Intelligent Grocery List" description="Auto-generate shopping lists and never forget an item." premium />
                        <FeatureCard icon={<FaPlusCircle />} title="Pantry Management" description="Track inventory, get expiry alerts, and reduce food waste." premium />
                    </div>
                </section>

                {/* ✅ HOW IT WORKS */}
                <section id="how-it-works" className="py-16 text-center">
                    <h2 className="text-3xl font-serif font-bold mb-12">Get Started in 3 Simple Steps</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        <div><img src={step1Pantry} className="h-32 mx-auto mb-4" alt="" /><h3 className="text-xl font-semibold">1. Add Ingredients</h3><p>Scan, type, or snap a photo of what's in your pantry.</p></div>
                        <div className="hidden md:block text-5xl text-gray-300 pt-12">→</div>
                        <div><img src={step2Recipes} className="h-32 mx-auto mb-4" alt="" /><h3 className="text-xl font-semibold">2. Get AI Suggestions</h3><p>AmiChef instantly finds recipes you can make right now.</p></div>
                        <div className="hidden md:block text-5xl text-gray-300 pt-12">→</div>
                        <div><img src={step3Cook} className="h-32 mx-auto mb-4" alt="" /><h3 className="text-xl font-semibold">3. Cook & Enjoy</h3><p>Save money, reduce waste, and enjoy delicious meals.</p></div>
                    </div>
                </section>

                {/* ✅ PRICING */}
                <section id="pricing" className="py-16">
                    <h2 className="text-3xl font-serif font-bold text-center mb-12">Choose Your Plan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <PricingCard onCtaClick={() => navigate('/auth')} title="Free" price="$0" features={["Unlimited ingredient search", "Basic recipe access", "Manual pantry entry"]} cta="Start for Free" />
                        <PricingCard onCtaClick={() => navigate('/auth')} title="Premium" price="$3/mo" features={["Everything in Free, plus:", "AI Meal Planning", "Pantry Scanner", "Grocery Deals", "Voice Cook Mode"]} cta="Start Free Trial" highlight />
                        <PricingCard onCtaClick={() => navigate('/auth')} title="Annual" price="$29/yr" features={["Save 25%!", "Everything in Premium"]} cta="Go Annual" />
                    </div>
                </section>

                {/* ✅ FINAL CTA */}
                <section className="text-center py-16">
                    <h2 className="text-3xl font-serif font-bold mb-4">Ready to Cook Smarter?</h2>
                    <p className="mb-8 text-lg">Join thousands saving time, money, and food with AmiChef.</p>
                    <button onClick={() => navigate('/auth')} className="bg-primary-accent text-white px-10 py-4 rounded-full text-xl font-bold hover:opacity-90 shadow-lg">Sign Up Free</button>
                </section>

                {/* ✅ FOOTER */}
                <footer className="text-center text-sm text-gray-500 py-8 border-t">
                    <p>&copy; {new Date().getFullYear()} AmiChef. All rights reserved.</p>
                    <div className="mt-2"><a href="#" className="hover:underline mx-2">Privacy Policy</a> | <a href="#" className="hover:underline mx-2">Terms of Service</a></div>
                    <div className="flex justify-center space-x-4 mt-4 text-2xl"><a href="#" className="hover:text-primary-accent"><FaFacebook /></a><a href="#" className="hover:text-primary-accent"><FaInstagram /></a><a href="#" className="hover:text-primary-accent"><FaTiktok /></a></div>
                    <div className="flex justify-center space-x-4 mt-4">
                        <a href="#"><img src={appStoreBadge} alt="Download on the App Store" className="h-10" /></a>
                        <a href="#"><img src={googlePlayBadge} alt="Get it on Google Play" className="h-10" /></a>
                    </div>
                </footer>
            </main>
        </div>
    );
}
