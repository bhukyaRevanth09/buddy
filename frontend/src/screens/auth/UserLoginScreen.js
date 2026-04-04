import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function UserLoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation
  const validate = () => {
    let newErrors = {};

    if (!phone) {
      newErrors.phone = "Phone is required";
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      newErrors.phone = "Enter a valid phone number";
    }

    if (!password) {
      newErrors.password = "Password required";
    } else if (password.length < 6) {
      newErrors.password = "Min 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Login
  const handleLogin = async () => {
    if (!validate()) return;

    const payload = { phone, password };

    setLoading(true);

    try {
      const response = await axios.post(
        "https://10.0.0.19:9090/api/user/user-login-password",
        payload
      );

      setLoading(false);

      if (response.data.success) {
        const { token, RefreshTkn } = response.data;

        // Save tokens
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("refreshToken", RefreshTkn);

        Alert.alert("Success", response.data.message);

        // Navigate to Home
        navigation.replace("Home");
      }
    } catch (error) {
      setLoading(false);
      console.log("Login error:", error.response?.data || error.message);
      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* Phone */}
      <TextInput
        placeholder="Phone"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          setErrors({ ...errors, phone: "" });
        }}
        style={[styles.input, errors.phone && styles.errorInput]}
        keyboardType="phone-pad"
      />
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      {/* Password */}
      <View style={{ position: "relative" }}>
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors({ ...errors, password: "" });
          }}
          style={[styles.input, errors.password && styles.errorInput]}
        />
        <TouchableOpacity
          style={styles.eye}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, (!phone || !password || loading) && styles.disabledButton]}
        onPress={handleLogin}
        disabled={!phone || !password || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      {/* Forgot Password */}
      <Text
        style={styles.link}
        onPress={() => navigation.navigate("OTP", { type: "forgot", phone })}
      >
        Forgot Password?
      </Text>

      {/* Register */}
      <Text
        style={styles.link}
        onPress={() => navigation.navigate("UserRegister")}
      >
        Don't have an account? Register
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 10, marginBottom: 10 },
  errorInput: { borderColor: "red" },
  errorText: { color: "red", marginBottom: 10, fontSize: 12 },
  button: { backgroundColor: "black", padding: 14, borderRadius: 10, marginTop: 10 },
  disabledButton: { backgroundColor: "gray" },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
  link: { marginTop: 15, textAlign: "center", color: "blue" },
  eye: { position: "absolute", right: 15, top: 15 },
});