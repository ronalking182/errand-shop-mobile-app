// src/screens/HomeScreen.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMessageStore } from "../../hooks/useMessageStore";
import { useNavigationAdapter } from "../../hooks/useNavigationAdapter";
import { useProfile } from "../../hooks/useProfile";
import { apiService } from "../../services/apiService";
import { useCartStore } from "../../store/cart.store";
import { useProductStore } from '../../store/product.store';
import { useTheme } from "../../theme/ThemeProvider";
interface Product {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  image: string;
  category: string;
  inStock: boolean;
  stockCount: number;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

const W = Dimensions.get("window").width;
const GUTTER = 14;
const CARD_W = (W - GUTTER * 3) / 2;

const C = {
  brand: "#FF7A2F", // orange
  brandDark: "#E5671F",
  green: "#1DB954",
  greenDark: "#149C43",
  text: "#111827",
  sub: "#6B7280",
  border: "#E5E7EB",
  chip: "#F3F4F6",
  heartBg: "#FFFFFF",
  heartOn: "#E11D48",
  plusBg: "#FF8A47",
  screen: "#FFFFFF",
  card: "#FFFFFF",
  badgeRed: "#EF4444",
  badgeGray: "#ECECEC",
};

// Remove the local Product type definition since we're importing it from mockDatabase

const CATEGORIES = ["All", "Vegetables", "Grains & Rice", "Dairy", "Meat", "Fruits"];

// Remove mock data - will use real API data from product store

export default function HomeScreen() {
  let colors, navigation, insets;
  
  try {
    const theme = useTheme();
    colors = theme?.colors || { text: '#000', sub: '#666', brand: '#FF7A2F', card: '#fff', border: '#e5e5e5' };
    navigation = useNavigationAdapter();
    insets = useSafeAreaInsets();
  } catch (error) {
    console.error('Error in HomeScreen initialization:', error);
    // Fallback values
    colors = { text: '#000', sub: '#666', brand: '#FF7A2F', card: '#fff', border: '#e5e5e5' };
    navigation = { navigate: () => {}, goBack: () => {} };
    insets = { top: 0, bottom: 0, left: 0, right: 0 };
  }
  
  // Use the product store
  const productStore = useProductStore();
  const { 
    products = [], 
    categories = [], 
    loading = false, 
    error = null, 
    fetchProducts = () => Promise.resolve(), 
    fetchCategories = () => Promise.resolve() 
  } = productStore || {};

  const { profile } = useProfile();

  // State declarations - moved before useEffect
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  
  const { items, addItem, itemCount } = useCartStore();
  const { unreadAdminCount, debugBadgeCount, testBadgeCountIssue } = useMessageStore();
  
  // Get unread admin messages count
  const unreadAdminMessages = unreadAdminCount;
  
  // Log badge count updates
  useEffect(() => {
    console.log('🏠 HomeScreen - Unread admin messages count:', unreadAdminMessages);
    debugBadgeCount();
  }, [unreadAdminMessages, debugBadgeCount]);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchProducts(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const testBackend = async () => {
      const result = await apiService.testConnection();
      console.log('Backend test result:', result);
      
      if (!result.success) {
        console.log('❌ Cannot connect to backend');
      } else {
        console.log('✅ Backend connection successful');
        // Now try products
        const products = await apiService.getProducts();
        console.log('Products result:', products);
      }
    };
    
    testBackend();
    fetchCategories();
    fetchProducts();
  }, []);

  // Fetch products when category or search changes
  useEffect(() => {
    const params: any = {};
    if (activeCat !== "All") {
      // Handle both string and object category formats
      const categoryName = typeof activeCat === 'string' ? activeCat : (activeCat as any)?.name || activeCat;
      params.category = categoryName;
    }
    if (q.trim()) params.search = q.trim();
    
    fetchProducts(params);
  }, [q, activeCat]);

  // Note: Chat initialization is now handled by SupportChatScreen when needed

  // Generate categories from product tags
  const CATEGORIES_FROM_TAGS = useMemo(() => {
    const allTags = new Set<string>();
    products.forEach(product => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach(tag => allTags.add(tag));
      }
    });
    return ["All", ...Array.from(allTags).sort()];
  }, [products]);
  
  // Use dynamic categories from API or fallback to tag-based categories
  const CATEGORIES_DYNAMIC = useMemo(() => {
    if (categories.length > 0) {
      // API categories might be objects, extract names and add "All"
      return ["All", ...categories.map(cat => typeof cat === 'string' ? cat : (cat as any)?.name || String(cat))];
    }
    return CATEGORIES_FROM_TAGS;
  }, [categories, CATEGORIES_FROM_TAGS]);
  
  const filtered = useMemo(() => {
    // Validate and sanitize products to ensure they have required fields
    const sanitizeProduct = (product: any) => {
      try {
        return {
          ...product,
          price: typeof product.price === 'number' ? product.price : 0,
          compareAtPrice: typeof product.compareAtPrice === 'number' ? product.compareAtPrice : undefined,
          subtitle: product.subtitle || product.unit || '',
          tags: Array.isArray(product.tags) ? product.tags : [],
          description: product.description || '',
          image: product.image || product.imageUrl || '',
          inStock: product.inStock !== undefined ? product.inStock : (product.stock || 0) > 0,
          stockCount: typeof product.stockCount === 'number' ? product.stockCount : (typeof product.stock === 'number' ? product.stock : 0),
          rating: typeof product.rating === 'number' ? product.rating : 0,
          reviewCount: typeof product.reviewCount === 'number' ? product.reviewCount : 0,
          createdAt: product.createdAt || new Date().toISOString()
        };
      } catch (error) {
        console.error('Error sanitizing product:', product, error);
        return {
          id: product?.id || 'unknown',
          name: product?.name || 'Unknown Product',
          price: 0,
          compareAtPrice: undefined,
          subtitle: '',
          tags: [],
          description: '',
          image: '',
          inStock: false,
          stockCount: 0,
          rating: 0,
          reviewCount: 0,
          createdAt: new Date().toISOString()
        };
      }
    };
    
    // Use products from API store - show first 6 as popular for home screen
    let rawList = products.slice(0, 6);
    
    // Sanitize all products to ensure they have required fields
    let list = rawList.map(sanitizeProduct);
    
    // Apply category filter - check both category and tags
    if (activeCat !== "All Items" && activeCat !== "All") {
      list = list.filter((p: any) => 
        p.category === activeCat || 
        (p.tags && Array.isArray(p.tags) && p.tags.includes(activeCat))
      );
    }
    
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((p: any) => 
        p.name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        (p.tags && Array.isArray(p.tags) && p.tags.some((tag: string) => tag.toLowerCase().includes(s)))
      );
    }
    return list;
  }, [q, activeCat, products]);

  const addToCart = (p: any) => {
    console.log('Adding to cart:', p.name);
    addItem({
      id: p.id,
      name: p.name,
      price: p.price, // API should return prices in correct format
      image: p.image || p.imageUrl,
    });
    console.log('Item added to cart');
  };

  // Predefined avatars (only existing files)
  const PREDEFINED_AVATARS = [
    // Male avatars
    { id: 'male-01', image: require('../../../assets/avatars/male-01.png'), gender: 'male' },
    { id: 'male-02', image: require('../../../assets/avatars/male-02.png'), gender: 'male' },
    { id: 'male-03', image: require('../../../assets/avatars/male-03.png'), gender: 'male' },
    { id: 'male-04', image: require('../../../assets/avatars/male-04.png'), gender: 'male' },
    { id: 'male-05', image: require('../../../assets/avatars/male-05.png'), gender: 'male' },
    { id: 'male-06', image: require('../../../assets/avatars/male-06.png'), gender: 'male' },
    { id: 'male-07', image: require('../../../assets/avatars/male-07.png'), gender: 'male' },
    { id: 'male-08', image: require('../../../assets/avatars/male-08.png'), gender: 'male' },
    { id: 'male-09', image: require('../../../assets/avatars/male-09.png'), gender: 'male' },
    { id: 'male-10', image: require('../../../assets/avatars/male-10.png'), gender: 'male' },
  
    { id: 'male-12', image: require('../../../assets/avatars/male-12.png'), gender: 'male' },
    { id: 'male-13', image: require('../../../assets/avatars/male-13.png'), gender: 'male' },
    { id: 'male-14', image: require('../../../assets/avatars/male-14.png'), gender: 'male' },
    // Female avatars (only available ones)
    { id: 'female-01', image: require('../../../assets/avatars/female-01.png'), gender: 'female' },
    { id: 'female-02', image: require('../../../assets/avatars/female-02.png'), gender: 'female' },
    { id: 'female-03', image: require('../../../assets/avatars/female-03.png'), gender: 'female' },
    { id: 'female-04', image: require('../../../assets/avatars/female-04.png'), gender: 'female' },
    { id: 'female-05', image: require('../../../assets/avatars/female-05.png'), gender: 'female' },
    { id: 'female-06', image: require('../../../assets/avatars/female-06.png'), gender: 'female' },
  ];

  // Helper function to render user avatar
  const renderUserAvatar = () => {
    if (!profile?.avatar) {
      // Default placeholder with icon
      return (
        <View style={[styles.avatar, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={18} color={colors.sub} />
        </View>
      );
    }

    // Check if it's a predefined avatar
    const predefinedAvatar = PREDEFINED_AVATARS.find(avatar => avatar.id === profile.avatar);
    if (predefinedAvatar) {
      return (
        <Image
          source={predefinedAvatar.image}
          style={styles.avatar}
        />
      );
    }

    // It's a custom uploaded image (URL)
    return (
      <Image
        source={{ uri: profile.avatar }}
        style={styles.avatar}
      />
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        {/* Logo */}
        <View style={styles.logoIcon}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={{ width: 150, height: 34, resizeMode: "contain" }}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.headerRight}>
          {/* <IconBadge 
            icon="notifications-outline" 
            count={3} 
            onPress={() => navigation.navigate("Notifications")}
          /> */}
          <IconBadge 
            icon="chatbubble-ellipses-outline" 
            count={unreadAdminMessages > 0 ? unreadAdminMessages : undefined}
            onPress={() => navigation.navigate("SupportChat")}
          />
          <Pressable onPress={() => navigation.navigate("Profile")}>
            {renderUserAvatar()}
          </Pressable>
        </View>
      </View>

      <ScrollView 
        style={styles.screen} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      >
        {/* SEARCH */}
        <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Ionicons name="search" size={18} color={colors.sub} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search for products..."
            placeholderTextColor={colors.sub}
            value={q}
            onChangeText={setQ}
          />
        </View>

        {/* CATEGORIES */}
        <FlatList
          data={CATEGORIES_DYNAMIC.length > 0 ? CATEGORIES_DYNAMIC : CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 14 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setActiveCat(item)}
              style={[
                styles.chip,
                { borderColor: colors.border, backgroundColor: colors.muted },
                activeCat === item && { backgroundColor: colors.brand + "20", borderColor: colors.brand + "50" },
              ]}
            >
              <Text
                style={[
                  styles.chipTxt,
                  { color: colors.text },
                  activeCat === item && { color: colors.brand, fontWeight: "800" },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )}
        />

        {/* PROMO CARD */}
        {/*<View style={[styles.promo, { backgroundColor: colors.brand }]}>
          <View>
            <Text style={styles.promoTitle}>Fresh Deals!</Text>
            <Text style={styles.promoSub}>Up to 30% off on fresh produce</Text>
            <Pressable style={[styles.promoBtn, { backgroundColor: colors.card }]}>
              <Text style={[styles.promoBtnTxt, { color: colors.brand }]}>Shop Now</Text>
            </Pressable>
          </View>
          <View style={styles.promoBadge}>
            <Ionicons name="leaf" size={20} color="#fff" />
          </View>
        </View>*/}

        {/* POPULAR HEADER */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Items</Text>
          <Pressable onPress={() => navigation.navigate("AllProducts")}>
            <Text style={[styles.viewAll, { color: colors.brand }]}>View All</Text>
          </Pressable>
        </View>

        {/* GRID */}
        <View style={styles.grid}>
          {filtered.map((p) => {
            // Determine stock status
            const isOutOfStock = !p.inStock || (p.stockCount || 0) === 0;
            const isLowStock = ((p.stockCount || 0) > 0 && (p.stockCount || 0) <= 5) || p.tags?.includes('Low Stock');
            
            return (
              <Pressable 
                key={p.id} 
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate("ProductDetails", { product: JSON.stringify(p) })}
              >
                <View style={[styles.cardThumb, { backgroundColor: colors.muted }]}>
                  {p.image || p.imageUrl ? (
                    <Image 
                      source={{ uri: p.image || p.imageUrl }} 
                      style={{ width: '100%', height: '100%', borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialCommunityIcons 
                      name="food-apple" 
                      size={28} 
                      color={colors.brand} 
                    />
                  )}
                  
                  {/* Stock Status Badge */}
                  {isOutOfStock && (
                    <View style={[styles.stockBadge, { backgroundColor: '#EF4444' }]}>
                      <Text style={styles.stockBadgeText}>Out of Stock</Text>
                    </View>
                  )}
                  {!isOutOfStock && isLowStock && (
                    <View style={[styles.stockBadge, { backgroundColor: '#F59E0B' }]}>
                      <Text style={styles.stockBadgeText}>Low Stock</Text>
                    </View>
                  )}
                  
                  {/* Sale Tag */}
                  {p.tags && p.tags.includes('Sale') && <SaleTag />}
                </View>
                
                <Text style={[styles.pName, { color: colors.text }]}>{p.name}</Text>
                <Text style={[styles.pSub, { color: colors.sub }]}>{p.subtitle}</Text>
                
                <View style={styles.priceRow}>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: colors.text }]}>₦{typeof p.price === 'number' && !isNaN(p.price) ? p.price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</Text>
                    {p.compareAtPrice && typeof p.compareAtPrice === 'number' && !isNaN(p.compareAtPrice) && (
                      <Text style={[styles.compare, { color: colors.sub }]}>₦{p.compareAtPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    )}
                  </View>
                  
                  {!isOutOfStock && (
                    <Pressable style={[styles.addBtn, { backgroundColor: colors.brand }]} onPress={() => addToCart(p)}>
                      <Ionicons name="add" size={18} color="#fff" />
                    </Pressable>
                  )}
                  
                  {isOutOfStock && (
                    <View style={[styles.addBtn, { backgroundColor: colors.border, opacity: 0.5 }]}>
                      <Ionicons name="close" size={18} color={colors.sub} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* FLOATING ACTION BUTTON - Always visible plus icon */}
      <Pressable 
        style={[styles.cartFab, { backgroundColor: colors.brand }]} 
        onPress={() => {
          navigation.navigate('custom-request', { showForm: true });
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

function IconBadge({ icon, count, onPress }: { icon: keyof typeof Ionicons.glyphMap; count?: number; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable style={styles.iconBadgeWrap} onPress={onPress}>
      <View style={[styles.iconBadgeCircle, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon} size={20} color={colors.text} />
      </View>
      {count !== undefined && count > 0 && (
        <View style={styles.iconBadgeDot}>
          <Text style={styles.iconBadgeTxt}>{count > 99 ? "99+" : count.toString()}</Text>
        </View>
      )}
    </Pressable>
  );
}

function SaleTag() {
  const { colors } = useTheme();
  return (
    <View style={[styles.saleTag, { backgroundColor: colors.brand + "20" }]}>
      <Text style={[styles.saleTxt, { color: colors.brand }]}>Sale</Text>
    </View>
  );
}

/* ——— Styles ——— */

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: GUTTER,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoIcon: {
    paddingHorizontal: GUTTER,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: "#fff" },

  iconBadgeWrap: { position: "relative" },
  iconBadgeCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  iconBadgeDot: {
    position: "absolute", right: -2, top: -2,
    backgroundColor: "#EF4444", borderRadius: 9, paddingHorizontal: 5, height: 18,
    alignItems: "center", justifyContent: "center",
  },
  iconBadgeTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },

  searchWrap: {
    marginHorizontal: GUTTER,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { marginLeft: 8, flex: 1 },

  chip: {
    height: 36, paddingHorizontal: 14, borderRadius: 18,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
    marginRight: 10,
  },
  chipTxt: { fontWeight: "700" },

  promo: {
    marginHorizontal: GUTTER,
    marginTop: 14,
    borderRadius: 16,
    padding: 18,
    overflow: "hidden",
  },
  promoTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  promoSub: { color: "#E8FBEF", marginTop: 6 },
  promoBtn: {
    marginTop: 12, paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, alignSelf: "flex-start",
  },
  promoBtnTxt: { fontWeight: "800" },
  promoBadge: {
    position: "absolute", right: 16, top: 16,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },

  sectionHead: {
    marginTop: 18,
    paddingHorizontal: GUTTER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 18, fontWeight: "900" },
  viewAll: { fontWeight: "800" },

  grid: {
    marginTop: 10,
    paddingHorizontal: GUTTER,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GUTTER,
  },
  card: {
    width: CARD_W,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    overflow: "hidden",
  },
  cardThumb: {
    height: 110,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    position: "relative",
    overflow: "hidden",
  },
  heart: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  saleTag: {
    position: "absolute",
    left: 6,
    top: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 60,
  },
  saleTxt: { fontSize: 12, fontWeight: "900" },

  // Stock status badge
  stockBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    maxWidth: 70,
  },
  stockBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  pName: { fontWeight: "800" },
  pSub: { marginTop: 2 },

  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  priceContainer: { flex: 1, marginRight: 8 },
  price: { fontWeight: "900", fontSize: 16 },
  compare: {
    textDecorationLine: "line-through",
    marginTop: 2,
    fontSize: 14,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    flexShrink: 0,
  },

  cartFab: {
    position: "absolute",
    bottom: 140,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
