import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";

export default function UserLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};

    // 📧 Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter valid email";
    }

    // 🔒 Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (!validate()) return;

    console.log("LOGIN DATA:", { email, password });

    // 👉 call backend API

    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Login</Text>

      {/* 📧 Email */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setErrors({ ...errors, email: "" });
        }}
        style={[styles.input, errors.email && styles.errorInput]}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      {/* 🔒 Password */}
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setErrors({ ...errors, password: "" });
        }}
        style={[styles.input, errors.password && styles.errorInput]}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      {/* 🔘 Button */}
      <TouchableOpacity
        style={[
          styles.button,
          (!email || !password) && styles.disabledButton,
        ]}
        onPress={handleLogin}
        disabled={!email || !password}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* 🔗 Register */}
      <Text
        style={styles.link}
        onPress={() => navigation.navigate("UserRegister")}
      >
        Don't have account? Register
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
    marginBottom: 10,
    fontSize: 12,
  },

  button: {
    backgroundColor: "black",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },

  disabledButton: {
    backgroundColor: "gray",
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