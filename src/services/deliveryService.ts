import AsyncStorage from '@react-native-async-storage/async-storage';

// Fix the environment variable by manually adding the colon if missing
let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:9090';

if (apiUrl.includes('localhost9090')) {
  apiUrl = apiUrl.replace('localhost9090', 'localhost:9090');
}
// Add /api/v1 to the base URL for API endpoints
const API_BASE_URL = `${apiUrl}/api/v1`;

interface DeliveryEstimateRequest {
  addressId: string;
  userId?: string;
}

interface DeliveryEstimateResponse {
  zoneId?: number;
  zoneName?: string;
  matchedKeyword?: string;
  matchedBy?: string;
  confidence?: number;
  price?: number;
  message?: string;
  suggestions?: {
    zoneId: number;
    keyword: string;
    price: number;
    confidence: number;
  }[];
}

interface OrderConfirmationRequest {
  addressId: string;
  clientPrice: number;
}

interface OrderConfirmationResponse {
  success?: boolean;
  message: string;
  addressId?: string;
  confirmedPrice?: number;
  zoneId?: number;
  zoneName?: string;
  matchedBy?: string;
  confidence?: number;
  error?: string;
}

interface DeliveryQuoteRequest {
  pickup_latitude: number;
  pickup_longitude: number;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_type: string;
  scheduled_date?: string;
}

interface CreateDeliveryRequest {
  order_id: string;
  delivery_type: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_notes?: string;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_notes?: string;
  recipient_name: string;
  recipient_phone: string;
  scheduled_date?: string;
}

class DeliveryService {
  private baseURL = apiUrl;

  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Get delivery cost estimation for a specific address
   */
  async estimateDelivery(addressId: string, userId?: string): Promise<DeliveryEstimateResponse> {
    try {
      const requestBody: DeliveryEstimateRequest = {
        addressId: addressId.toString(),
        ...(userId && { userId })
      };

      const response = await fetch(`${API_BASE_URL}/delivery/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to estimate delivery cost');
      }

      return data;
    } catch (error) {
      console.error('Delivery estimation error:', error);
      throw error;
    }
  }

  /**
   * Confirm delivery price before order placement
   */
  async confirmOrder(addressId: string, clientPrice: number): Promise<OrderConfirmationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/orders/confirm`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ addressId, clientPrice })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm order');
      }

      return data;
    } catch (error) {
      console.error('Order confirmation error:', error);
      throw error;
    }
  }

  /**
   * Get delivery quote based on coordinates
   */
  async getDeliveryQuote(quoteData: DeliveryQuoteRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/delivery/quote`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(quoteData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get delivery quote');
      }

      return data;
    } catch (error) {
      console.error('Delivery quote error:', error);
      throw error;
    }
  }

  /**
   * Track delivery status by tracking number
   */
  async trackDelivery(trackingNumber: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/delivery/track/${trackingNumber}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to track delivery');
      }

      return data;
    } catch (error) {
      console.error('Track delivery error:', error);
      throw error;
    }
  }

  /**
   * Create a new delivery order (Protected - JWT Required)
   */
  async createDelivery(deliveryData: CreateDeliveryRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/delivery`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(deliveryData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create delivery');
      }

      return data;
    } catch (error) {
      console.error('Create delivery error:', error);
      throw error;
    }
  }

  /**
   * Get delivery details by ID (Protected)
   */
  async getDeliveryDetails(deliveryId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/delivery/${deliveryId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get delivery details');
      }

      return data;
    } catch (error) {
      console.error('Get delivery details error:', error);
      throw error;
    }
  }

  /**
   * Get tracking updates for a delivery (Protected)
   */
  async getTrackingUpdates(deliveryId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/delivery/${deliveryId}/tracking`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get tracking updates');
      }

      return data;
    } catch (error) {
      console.error('Get tracking updates error:', error);
      throw error;
    }
  }
}

export const deliveryService = new DeliveryService();
export default deliveryService;