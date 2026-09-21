import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { getCurrentUser, getToken } from "../services/auth";

export default function EntryScreen() {
  const [destination, setDestination] = useState<"/(tabs)" | "/admin" | "/(auth)/login" | null>(null);

  useEffect(() => {
    const resolveDestination = async () => {
      const token = await getToken();
      if (!token) {
        setDestination("/(auth)/login");
        return;
      }

      try {
        const user = await getCurrentUser();
        setDestination(user?.role === "admin" ? "/admin" : "/(tabs)");
      } catch {
        setDestination("/(auth)/login");
      }
    };

    resolveDestination();
  }, []);

  if (destination === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return <Redirect href={destination} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#F5F8F3",
    flex: 1,
    justifyContent: "center",
  },
});
