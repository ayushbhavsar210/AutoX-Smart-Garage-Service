/**
 * Storage Utilities
 * Helper functions for localStorage operations
 * Used by mock API layer for data persistence
 */

/**
 * Get data from localStorage
 * @param {String} key - Storage key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Stored data or default value
 */
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading from localStorage for key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Save data to localStorage
 * @param {String} key - Storage key
 * @param {*} value - Value to store
 * @returns {Boolean} Success status
 */
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage for key "${key}":`, error);
    return false;
  }
};

/**
 * Remove data from localStorage
 * @param {String} key - Storage key
 * @returns {Boolean} Success status
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage for key "${key}":`, error);
    return false;
  }
};

/**
 * Clear all data from localStorage
 * @returns {Boolean} Success status
 */
export const clearStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

/**
 * Check if key exists in localStorage
 * @param {String} key - Storage key
 * @returns {Boolean} Whether key exists
 */
export const keyExists = (key) => {
  return localStorage.getItem(key) !== null;
};

/**
 * Get all keys from localStorage
 * @returns {Array} Array of keys
 */
export const getAllKeys = () => {
  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error('Error getting localStorage keys:', error);
    return [];
  }
};

/**
 * Append item to array in storage
 * @param {String} key - Storage key
 * @param {*} item - Item to append
 * @returns {Array} Updated array
 */
export const appendToArray = (key, item) => {
  try {
    const array = getFromStorage(key, []);
    if (!Array.isArray(array)) {
      console.warn(`Value at key "${key}" is not an array`);
      return [item];
    }
    const newArray = [...array, item];
    saveToStorage(key, newArray);
    return newArray;
  } catch (error) {
    console.error(`Error appending to array at key "${key}":`, error);
    return [];
  }
};

/**
 * Remove item from array in storage by index
 * @param {String} key - Storage key
 * @param {Number} index - Index to remove
 * @returns {Array} Updated array
 */
export const removeFromArray = (key, index) => {
  try {
    const array = getFromStorage(key, []);
    if (!Array.isArray(array)) {
      console.warn(`Value at key "${key}" is not an array`);
      return [];
    }
    const newArray = array.filter((_, i) => i !== index);
    saveToStorage(key, newArray);
    return newArray;
  } catch (error) {
    console.error(`Error removing from array at key "${key}":`, error);
    return [];
  }
};

/**
 * Remove item from array by property and value
 * @param {String} key - Storage key
 * @param {String} property - Property to check
 * @param {*} value - Value to match
 * @returns {Array} Updated array
 */
export const removeFromArrayByProperty = (key, property, value) => {
  try {
    const array = getFromStorage(key, []);
    if (!Array.isArray(array)) {
      console.warn(`Value at key "${key}" is not an array`);
      return [];
    }
    const newArray = array.filter(item => item[property] !== value);
    saveToStorage(key, newArray);
    return newArray;
  } catch (error) {
    console.error(`Error removing from array at key "${key}":`, error);
    return [];
  }
};

/**
 * Update item in array in storage
 * @param {String} key - Storage key
 * @param {Number} index - Index to update
 * @param {*} newValue - New value
 * @returns {Array} Updated array
 */
export const updateInArray = (key, index, newValue) => {
  try {
    const array = getFromStorage(key, []);
    if (!Array.isArray(array)) {
      console.warn(`Value at key "${key}" is not an array`);
      return [];
    }
    const newArray = [...array];
    newArray[index] = newValue;
    saveToStorage(key, newArray);
    return newArray;
  } catch (error) {
    console.error(`Error updating array at key "${key}":`, error);
    return [];
  }
};

/**
 * Update item in array by property and value
 * @param {String} key - Storage key
 * @param {String} property - Property to check
 * @param {*} searchValue - Value to search for
 * @param {Object} updates - Updates to apply
 * @returns {Array} Updated array
 */
export const updateInArrayByProperty = (key, property, searchValue, updates) => {
  try {
    const array = getFromStorage(key, []);
    if (!Array.isArray(array)) {
      console.warn(`Value at key "${key}" is not an array`);
      return [];
    }
    const newArray = array.map(item =>
      item[property] === searchValue ? { ...item, ...updates } : item
    );
    saveToStorage(key, newArray);
    return newArray;
  } catch (error) {
    console.error(`Error updating array by property at key "${key}":`, error);
    return [];
  }
};

/**
 * Find item in array by property and value
 * @param {String} key - Storage key
 * @param {String} property - Property to check
 * @param {*} value - Value to match
 * @returns {*} Found item or null
 */
export const findInArray = (key, property, value) => {
  try {
    const array = getFromStorage(key, []);
    if (!Array.isArray(array)) {
      console.warn(`Value at key "${key}" is not an array`);
      return null;
    }
    return array.find(item => item[property] === value) || null;
  } catch (error) {
    console.error(`Error finding in array at key "${key}":`, error);
    return null;
  }
};

/**
 * Filter array in storage
 * @param {String} key - Storage key
 * @param {Function} filterFunc - Filter function
 * @returns {Array} Filtered array
 */
export const filterArray = (key, filterFunc) => {
  try {
    const array = getFromStorage(key, []);
    if (!Array.isArray(array)) {
      console.warn(`Value at key "${key}" is not an array`);
      return [];
    }
    return array.filter(filterFunc);
  } catch (error) {
    console.error(`Error filtering array at key "${key}":`, error);
    return [];
  }
};

/**
 * Get array length from storage
 * @param {String} key - Storage key
 * @returns {Number} Array length
 */
export const getArrayLength = (key) => {
  try {
    const array = getFromStorage(key, []);
    return Array.isArray(array) ? array.length : 0;
  } catch (error) {
    console.error(`Error getting array length for key "${key}":`, error);
    return 0;
  }
};

/**
 * Get storage size in bytes
 * @returns {Number} Approximate storage size in bytes
 */
export const getStorageSize = () => {
  let size = 0;
  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
  } catch (error) {
    console.error('Error calculating storage size:', error);
  }
  return size;
};

/**
 * Export all utilities
 */
export default {
  getFromStorage,
  saveToStorage,
  removeFromStorage,
  clearStorage,
  keyExists,
  getAllKeys,
  appendToArray,
  removeFromArray,
  removeFromArrayByProperty,
  updateInArray,
  updateInArrayByProperty,
  findInArray,
  filterArray,
  getArrayLength,
  getStorageSize
};
