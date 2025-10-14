import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { useProductStore } from "../../store/product.store";
import { useCartStore } from "../../store/cart.store";
import { Product } from "../../data/mockDatabase";

type Item = {
  id: string;
  name: string;
  meta: string; // "2 lbs • ₦3.99"
  qty: number;
  checked: boolean;
  productId?: string; // Link to actual product for cart integration
};

// Create initial list items from real product data
const createInitialItems = (products: Product[]): Item[] => {
  if (products.length === 0) return [];
  
  // Use real products to create a realistic shopping list
  const selectedProducts = [
    products.find(p => p.name.includes('Bananas')) || products[4], // Bananas
    products.find(p => p.name.includes('Carrots')) || products[0], // Fresh Carrots
    products.find(p => p.name.includes('Milk')) || products[3], // Whole Milk
    products.find(p => p.name.includes('Apples')) || products[1], // Red Apples
    products.find(p => p.name.includes('Spinach')) || products[2], // Organic Spinach
  ].filter(Boolean) as Product[];

  return selectedProducts.map((product, index) => ({
    id: `list-${product.id}`,
    name: product.name,
    meta: `${product.subtitle} • ₦${product.price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    qty: index === 0 ? 2 : 1, // First item has qty 2, others have qty 1
    checked: false,
    productId: product.id
  }));
};

export default function ListDetailScreen() {
  const { colors } = useTheme();
  const { products, fetchProducts } = useProductStore();
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState("");
  const [listName, setListName] = useState("Go to Groceries");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempListName, setTempListName] = useState(listName);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customItems, setCustomItems] = useState<Item[]>([]);

  // Format price with proper comma formatting
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const { loading } = useProductStore();

  // Start with empty list - items should only be added through search catalog
  // useEffect(() => {
  //   if (products.length > 0 && items.length === 0) {
  //     setItems(createInitialItems(products));
  //   }
  // }, [products, items.length]);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);
  const { addItem } = useCartStore();

  // Fetch products when modal opens or search query changes
  useEffect(() => {
    if (showProductModal) {
      // Fetch all products when modal opens, then filter based on search
      fetchProducts({ search: searchQuery || undefined });
    }
  }, [showProductModal, searchQuery]);

  const toBuyCount = useMemo(() => items.filter(i => !i.checked).length, [items]);

  const toggle = (id: string) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const qty = (id: string, delta: number) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)));

  const add = () => {
    if (!text.trim()) return;
    setItems(prev => [
      { id: String(Date.now()), name: text.trim(), meta: "custom • —", qty: 1, checked: false },
      ...prev,
    ]);
    setText("");
  };

  const handleEditName = () => {
    setTempListName(listName);
    setIsEditingName(true);
  };

  const saveName = () => {
    setListName(tempListName.trim() || "My List");
    setIsEditingName(false);
  };

  const cancelEditName = () => {
    setTempListName(listName);
    setIsEditingName(false);
  };

  const selectAllItems = () => {
    const allChecked = items.every(item => item.checked);
    setItems(prev => prev.map(item => ({ ...item, checked: !allChecked })));
  };

  const addSelectedItemsToCart = () => {
    const selectedItems = items.filter(item => item.checked);
    let addedCount = 0;
    
    selectedItems.forEach(item => {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          // Add item with the specified quantity
          for (let i = 0; i < item.qty; i++) {
            addItem({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image
            });
          }
          addedCount++;
        }
      }
    });
    
    // Deselect all items after adding to cart
    if (addedCount > 0) {
      setItems(prev => prev.map(item => ({ ...item, checked: false })));
      
      Alert.alert(
        "Added to Cart",
        `${addedCount} item${addedCount > 1 ? 's' : ''} added to your cart`,
        [{ text: "OK" }]
      );
    }
  };

  const selectedItemsCount = useMemo(() => items.filter(i => i.checked).length, [items]);

  const filteredProducts = useMemo(() => {
    // Show all products by default, filter only when search query exists
    const realProducts = searchQuery.trim() 
      ? products.filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : products; // Show all products when no search query
    
    // Filter custom items that match search (only when searching)
    const matchingCustomItems = searchQuery.trim()
      ? customItems
          .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(item => ({
            id: item.id,
            name: item.name,
            subtitle: "Custom item",
            price: 0,
            image: "",
            category: "custom",
            description: "Custom item added by user",
            inStock: true,
            stockCount: 999,
            tags: ["Custom"],
            rating: 0,
            reviewCount: 0,
            createdAt: new Date().toISOString()
          }))
      : [];
    
    return [...realProducts, ...matchingCustomItems];
  }, [products, searchQuery, customItems]);

  const addProductToList = (product: Product) => {
    // Check if product is already in the list
    const existingItem = items.find(item => item.productId === product.id);
    if (existingItem) {
      Alert.alert("Item Already Added", `"${product.name}" is already in your list.`);
      return;
    }

    const newItem: Item = {
      id: String(Date.now()),
      name: product.name,
      meta: `${product.subtitle} • ₦${product.price.toFixed(2)}`,
      qty: 1,
      checked: false,
      productId: product.id // This links to the actual product
    };
    
    setItems(prev => [newItem, ...prev]);
    
    // Note: Items are not automatically added to cart anymore
    // Users need to select items and use "Add All to Cart" button
    
    // Don't close modal - allow adding multiple items
    // setShowProductModal(false);
    // setSearchQuery("");
    // setSelectedProduct(null);
  };

  const addCustomItemToCatalog = () => {
    if (!searchQuery.trim()) return;
    
    const customItem: Item = {
      id: `custom-${Date.now()}`,
      name: searchQuery.trim(),
      meta: "Custom item • ₦0.00",
      qty: 1,
      checked: false,
      productId: undefined // No product link for custom items
    };
    
    // Add to custom items catalog
    setCustomItems(prev => [customItem, ...prev]);
    
    // Clear search to show the newly added item in results
    setSearchQuery("");
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable style={styles.hBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.hTitle, { color: colors.text }]}>My Lists</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Title row */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            {isEditingName ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TextInput
                  value={tempListName}
                  onChangeText={setTempListName}
                  style={[styles.title, { color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border, flex: 1 }]}
                  onSubmitEditing={saveName}
                  onBlur={saveName}
                  autoFocus
                />
                <Pressable onPress={saveName} style={[styles.iconBtn, { backgroundColor: colors.brand }]}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </Pressable>
                <Pressable onPress={cancelEditName} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="close" size={18} color={colors.text} />
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={[styles.title, { color: colors.text }]}>{listName}</Text>
                <Text style={{ color: colors.sub }}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
              </>
            )}
          </View>
          {!isEditingName && (
            <Pressable 
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleEditName}
            >
              <Ionicons name="pencil" size={18} color={colors.text} />
            </Pressable>
          )}
        </View>

        {/* Search Catalog Button */}
        <Pressable 
          style={[styles.searchCatalogBtn, { backgroundColor: colors.brand }]} 
          onPress={() => setShowProductModal(true)}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.searchCatalogText}>Search Catalog</Text>
        </Pressable>
      </View>

      {/* Section header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 6 }}>
        <Text style={{ color: colors.text, fontWeight: "900" }}>
          {items.length === 0 ? 'Your List' : `To Buy (${toBuyCount})`}
        </Text>
        <Pressable onPress={selectAllItems}>
          <Text style={{ color: colors.brand, fontWeight: "600" }}>
            {items.every(item => item.checked) ? "Deselect All" : "Select All"}
          </Text>
        </Pressable>
      </View>

      {/* Add All to Cart Button - only show when items are selected */}
      {selectedItemsCount > 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Pressable 
            style={[styles.addToCartBtn, { backgroundColor: colors.brand }]} 
            onPress={addSelectedItemsToCart}
          >
            <Ionicons name="cart" size={20} color="#fff" />
            <Text style={styles.addToCartText}>
              Add {selectedItemsCount} item{selectedItemsCount > 1 ? 's' : ''} to Cart
            </Text>
          </Pressable>
        </View>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: 60 }}>
          <Ionicons name="list-outline" size={64} color={colors.sub} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
            Your list is empty
          </Text>
          <Text style={{ color: colors.sub, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            Tap "Search Catalog" above to add items to your grocery list
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          data={items}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: item.checked ? 0.6 : 1 },
              ]}
            >
              {/* left circle */}
              <Pressable onPress={() => toggle(item.id)} style={[styles.checkbox, { borderColor: colors.border }]}>
                {item.checked && <View style={[styles.dot, { backgroundColor: colors.brand }]} />}
              </Pressable>

              {/* text */}
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: colors.text, fontWeight: "800" }}>{item.name}</Text>
                <Text style={{ color: colors.sub, marginTop: 2 }}>{item.meta}</Text>
              </View>

              {/* qty controls */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <CircleBtn onPress={() => qty(item.id, -1)} icon="remove" />
                <Text style={{ color: colors.text, fontWeight: "800" }}>{item.qty}</Text>
                <CircleBtn onPress={() => qty(item.id, +1)} icon="add" />
                <Pressable 
                  onPress={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                  style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: "#FEE2E2", 
                    borderColor: "#FECACA",
                    borderWidth: 1
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* Product Search Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Grocery Items</Text>
            <Pressable 
              onPress={() => {
                setShowProductModal(false);
                setSearchQuery("");
              }} 
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.sub} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search groceries... (optional)"
                placeholderTextColor={colors.sub}
                style={{ flex: 1, color: colors.text, marginLeft: 8 }}
              />
            </View>
            <Pressable 
              style={[styles.doneBtn, { backgroundColor: colors.brand }]}
              onPress={() => {
                setShowProductModal(false);
                setSearchQuery("");
              }}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
          
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => {
              const isAlreadyAdded = items.some(listItem => listItem.productId === item.id);
              return (
                <Pressable
                  style={[
                    styles.productItem, 
                    { 
                      backgroundColor: colors.card, 
                      borderColor: colors.border,
                      opacity: isAlreadyAdded ? 0.5 : 1
                    }
                  ]}
                  onPress={() => addProductToList(item)}
                  disabled={isAlreadyAdded}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, { color: isAlreadyAdded ? colors.sub : colors.text }]}>
                      {item.name} {isAlreadyAdded && '✓'}
                    </Text>
                    <Text style={[styles.productSubtitle, { color: colors.sub }]}>{item.subtitle}</Text>
                    <Text style={[styles.productPrice, { color: isAlreadyAdded ? colors.sub : colors.brand }]}>
                      ₦{item.price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <Ionicons 
                    name={isAlreadyAdded ? "checkmark-circle" : "add-circle"} 
                    size={24} 
                    color={isAlreadyAdded ? colors.sub : colors.brand} 
                  />
                </Pressable>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                {loading ? (
                  <Text style={{ color: colors.sub, textAlign: "center" }}>Loading products...</Text>
                ) : searchQuery ? (
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: colors.sub, textAlign: "center", marginBottom: 16 }}>
                      No products found for "{searchQuery}"
                    </Text>
                    <Pressable
                      style={[
                        styles.searchCatalogBtn,
                        { backgroundColor: colors.brand, marginTop: 0, width: "100%" }
                      ]}
                      onPress={addCustomItemToCatalog}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.searchCatalogText}>Add "{searchQuery}" to catalog</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={{ color: colors.sub, textAlign: "center" }}>
                    No products available
                  </Text>
                )}
               </View>
             )}
          />
        </View>
      </Modal>

      {/* Bottom CTA - only show when there are items */}
      {items.length > 0 && (
        <View style={[styles.checkoutBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Pressable style={[styles.checkoutBtn, { backgroundColor: colors.brand }]} onPress={() => router.push("/cart")}>
            <Ionicons name="lock-closed" size={16} color="#fff" />
            <Text style={styles.checkoutTxt}>Proceed to Checkout</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function CircleBtn({ onPress, icon }: { onPress: () => void; icon: "add" | "remove" }) {
  return (
    <Pressable onPress={onPress} style={styles.circleBtn}>
      <Ionicons name={icon} size={18} color="#111827" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 50 },
  header: { height: 56, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  hBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  hTitle: { flex: 1, marginLeft: 8, fontSize: 20, fontWeight: "900" },

  title: { fontSize: 22, fontWeight: "900" },
  iconBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  searchCatalogBtn: { marginTop: 12, height: 50, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  searchCatalogText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  addRow: { marginTop: 12, height: 50, borderRadius: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  fabSm: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginLeft: 10 },

  card: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center" },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  circleBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF2F7" },
  drag: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  checkoutBar: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 1, padding: 12 },
  checkoutBtn: { height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  checkoutTxt: { color: "#fff", fontWeight: "900", fontSize: 16 },
  addToCartBtn: { height: 50, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  addToCartText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: { height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  closeBtn: { padding: 8 },
  searchContainer: { padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  searchInput: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  doneBtn: { height: 48, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  doneBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  productItem: { padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: "row", alignItems: "center" },
  productName: { fontSize: 16, fontWeight: "600" },
  productSubtitle: { fontSize: 14, marginTop: 2 },
  productPrice: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  emptyState: { padding: 40 },
});
