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
import { apiRequest } from "../../services/api";
import { useI18n } from "../../contexts/I18nContext";

const languages = [
  { label: "English", value: "en" },
  { label: "తెలుగు", value: "te" },
  { label: "हिंदी", value: "hi" },
];

export default function SignupScreen() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [language, setLanguage] = useState("en");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim()) {
      Alert.alert(t("auth.required"), t("auth.mobileRequired"));
      return;
    }

    if (!mobile.trim()) {
      Alert.alert(t("auth.required"), t("auth.mobileRequired"));
      return;
    }

    if (mobile.trim().length < 10) {
      Alert.alert(
        t("auth.invalidMobile"),
        t("auth.validMobile")
      );
      return;
    }

    if (!password) {
      Alert.alert(t("auth.required"), t("auth.passwordRequired"));
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        t("auth.weakPassword"),
        t("auth.passwordLength")
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        t("auth.passwordMismatch"),
        t("auth.passwordsNoMatch")
      );
      return;
    }

    try {
      setLoading(true);

      await apiRequest(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            mobile: mobile.trim(),
            password,
            language,
          }),
        },
        false
      );

      Alert.alert(
        t("auth.registrationSuccess"),
        t("auth.accountCreated"),
        [
          {
            text: t("auth.continue"),
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        t("auth.registrationFailed"),
        error?.message || t("auth.registrationError")
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#333"
            />
          </TouchableOpacity>

          <View style={styles.logoCircle}>
            <Ionicons
              name="leaf"
              size={36}
              color="#2E7D32"
            />
          </View>

          <Text style={styles.title}>{t("auth.createAccount")}</Text>

          <Text style={styles.subtitle}>
            {t("auth.startProtecting")}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          {/* Name */}
          <Text style={styles.label}>{t("auth.fullName")}</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#777"
            />

            <TextInput
              style={styles.input}
              placeholder={t("auth.enterName")}
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              editable={!loading}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Mobile */}
          <Text style={styles.label}>{t("auth.mobile")}</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#777"
            />

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
              placeholder={t("auth.createPassword")}
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              returnKeyType="next"
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(!showPassword)
              }
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

          {/* Confirm Password */}
          <Text style={styles.label}>{t("auth.confirmPassword")}</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#777"
            />

            <TextInput
              style={styles.input}
              placeholder={t("auth.confirmYourPassword")}
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />

            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
              disabled={loading}
            >
              <Ionicons
                name={
                  showConfirmPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={21}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          {/* Language */}
          <Text style={styles.label}>
            {t("auth.preferredLanguage")}
          </Text>

          <View style={styles.languageRow}>
            {languages.map((item) => {
              const selected = language === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.languageButton,
                    selected &&
                      styles.languageButtonSelected,
                  ]}
                  onPress={() =>
                    setLanguage(item.value)
                  }
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.languageText,
                      selected &&
                        styles.languageTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Signup */}
          <TouchableOpacity
            style={[
              styles.signupButton,
              loading && styles.signupButtonDisabled,
            ]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text style={styles.signupButtonText}>
                  {t("auth.creatingAccount")}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.signupButtonText}>
                  {t("auth.createAccount")}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFFFFF"
                />
              </>
            )}
          </TouchableOpacity>

          {/* Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              {t("auth.alreadyAccount")}
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.replace("/(auth)/login")
              }
              disabled={loading}
            >
              <Text style={styles.loginLink}>
                {" "}
                {t("auth.login")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          {t("auth.footerSignup")}
        </Text>
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
    paddingHorizontal: 24,
    paddingVertical: 30,
  },

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  backButton: {
    alignSelf: "flex-start",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 27,
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

  languageRow: {
    flexDirection: "row",
    gap: 8,
  },

  languageButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#D9DED8",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFCF9",
  },

  languageButtonSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32",
  },

  languageText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  languageTextSelected: {
    color: "#2E7D32",
    fontWeight: "700",
  },

  signupButton: {
    height: 54,
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    marginTop: 26,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  signupButtonDisabled: {
    opacity: 0.7,
  },

  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },

  loginText: {
    color: "#777",
    fontSize: 14,
  },

  loginLink: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "700",
  },

  footer: {
    textAlign: "center",
    color: "#8A9389",
    fontSize: 12,
    marginTop: 22,
  },
});