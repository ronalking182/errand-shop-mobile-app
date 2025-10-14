import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEYS = {
  IS_LOGGED_IN: 'isLoggedIn',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  FIRST_LOGIN_COMPLETE: 'firstLoginComplete',
  ONBOARDING_SEEN: 'onboardingSeen',
};

export interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  phone?: string;
}

class AuthService {
  // Store login state with backend data
  async setLoggedIn(isLoggedIn: boolean, accessToken?: string, refreshToken?: string, userData?: UserData) {
    try {
      const items: [string, string][] = [
        [AUTH_KEYS.IS_LOGGED_IN, isLoggedIn ? '1' : '0'],
        [AUTH_KEYS.FIRST_LOGIN_COMPLETE, isLoggedIn ? '1' : '0'],
      ];

      if (accessToken) items.push([AUTH_KEYS.ACCESS_TOKEN, accessToken]);
      if (refreshToken) items.push([AUTH_KEYS.REFRESH_TOKEN, refreshToken]);
      if (userData) items.push([AUTH_KEYS.USER_DATA, JSON.stringify(userData)]);

      await AsyncStorage.multiSet(items);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(AUTH_KEYS.IS_LOGGED_IN);
      const hasToken = await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
      return value === '1' && !!hasToken;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Get stored user data
  async getUserData(): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem(AUTH_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Get access token
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Get refresh token
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  // Logout and clear all data
  async logout() {
    try {
      console.log('🚪 AuthService - Logout called, clearing tokens...');
      await AsyncStorage.multiRemove([
        AUTH_KEYS.IS_LOGGED_IN,
        AUTH_KEYS.ACCESS_TOKEN,
        AUTH_KEYS.REFRESH_TOKEN,
        AUTH_KEYS.USER_DATA,
        AUTH_KEYS.FIRST_LOGIN_COMPLETE,
      ]);
      console.log('✅ AuthService - Tokens cleared successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Check if user has seen onboarding
  async hasSeenOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(AUTH_KEYS.ONBOARDING_SEEN);
      return value === '1';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  // Mark onboarding as seen
  async setOnboardingSeen() {
    try {
      await AsyncStorage.setItem(AUTH_KEYS.ONBOARDING_SEEN, '1');
    } catch (error) {
      console.error('Error setting onboarding seen:', error);
    }
  }

  // Check if first login is complete
  async isFirstLoginComplete(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(AUTH_KEYS.FIRST_LOGIN_COMPLETE);
      return value === '1';
    } catch (error) {
      console.error('Error checking first login status:', error);
      return false;
    }
  }
}

export const authService = new AuthService();