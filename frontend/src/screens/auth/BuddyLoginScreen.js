import React, { useState } from "react";
import {
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
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

import { useAuth } from "../../context/AuthContext.js";

const API_URL = "http://10.112.58.157:9090/api/buddy/buddy-login";

export default function BuddyLoginScreen({ navigation }) {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let newErrors = {};
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!identifier.trim()) {
      newErrors.identifier = "Email is required";
    } else if (!emailRegex.test(identifier.trim())) {
      newErrors.identifier = "Enter a valid email address";
    }

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

    try {
      setLoading(true);

      const payload = {
        email: identifier.trim().toLowerCase(),
        password,
        role: "buddy"
      };

      const res = await axios.post(API_URL, payload);

      if (res?.data?.success) {
        await login("buddy", res.data);
      } else {
        Alert.alert("Login Failed", res.data?.message || "Invalid credentials");
      }
    } catch (error) {
      console.log("BUDDY LOGIN ERROR:", error?.response?.data || error.message);

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Check your internet connection"
      );
    } finally {
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
            <Text style={styles.title}>Buddy Login</Text>
            <Text style={styles.subtitle}>Sign in to continue as a Buddy</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>

            <TextInput
              placeholder="name@example.com"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (errors.identifier) {
                  setErrors((prev) => ({ ...prev, identifier: "" }));
                }
              }}
              style={[styles.input, errors.identifier && styles.errorInput]}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#ADB5BD"
            />

            {errors.identifier && (
              <Text style={styles.errorText}>{errors.identifier}</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>

            <View style={styles.passwordWrapper}>
              <TextInput
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }
                }}
                style={[
                  styles.input,
                  { flex: 1 },
                  errors.password && styles.errorInput
                ]}
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

            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Login as Buddy</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ForgotPassword", { role: "buddy" })
              }
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupBox}
              onPress={() => navigation.navigate("BuddyRegister")}
            >
              <Text style={styles.footerText}>
                Don’t have an account?{" "}
                <Text style={styles.boldLink}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: "#fff"
  },

  container: {
    flexGrow: 1,
    padding: 25,
    justifyContent: "center"
  },

  header: {
    marginBottom: 35
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#212529"
  },

  subtitle: {
    fontSize: 16,
    color: "#6C757D",
    marginTop: 5
  },

  fieldGroup: {
    marginBottom: 20
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8
  },

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

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center"
  },

  eyeBtn: {
    position: "absolute",
    right: 15
  },

  errorInput: {
    borderColor: "#DC3545"
  },

  errorText: {
    color: "#DC3545",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "500"
  },

  loginBtn: {
    backgroundColor: "#000",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10
  },

  btnDisabled: {
    opacity: 0.7
  },

  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold"
  },

  footer: {
    marginTop: 30,
    alignItems: "center"
  },

  linkText: {
    color: "#007AFF",
    fontWeight: "600"
  },

  signupBox: {
    marginTop: 20
  },

  footerText: {
    color: "#6C757D",
    fontSize: 14
  },

  boldLink: {
    color: "#007AFF",
    fontWeight: "bold"
  }
});