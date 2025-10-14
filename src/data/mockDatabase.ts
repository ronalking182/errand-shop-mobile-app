// Mock database that simulates your Go backend structure
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  addresses: Address[];
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  category: string;
  inStock: boolean;
  stockCount: number;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  deliveryAddress: Address;
  createdAt: string;
  estimatedDelivery?: string;
}

export interface OrderItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

// Mock data storage
class MockDatabase {
  private users: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+23456789100',
      createdAt: new Date().toISOString(),
      addresses: [
        {
          id: 'addr1',
          userId: '1',
          label: 'Home',
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          phone: '+1234567890',
          isDefault: true
        }
      ]
    }
  ];

  private products: Product[] = [
    {
      id: '1',
      name: 'Fresh Carrots',
      subtitle: '1 lb bag',
      description: 'Fresh organic carrots, perfect for cooking and snacking.',
      price: 1200,
      image: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=300',
      category: 'Vegetables',
      inStock: true,
      stockCount: 50,
      tags: ['Fresh', 'Organic'],
      rating: 4.5,
      reviewCount: 23,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Red Apples',
      subtitle: '2 lbs',
      description: 'Crisp and sweet red apples, great for snacking.',
      price: 2000,
      compareAtPrice: 2800,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300',
      category: 'Fruits',
      inStock: true,
      stockCount: 30,
      tags: ['Sale', 'Fresh'],
      rating: 4.8,
      reviewCount: 45,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Organic Spinach',
      subtitle: '5 oz bag',
      description: 'Fresh organic spinach leaves, rich in nutrients.',
      price: 1600,
      image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300',
      category: 'Vegetables',
      inStock: true,
      stockCount: 25,
      tags: ['Organic', 'Fresh'],
      rating: 4.3,
      reviewCount: 18,
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Whole Milk',
      subtitle: '1 gallon',
      description: 'Fresh whole milk from local farms.',
      price: 3500,
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300',
      category: 'Dairy',
      inStock: true,
      stockCount: 40,
      tags: ['Fresh'],
      rating: 4.6,
      reviewCount: 32,
      createdAt: new Date().toISOString()
    },
    {
      id: '5',
      name: 'Bananas',
      subtitle: '2 lbs',
      description: 'Ripe yellow bananas, perfect for smoothies.',
      price: 1800,
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300',
      category: 'Fruits',
      inStock: true,
      stockCount: 60,
      tags: ['Fresh'],
      rating: 4.4,
      reviewCount: 28,
      createdAt: new Date().toISOString()
    }
  ];

  private orders: Order[] = [];
  private currentUserId = '1'; // Simulate logged-in user

  // User methods
  async getUser(id: string): Promise<User | null> {
    await this.delay(300); // Simulate network delay
    return this.users.find(u => u.id === id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    await this.delay(400);
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  }

  // Product methods
  async getProducts(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    await this.delay(500);
    
    let filtered = [...this.products];
    
    if (params?.category && params.category !== 'All Items') {
      filtered = filtered.filter(p => p.category === params.category);
    }
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }
    
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      products: filtered.slice(start, end),
      total: filtered.length
    };
  }

  async getProduct(id: string): Promise<Product | null> {
    await this.delay(300);
    return this.products.find(p => p.id === id) || null;
  }

  async getCategories(): Promise<string[]> {
    await this.delay(200);
    const categories = [...new Set(this.products.map(p => p.category))];
    return ['All Items', ...categories];
  }

  // Order methods
  async createOrder(orderData: {
    items: { productId: string; quantity: number }[];
    deliveryAddressId: string;
  }): Promise<Order> {
    await this.delay(600);
    
    const user = await this.getUser(this.currentUserId);
    if (!user) throw new Error('User not found');
    
    const address = user.addresses.find(a => a.id === orderData.deliveryAddressId);
    if (!address) throw new Error('Address not found');
    
    const orderItems: OrderItem[] = [];
    let totalAmount = 0;
    
    for (const item of orderData.items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        const orderItem: OrderItem = {
          productId: item.productId,
          product,
          quantity: item.quantity,
          price: product.price
        };
        orderItems.push(orderItem);
        totalAmount += product.price * item.quantity;
      }
    }
    
    const order: Order = {
      id: `order_${Date.now()}`,
      userId: this.currentUserId,
      items: orderItems,
      totalAmount,
      status: 'pending',
      deliveryAddress: address,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    this.orders.push(order);
    return order;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    await this.delay(400);
    const targetUserId = userId || this.currentUserId;
    return this.orders.filter(o => o.userId === targetUserId);
  }

  // Address methods
  async addAddress(userId: string, address: Omit<Address, 'id' | 'userId'>): Promise<Address> {
    await this.delay(400);
    
    const newAddress: Address = {
      ...address,
      id: `addr_${Date.now()}`,
      userId
    };
    
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex].addresses.push(newAddress);
    }
    
    return newAddress;
  }

  async updateAddress(addressId: string, updates: Partial<Address>): Promise<Address | null> {
    await this.delay(400);
    
    for (const user of this.users) {
      const addressIndex = user.addresses.findIndex(a => a.id === addressId);
      if (addressIndex !== -1) {
        user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...updates };
        return user.addresses[addressIndex];
      }
    }
    
    return null;
  }

  async deleteAddress(addressId: string): Promise<boolean> {
    await this.delay(300);
    
    for (const user of this.users) {
      const addressIndex = user.addresses.findIndex(a => a.id === addressId);
      if (addressIndex !== -1) {
        user.addresses.splice(addressIndex, 1);
        return true;
      }
    }
    
    return false;
  }

  // Auth simulation
  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    await this.delay(800);
    
    console.log('🔍 MockDB Login attempt:', { email, passwordLength: password.length });
    console.log('📋 Current users in database:', this.users.map(u => ({ id: u.id, email: u.email, name: u.name })));
    
    // Simple mock validation
    if (password.length < 6) {
      console.log('❌ Password too short');
      return null;
    }
    
    const user = this.users.find(u => u.email === email);
    if (user) {
      console.log('✅ User found, login successful');
      return {
        user,
        token: `mock_token_${user.id}_${Date.now()}`
      };
    }
    
    console.log('❌ User not found in database');
    return null;
  }

  async register(userData: { name: string; email: string; password: string }): Promise<{ user: User; token: string }> {
    await this.delay(1000);
    
    console.log('📝 MockDB Register attempt:', { name: userData.name, email: userData.email });
    console.log('📋 Users before registration:', this.users.length);
    
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      createdAt: new Date().toISOString(),
      addresses: []
    };
    
    this.users.push(newUser);
    
    console.log('✅ User registered successfully:', { id: newUser.id, email: newUser.email });
    console.log('📋 Users after registration:', this.users.length);
    console.log('📋 All users:', this.users.map(u => ({ id: u.id, email: u.email, name: u.name })));
    
    return {
      user: newUser,
      token: `mock_token_${newUser.id}_${Date.now()}`
    };
  }

  // Utility method to simulate network delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to reset data (useful for testing)
  reset() {
    this.orders = [];
    // Reset users to initial state if needed
  }
}

export const mockDB = new MockDatabase();