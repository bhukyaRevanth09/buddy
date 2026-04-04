import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../context/AuthContext";

export default function BuddyLoginScreen({ navigation }) {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔐 LOGIN FUNCTION
  const handleLogin = async () => {
    if (!identifier || !password) {
      return alert("Enter email/phone and password");
    }

    const isEmail = /\S+@\S+\.\S+/.test(identifier);

    const payload = {
      email: isEmail ? identifier : null,
      phone: !isEmail ? identifier : null,
      password,
      role: "buddy",
    };

    try {
      setLoading(true);

      const res = await axios.post(
        "http://10.0.0.19:9090/api/buddy/buddy-login",
        payload
      );

      console.log("LOGIN:", res.data);

      if (res?.data?.success) {
        await SecureStore.setItemAsync("accessToken", res.data.accessToken);
        await SecureStore.setItemAsync("refreshToken", res.data.refreshToken);

        login(res.data.role);
      } else {
        alert(res.data.message || "Login failed");
      }

    } catch (err) {
      console.log(err.response?.data || err.message);
      alert(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buddy Login</Text>

      {/* 📧 Email / Phone */}
      <TextInput
        placeholder="Email or Phone"
        value={identifier}
        onChangeText={setIdentifier}
        style={styles.input}
      />

      {/* 🔒 Password with Show/Hide */}
      <View style={{ position: "relative" }}>
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.eye}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.eyeText}>
            {showPassword ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🔘 LOGIN BUTTON */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.5 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      {/* 🔑 FORGOT PASSWORD */}
      <Text
        style={styles.link}
        onPress={() => navigation.navigate("ForgotPassword")}
      >
        Forgot Password?
      </Text>

      {/* 🔗 REGISTER */}
      <Text
        style={styles.link}
        onPress={() => navigation.navigate("BuddyRegister")}
      >
        Don’t have account? Register
      </Text>
    </View>
  );
}

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  button: {
    backgroundColor: "black",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },

  link: {
    marginTop: 15,
    textAlign: "center",
    color: "blue",
    fontWeight: "bold",
  },

  eye: {
    position: "absolute",
    right: 15,
    top: 15,
  },

  eyeText: {
    color: "gray",
    fontWeight: "bold",
  },
});