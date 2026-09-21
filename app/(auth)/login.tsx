import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getCurrentUser, login } from "../../services/auth";
import { useI18n } from "../../contexts/I18nContext";

export default function LoginScreen() {
  const { t } = useI18n();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!mobile.trim()) {
      Alert.alert(t("auth.required"), t("auth.mobileRequired"));
      return;
    }

    if (!password) {
      Alert.alert(t("auth.required"), t("auth.passwordRequired"));
      return;
    }

    try {
      setLoading(true);

      await login(mobile, password);
      const user = await getCurrentUser();
      router.replace(user?.role === "admin" ? "/admin" : "/(tabs)");
    } catch (error: any) {
      Alert.alert(
        t("auth.loginFailed"),
        error?.message || t("auth.loginError")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={42} color="#2E7D32" />
          </View>

          <Text style={styles.title}>{t("auth.appName")}</Text>

          <Text style={styles.subtitle}>
            {t("auth.appSubtitle")}
          </Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.welcome}>{t("auth.welcome")} 👋</Text>

          <Text style={styles.description}>
            {t("auth.loginDescription")}
          </Text>

          {/* Mobile */}
          <Text style={styles.label}>{t("auth.mobile")}</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#777" />

            <TextInput
              style={styles.input}
              placeholder={t("auth.enterMobile")}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
              maxLength={15}
              editable={!loading}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>{t("auth.password")}</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#777"
            />

            <TextInput
              style={styles.input}
              placeholder={t("auth.enterPassword")}
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Ionicons
                name={
                  showPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={21}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              loading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text style={styles.loginButtonText}>
                  {t("auth.loggingIn")}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.loginButtonText}>
                  {t("auth.login")}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#fff"
                />
              </>
            )}
          </TouchableOpacity>

          {/* Signup */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              {t("auth.noAccount")}
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/signup")}
              disabled={loading}
            >
              <Text style={styles.signupLink}> {t("auth.signup")}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.offlineButton}
            onPress={() => router.push("/offline-diagnosis")}
            disabled={loading}
          >
            <Ionicons name="cloud-offline-outline" size={19} color="#2E7D32" />
            <Text style={styles.offlineButtonText}>{t("offline.open")}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {t("auth.footer")}
        </Text>
        <Text style={styles.footerCredit}>{t("app.footerCredit")}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8F3",
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  logoCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1B5E20",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B756B",
    marginTop: 6,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  welcome: {
    fontSize: 23,
    fontWeight: "700",
    color: "#222",
  },

  description: {
    fontSize: 14,
    color: "#777",
    marginTop: 6,
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },

  inputContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D9DED8",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#FAFCF9",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#222",
  },

  loginButton: {
    height: 54,
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    marginTop: 26,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },

  signupText: {
    color: "#777",
    fontSize: 14,
  },

  signupLink: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "700",
  },

  offlineButton: {
    alignItems: "center",
    borderColor: "#B9D8BA",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    paddingVertical: 13,
  },

  offlineButtonText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 7,
  },

  footer: {
    textAlign: "center",
    color: "#8A9389",
    fontSize: 12,
    marginTop: 25,
  },
  footerCredit: {
    color: "#7A857A",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});