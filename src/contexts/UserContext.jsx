import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [appState, setAppState] = useState({
    isLoaded: false,
    isLoggedIn: false,
    isPremium: false,
    userName: null,
    userEmail: null,
    userAvatar: null,
    mealPlan: [],
  });

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    let unsubscribeUser = null;
    let unsubscribeMeals = null;

    const authListener = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user document from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeUser = onSnapshot(userDocRef, async (docSnap) => {
          if (!docSnap.exists()) {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
              displayName: user.displayName || 'User',
              email: user.email,
              isPremium: false,
              createdAt: new Date(),
            });
            // Update state with new user info
            setAppState((prevState) => ({
              ...prevState,
              isLoggedIn: true,
              userEmail: user.email,
              userAvatar: user.photoURL,
              isPremium: false,
              userName: user.displayName || 'User',
            }));
          } else {
            const data = docSnap.data();
            setAppState((prevState) => ({
              ...prevState,
              isLoggedIn: true,
              userEmail: user.email,
              userAvatar: user.photoURL,
              isPremium: data.isPremium || false,
              userName: data.displayName || user.displayName,
            }));
          }
        });

        // Fetch meal plan from Firestore
        const mealPlanDocRef = doc(db, 'mealPlans', user.uid);
        unsubscribeMeals = onSnapshot(mealPlanDocRef, (docSnap) => {
          const meals = docSnap.exists() && Array.isArray(docSnap.data().plan)
            ? docSnap.data().plan
            : [];
          setAppState((prevState) => ({
            ...prevState,
            mealPlan: meals,
            isLoaded: true,
          }));
        });
      } else {
        setAppState({
          isLoaded: true,
          isLoggedIn: false,
          isPremium: false,
          userName: null,
          userEmail: null,
          userAvatar: null,
          mealPlan: [],
        });
      }
    });

    return () => {
      authListener();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeMeals) unsubscribeMeals();
    };
  }, []);

  if (!appState.isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen text-xl text-gray-600">
        Loading...
      </div>
    );
  }

  return <UserContext.Provider value={appState}>{children}</UserContext.Provider>;
};