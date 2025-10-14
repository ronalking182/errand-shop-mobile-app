import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeProvider';
import { CLOUDINARY_CONFIG, createImageFormData, validateCloudinaryResponse, testCloudinaryConfig } from '../config/cloudinary';

// Predefined avatars using properly named avatar files
const PREDEFINED_AVATARS = [
  // Male avatars
  { id: 'male-01', image: require('../../assets/avatars/male-01.png'), gender: 'male' },
  { id: 'male-02', image: require('../../assets/avatars/male-02.png'), gender: 'male' },
  { id: 'male-03', image: require('../../assets/avatars/male-03.png'), gender: 'male' },
  { id: 'male-04', image: require('../../assets/avatars/male-04.png'), gender: 'male' },
  { id: 'male-05', image: require('../../assets/avatars/male-05.png'), gender: 'male' },
  { id: 'male-06', image: require('../../assets/avatars/male-06.png'), gender: 'male' },
  { id: 'male-07', image: require('../../assets/avatars/male-07.png'), gender: 'male' },
  { id: 'male-08', image: require('../../assets/avatars/male-08.png'), gender: 'male' },
  { id: 'male-09', image: require('../../assets/avatars/male-09.png'), gender: 'male' },
  { id: 'male-10', image: require('../../assets/avatars/male-10.png'), gender: 'male' },

  { id: 'male-12', image: require('../../assets/avatars/male-12.png'), gender: 'male' },
  { id: 'male-13', image: require('../../assets/avatars/male-13.png'), gender: 'male' },
  { id: 'male-14', image: require('../../assets/avatars/male-14.png'), gender: 'male' },
  { id: 'male-15', image: require('../../assets/avatars/male-15.png'), gender: 'male' },
  { id: 'male-16', image: require('../../assets/avatars/male-16.png'), gender: 'male' },
  { id: 'male-17', image: require('../../assets/avatars/male-17.png'), gender: 'male' },
  { id: 'male-18', image: require('../../assets/avatars/male-18.png'), gender: 'male' },
  { id: 'male-19', image: require('../../assets/avatars/male-19.png'), gender: 'male' },

  
  // Female avatars
  { id: 'female-01', image: require('../../assets/avatars/female-01.png'), gender: 'female' },
  { id: 'female-02', image: require('../../assets/avatars/female-02.png'), gender: 'female' },
  { id: 'female-03', image: require('../../assets/avatars/female-03.png'), gender: 'female' },
  { id: 'female-04', image: require('../../assets/avatars/female-04.png'), gender: 'female' },
  { id: 'female-05', image: require('../../assets/avatars/female-05.png'), gender: 'female' },
  { id: 'female-06', image: require('../../assets/avatars/female-06.png'), gender: 'female' },
];

interface AvatarSelectorProps {
  currentAvatar?: string;
  onAvatarChange: (avatar: string) => void;
  userGender?: string;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentAvatar,
  onAvatarChange,
  userGender,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Filter avatars by gender if specified
  const filteredAvatars = userGender && userGender.trim() !== '' 
    ? PREDEFINED_AVATARS.filter(avatar => avatar.gender === userGender.toLowerCase())
    : PREDEFINED_AVATARS;

  // Filter avatars by gender - show all avatars if no gender specified

  const renderCurrentAvatar = () => {
    if (currentAvatar) {
      // Check if it's a predefined avatar
      const predefinedAvatar = PREDEFINED_AVATARS.find(avatar => avatar.id === currentAvatar);
      if (predefinedAvatar) {
        return <Image source={predefinedAvatar.image} style={styles.currentAvatar} />;
      }
      // It's a custom uploaded image URL
      return <Image source={{ uri: currentAvatar }} style={styles.currentAvatar} />;
    }
    
    // Default placeholder
    return (
      <View style={[styles.currentAvatar, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="person" size={32} color={colors.sub} />
      </View>
    );
  };

  const handlePredefinedAvatarSelect = (avatarId: string) => {
    onAvatarChange(avatarId);
    setModalVisible(false);
  };

  const handleImageUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        
        try {
          // Upload to Cloudinary
          const imageUri = result.assets[0].uri;
          const imageType = result.assets[0].type || 'image/jpeg';
          
          console.log('🔄 AvatarSelector: Starting image upload');
          console.log('📷 Image details:', { uri: imageUri, type: imageType });
          console.log('☁️ Cloudinary config:', {
            cloudName: CLOUDINARY_CONFIG.cloudName,
            uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
            apiUrl: CLOUDINARY_CONFIG.apiUrl,
            folder: CLOUDINARY_CONFIG.folder
          });
          
          // Test Cloudinary configuration first
          console.log('🧪 Testing Cloudinary configuration...');
          const testResult = await testCloudinaryConfig();
          console.log('🧪 Test result:', testResult);
          
          const formData = createImageFormData(imageUri, imageType);
          
          // Log FormData contents for debugging
          console.log('📦 FormData created with entries:');
          // Note: FormData entries are not directly loggable, but we know what we added
          
          const response = await fetch(CLOUDINARY_CONFIG.apiUrl, {
            method: 'POST',
            body: formData,
            // Add headers for better debugging
            headers: {
              'Accept': 'application/json',
            },
          });
          
          const responseText = await response.text();
          console.log('📡 Cloudinary response status:', response.status);
          console.log('📡 Cloudinary response headers:', Object.fromEntries(response.headers.entries()));
          console.log('📡 Cloudinary response body:', responseText);
          
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('❌ Failed to parse Cloudinary response:', parseError);
            console.error('❌ Raw response text:', responseText);
            
            // Fallback: Use the local image URI for development
            console.log('🔄 Falling back to local image URI for development');
            Alert.alert(
              'Development Mode', 
              'Using local image for development. In production, please configure Cloudinary properly.',
              [
                {
                  text: 'Use Local Image',
                  onPress: () => {
                    onAvatarChange(imageUri);
                    setModalVisible(false);
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
            return;
          }
          
          if (response.ok) {
            const validatedData = validateCloudinaryResponse(data);
            console.log('✅ Upload successful! URL:', validatedData.secure_url);
            onAvatarChange(validatedData.secure_url);
            setModalVisible(false);
          } else {
            console.error('❌ Upload failed with status:', response.status);
            console.error('❌ Error data:', data);
            
            // Provide more specific error messages based on common Cloudinary errors
            let errorMessage = 'Upload failed';
            let showFallback = false;
            
            if (response.status === 400) {
              if (data.error?.message?.includes('Invalid upload preset')) {
                errorMessage = 'Upload configuration error (Invalid upload preset)';
                showFallback = true;
              } else if (data.error?.message?.includes('File size too large')) {
                errorMessage = 'Image file is too large. Please choose a smaller image.';
              } else {
                errorMessage = data.error?.message || 'Invalid upload request';
                showFallback = true;
              }
            } else if (response.status === 401) {
              errorMessage = 'Upload authentication failed';
              showFallback = true;
            } else if (response.status === 403) {
              errorMessage = 'Upload not allowed';
              showFallback = true;
            } else if (response.status >= 500) {
              errorMessage = 'Server error. Please try again later.';
            } else {
              errorMessage = data.error?.message || `Upload failed with status ${response.status}`;
              showFallback = true;
            }
            
            if (showFallback) {
              // Offer fallback for development
              Alert.alert(
                'Upload Failed',
                `${errorMessage}\n\nWould you like to use the local image for development?`,
                [
                  {
                    text: 'Use Local Image',
                    onPress: () => {
                      console.log('🔄 Using local image as fallback');
                      onAvatarChange(imageUri);
                      setModalVisible(false);
                    }
                  },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            } else {
              throw new Error(errorMessage);
            }
          }
        } catch (error) {
          console.error('❌ Avatar upload error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          
          // Offer fallback option in case of network or other errors
          Alert.alert(
            'Upload Failed',
            `Failed to upload image. Please try again.\n\nError: ${errorMessage}\n\nWould you like to use the local image for development?`,
            [
              {
                text: 'Use Local Image',
                onPress: () => {
                  console.log('🔄 Using local image as fallback after error');
                  const imageUri = result.assets[0].uri;
                  onAvatarChange(imageUri);
                  setModalVisible(false);
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.avatarContainer, { borderColor: colors.border }]}
        onPress={() => setModalVisible(true)}
      >
        {renderCurrentAvatar()}
        <View style={[styles.editIcon, { backgroundColor: colors.brand }]}>
          <Ionicons name="camera" size={16} color="white" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.cancelButton, { color: colors.sub }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Avatar</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Upload Custom Photo */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Upload Photo</Text>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handleImageUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.brand} />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={24} color={colors.brand} />
                )}
                <Text style={[styles.uploadText, { color: colors.text }]}>
                  {uploading ? 'Uploading...' : 'Upload from Gallery'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Predefined Avatars */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Avatar</Text>
              <View style={styles.avatarGrid}>
                {filteredAvatars.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarOption,
                      { borderColor: colors.border },
                      currentAvatar === avatar.id && { borderColor: colors.brand, borderWidth: 2 }
                    ]}
                    onPress={() => handlePredefinedAvatarSelect(avatar.id)}
                  >
                    <Image source={avatar.image} style={styles.avatarOptionImage} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    borderWidth: 2,
    borderRadius: 50,
    padding: 2,
  },
  currentAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
  },
});