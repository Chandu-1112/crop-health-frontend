import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest, cachedApiRequest } from "../services/api";
import { useI18n } from "../contexts/I18nContext";

type Farm = {
  id: number;
  name: string;
  area: number;
  latitude: number;
  longitude: number;
};

type Field = {
  id: number;
  farm_id: number;
  name: string;
  crop: string;
  variety: string;
  growth_stage: string;
  planting_date: string;
  area: number;
};

const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;

export default function WeatherScreen() {
  const { t } = useI18n();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);

  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  const [weather, setWeather] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadFarms() {
    try {
      setLoading(true);
      setError("");

      const farmData = await apiRequest("/api/farms");

      const farmList: Farm[] = Array.isArray(farmData)
        ? farmData
        : [];

      setFarms(farmList);

      if (farmList.length > 0) {
        await selectFarm(farmList[0]);
      }
    } catch (err: any) {
      console.log("Weather farms error:", err);

      setError(
        err?.message || t("weather.loadFarms")
      );
    } finally {
      setLoading(false);
    }
  }

  const selectFarm = async (farm: Farm) => {
    try {
      setSelectedFarm(farm);
      setSelectedField(null);
      setWeather(null);

      const fieldData = await apiRequest(
        `/api/farms/${farm.id}/fields`
      );

      const fieldList: Field[] = Array.isArray(fieldData)
        ? fieldData
        : [];

      setFields(fieldList);

      if (fieldList.length > 0) {
        setWeather(createLocalWeatherFallback());
        await loadWeather(fieldList[0]);
      }
    } catch (err: any) {
      console.log("Fields error:", err);

      Alert.alert(
        t("weather.loadFields"),
        err?.message || t("alert.tryAgain")
      );
    }
  };

  async function loadWeather(field: Field, forceRefresh = false) {
    try {
      setSelectedField(field);
      setWeatherLoading(true);
      setWeather(null);

      const endpoint = `/api/weather/field/${field.id}${forceRefresh ? "?refresh=true" : ""}`;
      const data = await cachedApiRequest<any>(
        endpoint,
        WEATHER_CACHE_TTL_MS,
        {},
        forceRefresh,
      );

      console.log("Weather response:", data);

      setWeather(data?.weather ?? data);
    } catch (err: any) {
      console.log("Weather error:", err);
      setWeather(createLocalWeatherFallback());

      Alert.alert(
        t("weather.unavailable"),
        err?.message || t("weather.unavailableText")
      );
    } finally {
      setWeatherLoading(false);
    }
  }

  const createLocalWeatherFallback = () => ({
    temperature: 28,
    humidity: 62,
    rainfall: 0,
    wind_speed: 8,
    description: t("weather.sample"),
    is_sample: true,
  });

  useEffect(() => {
    loadFarms();
  }, []);

  const getValue = (
    object: any,
    keys: string[],
    fallback = "--"
  ) => {
    if (!object) return fallback;

    for (const key of keys) {
      if (
        object[key] !== undefined &&
        object[key] !== null
      ) {
        return object[key];
      }
    }

    return fallback;
  };

  const temperature = getValue(weather, [
    "temperature",
    "temperature_c",
    "temp",
    "temp_c",
  ]);

  const humidity = getValue(weather, [
    "humidity",
    "relative_humidity",
    "humidity_percent",
  ]);

  const rainfall = getValue(weather, [
    "rainfall",
    "rain",
    "precipitation",
    "precipitation_mm",
    "rainfall_mm",
  ]);

  const wind = getValue(weather, [
    "wind_speed",
    "wind_speed_kmh",
    "windspeed",
    "wind",
  ]);

  const weatherDescription = getValue(
    weather,
    [
      "description",
      "weather_description",
      "condition",
      "weather",
    ],
    t("weather.current")
  );

  const feelsLike = getValue(weather, [
    "feels_like",
    "feels_like_c",
  ]);

  const pressure = getValue(weather, [
    "pressure",
    "pressure_hpa",
  ]);

  const weatherTime = getValue(weather, [
    "updated_at",
    "timestamp",
    "time",
    "date",
  ]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          {t("weather.loadingFarms")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>
            {t("weather.fieldTitle")}
          </Text>

          <Text style={styles.headerSubtitle}>
            {t("weather.subtitle")}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {farms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🌾</Text>

            <Text style={styles.emptyTitle}>
              {t("weather.noFarms")}
            </Text>

            <Text style={styles.emptyText}>
              {t("weather.noFarmsText")}
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push("/(tabs)/farm")
              }
            >
              <Text style={styles.primaryButtonText}>
                {t("weather.goFarm")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Farm selector */}
            <Text style={styles.sectionTitle}>
              {t("weather.selectFarm")}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {farms.map((farm) => (
                <TouchableOpacity
                  key={farm.id}
                  style={[
                    styles.farmChip,
                    selectedFarm?.id === farm.id &&
                      styles.farmChipSelected,
                  ]}
                  onPress={() => selectFarm(farm)}
                >
                  <Text
                    style={[
                      styles.farmChipText,
                      selectedFarm?.id === farm.id &&
                        styles.farmChipTextSelected,
                    ]}
                  >
                    🌾 {farm.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.footerText}>{t("app.footerCredit")}</Text>

            {/* Field selector */}
            {selectedFarm && (
              <>
                <Text style={styles.sectionTitle}>
                  {t("weather.selectField")}
                </Text>

                {fields.length === 0 ? (
                  <View style={styles.smallEmptyCard}>
                    <Text style={styles.smallEmptyText}>
                      {t("weather.noFields")}
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.horizontalScroll}
                  >
                    {fields.map((field) => (
                      <TouchableOpacity
                        key={field.id}
                        style={[
                          styles.fieldChip,
                          selectedField?.id === field.id &&
                            styles.fieldChipSelected,
                        ]}
                        onPress={() =>
                          loadWeather(field)
                        }
                      >
                        <Text style={styles.fieldCrop}>
                          🌱 {field.crop}
                        </Text>

                        <Text
                          style={[
                            styles.fieldName,
                            selectedField?.id ===
                              field.id &&
                              styles.fieldNameSelected,
                          ]}
                        >
                          {field.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {/* Weather */}
            {selectedField && (
              <View style={styles.weatherCard}>
                <View style={styles.weatherHeader}>
                  <View>
                    <Text style={styles.weatherTitle}>
                      🌦️ {t("weather.fieldTitle")}
                    </Text>

                    <Text style={styles.weatherField}>
                      {selectedField.name} ·{" "}
                      {selectedField.crop}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.refreshIcon}
                    onPress={() => loadWeather(selectedField, true)}
                    disabled={weatherLoading}
                  >
                    <Ionicons name="refresh" size={19} color="#2E6B3A" />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {weatherLoading ? (
                  <View style={styles.weatherLoading}>
                    <ActivityIndicator size="large" />

                    <Text style={styles.loadingText}>
                      {t("weather.gettingLatest")}
                    </Text>
                  </View>
                ) : weather ? (
                  <>
                    <View style={styles.mainWeather}>
                      <Text style={styles.temperature}>
                        {temperature}
                        {temperature !== "--" ? "°C" : ""}
                      </Text>

                      <Text style={styles.description}>
                        {weatherDescription}
                      </Text>
                    </View>

                    <View style={styles.statsGrid}>
                      <WeatherStat
                        icon="💧"
                        label={t("weather.humidity")}
                        value={
                          humidity === "--"
                            ? "--"
                            : `${humidity}%`
                        }
                      />

                      <WeatherStat
                        icon="🌧️"
                        label={t("weather.rainfall")}
                        value={
                          rainfall === "--"
                            ? "--"
                            : `${rainfall} mm`
                        }
                      />

                      <WeatherStat
                        icon="💨"
                        label={t("weather.wind")}
                        value={
                          wind === "--"
                            ? "--"
                            : `${wind} km/h`
                        }
                      />

                      <WeatherStat
                        icon="🌡️"
                        label={t("weather.feelsLike")}
                        value={
                          feelsLike === "--"
                            ? "--"
                            : `${feelsLike}°C`
                        }
                      />
                    </View>

                    {pressure !== "--" && (
                      <View style={styles.extraInfo}>
                        <Text style={styles.extraLabel}>
                          {t("weather.pressure")}
                        </Text>

                        <Text style={styles.extraValue}>
                          {pressure} hPa
                        </Text>
                      </View>
                    )}

                    {selectedFarm && (
                      <View style={styles.locationBox}>
                        <Text style={styles.locationTitle}>
                          📍 {t("weather.gps")}
                        </Text>

                        <Text style={styles.locationText}>
                          {selectedFarm.latitude.toFixed(
                            6
                          )}
                          ,{" "}
                          {selectedFarm.longitude.toFixed(
                            6
                          )}
                        </Text>
                      </View>
                    )}

                    {weatherTime !== "--" && (
                      <Text style={styles.updatedText}>
                        {t("weather.updated")}: {String(weatherTime)}
                      </Text>
                    )}
                  </>
                ) : (
                  <View style={styles.noWeather}>
                    <Text style={styles.noWeatherIcon}>
                      🌦️
                    </Text>

                    <Text style={styles.noWeatherText}>
                      {error || t("weather.dataUnavailable")}
                    </Text>

                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() =>
                        loadWeather(selectedField, true)
                      }
                    >
                      <Text style={styles.retryText}>
                        {t("weather.retry")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function WeatherStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statIcon}>{icon}</Text>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8F4",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F8F4",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#667064",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EBE5",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF4EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  backText: {
    fontSize: 32,
    lineHeight: 34,
    color: "#2E6B3A",
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1F2A21",
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#788178",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#263127",
    marginBottom: 10,
    marginTop: 4,
  },

  horizontalScroll: {
    marginBottom: 20,
  },

  farmChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E6DE",
    marginRight: 10,
  },

  farmChipSelected: {
    backgroundColor: "#2E6B3A",
    borderColor: "#2E6B3A",
  },

  farmChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#465047",
  },

  farmChipTextSelected: {
    color: "#FFFFFF",
  },

  fieldChip: {
    minWidth: 125,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E6DE",
    marginRight: 10,
  },

  fieldChipSelected: {
    borderColor: "#2E6B3A",
    backgroundColor: "#EEF7ED",
  },

  fieldCrop: {
    fontSize: 13,
    color: "#607064",
    marginBottom: 4,
  },

  fieldName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#263127",
  },

  fieldNameSelected: {
    color: "#2E6B3A",
  },

  weatherCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E4E9E2",
  },

  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refreshIcon: {
    alignItems: "center",
    backgroundColor: "#EEF7ED",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  footerText: { color: "#7A857A", fontSize: 12, paddingBottom: 10, textAlign: "center" },

  weatherTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#263127",
  },

  weatherField: {
    marginTop: 5,
    fontSize: 13,
    color: "#768078",
  },

  weatherEmoji: {
    fontSize: 38,
  },

  divider: {
    height: 1,
    backgroundColor: "#E8ECE6",
    marginVertical: 18,
  },

  weatherLoading: {
    alignItems: "center",
    paddingVertical: 35,
  },

  mainWeather: {
    alignItems: "center",
    marginBottom: 22,
  },

  temperature: {
    fontSize: 48,
    fontWeight: "700",
    color: "#243127",
  },

  description: {
    marginTop: 4,
    fontSize: 15,
    color: "#687269",
    textTransform: "capitalize",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  stat: {
    width: "48%",
    backgroundColor: "#F7F9F6",
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
  },

  statIcon: {
    fontSize: 22,
    marginBottom: 7,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263127",
  },

  statLabel: {
    marginTop: 3,
    fontSize: 12,
    color: "#788178",
  },

  extraInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E8ECE6",
  },

  extraLabel: {
    fontSize: 13,
    color: "#788178",
  },

  extraValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#263127",
  },

  locationBox: {
    marginTop: 12,
    backgroundColor: "#F0F6EE",
    borderRadius: 14,
    padding: 14,
  },

  locationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#37633F",
  },

  locationText: {
    marginTop: 5,
    fontSize: 13,
    color: "#526057",
  },

  updatedText: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 11,
    color: "#8A938B",
  },

  noWeather: {
    alignItems: "center",
    paddingVertical: 25,
  },

  noWeatherIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  noWeatherText: {
    fontSize: 14,
    color: "#737C74",
    textAlign: "center",
  },

  retryButton: {
    marginTop: 15,
    backgroundColor: "#2E6B3A",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginTop: 30,
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#263127",
    marginTop: 12,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#737C74",
    textAlign: "center",
    marginTop: 8,
  },

  primaryButton: {
    backgroundColor: "#2E6B3A",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 20,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  smallEmptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },

  smallEmptyText: {
    color: "#737C74",
    fontSize: 13,
  },
});
