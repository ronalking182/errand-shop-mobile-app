import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProductStore } from "../../store/product.store";
import { useCartStore } from "../../store/cart.store";
import { useTheme } from "../../theme/ThemeProvider";

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
  // Backend compatibility fields
  sellingPrice?: number;
  imageUrl?: string;
  stockQuantity?: number;
}

export default function AddProductsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { products, fetchProducts, loading } = useProductStore();
  const { addItem } = useCartStore();

  // Fetch products when component mounts or search query changes
  useEffect(() => {
    fetchProducts({ search: searchQuery });
  }, [searchQuery]);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addProductToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
    
    // Show feedback that item was added
    console.log(`Added ${product.name} to cart`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Products</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.sub} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products to add..."
            placeholderTextColor={colors.sub}
            style={{ flex: 1, color: colors.text, marginLeft: 8 }}
          />
        </View>
      </View>
      
      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.productItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => addProductToCart(item)}
          >
            <View style={[styles.productIcon, { backgroundColor: colors.muted }]}>
              <Ionicons name="nutrition" size={24} color={colors.brand} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.productSubtitle, { color: colors.sub }]}>{item.subtitle}</Text>
              <Text style={[styles.productPrice, { color: colors.brand }]}>₦{item.price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={[styles.addButton, { backgroundColor: colors.brand }]}>
              <Ionicons name="add" size={20} color="#fff" />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={colors.sub} />
            <Text style={[styles.emptyText, { color: colors.sub }]}>
              {loading ? "Searching products..." : searchQuery ? "No products found" : "Start typing to search products"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  searchContainer: { padding: 16 },
  searchInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  productItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: { fontSize: 16, fontWeight: "600" },
  productSubtitle: { fontSize: 14, marginTop: 2 },
  productPrice: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 16,
  },
});