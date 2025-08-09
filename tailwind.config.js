/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ✅ AmiChef Brand Colors
        'primary-accent': '#FF6F00',   // Orange for CTAs
        'secondary-green': '#4CAF50',  // Green for freshness
        'background-light': '#F5F5F5', // Light Gray for backgrounds
        'white': '#FFFFFF',            // Explicit white
        'text-dark': '#2F2F2F',        // Dark text
        'gray-100': '#F5F5F5',         // Light gray (same as background)
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Bitter', 'serif'],
      },
      // ✅ Animations (used in RecipeModal.jsx)
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
};
