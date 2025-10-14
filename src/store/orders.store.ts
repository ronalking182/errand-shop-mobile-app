import { create } from 'zustand';
import { dataService } from '../services/dataService';
import { notificationService } from '../services/notificationService';
import { useNotificationStore } from './notification.store';

interface OrderItem {
  id?: string;
  product_id: string;
  productId?: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  unitPriceNaira?: number;
  totalPrice?: number;
  totalPriceNaira?: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    price: number;
    priceNaira: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface Address {
  id: string;
  label: string;
  type: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
}

interface Order {
  id: string;
  orderNumber?: string;
  order_number?: string;
  status: string;
  totalAmount?: number;
  totalAmountNaira?: number;
  total_amount?: number;
  items: OrderItem[];
  custom_requests?: { custom_request_id: string; title: string; quantity: number; price: number; }[];
  customRequestDetails?: any[]; // Custom request details from backend
  deliveryAddress?: Address;
  delivery_address?: Address;
  deliveryMode?: 'home' | 'pickup';
  delivery_mode?: 'home' | 'pickup';
  paymentMethod?: string;
  payment_method?: string;
  paymentStatus?: string;
  serviceFee?: number;
  serviceFeeNaira?: number;
  deliveryFee?: number;
  deliveryFeeNaira?: number;
  itemsSubtotal?: number;
  itemsSubtotalNaira?: number;
  notes?: string;
  estimatedDelivery?: string;
  idempotencyKey?: string;
  created_at?: string;
  createdAt?: string;
  estimated_delivery?: string;
}

interface OrderConfirmationData {
  orderNumber: string;
  total: number;
  items: any[];
  customRequests?: any[];
  customRequestDetails?: any[];
  deliveryAddress?: any;
  deliveryMode?: 'home' | 'pickup';
}

interface OrdersStore {
  orders: Order[];
  currentOrder: Order | null;
  orderConfirmationData: OrderConfirmationData | null;
  loading: boolean;
  error: string | null;
  
  fetchOrders: () => Promise<void>;
  createOrder: (orderData: {
    items: { product_id: string; quantity: number; price: number; }[];
    custom_requests?: { custom_request_id: string; title: string; quantity: number; price: number; }[];
    delivery_address_id?: string;
    delivery_mode?: 'home' | 'pickup';
    payment_method: string;
  }) => Promise<Order | null>;
  setOrderConfirmationData: (data: OrderConfirmationData) => void;
  clearOrderConfirmationData: () => void;
  clearError: () => void;
  clearOrders: () => void;
}

export const useOrdersStore = create<OrdersStore>((set, get) => ({
  orders: [],
  currentOrder: null,
  orderConfirmationData: null,
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await dataService.getOrders();
      
      if (response.success) {
        // Handle both empty array and actual data
        const rawOrders = (response.data || []) as Order[];
        
        // Process orders to keep custom request amounts as-is (already in naira)
        const orders = rawOrders.map(order => {
          if (order.customRequestDetails && order.customRequestDetails.length > 0) {
            const processedCustomRequestDetails = order.customRequestDetails.map(customRequest => {
              const processedCustomRequest = { ...customRequest };
              
              // Keep activeQuote amounts as-is (already in naira)
              if (processedCustomRequest.activeQuote) {
                processedCustomRequest.activeQuote = {
                  ...processedCustomRequest.activeQuote,
                  grandTotalNaira: processedCustomRequest.activeQuote.grandTotalNaira || 0,
                  itemsSubtotalNaira: processedCustomRequest.activeQuote.itemsSubtotalNaira || 0
                };
              }
              
              // Keep item quoted prices as-is (already in naira)
              if (processedCustomRequest.items && processedCustomRequest.items.length > 0) {
                processedCustomRequest.items = processedCustomRequest.items.map((item: any) => ({
                  ...item,
                  quotedPriceNaira: item.quotedPriceNaira
                }));
              }
              
              return processedCustomRequest;
            });
            
            return {
              ...order,
              customRequestDetails: processedCustomRequestDetails
            };
          }
          
          return order;
        });
        
        // Debug: Log the API response structure
        console.log('🔍 ORDERS API RESPONSE:', {
          success: response.success,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          ordersCount: orders.length,
          firstOrderStructure: orders[0] ? {
            id: orders[0].id,
            hasCustomRequestDetails: !!orders[0].customRequestDetails,
            hasCustomRequests: !!orders[0].custom_requests,
            customRequestDetailsKeys: orders[0].customRequestDetails ? Object.keys(orders[0].customRequestDetails) : [],
            customRequestsKeys: orders[0].custom_requests ? Object.keys(orders[0].custom_requests) : [],
            allKeys: Object.keys(orders[0])
          } : null
        });
        
        const currentOrders = get().orders;
        
        // Check for status changes and send notifications
        if (currentOrders.length > 0) {
          const { preferences } = useNotificationStore.getState();
          
          orders.forEach((newOrder) => {
            const existingOrder = currentOrders.find(o => o.id === newOrder.id);
            if (existingOrder && existingOrder.status !== newOrder.status) {
              // Order status changed
               if (preferences.orderUpdates) {
                 notificationService.sendOrderStatusNotification(
                   newOrder.id,
                   newOrder.status
                 );
               }
               
               // Check for delivery-specific notifications
               if (preferences.deliveryNotifications && 
                   (newOrder.status === 'out_for_delivery' || newOrder.status === 'delivered')) {
                 const deliveryMessage = newOrder.status === 'delivered' 
                   ? 'Your order has been delivered!' 
                   : 'Your order is out for delivery!';
                 notificationService.sendDeliveryNotification(
                   newOrder.id,
                   deliveryMessage
                 );
               }
            }
          });
        }
        
        // Sort orders by creation date (newest first)
        const sortedOrders = orders.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0);
          const dateB = new Date(b.created_at || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        set({ 
          orders: sortedOrders,
          loading: false,
          error: null
        });
      } else {
        // Handle different error scenarios with user-friendly messages
        const errorMessage = response.message === 'Failed to fetch orders' 
          ? 'No orders found. Start shopping to see your order history!' 
          : response.message || 'Failed to fetch orders';
        set({ 
          error: errorMessage,
          loading: false,
          orders: []
        });
      }
    } catch (error: any) {
      console.error('Orders fetch error:', error);
      set({ 
        error: 'Unable to load orders. Please check your connection and try again.',
        loading: false,
        orders: []
      });
    }
  },

  createOrder: async (orderData: {
    items: { product_id: string; quantity: number; price: number; }[];
    custom_requests?: { custom_request_id: string; title: string; quantity: number; price: number; }[];
    delivery_address_id?: string;
    delivery_mode?: 'home' | 'pickup';
    payment_method: string;
  }) => {
    set({ loading: true, error: null });
    
    // Log the data being sent to backend
    console.log('🚀 CREATING ORDER - Data being sent to backend:');
    console.log('📦 Items:', JSON.stringify(orderData.items, null, 2));
    console.log('🎯 Custom Requests:', JSON.stringify(orderData.custom_requests, null, 2));
    console.log('📍 Delivery Address ID:', orderData.delivery_address_id);
    console.log('🚚 Delivery Mode:', orderData.delivery_mode);
    console.log('💳 Payment Method:', orderData.payment_method);
    console.log('📋 Full Order Data:', JSON.stringify(orderData, null, 2));
    
    try {
      const response = await dataService.createOrder(orderData);
      
      if (response.success && response.data) {
        const newOrder = response.data as Order;
        set(state => ({ 
          orders: [newOrder, ...state.orders],
          currentOrder: newOrder,
          loading: false,
          error: null
        }));
        return newOrder;
      } else {
        set({ 
          error: response.message || 'Failed to create order',
          loading: false 
        });
        return null;
      }
    } catch (error: any) {
      console.error('Create order error:', error);
      set({ 
        error: error.message || 'Network error occurred while creating order',
        loading: false 
      });
      return null;
    }
  },

  setOrderConfirmationData: (data: OrderConfirmationData) => set({ orderConfirmationData: data }),
  
  clearOrderConfirmationData: () => set({ orderConfirmationData: null }),
  
  clearError: () => set({ error: null }),
  
  clearOrders: () => set({ 
    orders: [], 
    currentOrder: null,
    orderConfirmationData: null,
    loading: false, 
    error: null 
  })
}));