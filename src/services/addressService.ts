import { useAuthStore } from '../store/auth.store';

// Address interfaces based on backend API
export interface Address {
  id: number;
  user_id: number;
  label: string;
  type: 'home' | 'work' | 'other';
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
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  is_default?: boolean;
}

export interface UpdateAddressRequest {
  label?: string;
  type?: 'home' | 'work' | 'other';
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  is_default?: boolean;
}

class AddressService {
  private baseURL = 'http://localhost:9090/api/v1';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Get all addresses
  async getAddresses(): Promise<Address[]> {
    const response = await fetch(`${this.baseURL}/customers/addresses`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch addresses');
    }
    
    const result = await response.json();
    return result.data;
  }

  // Create new address
  async createAddress(addressData: CreateAddressRequest): Promise<Address> {
    const response = await fetch(`${this.baseURL}/customers/addresses`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(addressData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create address');
    }
    
    const result = await response.json();
    return result.data;
  }

  // Update address
  async updateAddress(addressId: number, updateData: UpdateAddressRequest): Promise<Address> {
    const response = await fetch(`${this.baseURL}/customers/addresses/${addressId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update address');
    }
    
    const result = await response.json();
    return result.data;
  }

  // Delete address
  async deleteAddress(addressId: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/customers/addresses/${addressId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete address');
    }
  }

  // Set default address
  async setDefaultAddress(addressId: number): Promise<Address> {
    const response = await fetch(`${this.baseURL}/customers/addresses/${addressId}/default`, {
      method: 'PUT',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to set default address');
    }
    
    const result = await response.json();
    return result.data;
  }
}

// Export singleton instance
export const createAddressService = (token: string) => new AddressService(token);

export default AddressService;