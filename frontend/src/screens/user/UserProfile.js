import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/Apiclient.js";
import { useAuth } from "../../context/AuthContext.js";

export default function ProfileScreen({ navigation }) {
  const { logout } = useAuth();

  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [password, setPassword] = useState({
    oldPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user/user-profile");

      if (res.data.success) {
        const userData = res.data.user;

        setUser(userData);

        const addressString = userData.address
          ? `${userData.address.city || ""}, ${userData.address.state || ""} ${
              userData.address.pincode || ""
            }`
          : "";

        setForm({
          name: userData.name || "",
          phone: userData.phone || "",
          email: userData.email || "",
          address: addressString,
        });
      }
    } catch (err) {
      if (err.response?.status === 401 || err.message === "SESSION_EXPIRED") {
        logout();
      } else {
        Alert.alert("Error", "Could not load profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setUpdating(true);

      const res = await api.put("/user/update-userprofile", {
        name: form.name,
        phone: form.phone,
        address: {
          city: form.address,
          state: "",
          pincode: "",
        },
      });

      if (res.data.success) {
        setEditing(false);
        setUser({ ...user, ...form });
        Alert.alert("Success", "Profile updated!");
      }
    } catch (err) {
      Alert.alert("Error", "Update failed.");
    } finally {
      setUpdating(false);
    }
  };

  const changePassword = async () => {
    if (!password.oldPassword || !password.newPassword) {
      return Alert.alert("Error", "Fill both password fields.");
    }

    try {
      setUpdating(true);
      const res = await api.put("/auth/change-password", password);

      if (res.data.success) {
        Alert.alert("Success", "Password changed!");
        setPasswordMode(false);
        setPassword({ oldPassword: "", newPassword: "" });
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color="#fff" />
        </View>

        <Text style={styles.title}>{form.name || "User"}</Text>

        <TouchableOpacity onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#ff4d4d" />
        </TouchableOpacity>
      </View>

      {/* PROFILE */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, !editing && styles.disabledInput]}
          value={form.name}
          editable={editing}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={[styles.input, !editing && styles.disabledInput]}
          value={form.phone}
          editable={editing}
          keyboardType="phone-pad"
          onChangeText={(v) => setForm({ ...form, phone: v })}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, !editing && styles.disabledInput]}
          value={form.address}
          editable={editing}
          multiline
          placeholder="Enter city, state, pincode"
          onChangeText={(v) => setForm({ ...form, address: v })}
        />

        {!editing ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.btnText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setEditing(false);
                fetchProfile();
              }}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={updateProfile}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* PASSWORD */}
      <TouchableOpacity
        style={styles.passwordToggle}
        onPress={() => setPasswordMode(!passwordMode)}
      >
        <Text style={styles.passwordToggleText}>Change Password</Text>
      </TouchableOpacity>

      {passwordMode && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security</Text>

          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordBox}>
            <TextInput
              secureTextEntry={!showOldPass}
              style={styles.passInput}
              value={password.oldPassword}
              onChangeText={(v) =>
                setPassword({ ...password, oldPassword: v })
              }
            />
            <TouchableOpacity
              onPress={() => setShowOldPass(!showOldPass)}
            >
              <Ionicons name={showOldPass ? "eye-off" : "eye"} size={20} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>

          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordBox}>
            <TextInput
              secureTextEntry={!showNewPass}
              style={styles.passInput}
              value={password.newPassword}
              onChangeText={(v) =>
                setPassword({ ...password, newPassword: v })
              }
            />
            <TouchableOpacity
              onPress={() => setShowNewPass(!showNewPass)}
            >
              <Ionicons name={showNewPass ? "eye-off" : "eye"} size={20} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.darkBtn}
            onPress={changePassword}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA", padding: 20 },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },

  avatar: {
    backgroundColor: "#4CAF50",
    height: 70,
    width: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  label: {
    marginTop: 15,
    fontSize: 12,
    color: "#999",
  },

  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    padding: 12,
    marginTop: 5,
  },

  disabledInput: {
    color: "#777",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  primaryBtn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    flex: 1,
  },

  secondaryBtn: {
    backgroundColor: "#999",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    flex: 1,
    marginRight: 10,
  },

  darkBtn: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  passwordToggle: {
    alignItems: "center",
    marginBottom: 10,
  },

  passwordToggleText: {
    color: "#007AFF",
    fontWeight: "600",
  },

  passwordBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 5,
  },

  passInput: {
    flex: 1,
    paddingVertical: 12,
  },

  forgot: {
    alignSelf: "flex-end",
    color: "#FF9800",
    marginTop: 5,
  },
});