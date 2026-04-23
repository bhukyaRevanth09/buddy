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
  Platform, // FIXED: Correct spelling and import
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/Apiclient";

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Email Request, 2: OTP & New Password
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", otp: "", newPassword: "" });

  const handleRequestOtp = async () => {
    if (!form.email.includes("@")) return Alert.alert("Error", "Enter a valid email");
    try {
      setLoading(true);
      const res = await api.post("/auth/send-otp", { 
        email: form.email.trim().toLowerCase(), 
        role: "user", 
        type: "forgot" 
      });
      if (res.data.success) {
        Alert.alert("Code Sent", "Please check your email inbox.");
        setStep(2);
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "User not found");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!form.otp || !form.newPassword) return Alert.alert("Error", "Fill all fields");
    if (form.newPassword.length < 6) return Alert.alert("Error", "Password must be at least 6 characters");

    try {
      setLoading(true);
      const res = await api.post("/auth/restPassword", { ...form, role: "user" });
      if (res.data.success) {
        Alert.alert("Success", "Password updated! Please login with your new credentials.", [
          { 
            text: "Go to Login", 
            onPress: () => {
              // SECURITY BEST PRACTICE: Reset stack to Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'UserLogin' }], 
              });
            } 
          }
        ]);
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Invalid Code or Request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>

        <Text style={styles.title}>{step === 1 ? "Forgot Password" : "Reset Password"}</Text>
        <Text style={styles.subtitle}>
          {step === 1 
            ? "Enter your registered email to receive a verification code." 
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
                onChangeText={(v) => setForm({ ...form, email: v })}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleRequestOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Code</Text>}
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
                onChangeText={(v) => setForm({ ...form, otp: v })}
              />
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passWrapper}>
                <TextInput 
                  style={styles.passInput} 
                  placeholder="Minimum 6 characters"
                  secureTextEntry={!showPass}
                  value={form.newPassword}
                  onChangeText={(v) => setForm({ ...form, newPassword: v })}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Password</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  inner: { 
    padding: 25, 
    // FIXED: Platform usage in styles
    paddingTop: Platform.OS === "ios" ? 60 : 40 
  },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#212529" },
  subtitle: { fontSize: 15, color: "#6C757D", marginTop: 5, marginBottom: 30 },
  card: { 
    backgroundColor: "#fff", 
    padding: 20, 
    borderRadius: 15,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 4 }
    })
  },
  label: { fontSize: 12, fontWeight: "700", color: "#ADB5BD", textTransform: "uppercase", marginTop: 15 },
  input: { borderBottomWidth: 1, borderBottomColor: "#DEE2E6", paddingVertical: 10, fontSize: 16, marginBottom: 10 },
  passWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: "#DEE2E6" },
  passInput: { flex: 1, paddingVertical: 10, fontSize: 16 },
  primaryBtn: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 30 },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 }
});