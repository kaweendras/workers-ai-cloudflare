// Authentication utilities for managing tokens and user data in localStorage

interface AuthUser {
  token: string;
  role: string;
  email?: string;
  name?: string;
  id?: string;
}

interface LoginResponse {
  success: string;
  token: string;
  role: string;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Set authentication token in localStorage
 */
export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

/**
 * Set user data in localStorage
 */
export const setUserData = (userData: Partial<AuthUser>): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

/**
 * Get user data from localStorage
 */
export const getUserData = (): Partial<AuthUser> | null => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

/**
 * Remove user data from localStorage
 */
export const removeUserData = (): void => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};

/**
 * Set complete authentication data (token + user info)
 */
export const setAuthData = (loginResponse: LoginResponse): void => {
  setAuthToken(loginResponse.token);
  setUserData({
    token: loginResponse.token,
    role: loginResponse.role,
  });
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

/**
 * Get user role
 */
export const getUserRole = (): string | null => {
  const userData = getUserData();
  return userData?.role || null;
};

/**
 * Check if user has admin role
 */
export const isAdmin = (): boolean => {
  const role = getUserRole();
  return role === 'admin';
};

/**
 * Logout user by clearing all auth data
 */
export const logout = (): void => {
  removeAuthToken();
  removeUserData();
};

/**
 * Decode JWT token payload (basic decoding without verification)
 */
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token?: string): boolean => {
  try {
    const authToken = token || getAuthToken();
    if (!authToken) return true;

    const decoded = decodeToken(authToken);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Get user info from token
 */
export const getUserFromToken = (): any => {
  const token = getAuthToken();
  if (!token) return null;
  
  return decodeToken(token);
};

export type { AuthUser, LoginResponse };