// Cloudinary configuration for image uploads
export const CLOUDINARY_CONFIG = {
  cloudName: 'dhcoyw9bz',
  uploadPreset: 'errand_shop_preset',
  apiUrl: 'https://api.cloudinary.com/v1_1/dhcoyw9bz/image/upload',
  folder: 'avatars'
};

// Test function to verify Cloudinary configuration
export const testCloudinaryConfig = async (): Promise<void> => {
  try {
    console.log('🧪 Testing Cloudinary configuration...');
    console.log('🧪 Upload preset:', CLOUDINARY_CONFIG.uploadPreset);
    console.log('🧪 Cloud name:', CLOUDINARY_CONFIG.cloudName);
    
    // Create a minimal test with just upload preset (unsigned upload)
    const testFormData = new FormData();
    testFormData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    const response = await fetch(CLOUDINARY_CONFIG.apiUrl, {
      method: 'POST',
      body: testFormData,
    });
    
    console.log('🧪 Test response status:', response.status);
    const responseText = await response.text();
    console.log('🧪 Test response:', responseText);
    
    if (response.status === 200) {
      console.log('✅ Cloudinary configuration is working!');
    } else if (response.status === 400) {
      console.log('⚠️ Upload preset may not exist or is not configured for unsigned uploads');
    } else {
      console.log('❌ Cloudinary configuration issue detected');
    }
    
  } catch (error) {
    console.error('🧪 Cloudinary test error:', error);
  }
};

// Helper function to validate Cloudinary response
export const validateCloudinaryResponse = (response: any) => {
  if (!response) {
    throw new Error('No response received from Cloudinary');
  }
  
  if (response.error) {
    throw new Error(response.error.message || 'Cloudinary upload failed');
  }
  
  if (!response.secure_url) {
    throw new Error('No secure URL received from Cloudinary');
  }
  
  return response;
};

// Helper function to create FormData for image upload
export const createImageFormData = (imageUri: string, fileName: string): FormData => {
  const formData = new FormData();
  
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: fileName,
  } as any);
  
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  // Note: For unsigned uploads, we don't include API key or folder separately
  // The folder should be configured in the upload preset settings
  
  return formData;
};