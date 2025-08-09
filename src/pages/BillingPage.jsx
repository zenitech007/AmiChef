// File: /src/pages/BillingPage.jsx
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { FaCreditCard, FaCheckCircle, FaStar } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// --- Stripe Pricing Table Component ---
const StripePricingTable = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/pricing-table.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return React.createElement('stripe-pricing-table', {
        'pricing-table-id': 'prctbl_1Rr5xIF8edeg2xjvkoeMYiUT',
        'publishable-key': 'pk_live_51RooM7F8edeg2xjvsX1ElmYLxm3mG89DN97qJvH3v76cCkRgiBHPq6KQKms2FNgfDE9qpSYYWhLg00FtH7tCILdq00ItUHQfzs',
    });
};


// --- Main Page Component ---
function BillingPage() {
    const navigate = useNavigate();
    const { isPremium } = useContext(UserContext);

    useEffect(() => {
        if (isPremium) {
            toast.success("You are already a Premium member!");
            navigate('/dashboard');
        }
    }, [isPremium, navigate]);

    return (
        <DashboardLayout>
            <div className="bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
                <div className="max-w-5xl mx-auto space-y-12 py-12 px-4">
                    <div className="text-center">
                        <h2 className="text-5xl font-serif font-bold text-primary-accent mb-4 flex items-center justify-center">
                            <FaStar className="mr-4 text-5xl text-yellow-400" /> Upgrade to Premium
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Join our community of smart cooks and unlock exclusive AI-powered features to revolutionize your kitchen.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h3 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">What You'll Unlock:</h3>
                                <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-center text-lg"><FaCheckCircle className="text-secondary-green mr-4 text-xl" /> AI-Powered Meal Planning</li>
                                    <li className="flex items-center text-lg"><FaCheckCircle className="text-secondary-green mr-4 text-xl" /> Smart Pantry with AI Scanning</li>
                                    <li className="flex items-center text-lg"><FaCheckCircle className="text-secondary-green mr-4 text-xl" /> Advanced Nutritional Analysis</li>
                                    <li className="flex items-center text-lg"><FaCheckCircle className="text-secondary-green mr-4 text-xl" /> Multi-API Recipe Discovery</li>
                                    <li className="flex items-center text-lg"><FaCheckCircle className="text-secondary-green mr-4 text-xl" /> Interactive AI Chat Assistant</li>
                                    <li className="flex items-center text-lg"><FaCheckCircle className="text-secondary-green mr-4 text-xl" /> Export & Share Options</li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border dark:border-gray-700 shadow-inner">
                                <h3 className="text-2xl font-bold text-center mb-4 text-gray-800 dark:text-white">Choose Your Plan</h3>
                                
                                <div className="rounded-lg overflow-hidden shadow-lg">
                                    <StripePricingTable />
                                </div>

                                <div className="text-center my-6">
                                    <span className="text-sm text-gray-400 dark:text-gray-500 font-semibold">OR</span>
                                </div>

                                {/* ✅ UPDATED: Paystack button now uses text instead of a logo */}
                                <button 
                                    onClick={() => toast.success('Paystack is coming soon!')} 
                                    disabled={true}
                                    className="w-full bg-gray-800 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-3 cursor-not-allowed transition-transform hover:scale-105"
                                >
                                    Pay with Paystack <span className="ml-2 text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded-full">Soon</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default BillingPage;
