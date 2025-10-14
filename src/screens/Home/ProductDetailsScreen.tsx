import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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
  // Computed fields from API
  formattedPrice?: string;
  discountPercentage?: number;
  isOnSale?: boolean;
  // Backend compatibility fields
  sellingPrice?: number;
  imageUrl?: string;
  stockQuantity?: number;
  isActive?: boolean;
}

export default function ProductDetailsScreen() {
  let colors;
  
  try {
    const theme = useTheme();
    colors = theme?.colors || { text: '#000', sub: '#666', brand: '#FF7A2F', card: '#fff', border: '#e5e5e5', bg: '#fff', muted: '#f5f5f5' };
  } catch (error) {
    console.error('Error in ProductDetailsScreen theme initialization:', error);
    colors = { text: '#000', sub: '#666', brand: '#FF7A2F', card: '#fff', border: '#e5e5e5', bg: '#fff', muted: '#f5f5f5' };
  }
  
  const params = useLocalSearchParams();
  const { addItem } = useCartStore();
  const [qty, setQty] = useState(1);
  
  // Parse product from params
  const product: Product = params.product ? JSON.parse(params.product as string) : null;
  
  if (!product) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 50 }}>Product not found</Text>
      </View>
    );
  }
  
  const price = (product.price || product.sellingPrice || 0); // Use actual price value

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable style={styles.hBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.hTitle, { color: colors.text }]}>Product Details</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* hero card */}
      <View style={[styles.hero, { backgroundColor: "#FFF6EE" }]}>
        {product.imageUrl || product.image ? (
          <Image 
            source={{ uri: product.imageUrl || product.image }} 
            style={{ width: '100%', height: '100%', borderRadius: 12 }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="nutrition" size={120} color="#FF7A2F" />
        )}
        
        {/* Stock Status Badge */}
        {(!product.inStock || (product.stockCount || product.stockQuantity || 0) === 0) && (
          <View style={[styles.stockBadge, { backgroundColor: '#EF4444' }]}>
            <Text style={styles.stockBadgeText}>Out of Stock</Text>
          </View>
        )}
        {product.inStock && ((product.stockCount || product.stockQuantity || 0) > 0 && (product.stockCount || product.stockQuantity || 0) <= 5) && (
          <View style={[styles.stockBadge, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.stockBadgeText}>Low Stock</Text>
          </View>
        )}
        
        {/* Sale Tag */}
        {product.tags && product.tags.includes('Sale') && (
          <View style={[styles.saleTag, { backgroundColor: colors.brand }]}>
            <Text style={[styles.saleTagText, { color: '#fff' }]}>Sale</Text>
          </View>
        )}
        
        {/* Other Tags */}
        {product.tags.length > 0 && !product.tags.includes('Sale') && (
          <View style={styles.fresh}><Text style={styles.freshTxt}>{product.tags[0]}</Text></View>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Text style={[styles.title, { color: colors.text, flex: 1, marginRight: 12 }]} numberOfLines={2}>{product.name}</Text>
          <Text style={[styles.price, { color: colors.text, fontSize: 18 }]}>₦{price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <Text style={{ color: colors.sub, marginTop: 6 }}>{product.category}</Text>

        <View style={[styles.qtyCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.qtyTitle, { color: colors.text, fontSize: 14 }]}>Quantity</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn}>
              <Ionicons name="remove" size={18} color="#111827" />
            </Pressable>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>{qty}</Text>
            <Pressable onPress={() => setQty((q) => q + 1)} style={styles.qtyBtn}>
              <Ionicons name="add" size={18} color="#111827" />
            </Pressable>
          </View>
          <View style={{ flex: 1 }} />
          <View><Text style={{ color: colors.sub }}>Total</Text><Text style={[styles.price, { color: colors.text }]}>₦{(price * qty).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></View>
        </View>

        <View style={[styles.aboutCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.aboutTitle, { color: colors.text }]}>About this item</Text>
          <Text style={{ color: colors.text, marginTop: 8, lineHeight: 22 }}>
            {product.description || 'No description available for this product.'}
          </Text>
          {product.tags.length > 1 && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.aboutTitle, { color: colors.text, fontSize: 14 }]}>Tags</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                {product.tags.map((tag, index) => (
                  <View key={index} style={[styles.tagChip, { backgroundColor: colors.brand + '20', borderColor: colors.brand + '50' }]}>
                    <Text style={[styles.tagText, { color: colors.brand }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* sticky add button */}
      <View style={[styles.sticky, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Pressable 
          onPress={() => {
            if (product.inStock && (product.stockCount || product.stockQuantity || 0) > 0) {
              for (let i = 0; i < qty; i++) {
                addItem({
                  id: product.id,
                  name: product.name,
                  price: product.price || product.sellingPrice || 0,
                  image: product.image || product.imageUrl || ''
                });
              }
              router.back();
            }
          }} 
          style={[styles.cta, { 
            backgroundColor: (product.inStock && (product.stockCount || product.stockQuantity || 0) > 0) ? colors.brand : colors.sub,
            opacity: (product.inStock && (product.stockCount || product.stockQuantity || 0) > 0) ? 1 : 0.6
          }]}
          disabled={!product.inStock || (product.stockCount || product.stockQuantity || 0) === 0}
        >
          <Text style={styles.ctaTxt}>
            {(product.inStock && (product.stockCount || product.stockQuantity || 0) > 0) ? `Add to Cart - ₦${(qty * price).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Out of Stock'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1,  paddingTop: 40 },
  header: { height: 60, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 6 },
  hBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  hTitle: { flex: 1, marginLeft: 6, fontSize: 20, fontWeight: "900" },

  hero: { margin: 16, borderRadius: 16, height: 220, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  fresh: { position: "absolute", right: 12, top: 12, backgroundColor: "#FFD640", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  freshTxt: { fontWeight: "900" },
  dotsRow: { position: "absolute", left: 12, bottom: 12, flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  title: { fontSize: 24, fontWeight: "900" },
  price: { fontWeight: "900", fontSize: 22 },

  qtyCard: { marginTop: 14, borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center" },
  qtyTitle: { fontWeight: "900", fontSize: 16, flex: 1 },
  qtyBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF2F7" },

  aboutCard: { marginTop: 14, borderWidth: 1, borderRadius: 16, padding: 14 },
  aboutTitle: { fontWeight: "900", fontSize: 16 },

  sticky: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 1, padding: 12 },
  cta: { height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ctaTxt: { color: "#fff", fontWeight: "900", fontSize: 16 },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  
  // Stock status badge
  stockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 10,
    zIndex: 10,
    maxWidth: 80,
  },
  stockBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  
  // Sale tag
  saleTag: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 10,
    zIndex: 10,
    maxWidth: 60,
  },
  saleTagText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
