import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { useAddresses } from "../../hooks/useAddresses";
import { Address, CreateAddressRequest } from "../../services/addressService";
import { AddressForm } from "../../components/AddressForm";

function AddressCard({ address, onEdit, onDelete, onSetDefault, colors }: {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
  colors: any;
}) {
  return (
    <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.addressHeader}>
        <View style={styles.addressLabelContainer}>
          <Text style={[styles.addressLabel, { color: colors.text }]}>{address.label}</Text>
          {address.is_default && (
            <View style={[styles.defaultBadge, { backgroundColor: colors.brand }]}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <Pressable onPress={() => onEdit(address)} style={styles.editBtn}>
          <Ionicons name="pencil" size={16} color={colors.sub} />
        </Pressable>
      </View>
      
      <Text style={[styles.addressPhone, { color: colors.sub }]}>{address.type.charAt(0).toUpperCase() + address.type.slice(1)}</Text>
      <Text style={[styles.addressText, { color: colors.text }]}>{address.street}</Text>
      <Text style={[styles.addressText, { color: colors.text }]}>{address.city}, {address.state} {address.postal_code}</Text>
      <Text style={[styles.addressText, { color: colors.text }]}>{address.country}</Text>
      
      <View style={styles.addressActions}>
        {!address.is_default && (
          <Pressable onPress={() => onSetDefault(address.id)} style={[styles.actionBtn, { borderColor: colors.border }]}>
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Set as Default</Text>
          </Pressable>
        )}
        <Pressable onPress={() => onDelete(address.id)} style={[styles.actionBtn, styles.deleteBtn]}>
          <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

// AddAddressModal component is now replaced by AddressForm

export default function SavedAddressesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const { addresses, loading, error, createAddress, updateAddress, deleteAddress } = useAddresses();

  const handleAddAddress = async (newAddress: CreateAddressRequest) => {
    try {
      await createAddress(newAddress);
      setShowAddModal(false);
      Alert.alert('Success', 'Address added successfully!');
    } catch (error) {
      console.error('Failed to add address:', error);
      Alert.alert('Error', 'Failed to add address. Please try again.');
    }
  };

  const handleDeleteAddress = (id: number) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(id);
              Alert.alert('Success', 'Address deleted successfully!');
            } catch (error) {
              console.error('Failed to delete address:', error);
              Alert.alert('Error', 'Failed to delete address. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: number) => {
    try {
      const address = addresses.find(addr => addr.id === id);
      if (address) {
        await updateAddress(id, { ...address, is_default: true });
        Alert.alert('Success', 'Default address updated!');
      }
    } catch (error) {
      console.error('Failed to set default address:', error);
      Alert.alert('Error', 'Failed to update default address. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <Pressable style={styles.hBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.hTitle, { color: colors.text }]}>Delivery Address</Text>
        <Pressable onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={20} color={"#FF6B35"} />
          <Text style={[styles.addText, { color: "#FF6B35" }]}>Add New</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Loading addresses...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Error loading addresses</Text>
            <Text style={[styles.emptySub, { color: colors.sub }]}>{error}</Text>
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color={colors.sub} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No addresses saved</Text>
            <Text style={[styles.emptySub, { color: colors.sub }]}>Add your first address to get started with deliveries</Text>
          </View>
        ) : (
          addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={(address) => {/* Handle edit */}}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefault}
              colors={colors}
            />
          ))
        )}
      </ScrollView>

      <AddressForm
         visible={showAddModal}
         onClose={() => setShowAddModal(false)}
         onSave={handleAddAddress}
       />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  hBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  hTitle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 18,
    fontWeight: "900",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addText: {
    fontWeight: "600",
  },
  addressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  addressLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  editBtn: {
    padding: 4,
  },
  addressPhone: {
    fontSize: 14,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 2,
  },
  addressActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteBtn: {
    borderColor: "#EF4444",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    textAlign: "center",
    lineHeight: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "600",
  },
  formRow: {
    flexDirection: "row",
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxText: {
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});