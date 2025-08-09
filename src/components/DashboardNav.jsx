// File: /src/components/DashboardNav.jsx
import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaBell, FaUserCircle, FaTachometerAlt, FaWarehouse } from 'react-icons/fa'; // Icons for navigation
import { UserContext } from '../App.jsx'; // Import UserContext

function DashboardNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isPremium, upgradeToPremium } = useContext(UserContext); // Access user context

  const isActive = (path) => location.pathname === path;

  const handleUpgradeClick = () => {
    if (isLoggedIn && !isPremium) {
        alert("This button will take you to a payment page to upgrade!");
        // In a real app, navigate to your dedicated payment/upgrade page
        // navigate('/upgrade-plan'); // Placeholder for future upgrade route
    } else if (!isLoggedIn) {
        navigate('/auth', { state: { fromUpgrade: true } }); // Redirect to auth if not logged in
    }
    // If already premium, button might not be visible or say "Manage Plan"
  };

  return (
    <nav className="w-full bg-white shadow-sm py-4 px-6 rounded-t-lg"> {/* Slightly lighter shadow for internal nav */}
      <div className="max-w-full mx-auto flex justify-between items-center">
        {/* Left Section - Nav Links */}
        <div className="flex items-center space-x-6">
          {/* AmiChef Logo - for branding within dashboard */}
          <Link to="/dashboard" className="flex items-center text-primary-accent text-xl font-bold font-serif hover:opacity-90 transition-opacity">
            <img
                src="/images/amichef-logo-header.svg" // Small logo here for branding
                alt="AmiChef Logo"
                className="h-8 w-auto mr-2"
            />
            AmiChef
          </Link>
          <Link
            to="/dashboard"
            className={`py-2 px-3 rounded-full text-text-dark font-semibold transition-colors duration-200 ${isActive('/dashboard') ? 'bg-primary-accent/10 text-primary-accent' : 'hover:bg-gray-100'}`}
          >
            <FaTachometerAlt className="inline-block mr-2" /> Dashboard
          </Link>
          {/* 'Smart Pantry' is a Premium feature if you wish to gate it */}
          <Link
            to="/smart-pantry" // Placeholder for Smart Pantry page
            className={`py-2 px-3 rounded-full text-text-dark font-semibold transition-colors duration-200 ${isActive('/smart-pantry') ? 'bg-primary-accent/10 text-primary-accent' : 'hover:bg-gray-100'} ${!isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={(e) => !isPremium && e.preventDefault() && alert('Smart Pantry is a Premium feature!')}
          >
            <FaWarehouse className="inline-block mr-2" /> Smart Pantry {!isPremium && '🔒'}
          </Link>
        </div>

        {/* Right Section - Icons and Upgrade Button */}
        <div className="flex items-center space-x-4">
          <button className="text-text-dark hover:text-primary-accent transition-colors duration-200 text-xl relative">
            <FaBell />
            {/* Notification Badge (example) */}
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">2</span>
          </button>
          <button className="text-text-dark hover:text-primary-accent transition-colors duration-200 text-xl">
            <FaUserCircle />
          </button>

          {!isPremium && isLoggedIn && ( // Show upgrade button only if logged in and not premium
            <button
              onClick={handleUpgradeClick}
              className="bg-primary-accent hover:opacity-90 text-white font-semibold py-2 px-5 rounded-full text-sm transition-colors duration-200 shadow-md"
            >
              Upgrade to Pro
            </button>
          )}
           {/* Logged in as premium, maybe show "Manage Plan" or nothing */}
           {isPremium && isLoggedIn && (
            <button
                onClick={() => alert("Manage your Premium plan!")}
                className="bg-secondary-green hover:opacity-90 text-white font-semibold py-2 px-5 rounded-full text-sm transition-colors duration-200 shadow-md"
            >
                Manage Plan
            </button>
           )}
        </div>
      </div>
    </nav>
  );
}

export default DashboardNav;