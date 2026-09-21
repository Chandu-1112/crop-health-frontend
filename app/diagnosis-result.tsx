import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiRequest } from "../services/api";
import { useI18n } from "../contexts/I18nContext";

const teluguDiseaseNames: Record<string, string> = {
  "early blight": "ప్రారంభ దశ ఆకుమచ్చ",
  "late blight": "ఆలస్య దశ ఆకుమచ్చ",
  "bacterial spot": "బాక్టీరియా మచ్చ",
  "leaf mold": "ఆకు బూజు",
  blast: "వరి అగ్గి తెగులు",
  "brown spot": "గోధుమ మచ్చ తెగులు",
  "bacterial leaf blight": "బాక్టీరియా ఆకు ఎండుతెగులు",
  "bacterial blight": "బాక్టీరియా ఆకు తెగులు",
  "bollworm damage": "కాయతొలుచు పురుగు నష్టం",
  "leaf curl": "ఆకు ముడత",
  "powdery mildew": "బూజు తెగులు",
  "thrips damage": "థ్రిప్స్ నష్టం",
  "tikka leaf spot": "టిక్కా ఆకు మచ్చ",
  rust: "తుప్పు తెగులు",
};

const hindiDiseaseNames: Record<string, string> = {
  "early blight": "अगेती झुलसा",
  "tomato early blight": "अगेती झुलसा",
  "late blight": "पछेती झुलसा",
  "tomato late blight": "पछेती झुलसा",
  "bacterial spot": "बैक्टीरियल स्पॉट",
  "leaf mold": "लीफ मोल्ड",
  blast: "धान का झुलसा रोग",
  "rice blast": "धान का झुलसा रोग",
  "brown spot": "भूरा धब्बा",
  "bacterial leaf blight": "बैक्टीरियल लीफ ब्लाइट",
  "bacterial blight": "बैक्टीरियल ब्लाइट",
  "bollworm damage": "बॉलवर्म नुकसान",
  "leaf curl": "लीफ कर्ल",
  "powdery mildew": "पाउडरी मिल्ड्यू",
  "thrips damage": "थ्रिप्स नुकसान",
  "tikka leaf spot": "टिक्का लीफ स्पॉट",
  rust: "रस्ट",
};

type Diagnosis = {
  id: number;
  field_id: number;
  image_url?: string;
  disease: string;
  confidence: number;
  severity: string;
  affected_area: number;
  diagnosis_source: string;
  status: string;
  explanation: string;
};

type Recommendation = {
  priority: string;
  type: string;
  action: string;
  reason: string;
};

export default function DiagnosisResultScreen() {
  const { t, language } = useI18n();
  const { diagnosisId } = useLocalSearchParams<{
    diagnosisId: string;
  }>();

  const [diagnosis, setDiagnosis] =
    useState<Diagnosis | null>(null);

  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  /* ===================================================== */
  /* LOAD DIAGNOSIS */
  /* ===================================================== */

  const loadDiagnosis = async () => {
    if (!diagnosisId) {
      Alert.alert(
        t("result.notFound"),
        t("result.noId"),
        [
          {
            text: t("result.goBack"),
            onPress: () => router.back(),
          },
        ]
      );
      return;
    }

    try {
      setLoading(true);

      const data: Diagnosis = await apiRequest(
        `/api/diagnosis/${diagnosisId}`
      );

      console.log(
        "Diagnosis result:",
        data
      );

      setDiagnosis(data);
      try {
        const recommendationData = await apiRequest(
          `/api/recommendations/field/${data.field_id}`,
        );
        setRecommendations(
          Array.isArray(recommendationData?.recommendations)
            ? recommendationData.recommendations
            : [],
        );
      } catch (recommendationError) {
        console.log("Recommendation load error:", recommendationError);
        setRecommendations([]);
      }
    } catch (error: any) {
      console.log(
        "Diagnosis result error:",
        error?.message
      );

      Alert.alert(
        t("result.loadErrorTitle"),
        error?.message || t("result.loadError"),
        [
          {
            text: t("result.goBack"),
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDiagnosis();
    }, [diagnosisId])
  );

  /* ===================================================== */
  /* HELPERS */
  /* ===================================================== */

  const getConfidence = () => {
    if (!diagnosis) return 0;

    /*
     * Backend may return confidence as:
     * 0.92  -> 92%
     * 92    -> 92%
     */

    if (diagnosis.confidence <= 1) {
      return Math.round(
        diagnosis.confidence * 100
      );
    }

    return Math.round(diagnosis.confidence);
  };

  const getSeverityPercent = () => {
    const value = diagnosis?.severity?.toLowerCase() || "";
    if (isHealthy) return 0;
    const numericValue = Number.parseFloat(value);

    if (Number.isFinite(numericValue)) {
      return Math.min(Math.max(Math.round(numericValue <= 1 ? numericValue * 100 : numericValue), 0), 100);
    }

    if (value.includes("high") || value.includes("severe")) return 85;
    if (value.includes("medium") || value.includes("moderate")) return 55;
    return 25;
  };

  const getRiskColor = (percent: number) => {
    if (percent >= 67) return "#D32F2F";
    if (percent >= 34) return "#EF8C00";
    return "#2E7D32";
  };

  const getConfidenceColor = (percent: number) => {
    if (percent >= 67) return "#2E7D32";
    if (percent >= 34) return "#EF8C00";
    return "#D32F2F";
  };

  const getTeluguDiseaseName = (disease: string) =>
    teluguDiseaseNames[disease.trim().toLowerCase()] || "తెలుగు పేరు అందుబాటులో లేదు";

  const getHindiDiseaseName = (disease: string) =>
    hindiDiseaseNames[disease.trim().toLowerCase()] || "हिंदी नाम उपलब्ध नहीं है";

  const getLocalizedDiseaseName = (disease: string) => {
    if (language === "te") return getTeluguDiseaseName(disease);
    if (language === "hi") return getHindiDiseaseName(disease);
    return disease;
  };

  const isHealthy = [
    diagnosis?.disease,
    diagnosis?.severity,
  ].some((value) =>
    ["healthy", "no disease", "no disease identified", "none"].includes(
      (value || "").trim().toLowerCase(),
    ),
  );

  const getSymptoms = (explanation: string) =>
    explanation
      .replace(/^(symptoms?|visible signs?|signs?)\s*:\s*/i, "")
      .split(/[,.!?\n;]+/)
      .map((symptom) => symptom.trim())
      .map((symptom) => symptom.replace(/^(and|or)\s+/i, ""))
      .filter(Boolean)
      .slice(0, 4);

  const speakDisease = async () => {
    const englishName = diagnosis?.disease || t("result.unknown");
    const spokenName = getLocalizedDiseaseName(englishName);

    try {
      await Speech.stop();
      Speech.speak(spokenName, {
        language: language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN",
        rate: 0.85,
      });
    } catch (error) {
      console.log("Disease speech error:", error);
      Alert.alert(t("result.speechUnavailable"));
    }
  };

  const localizeValue = (value: string | null | undefined) => {
    const normalized = (value || "").toLowerCase();
    const keys: Record<string, string> = {
      high: "common.high",
      severe: "common.severe",
      medium: "common.medium",
      moderate: "common.moderate",
      low: "common.low",
      pending: "common.pending",
      completed: "common.completed",
      reviewed: "common.reviewed",
      ai: "common.ai",
      ai_analysis: "common.ai",
    };
    return keys[normalized] ? t(keys[normalized]) : value || t("result.unknown");
  };

  const getSeverityColor = () => {
    const severity =
      diagnosis?.severity?.toLowerCase() || "";
    if (isHealthy) return "#2E7D32";
    const numericValue = Number.parseFloat(severity);

    if (Number.isFinite(numericValue)) {
      const percent = numericValue <= 1 ? numericValue * 100 : numericValue;
      return getRiskColor(percent);
    }

    if (
      severity.includes("high") ||
      severity.includes("severe")
    ) {
      return "#D32F2F";
    }

    if (
      severity.includes("medium") ||
      severity.includes("moderate")
    ) {
      return "#EF8C00";
    }

    return "#2E7D32";
  };

  /* ===================================================== */
  /* LOADING */
  /* ===================================================== */

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <Ionicons
            name="analytics-outline"
            size={34}
            color="#2E7D32"
          />
        </View>

        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />

        <Text style={styles.loadingTitle}>
          {t("result.loading")}
        </Text>

        <Text style={styles.loadingSubtitle}>
          {t("result.analysisText")}
        </Text>
      </SafeAreaView>
    );
  }

  /* ===================================================== */
  /* NO RESULT */
  /* ===================================================== */

  if (!diagnosis) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons
          name="document-text-outline"
          size={50}
          color="#8A9389"
        />

        <Text style={styles.loadingTitle}>
          {t("result.loadErrorTitle")}
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            {t("result.goBack")}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const confidence = Math.min(Math.max(getConfidence(), 0), 100);
  const severityPercent = getSeverityPercent();
  const affectedArea = Math.min(
    Math.max(Math.round(Number(diagnosis.affected_area) || 0), 0),
    100,
  );
  const severityColor = getSeverityColor();
  const confidenceColor = getConfidenceColor(confidence);
  const affectedAreaColor = getRiskColor(affectedArea);
  const symptoms = getSymptoms(diagnosis.explanation || "");

  /* ===================================================== */
  /* MAIN UI */
  /* ===================================================== */

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#263326"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {t("result.title")}
            </Text>

            <Text style={styles.headerSubtitle}>
              {t("result.headerSubtitle")}
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* SUCCESS BANNER */}
        {/* ================================================= */}

        <View style={styles.successBanner}>
          <View style={styles.successIcon}>
            <Ionicons
              name="checkmark"
              size={21}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.successContent}>
            <Text style={styles.successTitle}>
              {t("result.complete")}
            </Text>

            <Text style={styles.successText}>
              {t("result.analysisText")}
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* DISEASE RESULT */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          {t("result.diagnosisDetails")}
        </Text>

        <View style={styles.diagnosisCard}>
          <View style={styles.diagnosisTop}>
            <View style={styles.diseaseIcon}>
              <Ionicons
                name="leaf"
                size={27}
                color="#2E7D32"
              />
            </View>

            <View style={styles.diseaseInfo}>
              <View style={styles.diseaseLabelRow}>
                <Text style={styles.diseaseLabel}>
                  {t("result.disease")}
                </Text>

                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={speakDisease}
                  accessibilityLabel={t("result.speakDisease")}
                >
                  <Ionicons
                    name="volume-high-outline"
                    size={18}
                    color="#2E7D32"
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.diseaseName, isHealthy && styles.healthyText]}>
                {isHealthy
                  ? t("result.healthy")
                  : getLocalizedDiseaseName(diagnosis.disease || t("result.unknown"))}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Disease severity */}

          <View style={styles.confidenceHeader}>
            <Text style={styles.metricLabel}>
              {t("result.severity")}
            </Text>

            <Text style={[styles.confidenceValue, { color: severityColor }]}>
              {severityPercent}%
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${severityPercent}%`,
                  backgroundColor: severityColor,
                },
              ]}
            />
          </View>

          {/* AI confidence */}
          <View style={styles.confidenceHeader}>
            <Text style={styles.metricLabel}>
              {t("result.confidence")}
            </Text>

            <Text style={[styles.confidenceValue, { color: confidenceColor }]}>
              {confidence}%
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(confidence, 100)}%`,
                  backgroundColor: confidenceColor,
                },
              ]}
            />
          </View>

          <Text style={styles.confidenceHint}>
            {t("result.confidenceHint")}
          </Text>
        </View>

        {/* ================================================= */}
        {/* SEVERITY + AFFECTED AREA */}
        {/* ================================================= */}

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.affectedAreaHeader}>
              <View style={styles.affectedAreaLabel}>
                <View style={styles.metricIcon}>
                  <Ionicons
                    name="pie-chart-outline"
                    size={22}
                    color="#2E7D32"
                  />
                </View>

                <Text style={styles.metricSmallLabel}>
                  {t("result.affectedArea")}
                </Text>
              </View>

              <Text style={[styles.affectedAreaValue, { color: affectedAreaColor }]}>
                {affectedArea}%
              </Text>
            </View>

            <View style={styles.affectedAreaTrack}>
              <View
                style={[
                  styles.affectedAreaFill,
                  {
                    width: `${affectedArea}%`,
                    backgroundColor: affectedAreaColor,
                  },
                ]}
              />
            </View>

            <Text style={styles.affectedAreaHint}>
              {affectedArea === 0
                ? t("result.noAffectedArea")
                : t("result.affectedAreaHint")}
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* EXPLANATION */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          {t("result.whyDiagnosis")}
        </Text>

        <View style={styles.explanationCard}>
          <View style={styles.explanationIcon}>
            <Ionicons
              name="sparkles"
              size={20}
              color="#2E7D32"
            />
          </View>

          <View style={styles.explanationContent}>
            <Text style={[styles.explanationTitle, isHealthy && styles.healthyText]}>
              {isHealthy ? t("result.healthy") : t("result.symptoms")}
            </Text>

            {(isHealthy
              ? [t("result.noDiseaseSymptoms")]
              : symptoms.length > 0
              ? symptoms
              : [t("result.noSymptoms")]
            ).map((symptom, index) => (
              <View style={styles.symptomRow} key={`${symptom}-${index}`}>
                <Text style={[styles.symptomBullet, isHealthy && styles.healthyText]}>•</Text>
                <Text style={styles.explanationText}>{symptom}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ================================================= */}
        {/* SOURCE + STATUS */}
        {/* ================================================= */}

        <View style={styles.detailsCard}>
          <DetailRow
            icon="hardware-chip-outline"
            label={t("result.source")}
            value={
              localizeValue(diagnosis.diagnosis_source || "ai")
            }
          />

          <View style={styles.detailDivider} />

          <DetailRow
            icon="information-circle-outline"
            label={t("result.status")}
            value={
              localizeValue(diagnosis.status || "completed")
            }
          />

          <View style={styles.detailDivider} />

          <DetailRow
            icon="document-text-outline"
            label={t("result.id")}
            value={`#${diagnosis.id}`}
          />
        </View>

        <Text style={styles.sectionTitle}>
          {t("result.recommendations")}
        </Text>

        <View style={styles.recommendationsCard}>
          {recommendations.length === 0 ? (
            <Text style={styles.recommendationEmpty}>
              {t("result.noRecommendations")}
            </Text>
          ) : (
            recommendations.map((item, index) => (
              <View key={`${item.type}-${index}`} style={styles.recommendationRow}>
                <View style={styles.recommendationIcon}>
                  <Ionicons
                    name={
                      item.type === "pesticide_safety"
                        ? "flask-outline"
                        : item.type === "prevention"
                          ? "shield-checkmark-outline"
                          : "leaf-outline"
                    }
                    size={20}
                    color="#2E7D32"
                  />
                </View>
                <View style={styles.recommendationBody}>
                  <Text style={styles.recommendationType}>
                    {item.type === "pesticide_safety"
                      ? t("result.pesticideSafety")
                      : item.type === "prevention"
                        ? t("result.prevention")
                        : t("result.action")}
                  </Text>
                  <Text style={styles.recommendationAction}>{item.action}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.warningCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color="#7A6200"
          />

          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>
              {t("result.checkOfficerTitle")}
            </Text>

            <Text style={styles.warningText}>
              {t("result.checkOfficerText")}
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* ACTIONS */}
        {/* ================================================= */}

        <TouchableOpacity
          style={styles.monitorButton}
          onPress={() => {
            Alert.alert(
              t("result.monitorTitle"),
              t("result.monitorText")
            );
          }}
        >
          <Ionicons
            name="pulse-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.monitorButtonText}>
            {t("result.monitor")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newDiagnosisButton}
          onPress={() =>
            router.replace("/(tabs)/diagnose")
          }
        >
          <Ionicons
            name="scan-outline"
            size={20}
            color="#2E7D32"
          />

          <Text style={styles.newDiagnosisText}>
            {t("result.newDiagnosis")}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ========================================================= */
/* DETAIL ROW */
/* ========================================================= */

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={19}
          color="#2E7D32"
        />
      </View>

      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text
        style={styles.detailValue}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

/* ========================================================= */
/* STYLES */
/* ========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8F3",
  },

  scrollContent: {
    paddingBottom: 25,
  },

  /* ---------------- Loading ---------------- */

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F8F3",
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  loadingTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: "700",
    color: "#263326",
  },

  loadingSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#7A827A",
    textAlign: "center",
  },

  /* ---------------- Header ---------------- */

  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  backIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#1B5E20",
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#707870",
  },

  /* ---------------- Success ---------------- */

  successBanner: {
    marginHorizontal: 22,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CDE5CE",
  },

  successIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },

  successContent: {
    flex: 1,
    marginLeft: 11,
  },

  successTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1B5E20",
  },

  successText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: "#527054",
  },

  /* ---------------- Sections ---------------- */

  sectionTitle: {
    marginHorizontal: 22,
    marginTop: 23,
    marginBottom: 11,
    fontSize: 16,
    fontWeight: "700",
    color: "#263326",
  },

  /* ---------------- Image ---------------- */

  imageCard: {
    marginHorizontal: 22,
    height: 250,
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  cropImage: {
    width: "100%",
    height: "100%",
  },

  imageFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  imageFallbackText: {
    marginTop: 8,
    fontSize: 12,
    color: "#8A9389",
  },

  /* ---------------- Diagnosis ---------------- */

  diagnosisCard: {
    marginHorizontal: 22,
    padding: 17,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  diagnosisTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  diseaseIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  diseaseInfo: {
    flex: 1,
    marginLeft: 12,
  },

  diseaseLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: "#8A9389",
  },

  diseaseLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  speakerButton: {
    width: 30,
    height: 30,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  diseaseName: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
    color: "#263326",
  },

  healthyText: {
    color: "#2E7D32",
  },

  diseaseTeluguName: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: "700",
    color: "#2E7D32",
  },

  divider: {
    height: 1,
    backgroundColor: "#EDF0EC",
    marginVertical: 16,
  },

  confidenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  metricLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#606960",
  },

  confidenceValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2E7D32",
  },

  progressBackground: {
    height: 9,
    marginTop: 9,
    borderRadius: 5,
    backgroundColor: "#E5EAE4",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#2E7D32",
  },

  confidenceHint: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 15,
    color: "#8A9389",
  },

  /* ---------------- Metrics ---------------- */

  metricsRow: {
    marginHorizontal: 22,
    marginTop: 11,
    flexDirection: "row",
    gap: 11,
  },

  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  affectedAreaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  affectedAreaLabel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  metricIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  metricSmallLabel: {
    marginTop: 0,
    marginLeft: 10,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#8A9389",
  },

  metricValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: "#263326",
  },

  affectedAreaValue: {
    marginLeft: 10,
    fontSize: 22,
    fontWeight: "800",
    color: "#2E7D32",
  },

  affectedAreaTrack: {
    height: 8,
    marginTop: 14,
    borderRadius: 4,
    backgroundColor: "#E5EAE4",
    overflow: "hidden",
  },

  affectedAreaFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#66BB6A",
  },

  affectedAreaHint: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 14,
    color: "#7A827A",
  },

  /* ---------------- Explanation ---------------- */

  explanationCard: {
    marginHorizontal: 22,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E3EBE1",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  explanationIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  explanationContent: {
    flex: 1,
    marginLeft: 12,
  },

  symptomRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: "#F7FAF6",
  },

  symptomBullet: {
    width: 16,
    fontSize: 18,
    lineHeight: 18,
    fontWeight: "800",
    color: "#2E7D32",
  },

  explanationTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#263326",
  },

  explanationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    color: "#697269",
  },

  /* ---------------- Details ---------------- */

  detailsCard: {
    marginHorizontal: 22,
    marginTop: 12,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  detailRow: {
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
  },

  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  detailLabel: {
    marginLeft: 10,
    fontSize: 11,
    color: "#7A827A",
    flex: 1,
  },

  detailValue: {
    maxWidth: 145,
    fontSize: 12,
    fontWeight: "700",
    color: "#263326",
    textAlign: "right",
  },

  detailDivider: {
    height: 1,
    backgroundColor: "#EEF1ED",
  },

  /* ---------------- Warning ---------------- */

  warningCard: {
    marginHorizontal: 22,
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFF8E1",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#F3E4AD",
  },

  warningContent: {
    flex: 1,
    marginLeft: 10,
  },

  warningTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#735D00",
  },

  warningText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: "#806F28",
  },

  recommendationsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E3EBE1",
  },

  recommendationRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2ED",
  },

  recommendationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  recommendationBody: { flex: 1 },
  recommendationType: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  recommendationAction: {
    color: "#263326",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  recommendationReason: {
    color: "#748074",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  recommendationEmpty: { color: "#748074", lineHeight: 20 },

  /* ---------------- Expert confirmation ---------------- */

  confirmationCard: {
    marginHorizontal: 22,
    padding: 15,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCEBDD",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  confirmationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  confirmationIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  confirmationContent: {
    flex: 1,
    marginLeft: 11,
  },

  confirmationHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#263326",
  },

  confirmationText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#697269",
  },

  confirmationNotes: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "#2E7D32",
  },

  confirmationStatus: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: "700",
    color: "#806F28",
  },

  confirmationButton: {
    marginTop: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  confirmationButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  /* ---------------- Actions ---------------- */

  monitorButton: {
    marginHorizontal: 22,
    marginTop: 18,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 2,
  },

  monitorButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  newDiagnosisButton: {
    marginHorizontal: 22,
    marginTop: 10,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F0F7EF",
    borderWidth: 1,
    borderColor: "#CFE3CF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  newDiagnosisText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "800",
  },

  backButton: {
    marginTop: 20,
    paddingHorizontal: 25,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  bottomSpace: {
    height: 25,
  },
});
