import { create } from 'zustand';
import { apiService } from '../services/apiService';

export type CustomRequestStatus = 'submitted' | 'under_review' | 'quote_sent' | 'customer_accepted' | 'approved' | 'customer_declined' | 'cancelled' | 'in_cart';

export interface CustomRequestItem {
  id: string;
  title: string;
  description: string;
  quantity?: number;
  unit?: string;
  preferredBrand?: string;
  productImages?: string[];
  status: CustomRequestStatus;
  adminQuote?: number;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields for cart functionality
  isInCart?: boolean;
  cartPrice?: number; // Price when added to cart (pending or quoted)
  cartQuantity?: number; // Quantity in cart (can be different from original quantity)
}

interface CustomRequestStore {
  requests: CustomRequestItem[];
  cartRequests: CustomRequestItem[]; // Requests currently in cart
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRequests: () => Promise<void>;
  createRequest: (requestData: {
    title: string;
    description: string;
    quantity?: number;
    unit?: string;
    preferredBrand?: string;
    productImages?: string[];
  }) => Promise<CustomRequestItem | null>;
  updateRequest: (requestId: string, requestData: {
    title?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    preferredBrand?: string;
    productImages?: string[];
  }) => Promise<boolean>;
  deleteRequest: (requestId: string) => Promise<boolean>;
  cancelRequest: (requestId: string, reason: string) => Promise<boolean>;
  permanentDeleteRequest: (requestId: string) => Promise<boolean>;
  sendMessage: (requestId: string, message: string) => Promise<boolean>;
  addRequestToCart: (requestId: string) => void;
  removeRequestFromCart: (requestId: string) => void;
  acceptQuote: (requestId: string) => Promise<boolean>;
  declineQuote: (requestId: string) => Promise<boolean>;
  updateRequestStatus: (requestId: string, status: CustomRequestStatus, adminQuote?: number, adminNotes?: string) => void;
  clearError: () => void;
  getCartRequestsTotal: () => number;
  getPendingRequestsCount: () => number;
}

export const useCustomRequestStore = create<CustomRequestStore>((set, get) => ({
  requests: [],
  cartRequests: [],
  isLoading: false,
  error: null,

  fetchRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getCustomRequests();
      if (response.success && response.data) {
        const requests: CustomRequestItem[] = response.data.map(req => {
          const activeQuote = (req as any).activeQuote;
          const quotes = (req as any).quotes || [];
          
          // Try to find the most recent quote or use activeQuote
          let bestQuote = activeQuote;
          if (quotes.length > 0) {
            // Find the most recent quote with SENT status
            const sentQuotes = quotes.filter((q: any) => q.status === 'SENT');
            if (sentQuotes.length > 0) {
              bestQuote = sentQuotes.sort((a: any, b: any) => 
                new Date(b.sentAt || b.updatedAt).getTime() - new Date(a.sentAt || a.updatedAt).getTime()
              )[0];
            }
          }
          
          // Enhanced quote processing logic
           let finalAdminQuote = 0;
           if (bestQuote && bestQuote.grandTotal !== undefined && bestQuote.grandTotal !== null) {
             finalAdminQuote = bestQuote.grandTotal;
           } else if ((req as any).grandTotal !== undefined && (req as any).grandTotal !== null) {
             finalAdminQuote = (req as any).grandTotal;
           } else if ((req as any).adminQuote !== undefined && (req as any).adminQuote !== null) {
             finalAdminQuote = (req as any).adminQuote;
           }
 
           // Keep the real number as requested - no conversion needed
           const adminQuote = finalAdminQuote;
          
          // Log only new custom requests with quote_sent status
          if (req.status === 'quote_sent') {
            console.log('New Custom Request Quote:', {
              id: req.id,
              title: req.title,
              status: req.status,
              adminQuote: adminQuote
            });
          }
          
          // Extract title from the first item's name since backend stores it there
          const title = (req as any).items?.[0]?.name || req.title || 'Custom Request';
          
          return {
            ...req,
            title: title, // Ensure title is properly set
            status: req.status as CustomRequestStatus,
            adminQuote: adminQuote,
            adminNotes: (req as any).adminNotes,
            isInCart: false,
            cartPrice: req.status === 'quote_sent' ? adminQuote || 0 : 0
          };
        });
        set({ requests, isLoading: false });
      } else {
        set({ error: response.message || 'Failed to fetch requests', isLoading: false });
      }
    } catch (error) {
      set({ error: 'Network error occurred', isLoading: false });
    }
  },

  createRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.createCustomRequest(requestData);
      if (response.success && response.data) {
        const newRequest: CustomRequestItem = {
          ...response.data,
          status: response.data.status as CustomRequestStatus,
          quantity: requestData.quantity,
          unit: requestData.unit,
          preferredBrand: requestData.preferredBrand,
          productImages: requestData.productImages,
          isInCart: false,
          cartPrice: 0
        };
        
        set(state => ({
          requests: [...state.requests, newRequest],
          isLoading: false
        }));
        
        return newRequest;
      } else {
        set({ error: response.message || 'Failed to create request', isLoading: false });
        return null;
      }
    } catch (error) {
      set({ error: 'Network error occurred', isLoading: false });
      return null;
    }
  },

  addRequestToCart: (requestId) => {
    set(state => {
      const request = state.requests.find(r => r.id === requestId);
      if (!request) return state;

      const updatedRequest = {
        ...request,
        isInCart: true,
        status: request.status === 'quote_sent' ? request.status : 'in_cart' as CustomRequestStatus,
        cartPrice: request.status === 'quote_sent' ? request.adminQuote || 0 : 0
      };

      return {
        requests: state.requests.map(r => r.id === requestId ? updatedRequest : r),
        cartRequests: [...state.cartRequests.filter(cr => cr.id !== requestId), updatedRequest]
      };
    });
  },

  removeRequestFromCart: (requestId) => {
    set(state => ({
      requests: state.requests.map(r => 
        r.id === requestId 
          ? { ...r, isInCart: false, status: r.status === 'in_cart' ? 'submitted' as CustomRequestStatus : r.status }
          : r
      ),
      cartRequests: state.cartRequests.filter(cr => cr.id !== requestId)
    }));
  },

  acceptQuote: async (requestId) => {
    try {
      const response = await apiService.acceptCustomRequest(requestId);
      if (response.success) {
        set(state => {
          const updatedRequests = state.requests.map(r => {
            if (r.id === requestId) {
              const updatedRequest = { 
                ...r, 
                status: 'customer_accepted' as CustomRequestStatus,
                cartPrice: r.adminQuote || 0 // Set cartPrice to the accepted quote amount
              };
              console.log('🎯 Quote accepted - updating cartPrice:', {
                requestId,
                adminQuote: r.adminQuote,
                newCartPrice: updatedRequest.cartPrice
              });
              return updatedRequest;
            }
            return r;
          });
          
          const updatedCartRequests = state.cartRequests.map(cr => {
            if (cr.id === requestId) {
              return { 
                ...cr, 
                status: 'customer_accepted' as CustomRequestStatus,
                cartPrice: cr.adminQuote || 0 // Set cartPrice to the accepted quote amount
              };
            }
            return cr;
          });
          
          return {
            requests: updatedRequests,
            cartRequests: updatedCartRequests
          };
        });
        return true;
      }
      return false;
    } catch (error) {
      set({ error: 'Failed to accept quote' });
      return false;
    }
  },

  declineQuote: async (requestId) => {
    try {
      const response = await apiService.declineCustomRequest(requestId);
      if (response.success) {
        set(state => ({
          requests: state.requests.map(r => 
            r.id === requestId 
              ? { ...r, status: 'customer_declined' as CustomRequestStatus, isInCart: false }
              : r
          ),
          cartRequests: state.cartRequests.filter(cr => cr.id !== requestId)
        }));
        return true;
      }
      return false;
    } catch (error) {
      set({ error: 'Failed to decline quote' });
      return false;
    }
  },

  updateRequest: async (requestId, requestData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.updateCustomRequest(requestId, requestData);
      if (response.success && response.data) {
        set(state => ({
          requests: state.requests.map(r => 
            r.id === requestId ? { ...r, ...response.data } : r
          ),
          isLoading: false
        }));
        return true;
      } else {
        set({ error: response.message || 'Failed to update request', isLoading: false });
        return false;
      }
    } catch (error) {
      set({ error: 'Network error occurred', isLoading: false });
      return false;
    }
  },

  deleteRequest: async (requestId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.deleteCustomRequest(requestId);
      if (response.success) {
        set(state => ({
          requests: state.requests.filter(r => r.id !== requestId),
          cartRequests: state.cartRequests.filter(cr => cr.id !== requestId),
          isLoading: false
        }));
        return true;
      } else {
        set({ error: response.message || 'Failed to delete request', isLoading: false });
        return false;
      }
    } catch (error) {
      set({ error: 'Network error occurred', isLoading: false });
      return false;
    }
  },

  cancelRequest: async (requestId, reason) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.cancelCustomRequest(requestId, reason);
      if (response.success) {
        set(state => ({
          requests: state.requests.map(r => 
            r.id === requestId ? { ...r, status: 'cancelled' as CustomRequestStatus } : r
          ),
          cartRequests: state.cartRequests.filter(cr => cr.id !== requestId),
          isLoading: false
        }));
        return true;
      } else {
        set({ error: response.message || 'Failed to cancel request', isLoading: false });
        return false;
      }
    } catch (error) {
      set({ error: 'Network error occurred', isLoading: false });
      return false;
    }
  },

  permanentDeleteRequest: async (requestId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.deleteCustomRequest(requestId);
      if (response.success) {
        set(state => ({
          requests: state.requests.filter(r => r.id !== requestId),
          cartRequests: state.cartRequests.filter(cr => cr.id !== requestId),
          isLoading: false
        }));
        return true;
      } else {
        set({ error: response.message || 'Failed to permanently delete request', isLoading: false });
        return false;
      }
    } catch (error) {
      set({ error: 'Network error occurred', isLoading: false });
      return false;
    }
  },

  sendMessage: async (requestId, message) => {
    try {
      const response = await apiService.sendCustomRequestMessage(requestId, message);
      if (response.success) {
        return true;
      } else {
        set({ error: response.message || 'Failed to send message' });
        return false;
      }
    } catch (error) {
      set({ error: 'Network error occurred' });
      return false;
    }
  },

  updateRequestStatus: (requestId, status, adminQuote, adminNotes) => {
    set(state => ({
      requests: state.requests.map(r => 
        r.id === requestId 
          ? { 
              ...r, 
              status, 
              adminQuote: adminQuote || r.adminQuote,
              adminNotes: adminNotes || r.adminNotes,
              cartPrice: status === 'quote_sent' ? adminQuote || r.adminQuote || 0 : r.cartPrice
            }
          : r
      ),
      cartRequests: state.cartRequests.map(cr => 
        cr.id === requestId 
          ? { 
              ...cr, 
              status, 
              adminQuote: adminQuote || cr.adminQuote,
              adminNotes: adminNotes || cr.adminNotes,
              cartPrice: status === 'quote_sent' ? adminQuote || cr.adminQuote || 0 : cr.cartPrice
            }
          : cr
      )
    }));
  },

  clearError: () => set({ error: null }),

  getCartRequestsTotal: () => {
    const { cartRequests } = get();
    return cartRequests.reduce((total, request) => {
      return total + (request.cartPrice || 0);
    }, 0);
  },

  getPendingRequestsCount: () => {
    const { cartRequests } = get();
    return cartRequests.filter(r => r.status === 'submitted' || r.status === 'in_cart').length;
  }
}));