import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { router } from "expo-router";
import { dataService } from "../../services/dataService";

// Extended country codes data including +124
const COUNTRY_CODES = [
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
];

export default function SignUpScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [agree, setAgree] = useState(false);
  // Fix: Properly initialize selectedCountry with +124 as default
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRY_CODES.find(c => c.code === "+124") || COUNTRY_CODES[0]
  );
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Validation functions with custom error messages
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'firstName':
        if (!value.trim()) {
          newErrors.firstName = "First name is required";
        } else if (value.trim().length < 2) {
          newErrors.firstName = "First name must be at least 2 characters";
        } else {
          delete newErrors.firstName;
        }
        break;
        
      case 'lastName':
        if (!value.trim()) {
          newErrors.lastName = "Last name is required";
        } else if (value.trim().length < 2) {
          newErrors.lastName = "Last name must be at least 2 characters";
        } else {
          delete newErrors.lastName;
        }
        break;
        
      case 'email':
        if (!value) {
          newErrors.email = "Email address is required";
        } else if (!value.includes('@')) {
          newErrors.email = "Please enter a valid email address with @";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Please enter a valid email format";
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'phone':
        if (!value) {
          newErrors.phone = "Phone number is required";
        } else if (value.length < 8) {
          newErrors.phone = "Phone number must be at least 8 digits";
        } else {
          delete newErrors.phone;
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors.password = "Password is required";
        } else if (value.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(value)) {
          newErrors.password = "Password must contain uppercase and lowercase letters";
        } else {
          delete newErrors.password;
        }
        break;
        
      case 'confirm':
        if (!value) {
          newErrors.confirm = "Please confirm your password";
        } else if (value !== password) {
          newErrors.confirm = "Passwords do not match";
        } else {
          delete newErrors.confirm;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const isFormValid = firstName.trim().length >= 2 && 
                     lastName.trim().length >= 2 && 
                     email.includes('@') && 
                     /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
                     phone.length >= 8 && 
                     password.length >= 6 && 
                     /(?=.*[a-z])(?=.*[A-Z])/.test(password) &&
                     password === confirm && 
                     agree &&
                     Object.keys(errors).length === 0;

  const onCreate = async () => {
    if (isFormValid) {
      try {
        // Register the user and send OTP
        const registerResult = await dataService.register({
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password,
          phone: selectedCountry.code + phone
        });
        
        if (registerResult.success) {
          // Registration successful, navigate to verify email screen
          router.push({
            pathname: "/verify-email",
            params: {
              email: email,
              phone: selectedCountry.code + phone,
              firstName: firstName,
              lastName: lastName,
              password: password
            }
          });
        } else {
          Alert.alert("Registration Failed", registerResult.message || "Failed to create account. Please try again.");
        }
      } catch (error) {
        console.error('Registration error:', error);
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } else {
      Alert.alert("Error", "Please fill in all fields correctly");
    }
  };

  const selectCountry = (country: typeof COUNTRY_CODES[0]) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
  };

  return (
    <ScrollView style={[{ backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <View style={[styles.topIconShadow, { backgroundColor: colors.card }]}>
          <View style={[styles.topIconCircle, { backgroundColor: colors.card }]}>
            <Image
              source={require("../../../assets/images/signature-cart.png")}
              style={{ width: 40, height: 40, resizeMode: "contain" }}
            />
          </View>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.sub }]}>Join Errand Shop today</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <LabeledInput
          label="First Name"
          placeholder="Enter your first name"
          value={firstName}
          onChangeText={(text: string) => {
            setFirstName(text);
            validateField('firstName', text);
          }}
          error={errors.firstName}
        />

        <LabeledInput
          label="Last Name"
          placeholder="Enter your last name"
          value={lastName}
          onChangeText={(text: string) => {
            setLastName(text);
            validateField('lastName', text);
          }}
          error={errors.lastName}
        />

        <LabeledInput
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={(text: string) => {
            setEmail(text);
            validateField('email', text);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <PhoneInput
          label="Phone Number"
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={(text: string) => {
            setPhone(text);
            validateField('phone', text);
          }}
          selectedCountry={selectedCountry}
          onCountryPress={() => setShowCountryPicker(true)}
          error={errors.phone}
        />

        <LabeledInput
          label="Password"
          value={password}
          onChangeText={(text: string) => {
            setPassword(text);
            validateField('password', text);
          }}
          visible={showPw}
          onToggle={() => setShowPw(!showPw)}
          error={errors.password}
          isPassword
        />

        <LabeledInput
          label="Confirm Password"
          value={confirm}
          onChangeText={(text: string) => {
            setConfirm(text);
            validateField('confirm', text);
          }}
          visible={showPw2}
          onToggle={() => setShowPw2(!showPw2)}
          error={errors.confirm}
          isPassword
        />

        <View style={styles.termsRow}>
          <Pressable style={styles.checkbox} onPress={() => setAgree(!agree)}>
            <Ionicons name={agree ? "checkbox" : "square-outline"} size={20} color={agree ? colors.brand : colors.border} />
          </Pressable>
          <Text style={[styles.termsText, { color: colors.sub }]}>
            I agree to the{" "}
            <Text style={[styles.link, { color: "#E53935" }]}>Terms of Service</Text>
            {" "}and{" "}
            <Text style={[styles.link, { color: "#E53935" }]}>Privacy Policy</Text>
          </Text>
        </View>

        <Pressable
          style={[
            styles.createBtn, 
            { 
              backgroundColor: isFormValid ? colors.brand : colors.muted,
              opacity: isFormValid ? 1 : 0.6,
              shadowOpacity: isFormValid ? 0.25 : 0.1,
              elevation: isFormValid ? 4 : 1,
            }
          ]}
          onPress={onCreate}
          disabled={!isFormValid}
        >
          <Ionicons name="person-add" size={18} color="#fff" />
          <Text style={[styles.createTxt, { fontWeight: isFormValid ? "900" : "700" }]}>Create Account</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={[{ color: colors.sub }]}>Already have an account? </Text>
        <Pressable onPress={() => router.push("/login")}>
          <Text style={[styles.link, { color: "#E53935" }]}>Sign In</Text>
        </Pressable>
      </View>

      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country</Text>
            <Pressable onPress={() => setShowCountryPicker(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          <FlatList
            data={COUNTRY_CODES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.countryItem,
                  { backgroundColor: selectedCountry?.code === item.code ? colors.muted : 'transparent' }
                ]}
                onPress={() => selectCountry(item)}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.countryInfo}>
                  <Text style={[styles.countryName, { color: colors.text }]}>{item.country}</Text>
                  <Text style={[styles.countryCode, { color: colors.sub }]}>{item.code}</Text>
                </View>
                {selectedCountry?.code === item.code && (
                  <Ionicons name="checkmark" size={20} color={colors.brand} />
                )}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

function LabeledInput({ label, value, onChangeText, visible, onToggle, error, isPassword, ...props }: any) {
  const { colors } = useTheme();
  
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          {...props}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !visible}
          placeholderTextColor={colors.sub}
          style={[
            styles.input, 
            { 
              borderColor: error ? '#E53935' : colors.border, 
              backgroundColor: colors.card, 
              color: colors.text 
            }
          ]}
        />
        {isPassword && (
          <Pressable style={styles.eye} onPress={onToggle}>
            <Ionicons 
              name={visible ? "eye" : "eye-off"} 
              size={16} 
              color={colors.sub} 
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: '#E53935' }]}>{error}</Text>
      )}
    </View>
  );
}

function PhoneInput({ label, value, onChangeText, selectedCountry, onCountryPress, error, ...props }: any) {
  const { colors } = useTheme();
  
  // Add default fallback if selectedCountry is undefined
  const country = selectedCountry || COUNTRY_CODES.find(c => c.code === "+124") || COUNTRY_CODES[0];
  
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.phoneContainer}>
        <Pressable 
          style={[
            styles.countrySelector, 
            { 
              borderColor: error ? '#E53935' : colors.border, 
              backgroundColor: colors.card 
            }
          ]} 
          onPress={onCountryPress}
        >
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={[styles.countryCodeText, { color: colors.text }]}>{country.code}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.sub} />
        </Pressable>
        
        <TextInput
          {...props}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.sub}
          keyboardType="phone-pad"
          style={[
            styles.phoneInput, 
            { 
              borderColor: error ? '#E53935' : colors.border, 
              backgroundColor: colors.card, 
              color: colors.text 
            }
          ]}
        />
      </View>
      {error && (
        <Text style={[styles.errorText, { color: '#E53935' }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingTop: 26, paddingBottom: 8 },
  topIconShadow: {
    width: 82, height: 82, borderRadius: 41,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3, marginBottom: 8,
  },
  topIconCircle: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "900" },
  subtitle: { marginTop: 2 },
  card: {
    marginHorizontal: 16, marginTop: 14, padding: 16,
    borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  label: { fontWeight: "700", marginBottom: 6 },
  input: {
    height: 46, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
  },
  phoneInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  countryCodeText: {
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  eye: { 
    position: "absolute", 
    right: 12, 
    top: 12,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    height: 24,
    width: 24,
  },
  termsRow: { flexDirection: "row", alignItems: "center", marginTop: 2, marginBottom: 10 },
  checkbox: { marginRight: 8 },
  termsText: { flex: 1, flexWrap: "wrap" },
  link: { fontWeight: "800" },
  createBtn: {
    flexDirection: "row", gap: 8,
    borderRadius: 12, height: 48, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  createTxt: { color: "#fff", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginVertical: 18 },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  flag: {
    fontSize: 24,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  countryCode: {
    fontSize: 14,
    marginTop: 2,
  },
});
