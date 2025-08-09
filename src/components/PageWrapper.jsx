// File: /src/components/PageWrapper.jsx
import React from 'react';

function PageWrapper({ children }) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md mx-auto">
      {children}
    </div>
  );
}

export default PageWrapper;