import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

// Save token
export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    return true;
  } catch (error) {
    console.error('Error saving token:', error);
    return false;
  }
};

// Get token
export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Remove token
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

// Save user
export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
};

// Get user
export const getUser = async () => {
  try {
    const userString = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Remove user
export const removeUser = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    return true;
  } catch (error) {
    console.error('Error removing user:', error);
    return false;
  }
};

// Clear all storage
export const clearStorage = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

export default {
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  removeUser,
  clearStorage
};