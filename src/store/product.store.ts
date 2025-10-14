import { create } from 'zustand';
import { dataService } from '../services/dataService';

interface Product {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number; // Price in cents
  compareAtPrice?: number;
  image: string;
  category: string;
  inStock: boolean;
  stockCount: number;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  // Computed fields from API
  formattedPrice?: string;
  discountPercentage?: number;
  isOnSale?: boolean;
  // Backend compatibility fields
  sku?: string;
  slug?: string;
  costPrice?: number;
  sellingPrice?: number;
  profit?: number;
  stockQuantity?: number;
  imageUrl?: string;
  imagePublicId?: string;
  lowStockThreshold?: number;
  isLowStock?: boolean;
  isActive?: boolean;
  updatedAt?: string;
}

interface ProductStore {
  products: Product[];
  categories: string[];
  loading: boolean;
  error: string | null;
  currentProduct: Product | null;
  
  fetchProducts: (params?: {category?: string, search?: string}) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  testBackendConnection: () => Promise<void>;
  clearError: () => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  categories: [],
  loading: false,
  error: null,
  currentProduct: null,

  fetchProducts: async (params) => {
    set({ loading: true, error: null });
    
    try {
      const response = await dataService.getProducts(params);
      
      if (response.success && response.data) {
        // Map response to UI-compatible format (handles both API and mock data)
        const products = response.data.data.map((product: any) => ({
          ...product,
          // Add compatibility aliases
          price: product.sellingPrice || product.price,
          stock: product.stockQuantity || product.stockCount,
          image: product.imageUrl || product.image,
          inStock: product.stockQuantity ? product.stockQuantity > 0 : product.inStock
        }));
        
        set({ 
          products,
          loading: false 
        });
      } else {
        set({ 
          products: [],
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: 'Failed to fetch products',
        loading: false 
      });
    }
  },

  fetchProduct: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await dataService.getProduct(id);
      
      if (response.success && response.data) {
        // Map response to UI-compatible format (handles both API and mock data)
        const productData: any = response.data;
        const product = {
          ...productData,
          // Add compatibility aliases
          price: productData.sellingPrice || productData.price,
          stock: productData.stockQuantity || productData.stockCount,
          image: productData.imageUrl || productData.image,
          inStock: productData.stockQuantity ? productData.stockQuantity > 0 : productData.inStock
        };
        
        set({ 
          currentProduct: product,
          loading: false 
        });
      } else {
        set({ 
          currentProduct: null,
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: 'Failed to fetch product',
        loading: false 
      });
    }
  },

  fetchCategories: async () => {
    try {
      const response = await dataService.getCategories();
      
      if (response.data) {
        set({ categories: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },

  testBackendConnection: async () => {
    console.log('🔍 Testing backend connection...');
    try {
      const result = await dataService.testConnection();
      console.log('Backend test result:', result);
      
      if (!result.success) {
        console.log('❌ Cannot connect to backend');
        set({ error: 'Cannot connect to backend server' });
      } else {
        console.log('✅ Backend connection successful');
        // Now try products
        const products = await dataService.getProducts();
        console.log('Products result:', products);
        set({ error: null });
      }
    } catch (error) {
      console.error('Backend connection test failed:', error);
      set({ error: 'Backend connection test failed' });
    }
  },

  clearError: () => set({ error: null })
}));