import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import api from "../api/Apiclient";

export default function CompleteOtpScreen({ route, navigation }) {
  const { bookingId } = route.params;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert("OTP required", "Please enter the OTP shared by customer");
      return;
    }

    try {
      setLoading(true);

      console.log("🔐 VERIFY COMPLETE OTP:", {
        bookingId,
        otp
      });

      const res = await api.post("/booking/complete", {
        bookingId,
        otp: otp.trim()
      });

      console.log("✅ OTP VERIFY RESPONSE:", res.data);

      if (res.data.success) {
        Alert.alert("Success", "Work completed successfully");

        navigation.reset({
          index: 0,
          routes: [{ name: "BuddyHome" }]
        });
      }
    } catch (err) {
      console.log("❌ OTP VERIFY ERROR:", err?.response?.data || err.message);

      Alert.alert(
        "Verification failed",
        err?.response?.data?.message || "Invalid OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={42} color="#000" />
        </View>

        <Text style={styles.title}>Complete Work</Text>

        <Text style={styles.sub}>
          We sent an OTP to the customer’s email. Ask the customer for the OTP
          and enter it below.
        </Text>

        <Text style={styles.bookingText}>
          Booking ID: {bookingId}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="••••••"
          placeholderTextColor="#B8B8B8"
          keyboardType="number-pad"
          value={otp}
          onChangeText={setOtp}
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity
          style={[
            styles.btn,
            (!otp.trim() || loading) && styles.disabledBtn
          ]}
          onPress={verifyOtp}
          disabled={!otp.trim() || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.btnText}>VERIFY & COMPLETE</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          disabled={loading}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
    justifyContent: "center",
    padding: 20
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }
  },

  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111"
  },

  sub: {
    marginTop: 10,
    color: "#666",
    textAlign: "center",
    lineHeight: 21,
    fontSize: 14
  },

  bookingText: {
    marginTop: 16,
    color: "#999",
    fontSize: 12
  },

  input: {
    marginTop: 26,
    width: "100%",
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#E1E4EA",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 15,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 10,
    color: "#111"
  },

  btn: {
    marginTop: 22,
    width: "100%",
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },

  disabledBtn: {
    backgroundColor: "#BDBDBD"
  },

  btnText: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 0.5
  },

  cancelBtn: {
    marginTop: 16,
    padding: 10
  },

  cancelText: {
    color: "#FF3B30",
    fontWeight: "800"
  }
});