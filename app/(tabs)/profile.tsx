import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { apiRequest } from "../../services/api";
import { logout } from "../../services/auth";
import { Language, useI18n } from "../../contexts/I18nContext";
import { ScrollReveal } from "../../components/scroll-reveal";

type Profile = { name: string; mobile: string; language: string; role?: string };
const languages = [
  { code: "en", labelKey: "profile.languageEnglish" },
  { code: "te", labelKey: "profile.languageTelugu" },
  { code: "hi", labelKey: "profile.languageHindi" },
];

export default function ProfileScreen() {
  const { t, setLanguage: setAppLanguage } = useI18n();
  const entryAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Animated.timing(entryAnimation, {
      toValue: 1,
      duration: 440,
      useNativeDriver: true,
    }).start();
  }, [entryAnimation]);

  const loadProfile = async () => {
    try {
      const data = await apiRequest("/api/users/me");
      setProfile(data);
      setName(data.name || "");
      const nextLanguage = data.language === "te" || data.language === "hi" ? data.language : "en";
      setLanguage(nextLanguage);
      setAppLanguage(nextLanguage);
    } catch (error: any) {
      Alert.alert(t("alert.loadTitle"), error?.message || t("alert.tryAgain"));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  const saveProfile = async () => {
    if (name.trim().length < 2) {
      Alert.alert(t("alert.nameRequired"), t("alert.nameMinimum"));
      return;
    }
    try {
      setSaving(true);
      const data = await apiRequest("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({ name: name.trim(), language }),
      });
      setProfile(data.user);
      Alert.alert(t("alert.updatedTitle"), t("alert.updatedMessage"));
    } catch (error: any) {
      Alert.alert(t("alert.saveTitle"), error?.message || t("alert.tryAgain"));
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    Alert.alert(t("alert.signOutTitle"), t("alert.signOutMessage"), [
      { text: t("alert.cancel"), style: "cancel" },
      {
        text: t("profile.signOut"),
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>{t("profile.loading")}</Text>
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
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        <Text style={styles.title}>{t("profile.title")}</Text>
        <Text style={styles.subtitle}>{t("profile.subtitle")}</Text>

        <View style={styles.avatar}>
          <Ionicons name="person" size={34} color="#2E7D32" />
        </View>
        <Text style={styles.accountName}>{profile?.name || t("profile.farmer")}</Text>
        <Text style={styles.mobile}>{profile?.mobile || t("profile.mobileUnavailable")}</Text>

        <ScrollReveal scrollY={scrollY}>
        <View style={styles.card}>
          <Text style={styles.label}>{t("profile.yourName")}</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={20} color="#7A857A" />
            <TextInput value={name} onChangeText={setName} style={styles.input} placeholder={t("profile.namePlaceholder")} />
          </View>

          <Text style={styles.label}>{t("profile.advisoryLanguage")}</Text>
          <View style={styles.languageRow}>
            {languages.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[styles.language, language === item.code && styles.selectedLanguage]}
                onPress={() => { setLanguage(item.code); setAppLanguage(item.code as Language); }}
              >
                <Text style={[styles.languageText, language === item.code && styles.selectedLanguageText]}>
                  {t(item.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>{t("profile.saveChanges")}</Text>}
          </TouchableOpacity>
        </View>
        </ScrollReveal>

        <TouchableOpacity style={styles.signOut} onPress={signOut}>
          <Ionicons name="log-out-outline" size={21} color="#C62828" />
          <Text style={styles.signOutText}>{t("profile.signOut")}</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>{t("app.footerCredit")}</Text>
      </Animated.ScrollView>
      </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  entry: { flex: 1 },
  keyboard: { flex: 1 },
  container: { flex: 1, backgroundColor: "#F5F8F3" },
  watermark: { position: "absolute", width: 340, height: 340, right: -120, top: 100, opacity: 0.035, transform: [{ rotate: "-18deg" }] },
  content: { padding: 20, paddingBottom: 36 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F8F3" },
  loadingText: { color: "#657165", marginTop: 14 },
  title: { color: "#1E2D1F", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#697469", fontSize: 14, marginTop: 5 },
  avatar: { alignItems: "center", justifyContent: "center", alignSelf: "center", backgroundColor: "#E8F5E9", borderRadius: 45, width: 82, height: 82, marginTop: 28 },
  accountName: { color: "#263326", fontSize: 20, fontWeight: "700", textAlign: "center", marginTop: 12 },
  mobile: { color: "#7B857B", textAlign: "center", marginTop: 4 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, marginTop: 24 },
  label: { color: "#3F4A40", fontSize: 13, fontWeight: "700", marginBottom: 8, marginTop: 4 },
  inputRow: { alignItems: "center", flexDirection: "row", borderColor: "#DCE5DA", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 20 },
  input: { flex: 1, color: "#263326", fontSize: 15, paddingVertical: 13, marginLeft: 9 },
  languageRow: { flexDirection: "row", gap: 8, marginBottom: 22 },
  language: { borderColor: "#DCE5DA", borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11 },
  selectedLanguage: { backgroundColor: "#E8F5E9", borderColor: "#2E7D32" },
  languageText: { color: "#6C766C", fontWeight: "600" },
  selectedLanguageText: { color: "#2E7D32" },
  saveButton: { alignItems: "center", backgroundColor: "#2E7D32", borderRadius: 12, paddingVertical: 14 },
  saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  signOut: { alignItems: "center", flexDirection: "row", justifyContent: "center", marginTop: 24, padding: 12 },
  signOutText: { color: "#C62828", fontSize: 15, fontWeight: "700", marginLeft: 8 },
  footerText: { color: "#7A857A", fontSize: 12, marginTop: 28, textAlign: "center" },
});
