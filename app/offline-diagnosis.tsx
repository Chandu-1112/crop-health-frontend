import React, { useMemo, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Language, useI18n } from "../contexts/I18nContext";

const diseaseCatalog: Record<string, { name: string; clue: string }[]> = {
  Tomato: [
    { name: "Early blight", clue: "Target-like brown spots on older leaves" },
    { name: "Late blight", clue: "Water-soaked dark patches spreading quickly" },
    { name: "Bacterial spot", clue: "Small dark spots on leaves or fruit" },
    { name: "Leaf mold", clue: "Yellow upper leaves with olive mold below" },
  ],
  Rice: [
    { name: "Blast", clue: "Spindle-shaped gray or brown lesions" },
    { name: "Brown spot", clue: "Oval brown spots on leaves" },
    { name: "Bacterial leaf blight", clue: "Yellow-white drying leaf edges" },
  ],
  Cotton: [
    { name: "Bacterial blight", clue: "Angular water-soaked leaf spots" },
    { name: "Bollworm damage", clue: "Holes or feeding inside squares and bolls" },
  ],
  Chilli: [
    { name: "Leaf curl", clue: "Curled leaves with stunted growth" },
    { name: "Powdery mildew", clue: "White powder on leaf surfaces" },
    { name: "Thrips damage", clue: "Silvery streaks and distorted young leaves" },
  ],
  Groundnut: [
    { name: "Tikka leaf spot", clue: "Dark circular spots with yellow halos" },
    { name: "Rust", clue: "Orange-brown powdery spots underneath leaves" },
  ],
};

const localizedCatalog: Record<Language, Record<string, { label: string; diseases: { name: string; clue: string }[] }>> = {
  en: {
    Tomato: { label: "Tomato", diseases: diseaseCatalog.Tomato },
    Rice: { label: "Rice", diseases: diseaseCatalog.Rice },
    Cotton: { label: "Cotton", diseases: diseaseCatalog.Cotton },
    Chilli: { label: "Chilli", diseases: diseaseCatalog.Chilli },
    Groundnut: { label: "Groundnut", diseases: diseaseCatalog.Groundnut },
  },
  te: {
    Tomato: { label: "టమాటా", diseases: [
      { name: "ప్రారంభ దశ ఆకుమచ్చ", clue: "పాత ఆకులపై లక్ష్యంలాంటి గోధుమ మచ్చలు" },
      { name: "ఆలస్య దశ ఆకుమచ్చ", clue: "త్వరగా వ్యాపించే నీటితో తడిసిన నల్లటి మచ్చలు" },
      { name: "బాక్టీరియా మచ్చ", clue: "ఆకులు లేదా పండ్లపై చిన్న నల్లటి మచ్చలు" },
      { name: "ఆకు బూజు", clue: "పైభాగం పసుపు ఆకులు, దిగువన ఆలివ్ రంగు బూజు" },
    ] },
    Rice: { label: "వరి", diseases: [
      { name: "వరి అగ్గి తెగులు", clue: "ఆకులపై కుదురు ఆకారపు బూడిద లేదా గోధుమ మచ్చలు" },
      { name: "గోధుమ మచ్చ తెగులు", clue: "ఆకులపై అండాకార గోధుమ మచ్చలు" },
      { name: "బాక్టీరియా ఆకు ఎండుతెగులు", clue: "ఆకుల అంచులు పసుపు రంగులోకి మారి ఎండిపోవడం" },
    ] },
    Cotton: { label: "పత్తి", diseases: [
      { name: "బాక్టీరియా ఆకు తెగులు", clue: "ఆకులపై కోణాకార నీటి మచ్చలు" },
      { name: "కాయతొలుచు పురుగు నష్టం", clue: "మొగ్గలు మరియు కాయలలో రంధ్రాలు లేదా తినివేసిన గుర్తులు" },
    ] },
    Chilli: { label: "మిరప", diseases: [
      { name: "ఆకు ముడత", clue: "ఆకులు ముడుచుకుని మొక్క పెరుగుదల తగ్గడం" },
      { name: "బూజు తెగులు", clue: "ఆకులపై తెల్లటి పొడి కనిపించడం" },
      { name: "థ్రిప్స్ నష్టం", clue: "వెండి రంగు గీతలు, కొత్త ఆకులు వంకరగా మారడం" },
    ] },
    Groundnut: { label: "వేరుశెనగ", diseases: [
      { name: "టిక్కా ఆకు మచ్చ", clue: "పసుపు వలయాలతో నల్లటి గుండ్రని మచ్చలు" },
      { name: "తుప్పు తెగులు", clue: "ఆకుల దిగువన నారింజ-గోధుమ పొడి మచ్చలు" },
    ] },
  },
  hi: {
    Tomato: { label: "टमाटर", diseases: [
      { name: "अगेती झुलसा", clue: "पुरानी पत्तियों पर लक्ष्य जैसे भूरे धब्बे" },
      { name: "पछेती झुलसा", clue: "तेजी से फैलते पानी जैसे गहरे धब्बे" },
      { name: "बैक्टीरियल स्पॉट", clue: "पत्तियों या फलों पर छोटे गहरे धब्बे" },
      { name: "लीफ मोल्ड", clue: "ऊपर की पत्तियां पीली और नीचे जैतूनी फफूंद" },
    ] },
    Rice: { label: "धान", diseases: [
      { name: "धान का झुलसा रोग", clue: "पत्तियों पर धुरी जैसे भूरे या धूसर घाव" },
      { name: "भूरा धब्बा", clue: "पत्तियों पर अंडाकार भूरे धब्बे" },
      { name: "बैक्टीरियल लीफ ब्लाइट", clue: "पत्तियों के किनारे पीले होकर सूखना" },
    ] },
    Cotton: { label: "कपास", diseases: [
      { name: "बैक्टीरियल ब्लाइट", clue: "पत्तियों पर कोणीय पानी जैसे धब्बे" },
      { name: "बॉलवर्म नुकसान", clue: "टिंडों और कलियों में छेद या खाने के निशान" },
    ] },
    Chilli: { label: "मिर्च", diseases: [
      { name: "लीफ कर्ल", clue: "पत्तियां मुड़ना और पौधे की वृद्धि रुकना" },
      { name: "पाउडरी मिल्ड्यू", clue: "पत्तियों की सतह पर सफेद पाउडर" },
      { name: "थ्रिप्स नुकसान", clue: "चांदी जैसी धारियां और मुड़ी हुई नई पत्तियां" },
    ] },
    Groundnut: { label: "मूंगफली", diseases: [
      { name: "टिक्का लीफ स्पॉट", clue: "पीले घेरे वाले गहरे गोल धब्बे" },
      { name: "रस्ट", clue: "पत्तियों के नीचे नारंगी-भूरे पाउडर जैसे धब्बे" },
    ] },
  },
};

export default function OfflineDiagnosisScreen() {
  const { t, language, setLanguage } = useI18n();
  const [crop, setCrop] = useState("Tomato");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [symptom, setSymptom] = useState<string | null>(null);

  const possibleDisease = useMemo(() => {
    if (!imageUri) return null;
    return localizedCatalog[language][crop].diseases.find((item) => item.clue === symptom)?.name || null;
  }, [crop, imageUri, language, symptom]);

  const chooseImage = async (source: "camera" | "gallery") => {
    const result =
      source === "camera"
        ? await (async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) return null;
            return ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            });
          })()
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });

    if (!result) return;
    if (!result.canceled && result.assets?.[0]?.uri) setImageUri(result.assets[0].uri);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.languageRow}>
          {[
            { code: "en", label: "English" },
            { code: "te", label: "తెలుగు" },
            { code: "hi", label: "हिन्दी" },
          ].map((item) => (
            <TouchableOpacity
              key={item.code}
              style={[styles.languageButton, language === item.code && styles.languageSelected]}
              onPress={() => {
                setLanguage(item.code as Language);
                setSymptom(null);
              }}
            >
              <Text style={[styles.languageText, language === item.code && styles.languageTextSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.title}>{t("offline.title")}</Text>
        <Text style={styles.subtitle}>{t("offline.subtitle")}</Text>

        <Text style={styles.label}>{t("offline.chooseCrop")}</Text>
        <View style={styles.cropRow}>
          {Object.keys(diseaseCatalog).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.cropButton, crop === item && styles.cropButtonSelected]}
              onPress={() => { setCrop(item); setImageUri(null); setSymptom(null); }}
            >
              <Text style={[styles.cropText, crop === item && styles.cropTextSelected]}>{localizedCatalog[language][item].label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {imageUri ? (
          <>
            <Text style={styles.label}>{t("offline.chooseSymptom")}</Text>
            <View style={styles.symptomList}>
              {localizedCatalog[language][crop].diseases.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.symptomButton, symptom === item.clue && styles.symptomSelected]}
                  onPress={() => setSymptom(item.clue)}
                >
                  <Text style={[styles.symptomText, symptom === item.clue && styles.symptomTextSelected]}>
                    {item.clue}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.imageCard}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : (
            <Ionicons name="leaf-outline" size={54} color="#2E7D32" />
          )}
          <Text style={styles.imageHint}>{imageUri ? t("offline.imageReady") : t("offline.addImage")}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => chooseImage("camera")}>
            <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>{t("offline.camera")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => chooseImage("gallery")}>
            <Ionicons name="images-outline" size={20} color="#2E7D32" />
            <Text style={styles.secondaryText}>{t("offline.gallery")}</Text>
          </TouchableOpacity>
        </View>

        {possibleDisease ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>{t("offline.possibleResult")}</Text>
            <Text style={styles.disease}>{possibleDisease}</Text>
            <Text style={styles.advice}>{t("offline.advice")}</Text>
            <Text style={styles.warning}>{t("offline.accuracy")}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Ionicons name="home-outline" size={19} color="#FFFFFF" />
          <Text style={styles.homeButtonText}>{t("offline.backToHome")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Ionicons name="log-in-outline" size={19} color="#2E7D32" />
          <Text style={styles.loginButtonText}>{t("offline.backToLogin")}</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>{t("app.footerCredit")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F8F3" },
  content: { padding: 22, paddingBottom: 40 },
  languageRow: { flexDirection: "row", justifyContent: "flex-end", gap: 7, marginBottom: 18 },
  languageButton: { borderColor: "#D8E5D5", borderRadius: 9, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: "#FFFFFF" },
  languageSelected: { backgroundColor: "#E8F5E9", borderColor: "#2E7D32" },
  languageText: { color: "#697469", fontSize: 12, fontWeight: "600" },
  languageTextSelected: { color: "#2E7D32" },
  title: { color: "#1B5E20", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#687468", marginTop: 7, lineHeight: 20 },
  label: { color: "#344334", fontWeight: "700", marginTop: 26, marginBottom: 10 },
  cropRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cropButton: { borderWidth: 1, borderColor: "#CFE3CF", borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: "#FFFFFF" },
  cropButtonSelected: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  cropText: { color: "#3F4A40", fontWeight: "600" },
  cropTextSelected: { color: "#FFFFFF" },
  imageCard: { alignItems: "center", justifyContent: "center", minHeight: 210, marginTop: 24, borderRadius: 18, borderWidth: 1, borderColor: "#D8E5D5", borderStyle: "dashed", backgroundColor: "#FFFFFF", overflow: "hidden" },
  image: { width: "100%", height: 210 },
  imageHint: { color: "#6D786D", margin: 12, textAlign: "center" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionButton: { flex: 1, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", backgroundColor: "#2E7D32", borderRadius: 12, paddingVertical: 14 },
  secondaryButton: { flex: 1, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", backgroundColor: "#E8F5E9", borderRadius: 12, paddingVertical: 14 },
  actionText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryText: { color: "#2E7D32", fontWeight: "700" },
  resultCard: { marginTop: 22, padding: 18, borderRadius: 16, backgroundColor: "#FFFFFF" },
  resultLabel: { color: "#6C766C", fontSize: 12, fontWeight: "700" },
  disease: { color: "#1B5E20", fontSize: 22, fontWeight: "800", marginTop: 5 },
  advice: { color: "#3F4A40", lineHeight: 20, marginTop: 12 },
  warning: { color: "#8A5A00", backgroundColor: "#FFF4D6", padding: 10, marginTop: 14, borderRadius: 9, lineHeight: 18 },
  symptomList: { gap: 8 },
  symptomButton: { backgroundColor: "#FFFFFF", borderColor: "#D8E5D5", borderRadius: 10, borderWidth: 1, padding: 12 },
  symptomSelected: { backgroundColor: "#E8F5E9", borderColor: "#2E7D32" },
  symptomText: { color: "#465246", lineHeight: 18 },
  symptomTextSelected: { color: "#1B5E20", fontWeight: "700" },
  homeButton: { alignItems: "center", backgroundColor: "#2E7D32", borderRadius: 12, flexDirection: "row", justifyContent: "center", marginTop: 24, paddingVertical: 13 },
  homeButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", marginLeft: 7 },
  loginButton: { alignItems: "center", borderColor: "#B9D8BA", borderRadius: 12, borderWidth: 1, flexDirection: "row", justifyContent: "center", marginTop: 24, paddingVertical: 13 },
  loginButtonText: { color: "#2E7D32", fontSize: 14, fontWeight: "700", marginLeft: 7 },
  footerText: { color: "#7A857A", fontSize: 12, marginTop: 28, textAlign: "center" },
});
