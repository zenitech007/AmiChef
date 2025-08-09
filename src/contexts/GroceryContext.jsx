import React, { createContext, useContext, useState, useEffect } from 'react';
import { uuid } from '../utils/uuid.js';

const GroceryContext = createContext();

const saveGroceryList = (list) => {
  try {
    localStorage.setItem('groceryList', JSON.stringify(list));
  } catch (error) {
    console.error("Failed to save grocery list to local storage:", error);
  }
};

const loadGroceryList = () => {
  try {
    const storedList = localStorage.getItem('groceryList');
    return storedList ? JSON.parse(storedList) : [];
  } catch (error) {
    console.error("Failed to load grocery list from local storage:", error);
    return [];
  }
};

export const GroceryProvider = ({ children }) => {
  const [groceryList, setGroceryList] = useState(loadGroceryList);

  useEffect(() => {
    saveGroceryList(groceryList);
  }, [groceryList]);

  const addItem = (item) => {
    const newItem = { ...item, id: uuid(), checked: false, pantryStatus: 'missing', category: item.category || 'Other' };
    setGroceryList((prevList) => [...prevList, newItem]);
    return true;
  };

  const removeItem = (id) => {
    setGroceryList((prevList) => prevList.filter((item) => item.id !== id));
  };

  const clearList = () => {
    setGroceryList([]);
  };

  const toggleItem = (id) => {
    setGroceryList((prevList) =>
      prevList.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const updateItem = (updatedItem) => {
    setGroceryList((prevList) =>
      prevList.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      )
    );
  };

  const value = {
    groceryList,
    setGroceryList,
    addItem,
    removeItem,
    clearList,
    toggleItem,
    updateItem,
  };

  return (
    <GroceryContext.Provider value={value}>
      {children}
    </GroceryContext.Provider>
  );
};

export const useGrocery = () => {
  const context = useContext(GroceryContext);
  if (context === undefined) {
    throw new Error('useGrocery must be used within a GroceryProvider');
  }
  return context;
};