// Service wrapper that switches between real API and mock database based on environment variable
import { apiService } from './apiService';
import { mockDB } from '../data/mockDatabase';

// Switch between mock and real API based on environment variable
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
console.log('Environment variable EXPO_PUBLIC_USE_MOCK:', process.env.EXPO_PUBLIC_USE_MOCK);
console.log('USE_MOCK is set to:', USE_MOCK);

class DataService {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    if (USE_MOCK) {
      console.log('Using mock data for products');
      const result = await mockDB.getProducts();
      return {
        success: true,
        data: {
          data: result.products,
          pagination: {
            page: 1,
            limit: result.products.length,
            total: result.total,
            totalPages: 1
          }
        }
      };
    } else {
      console.log('Using real API for products');
      return await apiService.getProducts(params);
    }
  }

  async getProduct(id: string) {
    if (USE_MOCK) {
      console.log('Using mock data for product:', id);
      const product = await mockDB.getProduct(id);
      return {
        success: true,
        data: product
      };
    } else {
      console.log('Using real API for product:', id);
      return await apiService.getProduct(id);
    }
  }

  async getCategories() {
    if (USE_MOCK) {
      console.log('Using mock data for categories');
      const categories = await mockDB.getCategories();
      return {
        success: true,
        data: categories
      };
    } else {
      console.log('Using real API for categories');
      return await apiService.getCategories();
    }
  }

  // Auth methods - always use real API for now
  async login(identifier: string, password: string) {
    if (USE_MOCK) {
      console.log('Using mock data for login');
      const result = await mockDB.login(identifier, password);
      if (result) {
        return {
          success: true,
          data: {
            token: result.token,
            refreshToken: result.token, // Mock uses same token
            user: {
              id: result.user.id,
              email: result.user.email,
              first_name: result.user.name.split(' ')[0] || result.user.name,
              last_name: result.user.name.split(' ')[1] || '',
              role: 'customer',
              status: 'active',
              phone: result.user.phone
            }
          }
        };
      } else {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }
    } else {
      console.log('Using real API for login');
      return await apiService.login(identifier, password);
    }
  }

  async register(userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone: string;
  }) {
    if (USE_MOCK) {
      console.log('Using mock data for register');
      const result = await mockDB.register({
        name: `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        password: userData.password
      });
      return {
        success: true,
        data: {
          token: result.token,
          refreshToken: result.token,
          user: {
            id: result.user.id,
            email: result.user.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: 'customer',
            status: 'active',
            phone: userData.phone
          }
        }
      };
    } else {
      console.log('Using real API for register');
      return await apiService.register(userData);
    }
  }

  // For other methods, delegate to real API service
  async verifyEmail(code: string) {
    return await apiService.verifyEmail(code);
  }

  async forgotPassword(email: string) {
    return await apiService.forgotPassword(email);
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    return await apiService.resetPassword(email, code, newPassword);
  }

  async resendOTP(email: string) {
    return await apiService.resendOTP(email);
  }

  async refreshToken() {
    return await apiService.refreshToken();
  }

  async getCurrentUser() {
    return await apiService.getCurrentUser();
  }

  async logout() {
    return await apiService.logout();
  }

  async getOrders() {
    if (USE_MOCK) {
      console.log('Using mock data for orders');
      const orders = await mockDB.getOrders();
      return {
        success: true,
        data: orders.map(order => ({
          id: order.id,
          order_number: `ORD-${order.id}`,
          status: order.status,
          totalAmountNaira: order.totalAmount,
          total_amount: order.totalAmount,
          items: order.items.map(item => ({
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
            product: {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.name.toLowerCase().replace(/\s+/g, '-'),
              imageUrl: item.product.image,
              price: item.price,
              priceNaira: item.price
            }
          })),
          delivery_address: order.deliveryAddress,
          delivery_mode: 'home' as const,
          payment_method: 'card',
          created_at: order.createdAt,
          estimated_delivery: order.estimatedDelivery
        })),
        message: 'Orders fetched successfully'
      };
    } else {
      console.log('Using real API for orders');
      return await apiService.getOrders();
    }
  }

  async createOrder(orderData: {
    items: { product_id: string; quantity: number; price: number; }[];
    custom_requests?: { custom_request_id: string; title: string; quantity: number; price: number; }[];
    delivery_address_id?: string;
    delivery_mode?: 'home' | 'pickup';
    payment_method: string;
  }) {
    if (USE_MOCK) {
      console.log('Using mock data for create order');
      // For mock, we'll just return a success response
      const itemsTotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const customRequestsTotal = (orderData.custom_requests || []).reduce((sum, cr) => sum + (cr.price * cr.quantity), 0);
      const totalAmount = itemsTotal + customRequestsTotal;
      
      return {
        success: true,
        data: {
          id: `mock-order-${Date.now()}`,
          order_number: `ORD-${Date.now()}`,
          status: 'pending',
          total_amount: totalAmount,
          items: orderData.items,
          custom_requests: orderData.custom_requests || [],
          delivery_mode: orderData.delivery_mode || 'home',
          payment_method: orderData.payment_method,
          created_at: new Date().toISOString(),
          estimated_delivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        message: 'Order created successfully'
      };
    } else {
      console.log('Using real API for create order');
      return await apiService.createOrder(orderData);
    }
  }

  // Note: Customer profile and address methods not implemented in apiService yet
  // These would need to be added to apiService when backend endpoints are ready

  async testConnection() {
    if (USE_MOCK) {
      console.log('Using mock data for connection test');
      return {
        success: true,
        data: { message: 'Mock connection successful' }
      };
    } else {
      console.log('Using real API for connection test');
      return await apiService.testConnection();
    }
  }

  async checkHealth() {
    return await apiService.checkHealth();
  }
}

export const dataService = new DataService();