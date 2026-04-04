import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function OTPScreen({ route, navigation }) {
  const { phone, email, role, type, formData } = route.params;
  const { login } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef([]);

  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);

  //  Timer
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  //  Handle OTP Input
  const handleChange = (text, index) => {
    if (text.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  //  Backspace handling
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  //  VERIFY OTP + REGISTER
  const handleVerify = async () => {
    const finalOtp = otp.join("");

    if (finalOtp.length !== 6) {
      return alert("Enter full OTP");
    }

    try {
      setLoading(true);

      // 🔍 Step 1: Verify OTP
      const verifyRes = await axios.post(
        "http://10.0.0.19:9090/api/auth/verify-otp",
        {
          phone,
          role,
          otp: finalOtp,
          type,
        }
      );

      if (!verifyRes.data.success) {
        return alert("Invalid OTP");
      }

      let registerRes;

      // 🧑‍🔧 BUDDY REGISTER
      if (type === "register" && role === "buddy" && verifyRes) {
        const payload = {
          ...formData,
          geoLocation: {
            type: "Point",
            coordinates: [
              formData?.location?.longitude || 0,
              formData?.location?.latitude || 0,
            ],
          },
          address: formData?.location || {},
          accountStatus: "active",
          availabilityStatus: "offline",
          isOnline: false,
        };

        registerRes = await axios.post(
          "http://10.0.0.19:9090/api/buddy/buddy-register",
          payload
        );
      }

      //  USER REGISTER
      else if (type === "register" && role === "user" && verifyRes) {
        registerRes = await axios.post(
          "http://10.0.0.19:9090/api/user/user-register",
          formData
        );
      }

      // 🔐 LOGIN / FORGOT FLOW (optional future)
      else {
        alert("OTP Verified ✅");
        return;
      }

      // ✅ Success
      if (registerRes?.data?.success) {
        alert("Registration Successful 🎉");
        login(role);
      } else {
        alert(registerRes?.data?.message || "Registration failed");
      }

    } catch (err) {
      console.log(err.response?.data || err.message);
      alert("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 RESEND OTP
  const resendOtp = async () => {
    try {
      await axios.post("http://10.0.0.19:9090/api/auth/send-otp", {
        phone,
        role,
        type,
      });

      setTimer(30);
    } catch (err) {
      alert("Error resending OTP");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>

      <Text style={styles.subtitle}>
        Sent to {phone || email}
      </Text>

      {/* 🔢 OTP BOXES */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={styles.otpBox}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
          />
        ))}
      </View>

      {/* 🔐 VERIFY BUTTON */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.5 }]}
        onPress={handleVerify}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify OTP"}
        </Text>
      </TouchableOpacity>

      {/* 🔁 RESEND */}
      {timer > 0 ? (
        <Text style={styles.timer}>Resend OTP in {timer}s</Text>
      ) : (
        <TouchableOpacity onPress={resendOtp}>
          <Text style={styles.resend}>Resend OTP</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
  },

  subtitle: {
    marginVertical: 10,
    color: "gray",
  },

  otpContainer: {
    flexDirection: "row",
    marginVertical: 20,
  },

  otpBox: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: "#ccc",
    textAlign: "center",
    fontSize: 20,
    marginHorizontal: 5,
    borderRadius: 10,
  },

  button: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },

  timer: {
    marginTop: 15,
    color: "gray",
  },

  resend: {
    marginTop: 15,
    color: "blue",
    fontWeight: "bold",
  },
});