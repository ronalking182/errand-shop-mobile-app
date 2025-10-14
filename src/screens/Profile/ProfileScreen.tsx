import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View, TouchableOpacity, ActionSheetIOS, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeProvider";
import { authService } from "../../services/authService";
import { apiService } from "../../services/apiService";
import { Alert } from "react-native";
import { useAuthStore } from "../../store/auth.store";
import { useUserStore } from "../../store/user.store";
import { useProfile } from "../../hooks/useProfile";
import { useAddresses } from "../../hooks/useAddresses";
// Removed AvatarSelector and testCloudinaryConfig imports as they're no longer needed

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  tint?: string;
  right?: React.ReactNode;
};

function Row({ icon, title, subtitle, onPress, tint, right }: RowProps) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.row, { borderColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: tint || "#FFF3EC" }]}>
          <Ionicons name={icon} size={18} color={colors.brand} />
        </View>
        <View>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
          {!!subtitle && <Text style={[styles.rowSub, { color: colors.sub }]}>{subtitle}</Text>}
        </View>
      </View>
      {right ? right : <Ionicons name="chevron-forward" size={18} color={colors.sub} />}
    </Pressable>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 12 }} />;
}

export default function ProfileScreen() {
  const { mode, setMode, colors } = useTheme();
  const dark = mode === "dark";
  const [appVersion] = useState("1.0.0");
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Get user data from stores and hooks
  const { user } = useAuthStore();
  const { profile, loading, error, fetchProfile, updateProfile } = useProfile();
  const { addresses, loading: addressesLoading, error: addressesError, refreshAddresses } = useAddresses();
  
  // Add focus listener to refresh profile when returning from edit screen
  // Only refresh if we don't have profile data or if there was an error
  useFocusEffect(
    React.useCallback(() => {
      // Check if user is authenticated before fetching data
      if (!user || !user.id) {
        console.log('❌ ProfileScreen focused - User not authenticated, skipping data fetch');
        return;
      }
      
      if (!profile || error) {
        console.log('🔄 ProfileScreen focused - refreshing profile data (no data or error)');
        fetchProfile();
        // Also refresh addresses when profile is refreshed
        console.log('🏠 ProfileScreen focused - refreshing addresses (profile refresh)');
        refreshAddresses();
      } else {
        console.log('🔄 ProfileScreen focused - skipping refresh (data already loaded)');
        // Only refresh addresses if we don't have any addresses loaded
        if (!addresses || addresses.length === 0) {
          console.log('🏠 ProfileScreen focused - refreshing addresses (no addresses loaded)');
          refreshAddresses();
        } else {
          console.log('🏠 ProfileScreen focused - skipping address refresh (addresses already loaded)');
        }
      }
    }, [fetchProfile, profile, error, refreshAddresses, addresses, user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Check if user is authenticated before refreshing data
      if (!user || !user.id) {
        console.log('❌ ProfileScreen refresh - User not authenticated, skipping data refresh');
        return;
      }
      
      await Promise.all([
        fetchProfile(),
        refreshAddresses()
      ]);
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Predefined avatars using properly named avatar files (same as AvatarSelector)
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
  
    
    // Female avatars (only the ones that exist)
    { id: 'female-01', image: require('../../../assets/avatars/female-01.png'), gender: 'female' },
    { id: 'female-02', image: require('../../../assets/avatars/female-02.png'), gender: 'female' },
    { id: 'female-03', image: require('../../../assets/avatars/female-03.png'), gender: 'female' },
    { id: 'female-04', image: require('../../../assets/avatars/female-04.png'), gender: 'female' },
    { id: 'female-05', image: require('../../../assets/avatars/female-05.png'), gender: 'female' },
    { id: 'female-06', image: require('../../../assets/avatars/female-06.png'), gender: 'female' },
  ];

  // Avatar changes are now handled in Personal Information screen only

  // Helper function to render avatar
  const renderAvatar = () => {
    if (!profile?.avatar) {
      // Default placeholder with icon
      return (
        <View style={[styles.avatarContainer]}>
          <View style={[styles.avatar, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="person" size={32} color={colors.sub} />
          </View>
        </View>
      );
    }

    // Check if it's a predefined avatar
    const predefinedAvatar = PREDEFINED_AVATARS.find(avatar => avatar.id === profile.avatar);
    if (predefinedAvatar) {
      return (
        <View style={styles.avatarContainer}>
          <Image
            source={predefinedAvatar.image}
            style={styles.avatar}
          />
        </View>
      );
    }

    // It's a custom uploaded image (URL)
    return (
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: profile.avatar }}
          style={styles.avatar}
        />
      </View>
    );
  };

  // Helper function to get display name
  const getDisplayName = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (profile?.firstName) {
      return profile.firstName;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    return 'User Name';
  };

  // Helper function to format gender
  const formatGender = (gender?: string) => {
    if (!gender) return null;
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };
  
  useEffect(() => {
    // Check authentication status first
    const checkAuthAndFetchProfile = async () => {
      const isLoggedIn = await authService.isLoggedIn();
      const token = await authService.getToken();
      
      console.log('🔐 Auth Status Check:');
      console.log('- Is Logged In:', isLoggedIn);
      console.log('- Has Token:', !!token);
      console.log('- Token Preview:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      // Debug: Log user data from auth store
      console.log('👤 ProfileScreen - User data from auth store:', user);
      console.log('📧 ProfileScreen - User email being displayed:', user?.email || 'user@email.com');
      
      if (!isLoggedIn || !token) {
        console.log('❌ User not authenticated, but not clearing tokens - just redirecting');
        // Don't call authService.logout() here as it clears tokens
        // Just redirect to login without clearing storage
        router.replace('/login');
        return;
      }
      
      // User is authenticated, fetch profile
      fetchProfile();
    };
    
    checkAuthAndFetchProfile();
  }, [user]); // Add user as dependency to log when it changes

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Call the backend logout API
              const response = await apiService.logout();
              if (response.success) {
                // Clear local storage
                await authService.logout();
                // Navigate to login screen
                router.replace("/login");
              } else {
                Alert.alert("Error", response.message || "Failed to logout. Please try again.");
              }
            } catch (error) {
              console.error('Logout error:', error);
              // Even if API call fails, clear local storage and logout
              await authService.logout();
              router.replace("/login");
            }
          },
        },
      ]
    );
  };

  const handlePasswordReset = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Change Password', 'Forgot Password'],
          cancelButtonIndex: 0,
          title: 'Password Options',
          message: 'Choose how you want to reset your password'
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            router.push('/profile/change-password');
          } else if (buttonIndex === 2) {
            router.push('/forgot');
          }
        }
      );
    } else {
      Alert.alert(
        'Password Options',
        'Choose how you want to reset your password',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Change Password', onPress: () => router.push('/profile/change-password') },
          { text: 'Forgot Password', onPress: () => router.push('/forgot') }
        ]
      );
    }
  };



  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={[styles.header, { 
        borderBottomColor: colors.border, 
        backgroundColor: colors.card,
        paddingTop: insets.top + 12
      }]}>
        <Text style={[styles.hTitle, { color: colors.text }]}>Profile Settings</Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
      >
        {/* Top card */}
        <View style={[styles.topCard, { borderColor: colors.border }]}>
          {renderAvatar()}
          <Text style={[styles.name, { color: colors.text }]}>
            {getDisplayName()}
          </Text>
          <Text style={{ color: colors.sub }}>
            {user?.email || 'user@email.com'}
          </Text>
            

          {profile?.phone && (
            <Text style={{ color: colors.sub, fontSize: 14, marginTop: 2 }}>
              {profile.phone}
            </Text>
          )}
          {profile?.gender && (
            <Text style={{ color: colors.sub, fontSize: 14, marginTop: 2 }}>
              {formatGender(profile.gender)}
            </Text>
          )}
          
          {/* Show complete profile button if profile data is incomplete */}
          {(!profile?.firstName || !profile?.lastName || !profile?.phone) && (
            <TouchableOpacity 
              style={{
                backgroundColor: colors.brand,
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 20,
                marginTop: 12
              }}
              onPress={() => router.push('/profile/edit')}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                Complete Your Profile
              </Text>
            </TouchableOpacity>
          )}
          
          {loading && (
            <Text style={{ color: colors.sub, fontSize: 12, marginTop: 4 }}>
              Loading profile...
            </Text>
          )}
          {error && (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: 'red', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
                {error.includes('401') || error.includes('Unauthorized') 
                  ? 'Session expired. Please log in again.' 
                  : `Error: ${error}`}
              </Text>
              <TouchableOpacity 
                style={{
                  backgroundColor: colors.brand,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 12
                }}
                onPress={() => {
                  // Check authentication before retrying profile fetch
                  if (user && user.id) {
                    console.log('🔄 ProfileScreen - Retrying profile fetch (user authenticated)');
                    fetchProfile();
                  } else {
                    console.log('❌ ProfileScreen - Cannot retry, user not authenticated');
                    // Could redirect to login here if needed
                  }
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                  {error.includes('401') || error.includes('Unauthorized') ? 'Login Again' : 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Account Settings */}
        <Text style={[styles.sectionLabel, { color: colors.sub }]}>Account Settings</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row
            icon="person-circle-outline"
            title="Personal Information"
            onPress={() => router.push("/profile/edit")}
          />
          <Divider />
          <Row
            icon="location-outline"
            title="Saved Addresses"
            subtitle={
              addressesLoading 
                ? 'Loading...' 
                : addressesError 
                ? 'Error loading addresses'
                : `${addresses?.length || 0} address${(addresses?.length || 0) !== 1 ? 'es' : ''}`
            }
            onPress={() => router.push("/profile/addresses")}
          />
          <Divider />
          <Row
            icon="key-outline"
            title="Reset Password"
            subtitle="Change your account password"
            onPress={handlePasswordReset}
          />
        </View>

        {/* Support */}
        <Text style={[styles.sectionLabel, { color: colors.sub }]}>Support</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row icon="help-buoy-outline" title="Help & FAQs" onPress={() => router.push("/profile/help")} />
          <Divider />
          <Row icon="chatbubble-ellipses-outline" title="Chat with Support" onPress={() => router.push("/support/chat")} />
          <Divider />
          <Row
            icon="notifications-outline"
            title="Notification"
            onPress={() => router.push("/profile/notifications")}
          />
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.sub }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Switch between light and dark theme"
            right={<Switch value={dark} onValueChange={(v) => setMode(v ? "dark" : "light")} />}
          />
        </View>

        {/* Legal */}
        <Text style={[styles.sectionLabel, { color: colors.sub }]}>Legal</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row 
            icon="document-text-outline" 
            title="Privacy Policy" 
            onPress={() => router.push("/profile/legal")} 
          />
          <Divider />
          <Row 
            icon="newspaper-outline" 
            title="Terms of Service" 
            onPress={() => router.push("/profile/legal?tab=terms")} 
          />
        </View>

        {/* App info */}
        <Text style={[styles.sectionLabel, { color: colors.sub }]}>App Information</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row
            icon="information-circle-outline"
            title="App Version"
            subtitle={appVersion}
            right={<Text style={{ color: colors.sub }} />}
          />
        </View>

        {/* Logout section */}
        <Pressable
          onPress={handleLogout}
          style={[
            styles.logout,
            { borderColor: "#FEE2E2", backgroundColor: "#FFFBFB" },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={{ color: "#EF4444", fontWeight: "800" }}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  hTitle: { fontSize: 18, fontWeight: "900" },

  topCard: {
    alignItems: "center",
    margin: 12,
    paddingVertical: 18,
    borderRadius: 16,
  },
  avatarContainer: {
    backgroundColor: 'white',
    borderRadius: 45,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: { width: 74, height: 74, borderRadius: 37 },
  name: { fontSize: 18, fontWeight: "900" },

  sectionLabel: { marginLeft: 12, marginTop: 8, marginBottom: 6, fontWeight: "700" },
  card: { marginHorizontal: 12, borderRadius: 14, borderWidth: 1 },

  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 12,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontWeight: "800" },
  rowSub: { marginTop: 2 },

  logout: {
    margin: 12, borderWidth: 1, borderRadius: 12,
    alignItems: "center", justifyContent: "center", gap: 8, flexDirection: "row", paddingVertical: 12,
  },
});
