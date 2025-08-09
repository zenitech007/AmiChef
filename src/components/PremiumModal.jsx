import React from 'react';
import { FaLock } from 'react-icons/fa';

const PremiumModal = ({ onClose, onUpgrade }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-xl">×</button>
        <div className="text-center">
          <FaLock className="text-primary-accent text-4xl mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Unlock Premium</h2>
          <p className="text-gray-600 mb-4">
            Get unlimited AI recipes, smart pantry scanning, and voice/image search for just <strong>$3/month</strong>.
          </p>
          <button
            onClick={onUpgrade}
            className="bg-primary-accent text-white font-bold py-2 px-6 rounded-full hover:bg-orange-500 transition">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;