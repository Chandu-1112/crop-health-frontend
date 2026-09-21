import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert as NativeAlert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../../services/api";
import { useI18n } from "../../contexts/I18nContext";
import { ScrollReveal } from "../../components/scroll-reveal";

type AlertItem = {
  id: number;
  field_id: number;
  type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at?: string;
};

const severityColor = (severity: string) => {
  const value = severity.toLowerCase();
  if (value === "high" || value === "critical") return "#C62828";
  if (value === "medium" || value === "moderate") return "#C77700";
  return "#2E7D32";
};

const severityBackground = (severity: string) => {
  const value = severity.toLowerCase();
  if (value === "high" || value === "critical") return "#FDECEC";
  if (value === "medium" || value === "moderate") return "#FFF4E5";
  return "#E8F5E9";
};

export default function AlertsScreen() {
  const { t } = useI18n();
  const entryAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    Animated.timing(entryAnimation, {
      toValue: 1,
      duration: 440,
      useNativeDriver: true,
    }).start();
  }, [entryAnimation]);

  const loadAlerts = async () => {
    try {
      const data = await apiRequest("/api/alerts");
      const uniqueAlerts = new Map<string, AlertItem>();
      (Array.isArray(data) ? data : []).forEach((alert: AlertItem) => {
        const key = `${alert.field_id}:${alert.type}:${alert.message}`;
        const existing = uniqueAlerts.get(key);
        if (!existing || new Date(alert.created_at || 0) > new Date(existing.created_at || 0)) {
          uniqueAlerts.set(key, alert);
        }
      });
      setAlerts(Array.from(uniqueAlerts.values()));
    } catch (error: any) {
      NativeAlert.alert(
        t("alerts.loadError"),
        error?.message || t("alert.connection"),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, []),
  );

  const markAsRead = async (alert: AlertItem) => {
    if (alert.is_read) return;
    try {
      await apiRequest(`/api/alerts/${alert.id}/read`, { method: "PUT" });
      setAlerts((current) =>
        current.map((item) =>
          item.id === alert.id ? { ...item, is_read: true } : item,
        ),
      );
    } catch (error: any) {
      NativeAlert.alert(
        t("alerts.updateError"),
        error?.message || t("alert.tryAgain"),
      );
    }
  };

  const deleteAlert = (alert: AlertItem) => {
    NativeAlert.alert(t("alerts.deleteTitle"), t("alerts.deleteText"), [
      { text: t("alert.cancel"), style: "cancel" },
      {
        text: t("alerts.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await apiRequest(`/api/alerts/${alert.id}`, { method: "DELETE" });
            setAlerts((current) => current.filter((item) => item.id !== alert.id));
          } catch (error: any) {
            NativeAlert.alert(t("alerts.updateError"), error?.message || t("alert.tryAgain"));
          }
        },
      },
    ]);
  };

  const visibleAlerts = showUnreadOnly
    ? alerts.filter((alert) => !alert.is_read)
    : alerts;
  const unreadCount = alerts.filter((alert) => !alert.is_read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>{t("alerts.subtitle")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../../assets/images/app-icon.jpeg")}
        style={styles.watermark}
        resizeMode="contain"
      />
      <Animated.View
        style={[
          styles.entry,
          {
            opacity: entryAnimation,
            transform: [{ translateY: entryAnimation.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
          },
        ]}
      >
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAlerts();
            }}
            tintColor="#2E7D32"
            colors={["#2E7D32"]}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t("alerts.title")}</Text>
            <Text style={styles.subtitle}>
              {t("alerts.subtitle")}
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{unreadCount}</Text>
            <Text style={styles.countLabel}>{t("alerts.unread")}</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filter, !showUnreadOnly && styles.activeFilter]}
            onPress={() => setShowUnreadOnly(false)}
          >
            <Text
              style={[
                styles.filterText,
                !showUnreadOnly && styles.activeFilterText,
              ]}
            >
              {t("alerts.all")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filter, showUnreadOnly && styles.activeFilter]}
            onPress={() => setShowUnreadOnly(true)}
          >
            <Text
              style={[
                styles.filterText,
                showUnreadOnly && styles.activeFilterText,
              ]}
            >
              {t("alerts.unread")} ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {visibleAlerts.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="shield-checkmark-outline" size={34} color="#2E7D32" />
            </View>
            <Text style={styles.emptyTitle}>
              {showUnreadOnly ? t("alerts.caughtUp") : t("alerts.empty")}
            </Text>
            <Text style={styles.emptyText}>
              {t("alerts.emptyText")}
            </Text>
          </View>
        ) : (
          visibleAlerts.map((alert) => {
            const color = severityColor(alert.severity);
            return (
            <ScrollReveal key={alert.id} scrollY={scrollY}>
            <TouchableOpacity
                style={[styles.card, !alert.is_read && styles.unreadCard]}
                activeOpacity={0.8}
                onPress={() => markAsRead(alert)}
              >
                <View style={[styles.icon, { backgroundColor: severityBackground(alert.severity) }]}>
                  <Ionicons
                    name={alert.type.toLowerCase().includes("weather") ? "rainy-outline" : "warning-outline"}
                    size={22}
                    color={color}
                  />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardHeading}>
                    <Text style={styles.cardTitle}>{alert.title}</Text>
                    {!alert.is_read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.cardMessage}>{alert.message}</Text>
                  <View style={styles.meta}>
                    <Text style={[styles.severity, { color }]}>
                      {alert.severity.toUpperCase()}
                    </Text>
                    {alert.created_at && (
                      <Text style={styles.date}>
                        {new Date(alert.created_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteAlert(alert)}
                  accessibilityLabel={t("alerts.delete")}
                >
                  <Ionicons name="trash-outline" size={20} color="#C62828" />
                </TouchableOpacity>
              </TouchableOpacity>
              </ScrollReveal>
            );
          })
        )}
      </Animated.ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  entry: { flex: 1 },
  container: { flex: 1, backgroundColor: "#F5F8F3" },
  watermark: { position: "absolute", width: 340, height: 340, right: -120, top: 100, opacity: 0.035, transform: [{ rotate: "-18deg" }] },
  content: { padding: 20, paddingBottom: 32 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F8F3" },
  loadingText: { marginTop: 14, color: "#546054", fontSize: 15 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  title: { fontSize: 28, fontWeight: "800", color: "#1E2D1F" },
  subtitle: { marginTop: 5, color: "#697469", fontSize: 14 },
  countBadge: { alignItems: "center", backgroundColor: "#E8F5E9", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },
  countText: { color: "#2E7D32", fontWeight: "800", fontSize: 20 },
  countLabel: { color: "#4D6B50", fontSize: 11 },
  filterRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  filter: { borderColor: "#D6DED3", borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9 },
  activeFilter: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  filterText: { color: "#5D695D", fontWeight: "600" },
  activeFilterText: { color: "#FFFFFF" },
  card: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: "#E8EEE6" },
  unreadCard: { borderColor: "#B7D8B9" },
  icon: { width: 44, height: 44, borderRadius: 13, justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardBody: { flex: 1 },
  cardHeading: { flexDirection: "row", alignItems: "center" },
  cardTitle: { flex: 1, color: "#263326", fontSize: 16, fontWeight: "700" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2E7D32", marginLeft: 8 },
  cardMessage: { color: "#687268", fontSize: 14, lineHeight: 20, marginTop: 6 },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  severity: { fontSize: 11, fontWeight: "800" },
  date: { color: "#899389", fontSize: 12, marginLeft: 12 },
  deleteButton: { alignSelf: "center", padding: 6, marginLeft: 6 },
  empty: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 18, padding: 30, marginTop: 18 },
  emptyIcon: { alignItems: "center", justifyContent: "center", width: 68, height: 68, borderRadius: 34, backgroundColor: "#E8F5E9" },
  emptyTitle: { color: "#263326", fontSize: 18, fontWeight: "700", marginTop: 16 },
  emptyText: { color: "#748074", textAlign: "center", lineHeight: 20, marginTop: 8 },
});
