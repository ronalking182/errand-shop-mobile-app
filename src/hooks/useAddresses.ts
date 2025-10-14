import { useState, useEffect } from 'react';
import { Address, CreateAddressRequest, UpdateAddressRequest, createAddressService } from '../services/addressService';
import { authService } from '../services/authService';

interface UseAddressesReturn {
  addresses: Address[];
  loading: boolean;
  error: string | null;
  createAddress: (data: CreateAddressRequest) => Promise<void>;
  updateAddress: (id: number, data: UpdateAddressRequest) => Promise<void>;
  deleteAddress: (id: number) => Promise<void>;
  setDefaultAddress: (id: number) => Promise<void>;
  refreshAddresses: () => Promise<void>;
}

export const useAddresses = (): UseAddressesReturn => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Get token on mount
  useEffect(() => {
    const getToken = async () => {
      const authToken = await authService.getToken();
      setToken(authToken);
    };
    getToken();
  }, []);

  const refreshAddresses = async () => {
    console.log('🏠 useAddresses - refreshAddresses called');
    const currentToken = token || await authService.getToken();
    if (!currentToken) {
      console.log('❌ useAddresses - No authentication token available');
      setError('No authentication token available');
      return;
    }

    try {
      console.log('🔍 useAddresses - Fetching addresses...');
      setLoading(true);
      setError(null);
      const addressService = createAddressService(currentToken);
      const data = await addressService.getAddresses();
      console.log('📋 useAddresses - Addresses received:', data);
      setAddresses(data);
    } catch (err) {
      console.error('❌ useAddresses - Failed to fetch addresses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  const createAddress = async (data: CreateAddressRequest) => {
    const currentToken = token || await authService.getToken();
    if (!currentToken) {
      throw new Error('No authentication token available');
    }

    try {
      setError(null);
      const addressService = createAddressService(currentToken);
      await addressService.createAddress(data);
      await refreshAddresses(); // Refresh list
    } catch (err) {
      console.error('Failed to create address:', err);
      setError(err instanceof Error ? err.message : 'Failed to create address');
      throw err;
    }
  };

  const updateAddress = async (id: number, data: UpdateAddressRequest) => {
    const currentToken = token || await authService.getToken();
    if (!currentToken) {
      throw new Error('No authentication token available');
    }

    try {
      setError(null);
      const addressService = createAddressService(currentToken);
      await addressService.updateAddress(id, data);
      await refreshAddresses(); // Refresh list
    } catch (err) {
      console.error('Failed to update address:', err);
      setError(err instanceof Error ? err.message : 'Failed to update address');
      throw err;
    }
  };

  const deleteAddress = async (id: number) => {
    const currentToken = token || await authService.getToken();
    if (!currentToken) {
      throw new Error('No authentication token available');
    }

    try {
      setError(null);
      const addressService = createAddressService(currentToken);
      await addressService.deleteAddress(id);
      await refreshAddresses(); // Refresh list
    } catch (err) {
      console.error('Failed to delete address:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete address');
      throw err;
    }
  };

  const setDefaultAddress = async (id: number) => {
    const currentToken = token || await authService.getToken();
    if (!currentToken) {
      throw new Error('No authentication token available');
    }

    try {
      setError(null);
      const addressService = createAddressService(currentToken);
      await addressService.setDefaultAddress(id);
      await refreshAddresses(); // Refresh list
    } catch (err) {
      console.error('Failed to set default address:', err);
      setError(err instanceof Error ? err.message : 'Failed to set default address');
      throw err;
    }
  };

  useEffect(() => {
    if (token) {
      refreshAddresses();
    }
  }, [token]);

  return {
    addresses,
    loading,
    error,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refreshAddresses
  };
};