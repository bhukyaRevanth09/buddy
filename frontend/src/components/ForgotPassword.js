import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import api from "../api/Apiclient";

export default function ForgotPasswordScreen({ route, navigation }) {
  const role = route?.params?.role || "user";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: ""
  });

  const handleRequestOtp = async () => {
    const email = form.email.trim().toLowerCase();

    if (!email.includes("@")) {
      Alert.alert("Error", "Enter a valid email");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/send-otp", {
        email,
        role,
        type: "forgot"
      });

      if (res.data.success) {
        Alert.alert("Code Sent", "Please check your email inbox.");
        setStep(2);
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Account not found"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const email = form.email.trim().toLowerCase();
    const cleanOtp = form.otp.trim();

    if (!cleanOtp || !form.newPassword) {
      Alert.alert("Error", "Fill all fields");
      return;
    }

    if (cleanOtp.length !== 6) {
      Alert.alert("Error", "OTP must be 6 digits");
      return;
    }

    if (form.newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/reset-password", {
        email,
        otp: cleanOtp,
        newPassword: form.newPassword,
        role
      });

      if (res.data.success) {
        Alert.alert(
          "Success",
          "Password updated! Please login with your new credentials.",
          [
            {
              text: "Go to Login",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: role === "buddy" ? "BuddyLogin" : "UserLogin"
                    }
                  ]
                });
              }
            }
          ]
        );
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Invalid OTP or request"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateOtp = (value) => {
    const onlyNumbers = value.replace(/[^0-9]/g, "");
    setForm({ ...form, otp: onlyNumbers });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (step === 2 ? setStep(1) : navigation.goBack())}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>

        <Text style={styles.title}>
          {step === 1 ? "Forgot Password" : "Reset Password"}
        </Text>

        <Text style={styles.subtitle}>
          {step === 1
            ? `Enter your registered ${role} email to receive a verification code.`
            : `Enter the 6-digit code sent to ${form.email}`}
        </Text>

        <View style={styles.card}>
          {step === 1 ? (
            <>
              <Text style={styles.label}>Email Address</Text>

              <TextInput
                style={styles.input}
                placeholder="example@mail.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                editable={!loading}
                onChangeText={(v) => setForm({ ...form, email: v })}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Verification Code</Text>

              <TextInput
                style={styles.input}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={form.otp}
                editable={!loading}
                onChangeText={updateOtp}
              />

              <Text style={styles.label}>New Password</Text>

              <View style={styles.passWrapper}>
                <TextInput
                  style={styles.passInput}
                  placeholder="Minimum 6 characters"
                  secureTextEntry={!showPass}
                  value={form.newPassword}
                  editable={!loading}
                  onChangeText={(v) =>
                    setForm({ ...form, newPassword: v })
                  }
                />

                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons
                    name={showPass ? "eye-off" : "eye"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA"
  },

  inner: {
    padding: 25,
    paddingTop: Platform.OS === "ios" ? 60 : 40
  },

  backBtn: {
    marginBottom: 20
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529"
  },

  subtitle: {
    fontSize: 15,
    color: "#6C757D",
    marginTop: 5,
    marginBottom: 30
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10
      },
      android: {
        elevation: 4
      }
    })
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ADB5BD",
    textTransform: "uppercase",
    marginTop: 15
  },

  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#DEE2E6",
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10
  },

  passWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#DEE2E6"
  },

  passInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16
  },

  primaryBtn: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30
  },

  disabledBtn: {
    opacity: 0.7
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  }
});