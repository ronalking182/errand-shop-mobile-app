import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigationAdapter } from "../../hooks/useNavigationAdapter";
import { useProfile } from "../../hooks/useProfile";
import { useCartStore } from "../../store/cart.store";
import { useProductStore } from "../../store/product.store";
import { useTheme } from "../../theme/ThemeProvider";

const W = Dimensions.get("window").width;
const SP = 14;

const C = {
  brand: "#FF7A2F",
  brandDark: "#E5671F",
  text: "#111827",
  sub: "#6B7280",
  border: "#E5E7EB",
  chip: "#F3F4F6",
  white: "#FFFFFF",
  heartOn: "#E11D48",
  plusBg: "#FF8A47",
  badgeYellow: "#FFE59A",
  badgeGreen: "#D1FADF",
  bg: "#FFFFFF",
};

// Predefined avatars (same as other screens)
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
  { id: 'male-15', image: require('../../../assets/avatars/male-15.png'), gender: 'male' },
  { id: 'male-16', image: require('../../../assets/avatars/male-16.png'), gender: 'male' },
  { id: 'male-17', image: require('../../../assets/avatars/male-17.png'), gender: 'male' },
  { id: 'male-18', image: require('../../../assets/avatars/male-18.png'), gender: 'male' },
  { id: 'male-19', image: require('../../../assets/avatars/male-19.png'), gender: 'male' },

];

type Product = {
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
  // Backend compatibility
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
};

// Categories will be generated dynamically from product tags

export default function AllProductsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigationAdapter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState("All Items");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState<"priceAsc" | "priceDesc" | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const { products, loading, fetchProducts, categories, fetchCategories, testBackendConnection } = useProductStore();
  const { profile } = useProfile();

  // Generate categories from product tags
  const CATEGORIES_FROM_TAGS = useMemo(() => {
    const allTags = new Set<string>();
    products.forEach(product => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach(tag => allTags.add(tag));
      }
    });
    return ["All Items", ...Array.from(allTags).sort()];
  }, [products]);
  
  // Use dynamic categories from API or fallback to tag-based categories
  const CATEGORIES = useMemo(() => {
    if (categories.length > 0) {
      // API categories might be objects, extract names and add "All Items"
      return ["All Items", ...categories.map(cat => typeof cat === 'string' ? cat : (cat as any)?.name || String(cat))];
    }
    return CATEGORIES_FROM_TAGS;
  }, [categories, CATEGORIES_FROM_TAGS]);

  // Helper function to render user avatar
  const renderUserAvatar = () => {
    if (!profile?.avatar) {
      // Default placeholder with icon
      return (
        <View style={[styles.avatar, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={14} color={colors.sub} />
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

  useEffect(() => {
    const testBackend = async () => {
      console.log('🔍 Starting backend connectivity test...');
      await testBackendConnection();
      
      // Then fetch products and categories
      fetchProducts();
      fetchCategories();
    };
    
    testBackend();
  }, []);

  const data = useMemo(() => {
    let items = products.filter(p => p.isActive).slice();

    // category filter - check both category and tags
    if (activeCat !== "All Items") {
      items = items.filter(p => 
        p.category === activeCat || 
        (p.tags && Array.isArray(p.tags) && p.tags.includes(activeCat))
      );
    }

    // query filter
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      items = items.filter(p => 
        p.name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.tags.some(tag => tag.toLowerCase().includes(s))
      );
    }

    // sort
    if (sort === "priceAsc") items.sort((a, b) => (a.price || a.sellingPrice || 0) - (b.price || b.sellingPrice || 0));
    if (sort === "priceDesc") items.sort((a, b) => (b.price || b.sellingPrice || 0) - (a.price || a.sellingPrice || 0));

    return items;
  }, [products, activeCat, q, sort]);

  const toggleLike = (id: string) =>
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));

  const addToCart = (p: Product) => {
    addItem({
      id: `${p.id}-${Date.now()}`, // unique cart item id
      name: p.name,
      price: p.price || p.sellingPrice || 0,
      image: p.image || p.imageUrl || ""
    });
  };

  const numColumns = layout === "grid" ? 2 : 1;
  const CARD_W = layout === "grid" ? (W - SP * 4) / 2 : (W - SP * 2);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable 
          style={[styles.headerLeft, { backgroundColor: colors.card }]} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Products</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => navigation.navigate("Profile")}>
            {renderUserAvatar()}
          </Pressable>
        </View>
      </View>

      {/* CONTROLS */}
      <View style={styles.controls}>
        <Pressable 
          style={[styles.ctrlBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => {
            // Toggle sort logic
            if (sort === null) setSort("priceAsc");
            else if (sort === "priceAsc") setSort("priceDesc");
            else setSort(null);
          }}
        >
          <Ionicons name="swap-vertical" size={16} color={colors.text} />
          <Text style={[styles.ctrlTxt, { color: colors.text }]}>Sort</Text>
        </Pressable>
        
        <View style={[styles.layoutWrap, { borderColor: colors.border }]}>
          <Pressable
            style={[styles.layoutBtn, layout === "grid" && { backgroundColor: colors.brand }]}
            onPress={() => setLayout("grid")}
          >
            <Ionicons name="grid-outline" size={16} color={layout === "grid" ? "#fff" : colors.text} />
          </Pressable>
          <Pressable
            style={[styles.layoutBtn, layout === "list" && { backgroundColor: colors.brand }]}
            onPress={() => setLayout("list")}
          >
            <Ionicons name="list-outline" size={16} color={layout === "list" ? "#fff" : colors.text} />
          </Pressable>
        </View>
      </View>

      {/* COMPACT LAYOUT - Categories and Count in same row */}
      <View style={styles.compactHeader}>
        {/* CATEGORIES */}
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          style={styles.categoriesList}
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
        
        {/* COUNT TEXT - positioned next to categories */}
        <Text style={[styles.countText, { color: colors.sub }]}>{data.length} items</Text>
      </View>

      {/* PRODUCT LIST - Right below the categories */}
      <FlatList
        data={data}
        numColumns={numColumns}
        key={layout} 
        contentContainerStyle={styles.productsContainer}
        columnWrapperStyle={layout === "grid" ? { justifyContent: "space-between" } : undefined}
        renderItem={({ item: p }) => (
          <ProductCard
            p={p}
            width={CARD_W}
            layout={layout}
            liked={!!liked[p.id]}
            onLike={() => toggleLike(p.id)}
            onAdd={() => addToCart(p)}
            navigation={navigation}
          />
        )}
      />
    </View>
  );
}

function ProductCard({
  p,
  width,
  layout,
  liked,
  onLike,
  onAdd,
  navigation,
}: {
  p: Product;
  width: number;
  layout: "grid" | "list";
  liked: boolean;
  onLike: () => void;
  onAdd: () => void;
  navigation: any;
}) {
  const { colors } = useTheme();
  const thumbH = layout === "grid" ? 110 : 80;
  
  // Determine stock status
  const isOutOfStock = !p.inStock || (p.stockCount || p.stockQuantity || 0) === 0;
  const isLowStock = p.isLowStock || ((p.stockCount || p.stockQuantity || 0) > 0 && (p.stockCount || p.stockQuantity || 0) <= (p.lowStockThreshold || 5));

  return (
    <Pressable
      style={[styles.card, { width, backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate("ProductDetails", { product: JSON.stringify(p) })}
    >
      <View style={[styles.thumb, { height: thumbH, backgroundColor: colors.muted }]}>
        {(p.image || p.imageUrl) ? (
          <Image 
            source={{ uri: p.image || p.imageUrl || '' }} 
            style={{ width: '100%', height: '100%', borderRadius: 12 }}
            resizeMode="cover"
          />
        ) : (
          <MaterialCommunityIcons name="package-variant" size={layout === "grid" ? 28 : 24} color={colors.brand} />
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
        {p.tags && p.tags.includes('Sale') && (
          <View style={[styles.saleTag, { backgroundColor: colors.brand }]}>
            <Text style={[styles.saleTagText, { color: '#fff' }]}>Sale</Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.pName, { color: colors.text }]}>{p.name}</Text>
      <Text style={[styles.pSub, { color: colors.sub }]} numberOfLines={2}>{p.subtitle || p.description}</Text>
      
      <View style={styles.priceRow}>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.text }]}>₦{typeof (p.price || p.sellingPrice) === 'number' && !isNaN(p.price || p.sellingPrice || 0) ? (p.price || p.sellingPrice || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</Text>
          {(p.compareAtPrice && p.compareAtPrice > (p.price || 0)) && (
            <Text style={[styles.compare, { color: colors.sub }]}>₦{p.compareAtPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          )}
        </View>
        
        {!isOutOfStock && (
          <Pressable style={[styles.addBtn, { backgroundColor: colors.brand }]} onPress={onAdd}>
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
}

function Tag({ label }: { label: string }) {
  const { colors } = useTheme();
  const bgColor = colors.brand + "20";
  const textColor = colors.brand;
  
  return (
    <View style={[styles.tag, { backgroundColor: bgColor }]}>
      <Text style={[styles.tagTxt, { color: textColor }]}>{label}</Text>
    </View>
  );
}

/* ——— Styles ——— */
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: SP,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center", marginRight: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: "900", flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 28, height: 28, borderRadius: 14 },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SP,
    gap: 10,
    marginBottom: 4,
  },
  ctrlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
  },
  ctrlTxt: { fontWeight: "700" },
  layoutWrap: { flexDirection: "row", borderRadius: 10, overflow: "hidden" },
  layoutBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  // Compact header with categories and count in same row
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SP,
    marginBottom: 8,
    marginTop: 4,
  },
  categoriesList: {
    flex: 1,
    marginRight: 8,
  },
  categoriesContainer: {
    paddingBottom: 0,
  },
  chip: {
    height: 36, paddingHorizontal: 14, borderRadius: 18,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
    marginRight: 10, marginTop: 2, marginBottom: 2,
  },
  chipTxt: { fontWeight: "700" },

  countText: { 
    fontSize: 12,
    fontWeight: '600',
  },

  productsContainer: { 
    paddingHorizontal: SP, 
    paddingBottom: 20,
  },

  card: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: SP,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    overflow: "hidden",
  },
  thumb: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },
  heart: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  tag: { position: "absolute", left: 8, top: 8, paddingHorizontal: 10, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tagTxt: { fontWeight: "900", fontSize: 12 },

  // Stock status badge
  stockBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    maxWidth: "45%",
  },
  stockBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  
  // Sale tag
  saleTag: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    maxWidth: "40%",
  },
  saleTagText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  pName: { fontWeight: "800" },
  pSub: { marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  priceContainer: { flex: 1, marginRight: 8 },
  price: { fontWeight: "900", fontSize: 16 },
  compare: { textDecorationLine: "line-through", marginTop: 2, fontSize: 14 },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    flexShrink: 0,
  },
});