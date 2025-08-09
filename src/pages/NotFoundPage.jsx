// File: /src/pages/NotFoundPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-background-light p-4 text-text-dark text-center">
      <h2 className="text-3xl font-bold text-primary-accent mb-4">404 - Page Not Found</h2>
      <p className="text-lg">Oops! The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate('/')} className="mt-4 text-secondary-green hover:underline">Go to Home</button>
    </div>
  );
}

export default NotFoundPage;