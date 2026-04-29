import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";

import axios from "axios";
import { useAuth } from "../../context/AuthContext.js";

const BASE_URL = "http://10.0.0.14:9090/api";

export default function OTPScreen({ route }) {
  const { email, role, type, formData } = route?.params || {};
  const { login } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);

  const inputs = useRef([]);

  // TIMER
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text, index) => {
    const clean = text.replace(/[^0-9]/g, "");

    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);

    if (clean && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  // VERIFY OTP
  const handleVerify = async () => {
    const finalOtp = otp.join("");

    if (finalOtp.length !== 6) {
      Alert.alert("Enter valid OTP");
      return;
    }

    try {
      setLoading(true);

      console.log("VERIFY PAYLOAD:", {
        email,
        role,
        otp: finalOtp,
        type,
      });

      // 1 VERIFY OTP
      const verifyRes = await axios.post(
        `${BASE_URL}/auth/verify-otp`,
        {
          email,
          role,
          otp: finalOtp,
          type,
        }
      );

      console.log("VERIFY RESPONSE:", verifyRes.data);

      if (!verifyRes.data.success) {
        Alert.alert("Invalid OTP");
        return;
      }

      let res;

      // 2 REGISTER
      if (type === "register") {
        const endpoint =
          role === "buddy"
            ? "/buddy/buddy-register"
            : "/user/user-register";

        console.log("REGISTER DATA:", formData);

        res = await axios.post(
          `${BASE_URL}${endpoint}`,
          formData
        );
      }

      // 3 LOGIN
      if (type === "login") {
        res = await axios.post(
          `${BASE_URL}/auth/login`,
          { email, role }
        );
      }

      console.log("FINAL RESPONSE:", res?.data);

      // 4 LOGIN CONTEXT
      if (res?.data?.success) {
        console.log("LOGIN ROLE:", role);

        await login(role, res.data);
      } else {
        Alert.alert("Something went wrong");
      }
    } catch (error) {
      console.log("OTP ERROR:", error?.response?.data);

      Alert.alert(
        "Error",
        error?.response?.data?.message || "OTP failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // RESEND OTP
  const resendOtp = async () => {
    try {
      setOtp(["", "", "", "", "", ""]);
      setTimer(30);
      inputs.current[0]?.focus();

      await axios.post(`${BASE_URL}/auth/send-otp`, {
        email,
        role,
        type,
      });

      Alert.alert("OTP resent");
    } catch (err) {
      Alert.alert("Failed to resend OTP");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Verification Code</Text>

          <Text style={styles.subtitle}>
            We have sent a 6 digit code to
          </Text>

          <Text style={styles.emailText}>{email}</Text>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              value={digit}
              style={styles.otpBox}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(text) =>
                handleChange(text, index)
              }
              onKeyPress={(e) =>
                handleKeyPress(e, index)
              }
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              Verify & Continue
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          {timer > 0 ? (
            <Text style={styles.timer}>
              Resend in{" "}
              <Text style={{ fontWeight: "bold" }}>
                {timer}s
              </Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={resendOtp}>
              <Text style={styles.resend}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 8,
    color: "#666",
  },
  emailText: {
    marginTop: 5,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  otpBox: {
    width: 48,
    height: 58,
    borderWidth: 2,
    borderColor: "#eee",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
  },
  timer: {
    color: "#999",
  },
  resend: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
});