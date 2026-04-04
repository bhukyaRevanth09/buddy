import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import axios from "axios";
import * as Location from "expo-location";

export default function UserRegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: { city: "", state: "", pincode: "" },
    geoLocation: { latitude: "", longitude: "" },
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔹 Auto-fill location and address
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Allow location access to auto-fill address");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      setForm((prev) => ({
        ...prev,
        geoLocation: { latitude: latitude.toString(), longitude: longitude.toString() },
      }));

      const addr = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addr.length > 0) {
        const a = addr[0];
        setForm((prev) => ({
          ...prev,
          address: {
            city: a.city || "",
            state: a.region || "",
            pincode: a.postalCode || "",
          },
        }));
      }
    })();
  }, []);

  const handleChange = (key, value, subKey = null) => {
    if (subKey) setForm({ ...form, [key]: { ...form[key], [subKey]: value } });
    else setForm({ ...form, [key]: value });

    setErrors({ ...errors, [key]: "" });
  };

  const validate = () => {
    let newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
    if (!form.password) newErrors.password = "Password required";
    else if (form.password.length < 6) newErrors.password = "Min 6 characters";
    if (!form.confirmPassword) newErrors.confirmPassword = "Confirm your password";
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!form.phone) newErrors.phone = "Phone required";
    else if (!/^[6-9]\d{9}$/.test(form.phone)) newErrors.phone = "Invalid phone";

    if (!form.address.city) newErrors.city = "City required";
    if (!form.address.state) newErrors.state = "State required";
    if (!form.address.pincode) newErrors.pincode = "Pincode required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Register → Send OTP
  const handleRegister = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      // Send OTP first
      await axios.post("http://10.0.0.19:9090/api/auth/send-otp", {
        phone: form.phone,
        email: form.email,
        password: form.password,
        role: "user",
        type: "register",
      });

      const { confirmPassword, ...cleanForm } = form;

      // Include hidden geoLocation in payload
      const payload = {
        ...cleanForm,
        geoLocation: cleanForm.geoLocation,
      };

      // Navigate to OTP screen
      navigation.navigate("OTP", {
        phone: form.phone,
        email: form.email,
        role: "user",
        type: "register",
        formData: payload,
      });
    } catch (err) {
      console.log(err.response?.data || err.message);
      Alert.alert("Error", "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {/* Name */}
      <TextInput
        placeholder="Full Name"
        value={form.name}
        onChangeText={(v) => handleChange("name", v)}
        style={[styles.input, errors.name && styles.errorInput]}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      {/* Email */}
      <TextInput
        placeholder="Email"
        value={form.email}
        onChangeText={(v) => handleChange("email", v)}
        style={[styles.input, errors.email && styles.errorInput]}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      {/* Password */}
      <View style={{ position: "relative" }}>
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={form.password}
          onChangeText={(v) => handleChange("password", v)}
          style={[styles.input, errors.password && styles.errorInput]}
        />
        <TouchableOpacity style={styles.eye} onPress={() => setShowPassword(!showPassword)}>
          <Text style={{ color: "gray", fontWeight: "bold" }}>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      {/* Confirm Password */}
      <TextInput
        placeholder="Confirm Password"
        secureTextEntry={!showPassword}
        value={form.confirmPassword}
        onChangeText={(v) => handleChange("confirmPassword", v)}
        style={[styles.input, errors.confirmPassword && styles.errorInput]}
      />
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

      {/* Phone */}
      <TextInput
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(v) => handleChange("phone", v)}
        style={[styles.input, errors.phone && styles.errorInput]}
      />
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      {/* Address */}
      <TextInput
        placeholder="City"
        value={form.address.city}
        onChangeText={(v) => handleChange("address", v, "city")}
        style={[styles.input, errors.city && styles.errorInput]}
      />
      <TextInput
        placeholder="State"
        value={form.address.state}
        onChangeText={(v) => handleChange("address", v, "state")}
        style={[styles.input, errors.state && styles.errorInput]}
      />
      <TextInput
        placeholder="Pincode"
        keyboardType="numeric"
        value={form.address.pincode}
        onChangeText={(v) => handleChange("address", v, "pincode")}
        style={[styles.input, errors.pincode && styles.errorInput]}
      />

      {/* Register Button */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.5 }]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Sending OTP..." : "Register"}</Text>
      </TouchableOpacity>

      {/* Login Link */}
      <Text style={styles.link} onPress={() => navigation.navigate("UserLogin")}>
        Already have an account? Login
      </Text>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 10, marginBottom: 5 },
  errorInput: { borderColor: "red" },
  errorText: { color: "red", fontSize: 12, marginBottom: 10 },
  button: { backgroundColor: "black", padding: 14, borderRadius: 10, marginTop: 10 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
  link: { marginTop: 15, textAlign: "center", color: "blue" },
  eye: { position: "absolute", right: 15, top: 15 },
});