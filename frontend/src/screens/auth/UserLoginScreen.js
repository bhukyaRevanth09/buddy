import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Context & API
import { useAuth } from "../../context/AuthContext.js";
import api from "../../api/Apiclient.js"; 

export default function UserLoginScreen({ navigation }) {
  const { login } = useAuth();

  // Form State
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Input handler
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    let newErrors = {};
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleLogin = async () => {
  if (!validate()) return;
  setLoading(true);

  try {
    const res = await api.post("/user/user-login", {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: "user",
    });

    if (res?.data?.success) {
      // THIS IS THE ONLY LINE YOU NEED.
      // Once this runs, RootNavigation re-renders and swaps stacks.
      await login("user", res.data); 
    } else {
      Alert.alert("Login Failed", res.data?.message || "Invalid credentials");
    }
  } catch (error) {
    Alert.alert("Error", error.response?.data?.message || "Server error");
  } finally {
    // We only set loading false if the login failed. 
    // If it succeeds, this component unmounts anyway.
    setLoading(false); 
  }
};
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.mainWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue as a User</Text>
          </View>

          {/* Email Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              placeholder="name@example.com"
              value={formData.email}
              onChangeText={(text) => handleInputChange("email", text)}
              style={[styles.input, errors.email && styles.errorInput]}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#ADB5BD"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}> 
              <TextInput
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                style={[styles.input, { flex: 1 }, errors.password && styles.errorInput]}
                autoCapitalize="none"
                placeholderTextColor="#ADB5BD"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={22} 
                  color="#6C757D" 
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signupBox}
              onPress={() => navigation.navigate("Home")} // Point this to your registration screen
            >
              <Text style={styles.footerText}>
                Don't have an account? <Text style={styles.boldLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, padding: 25, justifyContent: "center" },
  header: { marginBottom: 35 },
  title: { fontSize: 30, fontWeight: "bold", color: "#212529" },
  subtitle: { fontSize: 16, color: "#6C757D", marginTop: 5 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#495057", marginBottom: 8 },
  input: { 
    height: 55, 
    borderWidth: 1, 
    borderColor: "#DEE2E6", 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    fontSize: 16, 
    backgroundColor: "#F8F9FA",
    color: "#000"
  },
  passwordWrapper: { flexDirection: "row", alignItems: "center" },
  eyeBtn: { position: "absolute", right: 15 },
  errorInput: { borderColor: "#DC3545" },
  errorText: { color: "#DC3545", fontSize: 12, marginTop: 5, fontWeight: "500" },
  loginBtn: { 
    backgroundColor: "#007AFF", 
    height: 55, 
    borderRadius: 12, 
    justifyContent: "center", 
    alignItems: "center", 
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  btnDisabled: { backgroundColor: "#B0D4FF" },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  footer: { marginTop: 30, alignItems: "center" },
  linkText: { color: "#007AFF", fontWeight: "600" },
  signupBox: { marginTop: 20 },
  footerText: { color: "#6C757D", fontSize: 14 },
  boldLink: { color: "#007AFF", fontWeight: "bold" }
});