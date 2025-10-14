import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "../../theme/ThemeProvider";
import { useProfile } from "../../hooks/useProfile";
import { useAuthStore } from "../../store/auth.store";
import { AvatarSelector } from "../../components/AvatarSelector";

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, fetchProfile, loading: profileLoading } = useProfile();
  const { user } = useAuthStore();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Male");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated before fetching profile
    const checkAuthAndFetchProfile = async () => {
      console.log('🔍 EditProfileScreen - User data from auth store:', user);
      console.log('📧 EditProfileScreen - User email:', user?.email);
      
      // Only fetch profile if user is authenticated
      if (user && user.id) {
        console.log('✅ EditProfileScreen - User authenticated, fetching profile');
        fetchProfile();
      } else {
        console.log('❌ EditProfileScreen - User not authenticated, skipping profile fetch');
      }
    };
    
    checkAuthAndFetchProfile();
  }, [user]);

  useEffect(() => {
    if (profile) {
      console.log('📋 EditProfileScreen - Profile data loaded:', profile);
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setPhone(profile.phone || "");
      setGender(profile.gender || "");
      setAvatar(profile.avatar || "");
    } else {
      console.log('⚠️ EditProfileScreen - No profile data available');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 EditProfileScreen: Attempting to update profile with data:', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        gender,
        avatar
      });
      
      const result = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        gender,
        avatar
      });
      
      console.log('📥 EditProfileScreen: Update result received:', result);
      
      if (result.success) {
        console.log('✅ EditProfileScreen: Profile update successful');
        // Refresh profile data to ensure it's up to date
        await fetchProfile();
        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        console.log('❌ EditProfileScreen: Profile update failed:', result.message);
        Alert.alert("Error", result.message || "Failed to update profile");
      }
    } catch (error) {
      console.log('❌ EditProfileScreen: Profile update failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert("Error", `Failed to update profile: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = [
    styles.input,
    { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          borderBottomColor: colors.border, 
          backgroundColor: colors.card,
          paddingTop: insets.top + 12
        }
      ]}>
        <Pressable style={styles.hBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.hTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
        {profileLoading && (
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <ActivityIndicator size="small" color={colors.brand} />
            <Text style={{ color: colors.sub, marginTop: 8 }}>Loading profile...</Text>
          </View>
        )}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <AvatarSelector
             currentAvatar={avatar}
             onAvatarChange={setAvatar}
             userGender={gender}
           />
        </View>

        <Text style={[styles.label, { color: colors.sub }]}>First Name *</Text>
        <TextInput 
          style={fieldStyle} 
          value={firstName} 
          onChangeText={setFirstName} 
          placeholder="First name" 
          placeholderTextColor={colors.sub} 
        />

        <Text style={[styles.label, { color: colors.sub }]}>Last Name *</Text>
        <TextInput 
          style={fieldStyle} 
          value={lastName} 
          onChangeText={setLastName} 
          placeholder="Last name" 
          placeholderTextColor={colors.sub} 
        />

        <Text style={[styles.label, { color: colors.sub }]}>Email</Text>
        <TextInput 
          style={[fieldStyle, { opacity: 0.6 }]} 
          value={user?.email || ""} 
          editable={false}
          placeholder="Email" 
          placeholderTextColor={colors.sub} 
        />

        <Text style={[styles.label, { color: colors.sub }]}>Phone Number</Text>
        <TextInput 
          style={fieldStyle} 
          value={phone} 
          onChangeText={setPhone} 
          keyboardType="phone-pad" 
          placeholder="Phone number" 
          placeholderTextColor={colors.sub} 
        />

        <Text style={[styles.label, { color: colors.sub }]}>Gender</Text>
        <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Picker
            selectedValue={gender}
            onValueChange={setGender}
            style={{ color: colors.text }}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
          <Pressable 
            onPress={() => router.back()} 
            style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.card }]}
            disabled={loading}
          >
            <Text style={{ color: colors.text, fontWeight: "700" }}>Cancel</Text>
          </Pressable>
          <Pressable 
            onPress={handleSave} 
            style={[styles.btn, { backgroundColor: colors.brand }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700" }}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1 },
  hBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  hTitle: { flex: 1, marginLeft: 10, fontSize: 18, fontWeight: "900" },

  label: { marginTop: 8, marginBottom: 6, fontWeight: "700" },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 8,
  },
  btn: {
    flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  pickerContainer: {
    borderWidth: 1, borderRadius: 10, marginBottom: 8, overflow: "hidden",
  },
});
