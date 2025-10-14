import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomRequestItem } from './customRequest.store';

const CART_STORAGE_KEY = 'cart_data';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  type?: 'product' | 'custom_request';
  customRequest?: CustomRequestItem;
}

interface CartStore {
  items: CartItem[];
  customRequests: CustomRequestItem[];
  hiddenCustomRequests: CustomRequestItem[];
  itemCount: number;
  totalPrice: number;
  customRequestsTotal: number;
  appliedCouponCode?: string;
  discountAmount: number;
  isLoaded: boolean;
  
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  addCustomRequest: (customRequest: CustomRequestItem) => void;
  removeItem: (id: string) => void;
  removeCustomRequest: (id: string) => void;
  hideCustomRequest: (id: string) => void;
  restoreCustomRequest: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  incrementCustomRequest: (id: string) => void;
  decrementCustomRequest: (id: string) => void;
  applyCoupon: (couponCode: string, discount: number) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  getGrandTotal: () => number;
  hasPendingCustomRequests: () => boolean;
  loadCartFromStorage: () => Promise<void>;
  saveCartToStorage: () => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customRequests: [],
  hiddenCustomRequests: [],
  itemCount: 0,
  totalPrice: 0,
  customRequestsTotal: 0,
  appliedCouponCode: undefined,
  discountAmount: 0,
  isLoaded: false,
  
  addItem: (item) => {
    const { items } = get();
    const existingItem = items.find(i => i.id === item.id);
    
    // Clear coupon when adding to empty cart (new shopping session)
    const shouldClearCoupon = items.length === 0;
    
    if (existingItem) {
      set(state => ({
        items: state.items.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
        itemCount: state.itemCount + 1,
        totalPrice: state.totalPrice + item.price
      }));
    } else {
      set(state => ({
        items: [...state.items, { ...item, quantity: 1 }],
        itemCount: state.itemCount + 1,
        totalPrice: state.totalPrice + item.price,
        // Clear coupon data when starting fresh cart
        ...(shouldClearCoupon && {
          appliedCouponCode: undefined,
          discountAmount: 0
        })
      }));
    }
    get().saveCartToStorage();
  },
  
  removeItem: (id) => {
    const { items } = get();
    const item = items.find(i => i.id === id);
    if (item) {
      set(state => ({
        items: state.items.filter(i => i.id !== id),
        itemCount: state.itemCount - item.quantity,
        totalPrice: state.totalPrice - (item.price * item.quantity)
      }));
      get().saveCartToStorage();
    }
  },
  
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    
    const { items } = get();
    const item = items.find(i => i.id === id);
    if (item) {
      const quantityDiff = quantity - item.quantity;
      set(state => ({
        items: state.items.map(i => 
          i.id === id ? { ...i, quantity } : i
        ),
        itemCount: state.itemCount + quantityDiff,
        totalPrice: state.totalPrice + (item.price * quantityDiff)
      }));
      get().saveCartToStorage();
    }
  },
  
  applyCoupon: (couponCode: string, discount: number) => {
    set({ appliedCouponCode: couponCode, discountAmount: discount });
    get().saveCartToStorage();
  },
  
  addCustomRequest: (customRequest) => {
    // Ensure title is properly set by extracting from items if needed
    const title = customRequest.title || (customRequest as any).items?.[0]?.name || 'Custom Request';
    const processedCustomRequest = {
      ...customRequest,
      title: title
    };
    
    set(state => {
      const existingIndex = state.customRequests.findIndex(cr => cr.id === customRequest.id);
      if (existingIndex >= 0) {
        // Update existing custom request
        const updatedRequests = [...state.customRequests];
        updatedRequests[existingIndex] = processedCustomRequest;
        return {
          customRequests: updatedRequests,
          customRequestsTotal: updatedRequests.reduce((total, cr) => total + (cr.cartPrice || 0), 0),
          itemCount: state.items.reduce((count, item) => count + item.quantity, 0) + updatedRequests.length
        };
      } else {
        // Add new custom request
        const newRequests = [...state.customRequests, processedCustomRequest];
        return {
          customRequests: newRequests,
          customRequestsTotal: newRequests.reduce((total, cr) => total + (cr.cartPrice || 0), 0),
          itemCount: state.items.reduce((count, item) => count + item.quantity, 0) + newRequests.length
        };
      }
    });
    get().saveCartToStorage();
  },

  removeCustomRequest: (id) => {
    set(state => {
      const newRequests = state.customRequests.filter(cr => cr.id !== id);
      return {
        customRequests: newRequests,
        customRequestsTotal: newRequests.reduce((total, cr) => total + (cr.cartPrice || 0), 0),
        itemCount: state.items.reduce((count, item) => count + item.quantity, 0) + newRequests.length
      };
    });
    get().saveCartToStorage();
  },

  hideCustomRequest: (id) => {
    set(state => {
      const requestToHide = state.customRequests.find(cr => cr.id === id);
      if (requestToHide) {
        const newRequests = state.customRequests.filter(cr => cr.id !== id);
        const newHiddenRequests = [...state.hiddenCustomRequests, requestToHide];
        return {
          customRequests: newRequests,
          hiddenCustomRequests: newHiddenRequests,
          customRequestsTotal: newRequests.reduce((total, cr) => total + (cr.cartPrice || 0), 0),
          itemCount: state.items.reduce((count, item) => count + item.quantity, 0) + newRequests.length
        };
      }
      return state;
    });
    get().saveCartToStorage();
  },

  restoreCustomRequest: (id) => {
    set(state => {
      const requestToRestore = state.hiddenCustomRequests.find(cr => cr.id === id);
      if (requestToRestore) {
        const newHiddenRequests = state.hiddenCustomRequests.filter(cr => cr.id !== id);
        const newRequests = [...state.customRequests, requestToRestore];
        return {
          customRequests: newRequests,
          hiddenCustomRequests: newHiddenRequests,
          customRequestsTotal: newRequests.reduce((total, cr) => total + (cr.cartPrice || 0), 0),
          itemCount: state.items.reduce((count, item) => count + item.quantity, 0) + newRequests.length
        };
      }
      return state;
    });
    get().saveCartToStorage();
  },

  incrementCustomRequest: (id) => {
    set(state => {
      const updatedRequests = state.customRequests.map(cr => {
        if (cr.id === id) {
          const newQuantity = (cr.cartQuantity || 1) + 1;
          return {
            ...cr,
            cartQuantity: newQuantity,
            cartPrice: cr.adminQuote ? cr.adminQuote * newQuantity : cr.cartPrice
          };
        }
        return cr;
      });
      return {
        customRequests: updatedRequests,
        customRequestsTotal: updatedRequests.reduce((total, cr) => total + (cr.cartPrice || 0), 0),
        itemCount: state.items.reduce((count, item) => count + item.quantity, 0) + updatedRequests.reduce((count, cr) => count + (cr.cartQuantity || 1), 0)
      };
    });
    get().saveCartToStorage();
  },

   decrementCustomRequest: (id) => {
     set(state => {
       const updatedRequests = state.customRequests.map(cr => {
         if (cr.id === id) {
           const newQuantity = Math.max(1, (cr.cartQuantity || 1) - 1);
           return {
             ...cr,
             cartQuantity: newQuantity,
             cartPrice: cr.adminQuote ? cr.adminQuote * newQuantity : cr.cartPrice
           };
         }
         return cr;
       });
       return {
         customRequests: updatedRequests,
         customRequestsTotal: updatedRequests.reduce((total, cr) => total + (cr.cartPrice || 0), 0),
         itemCount: state.items.reduce((count, item) => count + item.quantity, 0) + updatedRequests.reduce((count, cr) => count + (cr.cartQuantity || 1), 0)
       };
     });
     get().saveCartToStorage();
   },

  removeCoupon: () => {
    set({ appliedCouponCode: undefined, discountAmount: 0 });
    get().saveCartToStorage();
  },
  
  getGrandTotal: () => {
    const { totalPrice, customRequestsTotal, discountAmount } = get();
    return Math.max(0, totalPrice + customRequestsTotal - discountAmount);
  },

  hasPendingCustomRequests: () => {
    const { customRequests } = get();
    // Check for requests that are not yet ready for checkout
    const pendingStatuses = ['submitted', 'under_review', 'quote_sent', 'in_cart'];
    return customRequests.some(cr => pendingStatuses.includes(cr.status));
  },
  
  clearCart: () => {
    set({ 
      items: [], 
      customRequests: [],
      itemCount: 0, 
      totalPrice: 0, 
      customRequestsTotal: 0,
      appliedCouponCode: undefined, 
      discountAmount: 0 
    });
    get().saveCartToStorage();
  },

  loadCartFromStorage: async () => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        const parsed = JSON.parse(cartData);
        set({
          items: parsed.items || [],
          customRequests: parsed.customRequests || [],
          hiddenCustomRequests: parsed.hiddenCustomRequests || [],
          itemCount: parsed.itemCount || 0,
          totalPrice: parsed.totalPrice || 0,
          customRequestsTotal: parsed.customRequestsTotal || 0,
          appliedCouponCode: parsed.appliedCouponCode,
          discountAmount: parsed.discountAmount || 0,
          isLoaded: true
        });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
      set({ isLoaded: true });
    }
  },

  saveCartToStorage: async () => {
    try {
      const { items, customRequests, hiddenCustomRequests, itemCount, totalPrice, customRequestsTotal, appliedCouponCode, discountAmount } = get();
      const cartData = {
        items,
        customRequests,
        hiddenCustomRequests,
        itemCount,
        totalPrice,
        customRequestsTotal,
        appliedCouponCode,
        discountAmount
      };
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  }
}));

// Load cart data when store is created (async)
// Note: We removed the synchronous call here to prevent AsyncStorage errors
// The cart will be loaded when the CartScreen component mounts and checks isLoaded