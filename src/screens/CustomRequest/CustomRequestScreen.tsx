import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
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
import { useTheme } from "../../theme/ThemeProvider";
import * as ImagePicker from 'expo-image-picker';
import { useCartStore } from "../../store/cart.store";
import { useCustomRequestStore } from "../../store/customRequest.store";
import CustomRequestConfirmationModal from "../../components/CustomRequestConfirmationModal";
import { CLOUDINARY_CONFIG, createImageFormData, validateCloudinaryResponse } from "../../config/cloudinary";

type Props = {
  navigation: any;
  route?: {
    params?: {
      showForm?: boolean;
    };
  };
};

export default function CustomRequestScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentView, setCurrentView] = useState<'form' | 'history'>(
    route?.params?.showForm ? 'form' : 'history'
  );
  
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("Select unit");
  const [preferredBrand, setPreferredBrand] = useState("");

  const [productImage, setProductImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { items: cartItems, addCustomRequest, customRequests } = useCartStore();
  const { createRequest, requests, fetchRequests, isLoading, acceptQuote, declineQuote, deleteRequest, cancelRequest, permanentDeleteRequest } = useCustomRequestStore();

  // Fetch requests when component mounts
  React.useEffect(() => {
    fetchRequests();
  }, []);

  const units = ["kg", "lbs", "pieces", "packs", "bottles", "cans", "boxes"];
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true);
        
        // Upload to Cloudinary
        const imageUri = result.assets[0].uri;
        const fileName = `custom_request_${Date.now()}.jpg`;
        
        const formData = createImageFormData(imageUri, fileName);
        
        const response = await fetch(CLOUDINARY_CONFIG.apiUrl, {
          method: 'POST',
          body: formData,
        });
        
        const responseData = await response.json();
        validateCloudinaryResponse(responseData);
        
        if (responseData.secure_url) {
          setProductImage(responseData.secure_url);
          console.log('✅ Image uploaded to Cloudinary:', responseData.secure_url);
        } else {
          throw new Error('No secure URL received from Cloudinary');
        }
      }
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setProductImage(null);
  };

  const handleSubmitRequest = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    // Show confirmation modal
    setShowConfirmationModal(true);
  };

  const handleConfirmSubmission = async () => {
    try {
      const requestData = {
        title,
        description,
        ...(unit !== 'Select unit' && { unit }),
        ...(quantity && { quantity: parseInt(quantity) }),
        ...(preferredBrand && { preferredBrand }),
        ...(productImage && { productImages: [productImage] })
      };

      const newRequest = await createRequest(requestData);
      
      if (newRequest) {
        // Add the custom request to cart
        const customRequestForCart = {
          ...newRequest,
          isInCart: true,
          status: 'submitted' as const,
          cartPrice: 0 // Pending requests have no price yet
        };
        addCustomRequest(customRequestForCart);
        
        // Reset form and show history
        resetForm();
        setCurrentView('history');
        
        // Refresh the requests list
        await fetchRequests();
      }
      
      setShowConfirmationModal(false);
      
      Alert.alert(
        "Request Submitted",
        "Your custom request has been submitted and added to your cart. You can view it in your request history below."
      );
    } catch (error) {
      Alert.alert("Error", "Failed to submit request. Please try again.");
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setTitle("");
    setDescription("");
    setQuantity("1");
    setUnit("Select unit");
    setPreferredBrand("");
    setProductImage(null);
  };

  const startNewRequest = () => {
    resetForm();
    setCurrentView('form');
  };

  const goBackToHistory = () => {
    setCurrentView('history');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRequests();
    } catch (error) {
      console.error('Error refreshing custom requests:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelSubmission = () => {
    setShowConfirmationModal(false);
  };

  const handleAddToCart = (request: any) => {
    try {
      // Check if the item is already in the cart
      const isAlreadyInCart = customRequests.some((cr: any) => cr.id === request.id);
      
      if (isAlreadyInCart) {
        Alert.alert(
          "Item Already in Cart",
          "This custom request is already in your cart. You can view it in the cart section.",
          [{ text: "OK" }]
        );
        return;
      }
      
      const customRequestForCart = {
        ...request,
        cartPrice: request.adminQuote || 0,
        status: 'customer_accepted' as const,
        isInCart: true
      };
      
      addCustomRequest(customRequestForCart);
      
      Alert.alert(
        "Added to Cart",
        "Custom request has been added to your cart successfully!"
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add request to cart. Please try again.");
    }
  };

  const handleAcceptQuote = async (requestId: string) => {
    try {
      const success = await acceptQuote(requestId);
      if (success) {
        Alert.alert('Success', 'Quote accepted! You can now add this item to your cart.');
        fetchRequests(); // Refresh the requests list
      } else {
        Alert.alert('Error', 'Failed to accept quote');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept quote');
    }
  };

  const handleDeclineQuote = async (requestId: string) => {
    Alert.alert(
      'Decline Quote',
      'Are you sure you want to decline this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await declineQuote(requestId);
              if (success) {
                Alert.alert('Quote Declined', 'The quote has been declined.');
                fetchRequests(); // Refresh the requests list
              } else {
                Alert.alert('Error', 'Failed to decline quote');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to decline quote');
            }
          }
        }
      ]
    );
  };

  const handleDeleteRequest = (requestId: string) => {
    Alert.prompt(
      'Cancel Request',
      'Please provide a reason for cancelling this request (3-500 characters):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason || reason.trim().length < 3 || reason.trim().length > 500) {
              Alert.alert('Invalid Reason', 'Reason must be between 3-500 characters');
              return;
            }
            try {
              const success = await cancelRequest(requestId, reason.trim());
              if (success) {
                Alert.alert('Success', 'Request cancelled successfully.');
                fetchRequests(); // Refresh the requests list
              } else {
                Alert.alert('Error', 'Failed to cancel request');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel request');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handlePermanentDelete = (requestId: string) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to permanently delete this cancelled request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await permanentDeleteRequest(requestId);
              if (success) {
                Alert.alert('Success', 'Request deleted permanently.');
                fetchRequests(); // Refresh the requests list
              } else {
                Alert.alert('Error', 'Failed to delete request');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete request');
            }
          },
        },
      ]
    );
  };

  const renderTabBar = () => {
    return (
      <View style={styles.tabBar}>
        <Pressable
          style={[
            styles.tabButton,
            currentView === 'history' && styles.activeTabButton,
            { borderColor: colors.border }
          ]}
          onPress={() => setCurrentView('history')}
        >
          <Text style={[
            styles.tabButtonText,
            { color: currentView === 'history' ? '#FF7A2F' : colors.sub }
          ]}>
            History
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tabButton,
            currentView === 'form' && styles.activeTabButton,
            { borderColor: colors.border }
          ]}
          onPress={startNewRequest}
        >
          <Text style={[
            styles.tabButtonText,
            { color: currentView === 'form' ? '#FF7A2F' : colors.sub }
          ]}>
            New Request
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderHistoryView = () => {
    return (
      <View style={styles.stepContent}>
        <View style={styles.historyHeader}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>Request History</Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.sub }]}>Loading requests...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.sub }]}>No custom requests yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.sub }]}>Create your first custom request to get started</Text>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.brand}
              />
            }
          >
            {requests.map((request) => {
              // Handle actual API response fields: submittedAt, updatedAt
              const createdDate = (request as any).submittedAt || (request as any).updatedAt || (request as any).created_at || request.createdAt;
              const formattedDate = createdDate ? new Date(createdDate).toLocaleDateString() : 'Invalid Date';
              
              return (
                <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.requestHeader}>
                    <Text style={[styles.requestTitle, { color: colors.text }]}>{(request as any).items?.[0]?.name || 'Custom Request'}</Text>
                    <View style={styles.requestHeaderRight}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                        <Text style={styles.statusText}>{request.status.replace('_', ' ').toUpperCase()}</Text>
                      </View>
                      <Pressable
                        style={[styles.deleteBtn, (request.status === 'cancelled' || request.status === 'customer_accepted') && styles.disabledBtn]}
                        onPress={(request.status === 'cancelled' || request.status === 'customer_accepted') ? undefined : () => handleDeleteRequest(request.id)}
                        disabled={request.status === 'cancelled' || request.status === 'customer_accepted'}
                      >
                        <Ionicons 
                          name="trash" 
                          size={18} 
                          color={(request.status === 'cancelled' || request.status === 'customer_accepted') ? '#9CA3AF' : '#EF4444'} 
                        />
                      </Pressable>
                    </View>
                  </View>
                  
                  <Text style={[styles.requestDescription, { color: colors.sub }]} numberOfLines={2}>
                    {(request as any).items?.[0]?.description || (request as any).notes || 'No description'}
                  </Text>
                  
                  {/* Display product images if available */}
                  {(request as any).items?.[0]?.images && (request as any).items[0].images.length > 0 ? (
                    <View style={styles.requestImagesContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.requestImagesScroll}>
                        {(request as any).items[0].images.map((imageUri: string, index: number) => (
                          <Image 
                            key={index} 
                            source={{ uri: imageUri }} 
                            style={styles.requestImage}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                  
                  <View style={styles.requestDetailsRow}>
                    {request.quantity ? (
                      <Text style={[styles.requestDetail, { color: colors.sub }]}>Qty: {`${request.quantity}${request.unit ? ` ${request.unit}` : ''}`}</Text>
                    ) : null}
                    {request.preferredBrand ? (
                      <Text style={[styles.requestDetail, { color: colors.sub }]}>Brand: {request.preferredBrand}</Text>
                    ) : null}
                  </View>
                  
                  {request.adminQuote ? (
                    <Text style={[styles.requestQuote, { color: '#10B981' }]}>Quote: ₦{request.adminQuote}</Text>
                  ) : null}
                  
                  {/* Accept/Decline buttons for quote_sent status */}
                  {request.status === 'quote_sent' && request.adminQuote ? (
                    <View style={styles.quoteActionsContainer}>
                      <Pressable
                        style={[styles.quoteActionBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => handleDeclineQuote(request.id)}
                      >
                        <Text style={styles.quoteActionBtnText}>Decline</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.quoteActionBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => handleAcceptQuote(request.id)}
                      >
                        <Text style={styles.quoteActionBtnText}>Accept</Text>
                      </Pressable>
                    </View>
                  ) : null}
                  
                  {/* Add to Cart button - only show for customer_accepted requests with quotes */}
                  {request.status === 'customer_accepted' && typeof request.adminQuote === 'number' ? (
                    <Pressable
                      style={[styles.addToCartBtn, { backgroundColor: '#10B981' }]}
                      onPress={() => handleAddToCart(request)}
                    >
                      <Ionicons name="cart" size={16} color="white" style={{ marginRight: 6 }} />
                      <Text style={styles.addToCartBtnText}>Add to Cart</Text>
                    </Pressable>
                  ) : null}
                  
                  <Text style={[styles.requestDate, { color: colors.sub }]}>
                    {formattedDate}
                  </Text>
                  
                  {/* Remove button for cancelled requests */}
                  {request.status === 'cancelled' && (
                    <Pressable
                      style={[styles.removeBtn, { backgroundColor: '#DC2626' }]}
                      onPress={() => handlePermanentDelete(request.id)}
                    >
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return '#F59E0B';
      case 'under_review':
        return '#60A5FA';
      case 'quote_sent':
        return '#10B981';
      case 'customer_accepted':
        return '#3B82F6';
      case 'approved':
        return '#10B981';
      case 'customer_declined':
        return '#EF4444';
      case 'cancelled':
        return '#EF4444';
      case 'in_cart':
        return '#8B5CF6';
      default:
        return '#9CA3AF';
    }
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        <Text style={[styles.stepText, { color: colors.text }]}>Step {currentStep} of 3</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: "#FF7A2F", 
                width: `${(currentStep / 3) * 100}%` 
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Item Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Enter request title"
          placeholderTextColor={colors.sub}
          value={title}
          onChangeText={setTitle}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Describe your custom request in detail"
          placeholderTextColor={colors.sub}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={[styles.label, { color: colors.text }]}>Quantity (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="1"
            placeholderTextColor={colors.sub}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
        </View>
        
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.label, { color: colors.text }]}>Unit (Optional)</Text>
          <Pressable
            style={[styles.input, styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowUnitPicker(!showUnitPicker)}
          >
            <Text style={[styles.pickerText, { color: unit === "Select unit" ? colors.sub : colors.text }]}>
              {unit}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.sub} />
          </Pressable>
          
          {showUnitPicker && (
            <View style={[styles.unitDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {units.map((u) => (
                <Pressable
                  key={u}
                  style={styles.unitOption}
                  onPress={() => {
                    setUnit(u);
                    setShowUnitPicker(false);
                  }}
                >
                  <Text style={[styles.unitOptionText, { color: colors.text }]}>{u}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Preferred Brand (Optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Any specific brand you prefer"
          placeholderTextColor={colors.sub}
          value={preferredBrand}
          onChangeText={setPreferredBrand}
        />
      </View>



      {/* Next Button */}
      <Pressable
        style={[styles.primaryBtn, { backgroundColor: "#FF7A2F", marginTop: 24 }]}
        onPress={() => {
          if (!title.trim()) {
            Alert.alert("Error", "Please enter a title");
            return;
          }
          if (!description.trim()) {
            Alert.alert("Error", "Please enter a description");
            return;
          }
          setCurrentStep(2);
        }}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
      </Pressable>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Product Photos</Text>
      <Text style={[styles.stepSubtitle, { color: colors.sub }]}>
        Add photos to help us identify the item
      </Text>
      
      <View style={styles.imageGrid}>
        {productImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: productImage }} style={styles.productImage} />
            <Pressable
              style={styles.removeImageBtn}
              onPress={removeImage}
            >
              <Ionicons name="close" size={16} color="white" />
            </Pressable>
          </View>
        ) : (
          <Pressable 
            style={[styles.addImageBtn, { borderColor: colors.border, opacity: isUploadingImage ? 0.5 : 1 }]} 
            onPress={handleImagePicker}
            disabled={isUploadingImage}
          >
            <Ionicons name={isUploadingImage ? "hourglass" : "camera"} size={24} color={colors.sub} />
            <Text style={[styles.addImageText, { color: colors.sub }]}>
              {isUploadingImage ? "Uploading..." : "Add Photo"}
            </Text>
          </Pressable>
        )}
      </View>
      
      <Text style={[styles.imageNote, { color: colors.sub }]}>Add one photo to help us identify the item</Text>

      {/* Navigation Buttons */}
      <View style={[styles.row, { marginTop: 24, gap: 12 }]}>
        <Pressable
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
          onPress={() => setCurrentStep(1)}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Back</Text>
        </Pressable>
        
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: "#FF7A2F", flex: 0.7 }]}
          onPress={() => setCurrentStep(3)}
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Review & Submit</Text>
      
      <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.reviewLabel, { color: colors.sub }]}>Title</Text>
        <Text style={[styles.reviewValue, { color: colors.text }]}>{title}</Text>
        
        <Text style={[styles.reviewLabel, { color: colors.sub }]}>Description</Text>
        <Text style={[styles.reviewValue, { color: colors.text }]}>{description}</Text>
        
        {(quantity || unit !== 'Select unit') && (
          <>
            <Text style={[styles.reviewLabel, { color: colors.sub }]}>Quantity</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>
              {`${quantity || ''}${unit !== 'Select unit' ? ` ${unit}` : ''}`}
            </Text>
          </>
        )}
        
        {preferredBrand && (
          <>
            <Text style={[styles.reviewLabel, { color: colors.sub }]}>Preferred Brand</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>{preferredBrand}</Text>
          </>
        )}
        

        
        {productImage && (
          <>
            <Text style={[styles.reviewLabel, { color: colors.sub }]}>Photo</Text>
            <View style={styles.reviewImages}>
              <Image source={{ uri: productImage }} style={styles.reviewImage} />
            </View>
          </>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={[styles.row, { marginTop: 24, gap: 12 }]}>
        <Pressable
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
          onPress={() => setCurrentStep(2)}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Back</Text>
        </Pressable>
        
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: "#FF7A2F", flex: 0.7 }]}
          onPress={handleSubmitRequest}
        >
          <Text style={styles.primaryBtnText}>Submit Request</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={currentView === 'history' ? () => navigation.back() : goBackToHistory} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {currentView === 'history' ? 'Custom Requests' : 'Custom Request'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Bar - always visible */}
      {renderTabBar()}
      
      {currentView === 'form' && renderStepIndicator()}

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {currentView === 'history' ? (
          renderHistoryView()
        ) : (
          <>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </>
        )}
      </ScrollView>

      <CustomRequestConfirmationModal
        visible={showConfirmationModal}
        onAgree={handleConfirmSubmission}
        onClose={handleCancelSubmission}
        hasCartItems={cartItems.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  stepIndicator: {
    padding: 16,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  stepContent: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: "row",
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: {
    fontSize: 16,
  },
  unitDropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 1000,
    maxHeight: 200,
  },
  unitOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  unitOptionText: {
    fontSize: 16,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  imageContainer: {
    position: "relative",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageText: {
    fontSize: 12,
    marginTop: 4,
  },
  imageNote: {
    fontSize: 12,
    textAlign: "center",
  },
  reviewCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  reviewImages: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  reviewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  secondaryBtn: {
    flex: 0.3,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  requestCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  requestHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  requestDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  requestDetail: {
    fontSize: 12,
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    marginTop: 8,
  },
  requestImagesContainer: {
    marginVertical: 8,
  },
  requestImagesScroll: {
    flexDirection: 'row',
  },
  requestImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  requestDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  requestQuote: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  addToCartBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  quoteActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quoteActionBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteActionBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    borderColor: '#FF7A2F',
    backgroundColor: 'rgba(255, 122, 47, 0.1)',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  removeBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});