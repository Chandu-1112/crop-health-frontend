
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { getCurrentUser } from "../../services/auth";
import { apiRequest } from "../../services/api";
import { useI18n } from "../../contexts/I18nContext";
import { ScrollReveal } from "../../components/scroll-reveal";

type User = {
  id: number;
  name: string;
  mobile: string;
  language: string;
};

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

type Dashboard = {
  summary?: {
    total_diagnoses?: number;
    unread_alerts?: number;
  };
};

type ForecastData = {
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
    "3_day": {
      risk_score: number;
      risk_level: string;
      highest_risk_score?: number;
      highest_risk_level?: string;
    };

    "7_day": {
      risk_score: number;
      risk_level: string;
      highest_risk_score?: number;
      highest_risk_level?: string;
    };

    "14_day": {
      risk_score: number;
      risk_level: string;
      highest_risk_score?: number;
      highest_risk_level?: string;
    };

    daily: any[];
  };

  forecast_alert?: {
    id: number;
    severity: string;
    title: string;
    message: string;
  } | null;
};

const WEATHER_REFRESH_INTERVAL_MS = 3 * 60 * 1000;

export default function HomeScreen() {
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);

  const [dashboard, setDashboard] =
    useState<Dashboard | null>(null);

  /* ===================================================== */
  /* WEATHER */
  /* ===================================================== */

  const [weather, setWeather] = useState<any>(null);

  const [weatherField, setWeatherField] =
    useState<Field | null>(null);

  const [weatherFarm, setWeatherFarm] =
    useState<Farm | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(false);

  /* ===================================================== */
  /* FORECAST */
  /* ===================================================== */

  const [forecast, setForecast] =
    useState<ForecastData | null>(null);

  const [forecastLoading, setForecastLoading] =
    useState(false);

  /* ===================================================== */
  /* GENERAL LOADING */
  /* ===================================================== */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const entryAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const lastWeatherFetchAt = useRef(0);
  const lastForecastFetchAt = useRef(0);
  const refreshCount = useRef(0);

  useEffect(() => {
    Animated.timing(entryAnimation, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
    }).start();
  }, [entryAnimation]);

  const createLocalWeatherFallback = () => ({
    temperature: 28,
    humidity: 62,
    rainfall: 0,
    wind_speed: 8,
    description: t("weather.sample"),
    is_sample: true,
  });

  /* ===================================================== */
  /* WEATHER */
  /* ===================================================== */

  const loadWeather = async (
    field: Field,
    farm: Farm,
    forceRefresh = false
  ) => {
    const now = Date.now();
    if (
      !forceRefresh &&
      now - lastWeatherFetchAt.current < WEATHER_REFRESH_INTERVAL_MS
    ) {
      return;
    }

    try {
      setWeatherLoading(true);

      const data = await apiRequest(
        `/api/weather/field/${field.id}${forceRefresh ? "?refresh=true" : ""}`
      );

      console.log(
        "Home weather response:",
        data
      );

      setWeather(data?.weather ?? data);
      setWeatherField(field);
      setWeatherFarm(farm);
      lastWeatherFetchAt.current = Date.now();
    } catch (error: any) {
      console.log(
        "Home weather error:",
        error?.message
      );

      setWeather(createLocalWeatherFallback());
      setWeatherField(field);
      setWeatherFarm(farm);
    } finally {
      setWeatherLoading(false);
    }
  };

  /* ===================================================== */
  /* FORECAST */
  /* ===================================================== */

  const loadForecast = async (
    field: Field,
    forceRefresh = false
  ) => {
    const now = Date.now();
    if (
      !forceRefresh &&
      now - lastForecastFetchAt.current < WEATHER_REFRESH_INTERVAL_MS
    ) {
      return;
    }

    try {
      setForecastLoading(true);

      const data = await apiRequest(
        `/api/forecast/field/${field.id}`
      );

      console.log(
        "Home forecast response:",
        data
      );

      setForecast(data);
      lastForecastFetchAt.current = Date.now();
    } catch (error: any) {
      console.log(
        "Home forecast error:",
        error?.message
      );

      setForecast(null);
    } finally {
      setForecastLoading(false);
    }
  };

  /* ===================================================== */
  /* WEATHER VALUE HELPER */
  /* ===================================================== */

  const getWeatherValue = (
    object: any,
    keys: string[],
    fallback = "--"
  ) => {
    if (!object) {
      return fallback;
    }

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

  /* ===================================================== */
  /* LOAD HOME DATA */
  /* ===================================================== */

  const loadHome = async (forceRefresh = false) => {
    try {
      /*
       * Load user, farms and dashboard independently.
       */

      const [
        userResult,
        farmsResult,
        dashboardResult,
      ] = await Promise.allSettled([
        getCurrentUser(),
        apiRequest("/api/farms"),
        apiRequest("/api/dashboard"),
      ]);

      /* ---------------- USER ---------------- */

      if (userResult.status === "fulfilled") {
        setUser(userResult.value);
      } else {
        console.log(
          "User loading error:",
          userResult.reason?.message
        );
      }

      /* ---------------- FARMS ---------------- */

      let loadedFarms: Farm[] = [];

      if (farmsResult.status === "fulfilled") {
        loadedFarms = Array.isArray(
          farmsResult.value
        )
          ? farmsResult.value
          : [];

        setFarms(loadedFarms);

        console.log(
          "Home farms loaded:",
          loadedFarms.length
        );
      } else {
        console.log(
          "Farm loading error:",
          farmsResult.reason?.message
        );

        setFarms([]);
      }

      /* ---------------- FIELDS ---------------- */

      let allFields: Field[] = [];

      if (loadedFarms.length > 0) {
        const fieldResults =
          await Promise.allSettled(
            loadedFarms.map((farm) =>
              apiRequest(
                `/api/farms/${farm.id}/fields`
              )
            )
          );

        fieldResults.forEach(
          (result, index) => {
            if (result.status === "fulfilled") {
              const farmFields: Field[] =
                Array.isArray(result.value)
                  ? result.value
                  : [];

              allFields.push(...farmFields);

              console.log(
                `Farm ${loadedFarms[index].id} fields:`,
                farmFields.length
              );
            } else {
              console.log(
                `Fields loading error for farm ${loadedFarms[index].id}:`,
                result.reason?.message
              );
            }
          }
        );

        setFields(allFields);

        console.log(
          "Home total fields:",
          allFields.length
        );
      } else {
        setFields([]);
      }

      /* ================================================= */
      /* WEATHER + FORECAST */
      /* ================================================= */

      if (
        allFields.length > 0 &&
        loadedFarms.length > 0
      ) {
        const firstField = allFields[0];

        const firstFarm = loadedFarms.find(
          (farm) =>
            farm.id === firstField.farm_id
        );

        if (firstFarm) {
          setWeatherField(firstField);
          setWeatherFarm(firstFarm);
          setWeather((currentWeather: any) => currentWeather || createLocalWeatherFallback());
        }
      } else {
        setWeather(null);
        setWeatherField(null);
        setWeatherFarm(null);
        setForecast(null);
      }

      /* ---------------- DASHBOARD ---------------- */

      if (dashboardResult.status === "fulfilled") {
        setDashboard(
          dashboardResult.value
        );

        console.log(
          "Dashboard loaded:",
          dashboardResult.value
        );
      } else {
        console.log(
          "Dashboard loading error:",
          dashboardResult.reason?.message
        );

        setDashboard(null);
      }
    } catch (error: any) {
      console.log(
        "Home loading error:",
        error?.message
      );

      Alert.alert(
        t("home.loadError"),
        error?.message ||
          t("alert.connection")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ===================================================== */
  /* RELOAD WHEN HOME GETS FOCUS */
  /* ===================================================== */

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [])
  );

  /* ===================================================== */
  /* REFRESH */
  /* ===================================================== */

  const handleRefresh = () => {
    setRefreshing(true);
    refreshCount.current += 1;
    loadHome(refreshCount.current % 5 === 0);
  };

  /* ===================================================== */
  /* NAVIGATION */
  /* ===================================================== */

  const handleDiagnose = () => {
    router.push("/(tabs)/diagnose");
  };

  const handleFarm = () => {
    router.push("/(tabs)/farm");
  };

  const handleAlerts = () => {
    router.push("/(tabs)/alerts");
  };

  const handleWeather = () => {
    router.push("/weather");
  };

  const handleForecast = () => {
    router.push("/forecast");
  };

  /* ===================================================== */
  /* VALUES */
  /* ===================================================== */

  const unreadAlerts =
    dashboard?.summary?.unread_alerts ?? 0;

  const farmCount = farms.length;

  const fieldCount = fields.length;
  const showHomeForecast = false;

  const diagnoses =
    dashboard?.summary?.total_diagnoses ?? 0;

  /* ===================================================== */
  /* WEATHER VALUES */
  /* ===================================================== */

  const temperature = getWeatherValue(
    weather,
    [
      "temperature",
      "temperature_c",
      "temp",
      "temp_c",
    ]
  );

  const humidity = getWeatherValue(
    weather,
    [
      "humidity",
      "relative_humidity",
      "humidity_percent",
    ]
  );

  const rainfall = getWeatherValue(
    weather,
    [
      "rainfall",
      "rain",
      "precipitation",
      "precipitation_mm",
      "rainfall_mm",
    ]
  );

  const wind = getWeatherValue(
    weather,
    [
      "wind_speed",
      "wind_speed_kmh",
      "windspeed",
      "wind",
    ]
  );

  const weatherDescription =
    getWeatherValue(
      weather,
      [
        "description",
        "weather_description",
        "condition",
        "weather",
      ],
      t("home.currentWeather")
    );

  /* ===================================================== */
  /* LOADING */
  /* ===================================================== */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <View style={styles.loadingLogo}>
          <Ionicons
            name="leaf"
            size={38}
            color="#2E7D32"
          />
        </View>

        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />

        <Text style={styles.loadingTitle}>
          {t("home.loadingTitle")}
        </Text>

        <Text style={styles.loadingSubtitle}>
          {t("home.loadingSubtitle")}
        </Text>
      </SafeAreaView>
    );
  }

  /* ===================================================== */
  /* UI */
  /* ===================================================== */

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
            transform: [{ translateY: entryAnimation.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
          },
        ]}
      >
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2E7D32"
            colors={["#2E7D32"]}
          />
        }
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View style={styles.header}>
          <View
            style={styles.headerTextContainer}
          >
            <Text
              style={styles.greeting}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t("home.hello")}, {user?.name || t("profile.farmer")} 👋
            </Text>

            <Text style={styles.subtitle}>
              {t("home.subtitle")}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleAlerts}
            activeOpacity={0.75}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color="#263326"
            />

            {unreadAlerts > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadAlerts > 99
                    ? "99+"
                    : unreadAlerts}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ================================================= */}
        {/* AI HEALTH CARD */}
        {/* ================================================= */}

        <ScrollReveal scrollY={scrollY}>
        <View style={styles.aiCard}>
          <View style={styles.aiCardTop}>
            <View
              style={styles.aiIconContainer}
            >
              <Ionicons
                name="sparkles"
                size={25}
                color="#2E7D32"
              />
            </View>

            <View
              style={styles.aiTitleContainer}
            >
              <Text style={styles.aiTitle}>
                {t("home.cropHealth")}
              </Text>

              <View style={styles.aiStatus}>
                <View
                  style={styles.onlineDot}
                />

                <Text
                  style={styles.onlineText}
                >
                  {t("home.aiMonitoring")}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.aiMessage}>
            {t("home.aiMessage")}
          </Text>

          <TouchableOpacity
            style={styles.aiButton}
            onPress={handleDiagnose}
            activeOpacity={0.8}
          >
            <Ionicons
              name="scan-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text
              style={styles.aiButtonText}
            >
              {t("home.checkHealth")}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
        </ScrollReveal>

        {/* ================================================= */}
        {/* WEATHER */}
        {/* ================================================= */}

        {farmCount > 0 &&
          fieldCount > 0 && (
            <>
              <View
                style={styles.sectionHeader}
              >
                <Text
                  style={styles.sectionTitle}
                >
                  {t("home.fieldWeather")}
                </Text>

                <TouchableOpacity
                  onPress={handleWeather}
                >
                  <Text
                    style={styles.viewAll}
                  >
                    {t("home.viewWeather")}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollReveal scrollY={scrollY}>
              <View
                style={styles.weatherCard}
              >
                <TouchableOpacity
                  style={styles.offlineWeatherButton}
                  onPress={() => router.push("/offline-diagnosis")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="cloud-offline-outline"
                    size={22}
                    color="#2E7D32"
                  />
                  <View style={styles.offlineWeatherText}>
                    <Text style={styles.offlineWeatherTitle}>
                      {t("offline.open")}
                    </Text>
                    <Text style={styles.offlineWeatherSubtitle}>
                      {t("offline.homeHint")}
                    </Text>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#2E7D32"
                  />
                </TouchableOpacity>

                {weatherLoading ? (
                  <View
                    style={
                      styles.weatherLoading
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color="#2E7D32"
                    />

                    <Text
                      style={
                        styles.weatherLoadingText
                      }
                    >
                      {t("weather.loadingHome")}
                    </Text>
                  </View>
                ) : weather ? (
                  <>
                    <View
                      style={styles.weatherTop}
                    >
                      <View
                        style={
                          styles.weatherTitleArea
                        }
                      >
                        <Text
                          style={
                            styles.weatherFarmName
                          }
                        >
                          {weatherFarm?.name}
                        </Text>

                        <Text
                          style={
                            styles.weatherFieldName
                          }
                        >
                          {weatherField?.name} ·{" "}
                          {weatherField?.crop}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.weatherRefreshIcon}
                        onPress={() => {
                          if (weatherField && weatherFarm) {
                            loadWeather(weatherField, weatherFarm, true);
                          }
                        }}
                        disabled={weatherLoading}
                      >
                        <Ionicons name="refresh" size={18} color="#2E7D32" />
                      </TouchableOpacity>
                    </View>

                    <View
                      style={
                        styles.temperatureRow
                      }
                    >
                      <Text
                        style={
                          styles.temperature
                        }
                      >
                        {temperature}
                        {temperature !== "--"
                          ? "°C"
                          : ""}
                      </Text>

                      <Text
                        style={
                          styles.weatherDescription
                        }
                      >
                        {weatherDescription}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.weatherStats
                      }
                    >
                      <WeatherItem
                        icon="water-outline"
                        value={
                          humidity === "--"
                            ? "--"
                            : `${humidity}%`
                        }
                        label={t("weather.humidity")}
                      />

                      <WeatherItem
                        icon="rainy-outline"
                        value={
                          rainfall === "--"
                            ? "--"
                            : `${rainfall} mm`
                        }
                        label={t("weather.rainfall")}
                      />

                      <WeatherItem
                        icon="speedometer-outline"
                        value={
                          wind === "--"
                            ? "--"
                            : `${wind} km/h`
                        }
                        label={t("weather.wind")}
                      />
                    </View>

                    {weatherFarm && (
                      <View
                        style={
                          styles.weatherLocation
                        }
                      >
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color="#2E7D32"
                        />

                        <Text
                          style={
                            styles.weatherLocationText
                          }
                        >
                          {t("weather.gps")}:{" "}
                          {weatherFarm?.latitude.toFixed(
                            5
                          )}
                          ,{" "}
                          {weatherFarm?.longitude.toFixed(
                            5
                          )}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={
                        styles.weatherButton
                      }
                      onPress={handleWeather}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={
                          styles.weatherButtonText
                        }
                      >
                        {t("home.viewWeather")}
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={17}
                        color="#2E7D32"
                      />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View
                    style={styles.noWeather}
                  >
                    <Ionicons
                      name="cloud-offline-outline"
                      size={28}
                      color="#7A827A"
                    />

                    <View
                      style={
                        styles.noWeatherContent
                      }
                    >
                      <Text
                        style={
                          styles.noWeatherTitle
                        }
                      >
                        {t("weather.unavailableHome")}
                      </Text>

                      <Text
                        style={
                          styles.noWeatherText
                        }
                      >
                        {t("weather.refreshHint")}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              </ScrollReveal>
            </>
          )}

        {/* ================================================= */}
        {/* CROP RISK FORECAST */}
        {/* ================================================= */}

        {showHomeForecast && forecast !== null && farmCount > 0 &&
          fieldCount > 0 && (
            <>
              <View
                style={styles.sectionHeader}
              >
                <Text
                  style={styles.sectionTitle}
                >
                  {t("home.cropRiskForecast")}
                </Text>

                <TouchableOpacity
                  onPress={handleForecast}
                >
                  <Text
                    style={styles.viewAll}
                  >
                    {t("home.viewForecast")}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollReveal scrollY={scrollY}>
              <View
                style={styles.forecastCard}
              >
                {forecastLoading ? (
                  <View
                    style={
                      styles.forecastLoading
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color="#2E7D32"
                    />

                    <Text
                      style={
                        styles.forecastLoadingText
                      }
                    >
                      {t("forecast.calculating")}
                    </Text>
                  </View>
                ) : forecast ? (
                  <>
                    {/* Forecast Header */}

                    <View
                      style={
                        styles.forecastTop
                      }
                    >
                      <View
                        style={
                          styles.forecastTitleArea
                        }
                      >
                        <Text
                          style={
                            styles.forecastFieldName
                          }
                        >
                          {forecast.field_name}
                        </Text>

                        <Text
                          style={
                            styles.forecastCropName
                          }
                        >
                          {forecast.crop}
                          {" • "}
                          {forecast.diagnosis?.disease ||
                            t("home.cropHealth")}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.riskIconContainer
                        }
                      >
                        <Ionicons
                          name="analytics-outline"
                          size={24}
                          color="#2E7D32"
                        />
                      </View>
                    </View>

                    {/* Current Risk */}

                    <View
                      style={
                        styles.currentRiskBox
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.currentRiskLabel
                          }
                        >
                          {t("forecast.currentRiskLabel")}
                        </Text>

                        <View
                          style={
                            styles.currentRiskRow
                          }
                        >
                          <Text
                            style={
                              styles.currentRiskScore
                            }
                          >
                            {Math.round(
                              forecast.current_risk
                                ?.score ?? 0
                            )}
                          </Text>

                          <Text
                            style={
                              styles.currentRiskPercent
                            }
                          >
                            /100
                          </Text>
                        </View>
                      </View>

                      <RiskBadge
                        level={
                          forecast.current_risk
                            ?.level
                        }
                        t={t}
                      />
                    </View>

                    {/* Risk Progress */}

                    <View
                      style={
                        styles.riskProgressBackground
                      }
                    >
                      <View
                        style={[
                          styles.riskProgressFill,
                          {
                            width: `${Math.min(
                              Math.max(
                                forecast.current_risk
                                  ?.score ?? 0,
                                0
                              ),
                              100
                            )}%`,
                          },
                        ]}
                      />
                    </View>

                    {/* Forecast Periods */}

                    <View
                      style={
                        styles.forecastPeriods
                      }
                    >
                      <ForecastPeriod
                        title={t("forecast.days3")}
                        t={t}
                        data={
                          forecast.forecast[
                            "3_day"
                          ]
                        }
                      />

                      <ForecastPeriod
                        title={t("forecast.days7")}
                        t={t}
                        data={
                          forecast.forecast[
                            "7_day"
                          ]
                        }
                      />

                      <ForecastPeriod
                        title={t("forecast.days14")}
                        t={t}
                        data={
                          forecast.forecast[
                            "14_day"
                          ]
                        }
                      />
                    </View>

                    {/* Forecast Alert */}

                    {forecast.forecast_alert && (
                      <View
                        style={
                          styles.forecastAlert
                        }
                      >
                        <View
                          style={
                            styles.forecastAlertIcon
                          }
                        >
                          <Ionicons
                            name="warning-outline"
                            size={20}
                            color="#C62828"
                          />
                        </View>

                        <View
                          style={
                            styles.forecastAlertContent
                          }
                        >
                          <Text
                            style={
                              styles.forecastAlertTitle
                            }
                          >
                            {
                              forecast
                                .forecast_alert
                                .title
                            }
                          </Text>

                          <Text
                            style={
                              styles.forecastAlertText
                            }
                            numberOfLines={2}
                          >
                            {
                              forecast
                                .forecast_alert
                                .message
                            }
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Diagnosis Info */}

                    <View
                      style={
                        styles.forecastDiagnosis
                      }
                    >
                      <View
                        style={
                          styles.forecastDiagnosisIcon
                        }
                      >
                        <Ionicons
                          name="medical-outline"
                          size={19}
                          color="#2E7D32"
                        />
                      </View>

                      <View
                        style={
                          styles.forecastDiagnosisContent
                        }
                      >
                        <Text
                          style={
                            styles.forecastDiagnosisLabel
                          }
                        >
                          {t("forecast.latestDiagnosis")}
                        </Text>

                        <Text
                          style={
                            styles.forecastDiagnosisName
                          }
                          numberOfLines={1}
                        >
                          {forecast.diagnosis
                            ?.disease ||
                            t("home.noDisease")}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.forecastConfidence
                        }
                      >
                        {Math.round(
                          (forecast.diagnosis
                            ?.confidence ?? 0) <= 1
                            ? (forecast.diagnosis
                                ?.confidence ?? 0) *
                                100
                            : forecast.diagnosis
                                ?.confidence ?? 0
                        )}
                        %
                      </Text>
                    </View>

                    {/* Detailed Forecast Button */}

                    <TouchableOpacity
                      style={
                        styles.forecastButton
                      }
                      onPress={handleForecast}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="trending-up-outline"
                        size={18}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.forecastButtonText
                        }
                      >
                        {t("forecast.details")}
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={17}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View
                    style={
                      styles.noForecast
                    }
                  >
                    <View
                      style={
                        styles.noForecastIcon
                      }
                    >
                      <Ionicons
                        name="analytics-outline"
                        size={27}
                        color="#2E7D32"
                      />
                    </View>

                    <Text
                      style={
                        styles.noForecastTitle
                      }
                    >
                      {t("forecast.unavailableHome")}
                    </Text>

                    <Text
                      style={
                        styles.noForecastText
                      }
                    >
                      {t("forecast.requiredData")}
                    </Text>

                    <TouchableOpacity
                      style={
                        styles.noForecastButton
                      }
                      onPress={handleDiagnose}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={
                          styles.noForecastButtonText
                        }
                      >
                        {t("home.startDiagnosis")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              </ScrollReveal>
            </>
          )}

        <TouchableOpacity
          style={styles.forecastButton}
          onPress={handleForecast}
          activeOpacity={0.85}
        >
          <View style={styles.forecastButtonIcon}>
            <Ionicons name="trending-up-outline" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.forecastButtonContent}>
            <Text style={styles.forecastButtonTitle}>
              {t("home.cropRiskForecast")}
            </Text>
            <Text style={styles.forecastButtonText}>
              {t("home.forecastButtonText")}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* ================================================= */}
        {/* FARM OVERVIEW */}
        {/* ================================================= */}

        <View style={styles.sectionHeader}>
          <Text
            style={styles.sectionTitle}
          >
            {t("home.farmOverview")}
          </Text>

          <TouchableOpacity
            onPress={handleFarm}
          >
            <Text style={styles.viewAll}>
              {t("home.viewFarm")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollReveal scrollY={scrollY}>
        <View style={styles.statsGrid}>
          <StatCard
            icon="leaf-outline"
            value={farmCount}
            label={t("home.farms")}
            onPress={handleFarm}
          />

          <StatCard
            icon="grid-outline"
            value={fieldCount}
            label={t("home.fields")}
            onPress={handleFarm}
          />

          <StatCard
            icon="scan-outline"
            value={diagnoses}
            label={t("home.diagnoses")}
            onPress={handleDiagnose}
          />

          <StatCard
            icon="notifications-outline"
            value={unreadAlerts}
            label={t("home.alerts")}
            onPress={handleAlerts}
            alert={unreadAlerts > 0}
          />
        </View>
        </ScrollReveal>

        {/* ================================================= */}
        {/* CURRENT FARMS */}
        {/* ================================================= */}

        {farmCount > 0 && (
          <>
            <View
              style={styles.sectionHeader}
            >
              <Text
                style={styles.sectionTitle}
              >
                {t("home.yourFarms")}
              </Text>

              <TouchableOpacity
                onPress={handleFarm}
              >
                <Text
                  style={styles.viewAll}
                >
                  {t("home.manage")}
                </Text>
              </TouchableOpacity>
            </View>

            {farms
              .slice(0, 3)
              .map((farm) => {
                const farmFields =
                  fields.filter(
                    (field) =>
                      field.farm_id ===
                      farm.id
                  );

                return (
                  <ScrollReveal key={farm.id} scrollY={scrollY}>
                  <TouchableOpacity
                    style={
                      styles.farmCard
                    }
                    onPress={handleFarm}
                    activeOpacity={0.8}
                  >
                    <View
                      style={
                        styles.farmIcon
                      }
                    >
                      <Ionicons
                        name="leaf"
                        size={23}
                        color="#2E7D32"
                      />
                    </View>

                    <View
                      style={
                        styles.farmInfo
                      }
                    >
                      <Text
                        style={
                          styles.farmName
                        }
                        numberOfLines={1}
                      >
                        {farm.name}
                      </Text>

                      <Text
                        style={
                          styles.farmDetails
                        }
                      >
                        {farm.area} {t("farm.acres")} •{" "}
                        {farmFields.length}{" "}
                        {farmFields.length ===
                        1
                          ? t("home.field")
                          : t("home.fieldsPlural")}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#8A9389"
                    />
                  </TouchableOpacity>
                  </ScrollReveal>
                );
              })}
          </>
        )}

        {/* ================================================= */}
        {/* NO FARMS */}
        {/* ================================================= */}

        {farmCount === 0 && (
          <View
            style={
              styles.emptyFarmCard
            }
          >
            <View
              style={
                styles.emptyFarmIcon
              }
            >
              <Ionicons
                name="leaf-outline"
                size={30}
                color="#2E7D32"
              />
            </View>

            <Text
              style={
                styles.emptyFarmTitle
              }
            >
              {t("home.noFarms")}
            </Text>

            <Text
              style={
                styles.emptyFarmText
              }
            >
              Add your farm to start tracking
              fields and crop health.
            </Text>

            <TouchableOpacity
              style={
                styles.addFarmButton
              }
              onPress={handleFarm}
              activeOpacity={0.8}
            >
              <Ionicons
                name="add"
                size={19}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.addFarmButtonText
                }
              >
                Add Your Farm
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================= */}
        {/* AI INSIGHT */}
        {/* ================================================= */}

        <View
          style={styles.insightCard}
        >
          <View
            style={styles.insightIcon}
          >
            <Ionicons
              name="bulb-outline"
              size={23}
              color="#2E7D32"
            />
          </View>

          <View
            style={
              styles.insightContent
            }
          >
            <Text
              style={
                styles.insightLabel
              }
            >
              {t("home.aiInsight")}
            </Text>

            <Text
              style={
                styles.insightTitle
              }
            >
              Monitor your crops regularly
            </Text>

            <Text
              style={
                styles.insightText
              }
            >
              Regular crop scans help identify
              changes early and make follow-up
              monitoring easier.
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* PROTECTION MESSAGE */}
        {/* ================================================= */}

        <View
          style={
            styles.protectionCard
          }
        >
          <View
            style={
              styles.protectionIcon
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={25}
              color="#2E7D32"
            />
          </View>

          <View
            style={
              styles.protectionContent
            }
          >
            <Text
              style={
                styles.protectionTitle
              }
            >
              {t("home.protectTitle")}
            </Text>

            <Text
              style={
                styles.protectionText
              }
            >
              {t("home.protectText")}
            </Text>
          </View>
        </View>

        <Text
          style={styles.footerText}
        >
          {t("home.footerCredit")}
        </Text>

        <View
          style={styles.bottomSpace}
        />
      </Animated.ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ========================================================= */
/* WEATHER ITEM */
/* ========================================================= */

function WeatherItem({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View
      style={styles.weatherItem}
    >
      <Ionicons
        name={icon}
        size={20}
        color="#2E7D32"
      />

      <Text
        style={
          styles.weatherItemValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.weatherItemLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

/* ========================================================= */
/* RISK BADGE */
/* ========================================================= */

function RiskBadge({
  level,
  t,
}: {
  level?: string;
  t: (key: string) => string;
}) {
  const normalized =
    (level || "low").toLowerCase();

  const isHigh =
    normalized === "high";

  const isMedium =
    normalized === "medium";

  const backgroundColor = isHigh
    ? "#FFEBEE"
    : isMedium
    ? "#FFF4E5"
    : "#E8F5E9";

  const textColor = isHigh
    ? "#C62828"
    : isMedium
    ? "#EF6C00"
    : "#2E7D32";

  return (
    <View
      style={[
        styles.riskBadge,
        {
          backgroundColor,
        },
      ]}
    >
      <View
        style={[
          styles.riskBadgeDot,
          {
            backgroundColor:
              textColor,
          },
        ]}
      />

      <Text
        style={[
          styles.riskBadgeText,
          {
            color: textColor,
          },
        ]}
      >
        {normalized === "high"
          ? t("risk.high")
          : normalized === "medium"
          ? t("risk.medium")
          : t("risk.low")}
      </Text>
    </View>
  );
}

/* ========================================================= */
/* FORECAST PERIOD */
/* ========================================================= */

function ForecastPeriod({
  title,
  data,
  t,
}: {
  title: string;
  t: (key: string) => string;
  data?: {
    risk_score: number;
    risk_level: string;
    highest_risk_score?: number;
    highest_risk_level?: string;
  };
}) {
  const score = Math.round(
    data?.risk_score ?? 0
  );

  return (
    <View
      style={styles.forecastPeriod}
    >
      <Text
        style={
          styles.forecastPeriodTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.forecastPeriodScore
        }
      >
        {score}
      </Text>

      <RiskBadge
        level={
          data?.risk_level
        }
        t={t}
      />

      {data?.highest_risk_score !==
        undefined && (
        <Text
          style={
            styles.forecastHighest
          }
        >
          {t("forecast.peak")} {Math.round(
            data.highest_risk_score
          )}
        </Text>
      )}
    </View>
  );
}

/* ========================================================= */
/* STAT CARD */
/* ========================================================= */

function StatCard({
  icon,
  value,
  label,
  onPress,
  alert = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  onPress: () => void;
  alert?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={styles.statIcon}
      >
        <Ionicons
          name={icon}
          size={23}
          color={
            alert
              ? "#D32F2F"
              : "#2E7D32"
          }
        />
      </View>

      <Text
        style={styles.statValue}
      >
        {value}
      </Text>

      <Text
        style={styles.statLabel}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ========================================================= */
/* STYLES */
/* ========================================================= */

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
    right: -120,
    top: 90,
    opacity: 0.035,
    transform: [{ rotate: "-18deg" }],
  },

  scrollContent: {
    paddingBottom: 20,
  },

  /* ---------------- Loading ---------------- */

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F8F3",
    paddingHorizontal: 30,
  },

  loadingLogo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 17,
    fontWeight: "700",
    color: "#263326",
    textAlign: "center",
  },

  loadingSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#7A827A",
    textAlign: "center",
  },

  /* ---------------- Header ---------------- */

  header: {
    paddingHorizontal: 22,
    paddingTop: 50,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
    paddingRight: 14,
  },

  greeting: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1B5E20",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#707870",
  },

  notificationButton: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  badge: {
    position: "absolute",
    right: -2,
    top: -3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#D32F2F",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#F5F8F3",
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  /* ---------------- AI Card ---------------- */

  aiCard: {
    marginHorizontal: 22,
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#E8F5E9",
  },

  aiCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  aiIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  aiTitleContainer: {
    marginLeft: 13,
    flex: 1,
  },

  aiTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1B5E20",
  },

  aiStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#43A047",
    marginRight: 6,
  },

  onlineText: {
    fontSize: 11,
    color: "#557055",
    fontWeight: "600",
  },

  aiMessage: {
    marginTop: 15,
    fontSize: 13,
    lineHeight: 20,
    color: "#526052",
  },

  aiButton: {
    marginTop: 17,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  aiButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  /* ---------------- Sections ---------------- */

  sectionHeader: {
    marginHorizontal: 22,
    marginTop: 27,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  sectionTitleStandalone: {
    marginHorizontal: 22,
    marginTop: 27,
    marginBottom: 14,
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  viewAll: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E7D32",
  },

  /* ---------------- WEATHER ---------------- */

  weatherCard: {
    marginHorizontal: 22,
    padding: 18,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  offlineWeatherButton: {
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 14,
    padding: 14,
  },
  offlineWeatherText: { flex: 1, marginLeft: 10 },
  offlineWeatherTitle: { color: "#1B5E20", fontSize: 14, fontWeight: "800" },
  offlineWeatherSubtitle: { color: "#657165", fontSize: 11, marginTop: 3 },

  weatherLoading: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },

  weatherLoadingText: {
    marginTop: 9,
    fontSize: 12,
    color: "#7A827A",
  },

  weatherTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  weatherTitleArea: {
    flex: 1,
  },

  weatherFarmName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#263326",
  },

  weatherFieldName: {
    marginTop: 4,
    fontSize: 12,
    color: "#7A827A",
  },

  weatherEmoji: {
    fontSize: 38,
    marginLeft: 10,
  },

  weatherRefreshIcon: {
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },

  temperatureRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "baseline",
  },

  temperature: {
    fontSize: 38,
    fontWeight: "800",
    color: "#1B5E20",
  },

  weatherDescription: {
    marginLeft: 10,
    fontSize: 12,
    color: "#737C74",
    flex: 1,
  },

  weatherStats: {
    flexDirection: "row",
    marginTop: 17,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E8ECE6",
  },

  weatherItem: {
    flex: 1,
    alignItems: "center",
  },

  weatherItemValue: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "700",
    color: "#263326",
  },

  weatherItemLabel: {
    marginTop: 2,
    fontSize: 10,
    color: "#8A9389",
  },

  weatherLocation: {
    marginTop: 15,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F0F7EF",
    flexDirection: "row",
    alignItems: "center",
  },

  weatherLocationText: {
    marginLeft: 6,
    fontSize: 10,
    color: "#5F6B61",
  },

  weatherButton: {
    marginTop: 13,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  weatherButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32",
  },

  noWeather: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
  },

  noWeatherContent: {
    flex: 1,
    marginLeft: 13,
  },

  noWeatherTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3F4740",
  },

  noWeatherText: {
    marginTop: 4,
    fontSize: 11,
    color: "#858D85",
  },

  /* ---------------- FORECAST ---------------- */

  forecastCard: {
    marginHorizontal: 22,
    padding: 18,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  forecastLoading: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
  },

  forecastLoadingText: {
    marginTop: 9,
    fontSize: 12,
    color: "#7A827A",
  },

  forecastTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  forecastTitleArea: {
    flex: 1,
    paddingRight: 10,
  },

  forecastFieldName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#263326",
  },

  forecastCropName: {
    marginTop: 4,
    fontSize: 12,
    color: "#7A827A",
  },

  riskIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  currentRiskBox: {
    marginTop: 17,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F5F8F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  currentRiskLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#7A827A",
  },

  currentRiskRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },

  currentRiskScore: {
    fontSize: 31,
    fontWeight: "800",
    color: "#1B5E20",
  },

  currentRiskPercent: {
    marginLeft: 3,
    fontSize: 11,
    color: "#8A9389",
  },

  riskBadge: {
    minWidth: 78,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  riskBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  riskBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },

  riskProgressBackground: {
    marginTop: 11,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E6EAE4",
    overflow: "hidden",
  },

  riskProgressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#2E7D32",
  },

  forecastPeriods: {
    marginTop: 16,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E8ECE6",
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECE6",
    paddingVertical: 14,
  },

  forecastPeriod: {
    flex: 1,
    alignItems: "center",
  },

  forecastPeriodTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7A827A",
  },

  forecastPeriodScore: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "800",
    color: "#263326",
  },

  forecastHighest: {
    marginTop: 4,
    fontSize: 9,
    color: "#8A9389",
  },

  forecastAlert: {
    marginTop: 14,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#F5D5D5",
    flexDirection: "row",
    alignItems: "center",
  },

  forecastAlertIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
  },

  forecastAlertContent: {
    flex: 1,
    marginLeft: 10,
  },

  forecastAlertTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#C62828",
  },

  forecastAlertText: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: "#7A4B4B",
  },

  forecastDiagnosis: {
    marginTop: 14,
    padding: 11,
    borderRadius: 12,
    backgroundColor: "#F0F7EF",
    flexDirection: "row",
    alignItems: "center",
  },

  forecastDiagnosisIcon: {
    width: 37,
    height: 37,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  forecastDiagnosisContent: {
    flex: 1,
    marginLeft: 9,
    marginRight: 8,
  },

  forecastDiagnosisLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: "#6C796D",
  },

  forecastDiagnosisName: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#263326",
  },

  forecastConfidence: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2E7D32",
  },

  forecastButton: {
    marginHorizontal: 22,
    marginTop: 20,
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 7,
  },

  forecastButtonIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  forecastButtonContent: {
    flex: 1,
    marginHorizontal: 6,
  },

  forecastButtonTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  forecastButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  noForecast: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  noForecastIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  noForecastTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#263326",
  },

  noForecastText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    color: "#7A827A",
  },

  noForecastButton: {
    marginTop: 13,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
  },

  noForecastButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2E7D32",
  },

  /* ---------------- Statistics ---------------- */

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 17,
    gap: 10,
  },

  statCard: {
    width: "47%",
    minHeight: 112,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  statValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "800",
    color: "#222",
  },

  statLabel: {
    marginTop: 1,
    fontSize: 12,
    color: "#777",
  },

  /* ---------------- Farms ---------------- */

  farmCard: {
    marginHorizontal: 22,
    marginBottom: 10,
    padding: 15,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  farmIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  farmInfo: {
    flex: 1,
    marginLeft: 13,
    marginRight: 10,
  },

  farmName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#263326",
  },

  farmDetails: {
    marginTop: 4,
    fontSize: 12,
    color: "#7A827A",
  },

  emptyFarmCard: {
    marginHorizontal: 22,
    padding: 22,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  emptyFarmIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyFarmTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#263326",
  },

  emptyFarmText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#7A827A",
    textAlign: "center",
  },

  addFarmButton: {
    marginTop: 15,
    height: 43,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  addFarmButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  /* ---------------- Diagnosis ---------------- */

  diagnoseCard: {
    marginHorizontal: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  diagnoseLeft: {
    marginRight: 14,
  },

  cameraCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  diagnoseMiddle: {
    flex: 1,
  },

  diagnoseTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },

  diagnoseDescription: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#777",
  },

  diagnoseLink: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  diagnoseLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E7D32",
  },

  /* ---------------- Quick Actions ---------------- */

  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 17,
    gap: 10,
  },

  quickAction: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 1,
    },
  },

  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  quickTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },

  quickSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "#888",
  },

  /* ---------------- AI Insight ---------------- */

  insightCard: {
    marginHorizontal: 22,
    marginTop: 25,
    padding: 17,
    borderRadius: 17,
    backgroundColor: "#F0F7EF",
    borderWidth: 1,
    borderColor: "#DCEADB",
    flexDirection: "row",
  },

  insightIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  insightContent: {
    flex: 1,
    marginLeft: 12,
  },

  insightLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#2E7D32",
  },

  insightTitle: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },

  insightText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: "#707870",
  },

  /* ---------------- Protection ---------------- */

  protectionCard: {
    marginHorizontal: 22,
    marginTop: 14,
    padding: 17,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },

  protectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  protectionContent: {
    flex: 1,
    marginLeft: 12,
  },

  protectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },

  protectionText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: "#777",
  },

  /* ---------------- Footer ---------------- */

  footerText: {
    textAlign: "center",
    marginTop: 22,
    fontSize: 11,
    color: "#969D96",
  },
  offlineButton: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    padding: 12,
    gap: 7,
  },
  offlineButtonText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "700",
  },

  bottomSpace: {
    height: 25,
  },
});
