import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { apiRequest, cachedApiRequest } from "../services/api";
import { useI18n } from "../contexts/I18nContext";
import { ScrollReveal } from "../components/scroll-reveal";

interface Farm {
  id: number;
  name: string;
  area: number;
  latitude: number;
  longitude: number;
}

interface Field {
  id: number;
  farm_id: number;
  name: string;
  crop: string;
  variety: string;
  growth_stage: string;
  planting_date: string;
  area: number;
}

interface ForecastDay {
  date: string;
  temperature: number | null;
  humidity: number | null;
  rainfall: number | null;
  wind_speed: number | null;
  risk_score: number;
  risk_level: string;
}

interface PeriodSummary {
  risk_score: number;
  highest_risk_score?: number;
  highest_risk_level?: string;
  risk_level: string;
}

interface ForecastResponse {
  isSample?: boolean;
  field_id: number;
  field_name: string;
  crop: string;
  growth_stage: string;

  diagnosis: {
    disease: string;
    confidence: number;
    severity: string;
  };

  current_risk: {
    score: number;
    level: string;
  };

  forecast: {
    "3_day": PeriodSummary;
    "5_day": PeriodSummary;
    "7_day": PeriodSummary;
    daily: ForecastDay[];
  };

  forecast_alert?: {
    id: number;
    severity: string;
    title: string;
    message: string;
  } | null;
}

const FORECAST_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export default function ForecastScreen() {
  const { t } = useI18n();
  const entryAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);

  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  const [forecast, setForecast] =
    useState<ForecastResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);

  const createSampleForecast = (
    field: Field,
    diagnosis?: ForecastResponse["diagnosis"],
  ): ForecastResponse => {
    const baseRisk = 30 + ((field.id * 17) % 31);
    const daily = Array.from({ length: 7 }, (_, index) => {
      const score = Math.min(100, baseRisk + ((index * 9 + field.id) % 20));
      const riskLevel = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
      const date = new Date();
      date.setDate(date.getDate() + index);

      return {
        date: date.toISOString().slice(0, 10),
        temperature: 24 + ((field.id + index) % 7),
        humidity: 58 + ((field.id * 3 + index * 4) % 25),
        rainfall: index % 3 === 0 ? 4 : 0,
        wind_speed: 8 + (index % 5),
        risk_score: score,
        risk_level: riskLevel,
      };
    });

    const summary = (days: number): PeriodSummary => {
      const period = daily.slice(0, days);
      const score = Math.round(
        period.reduce((total, day) => total + day.risk_score, 0) / period.length,
      );
      const highest = Math.max(...period.map((day) => day.risk_score));
      return {
        risk_score: score,
        highest_risk_score: highest,
        highest_risk_level: highest >= 70 ? "high" : highest >= 40 ? "medium" : "low",
        risk_level: score >= 70 ? "high" : score >= 40 ? "medium" : "low",
      };
    };

    return {
      isSample: true,
      field_id: field.id,
      field_name: field.name,
      crop: field.crop,
      growth_stage: field.growth_stage,
      diagnosis: {
        disease: diagnosis?.disease || t("forecast.noLatestDiagnosis"),
        confidence: diagnosis?.confidence || 0,
        severity: diagnosis?.severity || "low",
      },
      current_risk: {
        score: baseRisk,
        level: baseRisk >= 40 ? "medium" : "low",
      },
      forecast: {
        "3_day": summary(3),
        "5_day": summary(5),
        "7_day": summary(7),
        daily,
      },
      forecast_alert: null,
    };
  };

  useEffect(() => {
    Animated.timing(entryAnimation, {
      toValue: 1,
      duration: 460,
      useNativeDriver: true,
    }).start();
  }, [entryAnimation]);

  const loadFarms = async () => {
    try {
      setLoading(true);

      const farmData = await apiRequest("/api/farms");

      setFarms(farmData || []);

      if (farmData && farmData.length > 0) {
        const firstFarm = farmData[0];

        setSelectedFarm(firstFarm);

        await loadFields(firstFarm.id);
      }
    } catch (error: any) {
      console.log("Forecast farms error:", error);

      Alert.alert(
        t("forecast.error"),
        error?.message || t("forecast.loadFarms")
      );
    } finally {
      setLoading(false);
    }
  };

  const loadFields = async (farmId: number) => {
    try {
      setForecast(null);

      const fieldData = await apiRequest(
        `/api/farms/${farmId}/fields`
      );

      setFields(fieldData || []);

      if (fieldData && fieldData.length > 0) {
        const firstField = fieldData[0];

        setSelectedField(firstField);

        await loadForecast(firstField.id, false, firstField);
      } else {
        setSelectedField(null);
      }
    } catch (error: any) {
      console.log("Forecast fields error:", error);

      Alert.alert(
        t("forecast.error"),
        error?.message || t("forecast.loadFields")
      );
    }
  };

  const loadForecast = async (
    fieldId: number,
    forceRefresh = false,
    fallbackField?: Field,
  ) => {
    try {
      setLoadingForecast(true);

      const data = await cachedApiRequest<ForecastResponse>(
        `/api/forecast/field/${fieldId}${forceRefresh ? "?refresh=true" : ""}`,
        FORECAST_CACHE_TTL_MS,
        {},
        forceRefresh,
      );

      setForecast(data);
    } catch (error: any) {
      console.log("Forecast error:", error);

      const fieldForFallback =
        fallbackField || fields.find((field) => field.id === fieldId);
      if (fieldForFallback) {
        let latestDiagnosis: ForecastResponse["diagnosis"] | undefined;
        try {
          latestDiagnosis = await cachedApiRequest(
            `/api/diagnosis/field/${fieldId}/latest`,
            FORECAST_CACHE_TTL_MS,
          );
        } catch {
          latestDiagnosis = undefined;
        }
        setForecast(createSampleForecast(fieldForFallback, latestDiagnosis));
      } else {
        setForecast(null);
      }
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleFarmChange = async (farm: Farm) => {
    setSelectedFarm(farm);
    await loadFields(farm.id);
  };

  const handleFieldChange = async (field: Field) => {
    setSelectedField(field);
    await loadForecast(field.id, false, field);
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const getRiskIcon = (level: string) => {
    if (level === "high") {
      return "warning";
    }

    if (level === "medium") {
      return "alert-circle";
    }

    return "checkmark-circle";
  };

  const getRiskColor = (level: string) => {
    if (level === "high") {
      return "#dc2626";
    }

    if (level === "medium") {
      return "#d97706";
    }

    return "#16a34a";
  };

  const formatRiskLevel = (level: string) => {
    if (!level) return t("forecast.unknown");

    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const formatDate = (value: string) => {
    if (!value) return "";

    const date = new Date(value);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatConfidence = (confidence: number) => {
    if (confidence <= 1) {
      return `${Math.round(confidence * 100)}%`;
    }

    return `${Math.round(confidence)}%`;
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          {t("forecast.loading")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/app-icon.jpeg")}
        style={styles.watermark}
        resizeMode="contain"
      />
      <Animated.View
        style={[
          styles.entry,
          {
            opacity: entryAnimation,
            transform: [{ translateY: entryAnimation.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          },
        ]}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#111827"
          />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>
            {t("forecast.title")}
          </Text>

          <Text style={styles.headerSubtitle}>
            {t("forecast.subtitle")}
          </Text>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {/* Farm Selection */}
        <Text style={styles.sectionTitle}>
          {t("forecast.selectFarm")}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {farms.map((farm) => {
            const active = selectedFarm?.id === farm.id;

            return (
              <TouchableOpacity
                key={farm.id}
                style={[
                  styles.selectionCard,
                  active && styles.selectionCardActive,
                ]}
                onPress={() => handleFarmChange(farm)}
              >
                <Ionicons
                  name="leaf"
                  size={20}
                  color={active ? "#ffffff" : "#16a34a"}
                />

                <Text
                  style={[
                    styles.selectionText,
                    active && styles.selectionTextActive,
                  ]}
                >
                  {farm.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {farms.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="leaf-outline" size={34} color="#16a34a" />
            <Text style={styles.emptyTitle}>{t("forecast.noFarms")}</Text>
            <Text style={styles.emptyText}>{t("forecast.noFarmsText")}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/(tabs)/farm")}
            >
              <Text style={styles.addButtonText}>{t("forecast.addFarm")}</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.footerText}>{t("app.footerCredit")}</Text>

        {/* Field Selection */}
        {selectedFarm && (
          <>
            <Text style={styles.sectionTitle}>
              {t("forecast.selectField")}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {fields.map((field) => {
                const active =
                  selectedField?.id === field.id;

                return (
                  <TouchableOpacity
                    key={field.id}
                    style={[
                      styles.selectionCard,
                      active && styles.selectionCardActive,
                    ]}
                    onPress={() =>
                      handleFieldChange(field)
                    }
                  >
                    <Ionicons
                      name="location"
                      size={20}
                      color={
                        active ? "#ffffff" : "#2E7D32"
                      }
                    />

                    <View>
                      <Text
                        style={[
                          styles.selectionText,
                          active &&
                            styles.selectionTextActive,
                        ]}
                      >
                        {field.name}
                      </Text>

                      <Text
                        style={[
                          styles.selectionSubtext,
                          active &&
                            styles.selectionSubtextActive,
                        ]}
                      >
                        {field.crop}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* No fields */}
        {selectedFarm && fields.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons
              name="leaf-outline"
              size={42}
              color="#9ca3af"
            />

            <Text style={styles.emptyTitle}>
              {t("forecast.noFields")}
            </Text>

            <Text style={styles.emptyText}>
              {t("forecast.noFieldsText")}
            </Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                router.push("/(tabs)/farm")
              }
            >
              <Text style={styles.addButtonText}>
                {t("forecast.addFarm")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Forecast */}
        {loadingForecast && (
          <View style={styles.forecastLoading}>
            <ActivityIndicator size="large" />

            <Text style={styles.loadingText}>
              {t("forecast.loading")}
            </Text>
          </View>
        )}

        {/* Forecast */}
        {!loadingForecast && forecast && (
          <>
            {/* Field Info */}
            <ScrollReveal scrollY={scrollY}>
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="leaf"
                  size={25}
                  color="#16a34a"
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>
                  {forecast.field_name}
                </Text>

                <Text style={styles.infoText}>
                  {forecast.crop} •{" "}
                  {forecast.growth_stage}
                </Text>

                <Text style={styles.infoText}>
                  {t("forecast.detected")}:{" "}
                  {forecast.diagnosis.disease}
                </Text>
              </View>
            </View>
            </ScrollReveal>

            {/* Current Risk */}
            <Text style={styles.sectionTitle}>
              {t("forecast.currentRisk")}
            </Text>

            <ScrollReveal scrollY={scrollY}>
            <View style={styles.currentRiskCard}>
              <View
                style={[
                  styles.riskIconContainer,
                  {
                    backgroundColor: `${getRiskColor(
                      forecast.current_risk.level
                    )}20`,
                  },
                ]}
              >
                <Ionicons
                  name={
                    getRiskIcon(
                      forecast.current_risk.level
                    ) as any
                  }
                  size={35}
                  color={getRiskColor(
                    forecast.current_risk.level
                  )}
                />
              </View>

              <View style={styles.riskContent}>
                <Text style={styles.riskLabel}>
                  {t("forecast.currentRisk")}
                </Text>

                <Text
                  style={[
                    styles.riskLevel,
                    {
                      color: getRiskColor(
                        forecast.current_risk.level
                      ),
                    },
                  ]}
                >
                  {formatRiskLevel(
                    forecast.current_risk.level
                  )}
                </Text>
              </View>

              <Text
                style={[
                  styles.riskScore,
                  {
                    color: getRiskColor(
                      forecast.current_risk.level
                    ),
                  },
                ]}
              >
                {Math.round(
                  forecast.current_risk.score
                )}
              </Text>
            </View>
            </ScrollReveal>

            {/* Diagnosis */}
            <ScrollReveal scrollY={scrollY}>
            <View style={styles.diagnosisCard}>
              <Text style={styles.cardTitle}>
                {t("forecast.diagnosis")}
              </Text>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>
                  {t("forecast.disease")}
                </Text>

                <Text style={styles.rowValue}>
                  {forecast.diagnosis.disease}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>
                  {t("forecast.confidence")}
                </Text>

                <Text style={styles.rowValue}>
                  {formatConfidence(
                    forecast.diagnosis.confidence
                  )}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>
                  {t("forecast.severity")}
                </Text>

                <Text style={styles.rowValue}>
                  {formatRiskLevel(
                    forecast.diagnosis.severity
                  )}
                </Text>
              </View>
            </View>
            </ScrollReveal>

            {/* Period Summary */}
            <Text style={styles.sectionTitle}>
              {t("forecast.outlook")}
            </Text>

            <ScrollReveal scrollY={scrollY}>
            <View style={styles.periodContainer}>
              {[
                {
                  title: t("forecast.days3"),
                  data: forecast.forecast["3_day"],
                },
                {
                  title: t("forecast.days5"),
                  data: forecast.forecast["5_day"],
                },
                {
                  title: t("forecast.days7"),
                  data: forecast.forecast["7_day"],
                },
              ].map((period) => (
                <View
                  key={period.title}
                  style={styles.periodCard}
                >
                  <Text style={styles.periodTitle}>
                    {period.title}
                  </Text>

                  <Text
                    style={[
                      styles.periodRisk,
                      {
                        color: getRiskColor(
                          period.data.risk_level
                        ),
                      },
                    ]}
                  >
                    {Math.round(
                      period.data.risk_score
                    )}
                  </Text>

                  <Text
                    style={[
                      styles.periodLevel,
                      {
                        color: getRiskColor(
                          period.data.risk_level
                        ),
                      },
                    ]}
                  >
                    {formatRiskLevel(
                      period.data.risk_level
                    )}
                  </Text>
                </View>
              ))}
            </View>
            </ScrollReveal>

            {/* Forecast Alert */}
            {forecast.forecast_alert && (
              <ScrollReveal scrollY={scrollY}>
              <View style={styles.alertCard}>
                <View style={styles.alertIcon}>
                  <Ionicons
                    name="warning"
                    size={24}
                    color="#dc2626"
                  />
                </View>

                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>
                    {forecast.forecast_alert.title}
                  </Text>

                  <Text style={styles.alertMessage}>
                    {forecast.forecast_alert.message}
                  </Text>
                </View>
              </View>
              </ScrollReveal>
            )}

            {/* Daily Forecast */}
            <Text style={styles.sectionTitle}>
              {t("forecast.daily")}
            </Text>

            {forecast.forecast.daily.map(
              (day, index) => (
                <ScrollReveal key={`${day.date}-${index}`} scrollY={scrollY}>
                <View
                  style={styles.dailyCard}
                >
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>
                      {formatDate(day.date)}
                    </Text>
                  </View>

                  <View style={styles.weatherContainer}>
                    <View style={styles.weatherItem}>
                      <Ionicons
                        name="thermometer-outline"
                        size={17}
                        color="#6b7280"
                      />

                      <Text style={styles.weatherText}>
                        {day.temperature !== null
                          ? `${Math.round(
                              day.temperature
                            )}°C`
                          : "--"}
                      </Text>
                    </View>

                    <View style={styles.weatherItem}>
                      <Ionicons
                        name="water-outline"
                        size={17}
                        color="#6b7280"
                      />

                      <Text style={styles.weatherText}>
                        {day.humidity !== null
                          ? `${Math.round(
                              day.humidity
                            )}%`
                          : "--"}
                      </Text>
                    </View>

                    <View style={styles.weatherItem}>
                      <Ionicons
                        name="rainy-outline"
                        size={17}
                        color="#6b7280"
                      />

                      <Text style={styles.weatherText}>
                        {day.rainfall !== null
                          ? `${day.rainfall.toFixed(
                              1
                            )}mm`
                          : "--"}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.dailyRisk,
                      {
                        backgroundColor: `${getRiskColor(
                          day.risk_level
                        )}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dailyRiskScore,
                        {
                          color: getRiskColor(
                            day.risk_level
                          ),
                        },
                      ]}
                    >
                      {Math.round(day.risk_score)}
                    </Text>

                    <Text
                      style={[
                        styles.dailyRiskLevel,
                        {
                          color: getRiskColor(
                            day.risk_level
                          ),
                        },
                      ]}
                    >
                      {formatRiskLevel(
                        day.risk_level
                      )}
                    </Text>
                  </View>
                </View>
                </ScrollReveal>
              )
            )}

            <TouchableOpacity
              style={styles.refreshIcon}
              onPress={() =>
                selectedField &&
                loadForecast(selectedField.id, true)
              }
            >
              <Ionicons
                name="refresh"
                size={20}
                color="#2E7D32"
              />
            </TouchableOpacity>

            {forecast.isSample && (
              <View style={styles.sampleBanner}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#8A6200"
                />
                <Text style={styles.sampleBannerText}>
                  {t("forecast.sampleLabel")}
                </Text>
              </View>
            )}
          </>
        )}
      </Animated.ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  entry: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: "#F5F8F3",
  },

  watermark: {
    position: "absolute",
    width: 360,
    height: 360,
    right: -130,
    top: 120,
    opacity: 0.035,
    transform: [{ rotate: "-18deg" }],
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F8F3",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#6b7280",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 18,
    marginBottom: 12,
  },

  horizontalList: {
    gap: 10,
    paddingBottom: 4,
  },

  selectionCard: {
    minWidth: 120,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  selectionCardActive: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },

  selectionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  selectionTextActive: {
    color: "#ffffff",
  },

  selectionSubtext: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },

  selectionSubtextActive: {
    color: "#dcfce7",
  },

  emptyCard: {
    marginTop: 25,
    padding: 30,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  emptyText: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#6b7280",
  },

  addButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#16a34a",
  },

  addButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  forecastLoading: {
    marginTop: 40,
    alignItems: "center",
  },

  sampleBanner: {
    marginTop: 18,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#F3E4AD",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sampleBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#806F28",
    fontWeight: "600",
  },

  infoCard: {
    marginTop: 22,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 13,
  },

  infoTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  infoText: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },

  currentRiskCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
  },

  riskIconContainer: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },

  riskContent: {
    flex: 1,
    marginLeft: 14,
  },

  riskLabel: {
    fontSize: 13,
    color: "#6b7280",
  },

  riskLevel: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "700",
  },

  riskScore: {
    fontSize: 34,
    fontWeight: "800",
  },

  diagnosisCard: {
    marginTop: 15,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#ffffff",
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },

  row: {
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  rowLabel: {
    fontSize: 14,
    color: "#6b7280",
  },

  rowValue: {
    maxWidth: "60%",
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "right",
  },

  periodContainer: {
    flexDirection: "row",
    gap: 10,
  },

  periodCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },

  periodTitle: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },

  periodRisk: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: "800",
  },

  periodLevel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
  },

  alertCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    flexDirection: "row",
  },

  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },

  alertContent: {
    flex: 1,
    marginLeft: 12,
  },

  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#991b1b",
  },

  alertMessage: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: "#7f1d1d",
  },

  dailyCard: {
    marginBottom: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
  },

  dateContainer: {
    width: 58,
  },

  dateText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  weatherContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },

  weatherItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  weatherText: {
    fontSize: 11,
    color: "#6b7280",
  },

  dailyRisk: {
    minWidth: 52,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
  },

  dailyRiskScore: {
    fontSize: 15,
    fontWeight: "800",
  },

  dailyRiskLevel: {
    fontSize: 9,
    fontWeight: "700",
  },

  refreshButton: {
    marginTop: 15,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  refreshIcon: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginTop: 14,
    width: 36,
  },
  footerText: { color: "#7A857A", fontSize: 12, paddingBottom: 10, textAlign: "center" },

  refreshText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
