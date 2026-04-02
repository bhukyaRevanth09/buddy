import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";

export default function UserRegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    setErrors({ ...errors, [key]: "" });
  };

  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";

    if (!form.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Invalid email";

    if (!form.password) newErrors.password = "Password required";
    else if (form.password.length < 6)
      newErrors.password = "Min 6 characters";

    if (!form.confirmPassword)
      newErrors.confirmPassword = "Confirm your password";
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!form.phone) newErrors.phone = "Phone required";
    else if (form.phone.length < 10)
      newErrors.phone = "Invalid phone";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;

    console.log("REGISTER DATA:", form);

    // 👉 API CALL HERE

    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
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
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={form.password}
          onChangeText={(v) => handleChange("password", v)}
          style={[styles.input, styles.passwordInput, errors.password && styles.errorInput]}
        />

        <TouchableOpacity
          style={styles.eye}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text>{showPassword ? "Hide" : "Show"}</Text>
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
      {errors.confirmPassword && (
        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
      )}

      {/* Phone */}
      <TextInput
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(v) => handleChange("phone", v)}
        style={[styles.input, errors.phone && styles.errorInput]}
      />
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      {/* Login */}
      <Text
        style={styles.link}
        onPress={() => navigation.navigate("UserLogin")}
      >
        Already have account? Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 5,
  },

  errorInput: {
    borderColor: "red",
  },

  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },

  passwordContainer: {
    position: "relative",
  },

  passwordInput: {
    paddingRight: 60,
  },

  eye: {
    position: "absolute",
    right: 15,
    top: 12,
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
  },
});