import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAddresses, CreateAddressRequest, Address } from '../hooks/useProfile';
import { useTheme } from '../theme/ThemeProvider';

const AddressScreen: React.FC = () => {
  const { colors } = useTheme();
  const { addresses, loading, error, createAddress, updateAddress, setDefaultAddress, deleteAddress } = useAddresses();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<CreateAddressRequest>({
    label: '',
    type: 'home',
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    is_default: false,
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: colors.sub,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: '#F44336',
      textAlign: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.brand,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    addButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    addressCard: {
      marginHorizontal: 20,
      marginBottom: 15,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    addressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    addressLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    defaultBadge: {
      backgroundColor: colors.brand,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    defaultText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    addressText: {
      fontSize: 14,
      color: colors.sub,
      marginBottom: 4,
    },
    addressActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    setDefaultButton: {
      backgroundColor: colors.brand + '20',
    },
    editButton: {
      backgroundColor: colors.sub + '20',
    },
    deleteButton: {
      backgroundColor: '#F4433620',
    },
    actionText: {
      marginLeft: 4,
      fontSize: 12,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      gap: 6,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.bg,
      color: colors.text,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: 8,
    },
    typeOption: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    typeOptionActive: {
      backgroundColor: colors.brand,
      borderColor: colors.brand,
    },
    typeOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    typeOptionTextActive: {
      color: 'white',
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxActive: {
      backgroundColor: colors.brand,
      borderColor: colors.brand,
    },
    checkboxText: {
      fontSize: 14,
      color: colors.text,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '600',
    },
    saveButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.brand,
      alignItems: 'center',
    },
    saveButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.sub,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  const resetForm = () => {
    setFormData({
      label: '',
      type: 'home',
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      is_default: false,
    });
    setEditingAddress(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (address: Address) => {
    setFormData({
      label: address.label,
      type: address.type,
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
    setEditingAddress(address);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.label.trim() || !formData.street.trim() || !formData.city.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    let result;
    if (editingAddress) {
      result = await updateAddress(Number(editingAddress.id), formData);
    } else {
      result = await createAddress(formData);
    }

    if (result.success) {
      Alert.alert('Success', result.message || 'Address saved successfully');
      setShowAddModal(false);
      resetForm();
    } else {
      Alert.alert('Error', result.message || 'Failed to save address');
    }
  };

  const handleSetDefault = async (address: Address) => {
    if (address.is_default) return;

    const result = await setDefaultAddress(Number(address.id));
    if (result.success) {
      Alert.alert('Success', 'Default address updated');
    } else {
      Alert.alert('Error', result.message || 'Failed to set default address');
    }
  };

  const handleDelete = async (address: Address) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAddress(Number(address.id));
            if (result.success) {
              Alert.alert('Success', 'Address deleted successfully');
            } else {
              Alert.alert('Error', result.message || 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  if (loading && addresses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && addresses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Addresses</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>Add Address</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={colors.sub} />
            <Text style={styles.emptyText}>
              No addresses found.{"\n"}Add your first address to get started.
            </Text>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressLabel}>{address.label}</Text>
                {address.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.addressText}>{address.street}</Text>
              <Text style={styles.addressText}>
                {address.city}, {address.state} {address.postal_code}
              </Text>
              <Text style={styles.addressText}>{address.country}</Text>
              
              <View style={styles.addressActions}>
                {!address.is_default && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.setDefaultButton]}
                    onPress={() => handleSetDefault(address)}
                  >
                    <Ionicons name="star-outline" size={16} color={colors.brand} />
                    <Text style={[styles.actionText, { color: colors.brand }]}>Set Default</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => openEditModal(address)}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.sub} />
                  <Text style={[styles.actionText, { color: colors.sub }]}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(address)}
                >
                  <Ionicons name="trash-outline" size={16} color="#F44336" />
                  <Text style={[styles.actionText, { color: '#F44336' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Address Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Label *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.label}
                  onChangeText={(text) => setFormData({ ...formData, label: text })}
                  placeholder="e.g., Home, Work, etc."
                  placeholderTextColor={colors.sub}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeSelector}>
                  {['home', 'work', 'other'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        formData.type === type && styles.typeOptionActive,
                      ]}
                      onPress={() => setFormData({ ...formData, type })}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          formData.type === type && styles.typeOptionTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Street Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.street}
                  onChangeText={(text) => setFormData({ ...formData, street: text })}
                  placeholder="Enter street address"
                  placeholderTextColor={colors.sub}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder="Enter city"
                  placeholderTextColor={colors.sub}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>State/Province</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text })}
                  placeholder="Enter state or province"
                  placeholderTextColor={colors.sub}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Country</Text>
                <TextInput
                  style={styles.input}
                  value={formData.country}
                  onChangeText={(text) => setFormData({ ...formData, country: text })}
                  placeholder="Enter country"
                  placeholderTextColor={colors.sub}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  value={formData.postal_code}
                  onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
                  placeholder="Enter postal code"
                  placeholderTextColor={colors.sub}
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
              >
                <View style={[styles.checkbox, formData.is_default && styles.checkboxActive]}>
                  {formData.is_default && (
                    <Ionicons name="checkmark" size={12} color="white" />
                  )}
                </View>
                <Text style={styles.checkboxText}>Set as default address</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingAddress ? 'Update' : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddressScreen;