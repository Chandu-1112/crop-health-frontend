import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { apiRequest } from "../services/api";
import { logout } from "../services/auth";

type AdminUser = {
  id: number;
  name: string;
  mobile: string;
  role: string;
  language: string;
};

export default function AdminScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/api/users/admin");
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert("Admin access error", error?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadUsers();
  }, [loadUsers]));

  const removeUser = (user: AdminUser) => {
    Alert.alert("Delete user", `Delete ${user.name} and all related farm records?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingId(user.id);
            await apiRequest(`/api/users/${user.id}`, { method: "DELETE" });
            setUsers((current) => current.filter((item) => item.id !== user.id));
          } catch (error: any) {
            Alert.alert("Delete failed", error?.message || "Unable to delete user.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin dashboard</Text>
          <Text style={styles.subtitle}>Manage registered users</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={20} color="#B42318" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadUsers}
          ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.userInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.detail}>{item.mobile}</Text>
                <Text style={styles.detail}>{item.role} · {item.language}</Text>
              </View>
              {item.role !== "admin" ? (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeUser(item)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? (
                    <ActivityIndicator color="#B42318" />
                  ) : (
                    <Ionicons name="trash-outline" size={21} color="#B42318" />
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F8F3" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 22 },
  title: { color: "#1B5E20", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#687468", marginTop: 4 },
  logout: { backgroundColor: "#FDECEC", borderRadius: 12, padding: 11 },
  loader: { marginTop: 40 },
  list: { gap: 12, padding: 22, paddingTop: 4 },
  card: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 16 },
  userInfo: { flex: 1 },
  name: { color: "#263A28", fontSize: 17, fontWeight: "700" },
  detail: { color: "#687468", marginTop: 4 },
  deleteButton: { padding: 10 },
  empty: { color: "#687468", paddingTop: 30, textAlign: "center" },
});
