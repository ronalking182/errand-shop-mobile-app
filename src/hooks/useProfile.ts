import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/apiService';

export interface CustomerProfile {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  avatar?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  gender?: string;
  avatar?: string;
}

export interface Address {
  id: string;
  user_id: number;
  label: string;
  type: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressRequest {
  label: string;
  type: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
}

// Profile Hook
export const useProfile = () => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching customer profile...');
      
      // Check authentication before making the request
      const token = await AsyncStorage.getItem('accessToken');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      
      console.log('🔑 Auth check:', {
        hasToken: !!token,
        isLoggedIn: isLoggedIn === '1',
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
      });
      
      // If user is not authenticated, don't make the API call
      if (!token || isLoggedIn !== '1') {
        console.log('❌ User not authenticated, skipping profile fetch');
        setError('Please log in to view your profile');
        setLoading(false);
        return;
      }
      
      const response = await apiService.getCustomerProfile();
      console.log('📋 Profile API Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        console.log('✅ Profile data received:', response.data);
        setProfile(response.data);
      } else {
        console.log('❌ Profile fetch failed:', response.message);
        setError(response.message || 'Failed to fetch profile');
      }
    } catch (err: any) {
      console.log('🚨 Profile fetch error:', err);
      
      // Check if it's an authentication error
      if (err?.response?.status === 401) {
        console.log('🔒 Authentication error detected');
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Network error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: UpdateProfileRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.updateCustomerProfile(profileData);
      if (response.success && response.data) {
        setProfile(response.data);
        return { success: true, message: response.message };
      } else {
        setError(response.message || 'Failed to update profile');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Network error occurred';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.changePassword(currentPassword, newPassword);
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        setError(response.message || 'Failed to change password');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Network error occurred';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
    refetch: fetchProfile
  };
};

// Address Hook
export const useAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🏠 Fetching customer addresses...');
      const response = await apiService.getCustomerAddresses();
      console.log('📍 Addresses API Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        console.log('✅ Addresses data received:', response.data);
        console.log('📊 Number of addresses:', response.data.length);
        setAddresses(response.data);
      } else {
        console.log('❌ Addresses fetch failed:', response.message);
        setError(response.message || 'Failed to fetch addresses');
      }
    } catch (err) {
      console.log('🚨 Addresses fetch error:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createAddress = async (addressData: CreateAddressRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.createCustomerAddress(addressData);
      if (response.success && response.data) {
        // Refresh addresses list
        await fetchAddresses();
        return { success: true, message: response.message, data: response.data };
      } else {
        setError(response.message || 'Failed to create address');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Network error occurred';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async (id: number, addressData: Partial<CreateAddressRequest>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.updateCustomerAddress(id, addressData);
      if (response.success && response.data) {
        // Refresh addresses list
        await fetchAddresses();
        return { success: true, message: response.message, data: response.data };
      } else {
        setError(response.message || 'Failed to update address');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Network error occurred';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const setDefaultAddress = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.setDefaultAddress(id);
      if (response.success) {
        // Refresh addresses list to update default status
        await fetchAddresses();
        return { success: true, message: response.message };
      } else {
        setError(response.message || 'Failed to set default address');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Network error occurred';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.deleteCustomerAddress(id);
      if (response.success) {
        // Refresh addresses list
        await fetchAddresses();
        return { success: true, message: response.message };
      } else {
        setError(response.message || 'Failed to delete address');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Network error occurred';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAddress = () => {
    return addresses.find(address => address.is_default) || null;
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
    getDefaultAddress,
    refetch: fetchAddresses
  };
};