import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { CreateAddressRequest } from '../services/addressService';

interface AddressFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (address: CreateAddressRequest) => Promise<void>;
}

export const AddressForm: React.FC<AddressFormProps> = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: 'Home',
    type: 'home' as 'home' | 'work' | 'other',
    street: '',
    city: '',
    state: '',
    country: 'United States',
    postal_code: '',
    is_default: false,
  });

  const handleSave = async () => {
    if (!formData.street || !formData.city || !formData.state || !formData.postal_code) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      
      // Reset form
      setFormData({
        label: 'Home',
        type: 'home',
        street: '',
        city: '',
        state: '',
        country: 'United States',
        postal_code: '',
        is_default: false,
      });
      
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add New Address</Text>
          <Pressable onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveBtn, { color: loading ? colors.sub : '#EF4444' }]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {/* Label and Type Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Label</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={formData.label}
                onChangeText={(value) => updateFormData('label', value)}
                placeholder="Home"
                placeholderTextColor={colors.sub}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Type</Text>
              <View style={[styles.selectInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.selectText, { color: colors.text }]}>{formData.type}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.sub} />
              </View>
            </View>
          </View>

          {/* Street Address */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Street Address *</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={formData.street}
              onChangeText={(value) => updateFormData('street', value)}
              placeholder="123 Main Street"
              placeholderTextColor={colors.sub}
            />
          </View>

          {/* City and State Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 2, marginRight: 8 }]}>
              <Text style={[styles.formLabel, { color: colors.text }]}>City *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={formData.city}
                onChangeText={(value) => updateFormData('city', value)}
                placeholder="New York"
                placeholderTextColor={colors.sub}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.formLabel, { color: colors.text }]}>State *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={formData.state}
                onChangeText={(value) => updateFormData('state', value)}
                placeholder="NY"
                placeholderTextColor={colors.sub}
              />
            </View>
          </View>

          {/* Postal Code */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Postal Code *</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={formData.postal_code}
              onChangeText={(value) => updateFormData('postal_code', value)}
              placeholder="10001"
              placeholderTextColor={colors.sub}
              keyboardType="numeric"
            />
          </View>

          {/* Country */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Country</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={formData.country}
              onChangeText={(value) => updateFormData('country', value)}
              placeholder="United States"
              placeholderTextColor={colors.sub}
            />
          </View>

          {/* Set as Default */}
          <View style={styles.defaultOption}>
            <Pressable
              style={[styles.checkbox, { borderColor: colors.border, backgroundColor: formData.is_default ? '#EF4444' : 'transparent' }]}
              onPress={() => updateFormData('is_default', !formData.is_default)}
            >
              {formData.is_default && <Ionicons name="checkmark" size={16} color="#fff" />}
            </Pressable>
            <Text style={[styles.defaultText, { color: colors.text }]}>Set as default address</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveBtn: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  selectInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    textTransform: 'capitalize',
  },
  defaultOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultText: {
    fontSize: 16,
  },
});