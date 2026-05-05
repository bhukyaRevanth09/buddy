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
} from "react-native";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.js";

// Ensure this IP is correct for your local machine
const API_URL = "http://192.168.0.109:9090/api/buddy/buddy-login";

export default function BuddyLoginScreen({ navigation }) {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let newErrors = {};
    if (!identifier) newErrors.identifier = "Email is required";
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);

    const payload = {
      email: identifier.trim().toLowerCase(),
      password,
      role: "buddy",
    };

    try {
      const res = await axios.post(API_URL, payload);
      
      if (res?.data?.success) {
        // ✅ PASS THE WHOLE DATA OBJECT
        // The AuthContext handles SecureStore internally.
        await login("buddy", res.data); 
        // Navigation happens automatically via RootNavigation state change
      } else {
        Alert.alert("Login Failed", res.data?.message || "Invalid credentials");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Check your internet connection";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Buddy Login</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            placeholder="Enter your email"
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              if (errors.identifier) setErrors({ ...errors, identifier: "" });
            }}
            style={[styles.input, errors.identifier && styles.errorInput]}
            autoCapitalize="none"
          />
          {errors.identifier && <Text style={styles.errorText}>{errors.identifier}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              placeholder="Enter password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: "" });
              }}
              style={[styles.input, { flex: 1 }, errors.password && styles.errorInput]}
            />
            <TouchableOpacity style={styles.eye} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login as Buddy</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("BuddyRegister")}>
          <Text style={styles.link}>Don’t have account? <Text style={styles.boldLink}>Register</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 30, color: "#1a1a1a" },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 14, borderRadius: 12, fontSize: 16, backgroundColor: "#f9f9f9" },
  passwordWrapper: { flexDirection: "row", alignItems: "center" },
  errorInput: { borderColor: "#ff4d4d" },
  errorText: { color: "#ff4d4d", marginTop: 4, fontSize: 13 },
  button: { backgroundColor: "#000", padding: 18, borderRadius: 12, marginTop: 20, alignItems: "center" },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  link: { marginTop: 25, textAlign: "center", color: "#666", fontSize: 15 },
  boldLink: { color: "#007AFF", fontWeight: "bold" },
  eye: { position: "absolute", right: 15 },
  eyeText: { color: "#007AFF", fontWeight: "600" },
});