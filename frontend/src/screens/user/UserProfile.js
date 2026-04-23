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
import { Ionicons } from "@expo/vector-icons"; // Ensure you have expo-vector-icons installed
import api from "../../api/Apiclient.js";
import { useAuth } from "../../context/AuthContext.js";

export default function ProfileScreen({ navigation }) {
  const { logout } = useAuth();

  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Password Visibility States
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "", // New Field
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
        setForm({
          name: userData.name || "",
          phone: userData.phone || "",
          email: userData.email || "",
          address: userData.address || "", // New Field
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
      const res = await api.put("/user/update-profile", {
        name: form.name,
        phone: form.phone,
        address: form.address, // Sending address to backend
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Account Settings</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Details</Text>

        {/* Name */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, !editing && styles.disabledInput]}
          value={form.name}
          editable={editing}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />

        {/* Phone */}
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={[styles.input, !editing && styles.disabledInput]}
          value={form.phone}
          editable={editing}
          keyboardType="phone-pad"
          onChangeText={(v) => setForm({ ...form, phone: v })}
        />

        {/* Address - Added Field */}
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, !editing && styles.disabledInput]}
          value={form.address}
          editable={editing}
          multiline
          onChangeText={(v) => setForm({ ...form, address: v })}
          placeholder="Enter your home address"
        />

        {!editing ? (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.row}>
            <TouchableOpacity style={[styles.halfBtn, styles.cancelBtn]} onPress={() => { setEditing(false); setForm(user); }}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.halfBtn} onPress={updateProfile}>
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Password Change Section */}
      <TouchableOpacity style={styles.passwordToggle} onPress={() => setPasswordMode(!passwordMode)}>
        <Text style={styles.passwordToggleText}>
          {passwordMode ? "Close Security Settings" : "Change Password"}
        </Text>
      </TouchableOpacity>

      {passwordMode && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Update Password</Text>
          
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              secureTextEntry={!showOldPass}
              style={styles.passInput}
              value={password.oldPassword}
              onChangeText={(v) => setPassword({ ...password, oldPassword: v })}
            />
            <TouchableOpacity onPress={() => setShowOldPass(!showOldPass)}>
              <Ionicons name={showOldPass ? "eye-off" : "eye"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link inside Change Password UI */}
          <TouchableOpacity 
            style={styles.forgotBtn} 
            onPress={() => navigation.navigate("ForgotPassword")} 
          >
            <Text style={styles.forgotText}>Forgot current password?</Text>
          </TouchableOpacity>

          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              secureTextEntry={!showNewPass}
              style={styles.passInput}
              value={password.newPassword}
              onChangeText={(v) => setPassword({ ...password, newPassword: v })}
            />
            <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
              <Ionicons name={showNewPass ? "eye-off" : "eye"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.savePassBtn} onPress={changePassword}>
            {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Password</Text>}
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 20 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "bold", color: "#212529" },
  logoutTxt: { color: "#FF4D4D", fontWeight: "bold" },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 15, elevation: 3, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10, color: "#495057" },
  label: { fontSize: 12, color: "#ADB5BD", marginTop: 15, fontWeight: "700", textTransform: "uppercase" },
  input: { borderBottomWidth: 1, borderBottomColor: "#DEE2E6", paddingVertical: 8, fontSize: 16, color: "#212529" },
  disabledInput: { color: "#868E96" },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: "#DEE2E6" },
  passInput: { flex: 1, paddingVertical: 8, fontSize: 16, color: "#212529" },
  editBtn: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 25 },
  editBtnText: { color: "#fff", fontWeight: "bold" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 25 },
  halfBtn: { backgroundColor: "#4CAF50", width: "48%", padding: 15, borderRadius: 10, alignItems: "center" },
  cancelBtn: { backgroundColor: "#6C757D" },
  btnText: { color: "#fff", fontWeight: "bold" },
  passwordToggle: { padding: 10, alignItems: "center", marginBottom: 10 },
  passwordToggleText: { color: "#007AFF", fontWeight: "600" },
  savePassBtn: { backgroundColor: "#212529", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 25 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 5 },
  forgotText: { color: "#FF9800", fontSize: 13, fontWeight: "600" }
});