// File: /src/components/Header.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

function Header() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="w-full bg-white shadow-md py-2 px-6 fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* ✅ Logo */}
        <Link to="/" className="flex items-center">
          <img
            src="/images/amichef-logo-header.svg"
            alt="AmiChef Logo"
            className="h-8 w-auto sm:h-10"
          />
        </Link>

        {/* ✅ Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/features" className="text-gray-600 hover:text-secondary-green transition-colors">Features</Link>
          <Link to="/how-it-works" className="text-gray-600 hover:text-secondary-green transition-colors">How it Works</Link>
          <Link to="/pricing" className="text-gray-600 hover:text-secondary-green transition-colors">Pricing</Link>
          <Link to="/login" className="text-gray-600 hover:text-secondary-green transition-colors">Login</Link>
          <Link to="/signup" className="text-white bg-secondary-green hover:bg-secondary-green/90 px-4 py-2 rounded-full font-semibold transition-colors">Sign up</Link>
        </nav>

        {/* ✅ Mobile Hamburger */}
        <button onClick={toggleMenu} className="md:hidden text-gray-600 text-2xl focus:outline-none">
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* ✅ Mobile Dropdown with Slide Animation */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white shadow-lg overflow-hidden transform transition-all duration-300 ease-in-out 
        ${isMenuOpen ? 'max-h-[500px] opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-0'}`}
        style={{ transformOrigin: 'top' }}
      >
        <nav className="flex flex-col items-center space-y-4 py-4">
          <Link to="/features" onClick={toggleMenu} className="text-gray-600 hover:text-secondary-green transition-colors">Features</Link>
          <Link to="/how-it-works" onClick={toggleMenu} className="text-gray-600 hover:text-secondary-green transition-colors">How it Works</Link>
          <Link to="/pricing" onClick={toggleMenu} className="text-gray-600 hover:text-secondary-green transition-colors">Pricing</Link>
          <Link to="/login" onClick={toggleMenu} className="text-gray-600 hover:text-secondary-green transition-colors">Login</Link>
          <Link to="/signup" onClick={toggleMenu} className="text-white bg-secondary-green hover:bg-secondary-green/90 px-4 py-2 rounded-full font-semibold transition-colors">Sign up</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
