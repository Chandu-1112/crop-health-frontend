import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ViewStyle,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { apiRequest } from "../../services/api";
import { useI18n } from "../../contexts/I18nContext";
import { ScrollReveal } from "../../components/scroll-reveal";

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

type FieldForm = {
  name: string;
  crop: string;
  variety: string;
  growth_stage: string;
  planting_date: string;
  area: string;
};

type FarmForm = {
  name: string;
  area: string;
  latitude: string;
  longitude: string;
};

let activeVoiceInputId: string | null = null;

type SpeechRecognitionEvent = {
  results?: Array<{ transcript?: string }>;
  message?: string;
};

type SpeechRecognitionModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
  }) => void;
  stop: () => Promise<void> | void;
  addListener: (
    eventName: "start" | "end" | "result" | "error",
    listener: (event: SpeechRecognitionEvent) => void,
  ) => { remove: () => void };
};

let speechRecognitionModule: SpeechRecognitionModule | null = null;

try {
  speechRecognitionModule = require("expo-speech-recognition").ExpoSpeechRecognitionModule;
} catch {
  speechRecognitionModule = null;
}

export default function FarmScreen() {
  const { t } = useI18n();
  const entryAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Record<number, Field[]>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [expandedFarm, setExpandedFarm] = useState<number | null>(null);

  const [farmModalVisible, setFarmModalVisible] = useState(false);
  const [fieldModalVisible, setFieldModalVisible] = useState(false);

  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [editingField, setEditingField] = useState<Field | null>(null);

  const [farmForm, setFarmForm] = useState<FarmForm>({
    name: "",
    area: "",
    latitude: "",
    longitude: "",
  });

  const [fieldForm, setFieldForm] = useState<FieldForm>({
    name: "",
    crop: "",
    variety: "",
    growth_stage: "",
    planting_date: "",
    area: "",
  });

  const [savingFarm, setSavingFarm] = useState(false);
  const [savingField, setSavingField] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [farmLocation, setFarmLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    Animated.timing(entryAnimation, {
      toValue: 1,
      duration: 460,
      useNativeDriver: true,
    }).start();
  }, [entryAnimation]);

  const loadFarms = async () => {
    try {
      const farmData: Farm[] = await apiRequest("/api/farms");

      setFarms(farmData || []);

      if (farmData?.length > 0) {
        const fieldResults = await Promise.all(
          farmData.map(async (farm) => {
            try {
              const farmFields: Field[] = await apiRequest(
                `/api/farms/${farm.id}/fields`
              );

              return {
                farmId: farm.id,
                fields: farmFields || [],
              };
            } catch (error) {
              console.log(
                `Failed to load fields for farm ${farm.id}`,
                error
              );

              return {
                farmId: farm.id,
                fields: [],
              };
            }
          })
        );

        const fieldMap: Record<number, Field[]> = {};

        fieldResults.forEach((result) => {
          fieldMap[result.farmId] = result.fields;
        });

        setFields(fieldMap);
      } else {
        setFields({});
      }
    } catch (error: any) {
      console.log("Farm loading error:", error?.message);

      Alert.alert(
        t("farm.alertLoad"),
        error?.message ||
          t("alert.connection")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFarms();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadFarms();
  };

  const toggleFarm = (farmId: number) => {
    if (expandedFarm === farmId) {
      setExpandedFarm(null);
      return;
    }

    setExpandedFarm(farmId);
  };

  // --------------------------------------------------
  // GET CURRENT GPS LOCATION
  // --------------------------------------------------

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          t("farm.locationPermission"),
          t("farm.locationPermissionText"),
          [
            {
              text: t("alert.cancel"),
              style: "cancel",
            },
            {
              text: t("forecast.retry"),
              onPress: getCurrentLocation,
            },
          ]
        );

        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      setFarmLocation({
        latitude,
        longitude,
      });
      setFarmForm((previous) => ({
        ...previous,
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
      }));

      Alert.alert(
        t("farm.locationDetected"),
        `${t("farm.locationSuccess")}\n\n${t("farm.latitude")}: ${latitude.toFixed(
          6
        )}\n${t("farm.longitude")}: ${longitude.toFixed(6)}`
      );
    } catch (error: any) {
      console.log("GPS error:", error);

      Alert.alert(
        t("farm.locationError"),
        t("farm.locationErrorText")
      );
    } finally {
      setGettingLocation(false);
    }
  };

  const openAddFarm = async () => {
    setFarmForm({
      name: "",
      area: "",
      latitude: "",
      longitude: "",
    });

    setFarmLocation(null);

    setFarmModalVisible(true);

    // Automatically get GPS when {t("farm.add")} is opened
    await getCurrentLocation();
  };

  const openAddField = (farm: Farm) => {
    setSelectedFarm(farm);
    setEditingField(null);

    setFieldForm({
      name: "",
      crop: "",
      variety: "",
      growth_stage: "",
      planting_date: "",
      area: "",
    });

    setFieldModalVisible(true);
  };

  const openEditField = (farm: Farm, field: Field) => {
    setSelectedFarm(farm);
    setEditingField(field);

    setFieldForm({
      name: field.name,
      crop: field.crop,
      variety: field.variety,
      growth_stage: field.growth_stage,
      planting_date: field.planting_date,
      area: String(field.area),
    });

    setFieldModalVisible(true);
  };

  // --------------------------------------------------
  // SAVE FARM
  // --------------------------------------------------

  const saveFarm = async () => {
    if (!farmForm.name.trim()) {
      Alert.alert(
        t("farm.missingInfo"),
        t("farm.farmNameRequired")
      );
      return;
    }

    const area = Number(farmForm.area);
    const latitude = Number(farmForm.latitude);
    const longitude = Number(farmForm.longitude);

    if (!farmForm.area || Number.isNaN(area) || area <= 0) {
      Alert.alert(
        t("farm.invalidArea"),
        t("farm.invalidFarmArea")
      );
      return;
    }

    if (
      !farmForm.latitude ||
      !farmForm.longitude ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      Alert.alert(
        t("farm.invalidLocation"),
        t("farm.invalidLocationText")
      );
      return;
    }

    // Make sure GPS location exists
    if (!farmLocation && (!farmForm.latitude || !farmForm.longitude)) {
      Alert.alert(
        t("farm.locationNotDetected"),
        t("farm.locationTryAgain"),
        [
          {
            text: t("alert.cancel"),
            style: "cancel",
          },
          {
            text: t("farm.getLocation"),
            onPress: getCurrentLocation,
          },
        ]
      );

      return;
    }

    try {
      setSavingFarm(true);

      await apiRequest("/api/farms", {
        method: "POST",
        body: JSON.stringify({
          name: farmForm.name.trim(),
          area,
          latitude,
          longitude,
        }),
      });

      setFarmModalVisible(false);

      setFarmLocation(null);

      Alert.alert(
        t("farm.added"),
        t("farm.addedText")
      );

      await loadFarms();
    } catch (error: any) {
      Alert.alert(
        t("farm.addError"),
        error?.message || t("alert.somethingWrong")
      );
    } finally {
      setSavingFarm(false);
    }
  };

  // --------------------------------------------------
  // SAVE FIELD
  // --------------------------------------------------

  const saveField = async () => {
    if (!selectedFarm) {
      return;
    }

    if (!fieldForm.name.trim()) {
      Alert.alert(
        t("farm.missingInfo"),
        t("farm.fieldNameRequired")
      );
      return;
    }

    if (!fieldForm.crop.trim()) {
      Alert.alert(
        t("farm.missingInfo"),
        t("farm.cropRequired")
      );
      return;
    }

    if (!fieldForm.variety.trim()) {
      Alert.alert(
        t("farm.missingInfo"),
        t("farm.varietyRequired")
      );
      return;
    }

    if (!fieldForm.growth_stage.trim()) {
      Alert.alert(
        t("farm.missingInfo"),
        t("farm.stageRequired")
      );
      return;
    }

    if (!fieldForm.planting_date.trim()) {
      Alert.alert(
        t("farm.missingInfo"),
        t("farm.dateRequired")
      );
      return;
    }

    const area = Number(fieldForm.area);

    if (!fieldForm.area || Number.isNaN(area) || area <= 0) {
      Alert.alert(
        t("farm.invalidArea"),
        t("farm.invalidFieldArea")
      );
      return;
    }

    try {
      setSavingField(true);

      const payload = {
        name: fieldForm.name.trim(),
        crop: fieldForm.crop.trim(),
        variety: fieldForm.variety.trim(),
        growth_stage: fieldForm.growth_stage.trim(),
        planting_date: fieldForm.planting_date.trim(),
        area,
      };

      if (editingField) {
        await apiRequest(
          `/api/farms/${selectedFarm.id}/fields/${editingField.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        Alert.alert(
          t("farm.fieldUpdated"),
          t("farm.fieldUpdatedText")
        );
      } else {
        await apiRequest(
          `/api/farms/${selectedFarm.id}/fields`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        Alert.alert(
          t("farm.fieldAdded"),
          t("farm.fieldAddedText")
        );
      }

      setFieldModalVisible(false);

      await loadFarms();
    } catch (error: any) {
      Alert.alert(
        editingField
          ? t("farm.updateFieldError")
          : t("farm.addFieldError"),
        error?.message || t("alert.somethingWrong")
      );
    } finally {
      setSavingField(false);
    }
  };

  // --------------------------------------------------
  // DELETE FIELD
  // --------------------------------------------------

  const deleteField = (farm: Farm, field: Field) => {
    Alert.alert(
      t("farm.deleteField"),
      `${t("farm.deleteFieldConfirm")} "${field.name}"?`,
      [
        {
          text: t("alert.cancel"),
          style: "cancel",
        },
        {
          text: t("farm.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(
                `/api/farms/${farm.id}/fields/${field.id}`,
                {
                  method: "DELETE",
                }
              );

              Alert.alert(
                t("farm.fieldDeleted"),
                t("farm.fieldDeletedText")
              );

              await loadFarms();
            } catch (error: any) {
              Alert.alert(
                t("farm.deleteFieldError"),
                error?.message ||
                  t("alert.somethingWrong")
              );
            }
          },
        },
      ]
    );
  };

  const deleteFarm = (farm: Farm) => {
    Alert.alert(
      t("farm.deleteFarm"),
      `${t("farm.deleteFarmConfirm")} "${farm.name}"?`,
      [
        { text: t("alert.cancel"), style: "cancel" },
        {
          text: t("farm.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/api/farms/${farm.id}`, { method: "DELETE" });
              await loadFarms();
              Alert.alert(t("farm.farmDeleted"), t("farm.farmDeletedText"));
            } catch (error: any) {
              Alert.alert(t("farm.deleteFarmError"), error?.message || t("alert.somethingWrong"));
            }
          },
        },
      ],
    );
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer as ViewStyle}>
        <View style={styles.loadingIcon as ViewStyle}>
          <Ionicons
            name="leaf-outline"
            size={38}
            color="#2E7D32"
          />
        </View>

        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />

        <Text style={styles.loadingTitle}>
          {t("farm.loading")}
        </Text>

        <Text style={styles.loadingSubtitle}>
          {t("farm.loadingSubtitle")}
        </Text>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

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
            transform: [{ translateY: entryAnimation.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          },
        ]}
      >
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2E7D32"
            colors={["#2E7D32"]}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t("farm.title")}</Text>

            <Text style={styles.subtitle}>
              {t("farm.subtitle")}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addFarmButton}
            onPress={openAddFarm}
            activeOpacity={0.8}
          >
            <Ionicons
              name="add"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* EMPTY STATE */}

        {farms.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="leaf-outline"
                size={42}
                color="#2E7D32"
              />
            </View>

            <Text style={styles.emptyTitle}>
              {t("farm.noFarms")}
            </Text>

            <Text style={styles.emptyText}>
              {t("farm.noFarmsText")}
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={openAddFarm}
              activeOpacity={0.8}
            >
              <Ionicons
                name="add"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.emptyButtonText}>
                {t("farm.add")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* SUMMARY */}

            <ScrollReveal scrollY={scrollY}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIcon}>
                  <Ionicons
                    name="leaf-outline"
                    size={20}
                    color="#2E7D32"
                  />
                </View>

                <View>
                  <Text style={styles.summaryValue}>
                    {farms.length}
                  </Text>

                  <Text style={styles.summaryLabel}>
                    {t("home.farms")}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <View style={styles.summaryIcon}>
                  <Ionicons
                    name="grid-outline"
                    size={20}
                    color="#2E7D32"
                  />
                </View>

                <View>
                  <Text style={styles.summaryValue}>
                    {Object.values(fields).reduce(
                      (total, farmFields) =>
                        total + farmFields.length,
                      0
                    )}
                  </Text>

                  <Text style={styles.summaryLabel}>
                    {t("farm.fields")}
                  </Text>
                </View>
              </View>
            </View>
            </ScrollReveal>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t("home.yourFarms")}
              </Text>

              <Text style={styles.sectionCount}>
                {farms.length}{" "}
                {farms.length === 1
                  ? t("farm.farmSingular")
                  : t("farm.farmPlural")}
              </Text>
            </View>

            {/* FARM LIST */}

            {farms.map((farm) => {
              const farmFields =
                fields[farm.id] || [];

              const isExpanded =
                expandedFarm === farm.id;

              return (
                <ScrollReveal key={farm.id} scrollY={scrollY}>
                <View
                  style={styles.farmCard}
                >
                  <TouchableOpacity
                    style={styles.farmHeader}
                    onPress={() =>
                      toggleFarm(farm.id)
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.farmIcon}>
                      <Ionicons
                        name="leaf"
                        size={25}
                        color="#2E7D32"
                      />
                    </View>

                    <View style={styles.farmInfo}>
                      <Text
                        style={styles.farmName}
                        numberOfLines={1}
                      >
                        {farm.name}
                      </Text>

                      <View style={styles.farmMeta}>
                        <View
                          style={styles.metaItem}
                        >
                          <Ionicons
                            name="resize-outline"
                            size={14}
                            color="#7B847B"
                          />

                          <Text
                            style={styles.metaText}
                          >
                            {farm.area} {t("farm.acres")}
                          </Text>
                        </View>

                        <View
                          style={styles.metaItem}
                        >
                          <Ionicons
                            name="grid-outline"
                            size={14}
                            color="#7B847B"
                          />

                          <Text
                            style={styles.metaText}
                          >
                            {farmFields.length}{" "}
                            {farmFields.length === 1
                              ? t("farm.fieldSingular")
                              : t("farm.fields")}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => deleteFarm(farm)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={20} color="#C62828" />
                    </TouchableOpacity>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={21} color="#667066" />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View
                      style={styles.farmExpanded}
                    >
                      <View
                        style={styles.locationRow}
                      >
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color="#2E7D32"
                        />

                        <Text
                          style={styles.locationText}
                        >
                          {farm.latitude.toFixed(5)},{" "}
                          {farm.longitude.toFixed(5)}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.fieldSectionHeader
                        }
                      >
                        <Text
                          style={
                            styles.fieldSectionTitle
                          }
                        >
                          {t("farm.fields")}
                        </Text>

                        <TouchableOpacity
                          style={
                            styles.addFieldButton
                          }
                          onPress={() =>
                            openAddField(farm)
                          }
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name="add"
                            size={17}
                            color="#2E7D32"
                          />

                          <Text
                            style={
                              styles.addFieldText
                            }
                          >
                            {t("farm.addField")}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {farmFields.length === 0 ? (
                        <View
                          style={
                            styles.noFieldCard
                          }
                        >
                          <Ionicons
                            name="grid-outline"
                            size={28}
                            color="#A1AAA1"
                          />

                          <Text
                            style={
                              styles.noFieldTitle
                            }
                          >
                            {t("farm.noFields")}
                          </Text>

                          <Text
                            style={
                              styles.noFieldText
                            }
                          >
                            {t("farm.addFieldHint")}
                          </Text>
                        </View>
                      ) : (
                        farmFields.map((field) => (
                          <FieldCard
                            key={field.id}
                            field={field}
                            onEdit={() =>
                              openEditField(
                                farm,
                                field
                              )
                            }
                            onDelete={() =>
                              deleteField(
                                farm,
                                field
                              )
                            }
                          />
                        ))
                      )}
                    </View>
                  )}
                </View>
                </ScrollReveal>
              );
            })}
          </>
        )}

        <Text style={styles.footerText}>
          {t("farm.footerHint")}
        </Text>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>
      </Animated.View>

      {/* ================================================= */}
      {/* ADD FARM MODAL */}
      {/* ================================================= */}

      <Modal
        visible={farmModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setFarmModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalKeyboard}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {t("farm.add")}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {t("farm.enterDetails")}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  setFarmModalVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={23}
                  color="#555"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <Input
                label={t("farm.nameLabel")}
                placeholder={t("farm.namePlaceholder")}
                value={farmForm.name}
                voiceEnabled
                onChangeText={(text) =>
                  setFarmForm((prev) => ({
                    ...prev,
                    name: text,
                  }))
                }
              />

              <Input
                label={t("farm.areaLabel")}
                placeholder={t("farm.areaPlaceholder")}
                keyboardType="decimal-pad"
                value={farmForm.area}
                onChangeText={(text) =>
                  setFarmForm((prev) => ({
                    ...prev,
                    area: text,
                  }))
                }
              />

              {/* GPS STATUS */}

              <View style={styles.gpsCard}>
                <View style={styles.gpsIcon}>
                  <Ionicons
                    name="location"
                    size={22}
                    color="#2E7D32"
                  />
                </View>

                <View style={styles.gpsInfo}>
                  <Text style={styles.gpsTitle}>
                    {t("farm.gpsLocation")}
                  </Text>

                  {gettingLocation ? (
                    <View style={styles.gpsLoadingRow}>
                      <ActivityIndicator
                        size="small"
                        color="#2E7D32"
                      />

                      <Text
                        style={
                          styles.gpsLoadingText
                        }
                      >
                        {t("farm.detectingLocation")}
                      </Text>
                    </View>
                  ) : farmLocation ? (
                    <>
                      <Text style={styles.gpsSuccess}>
                        {t("farm.locationDetected")}
                      </Text>

                      <Text
                        style={styles.gpsCoordinates}
                      >
                        {farmLocation.latitude.toFixed(
                          6
                        )}
                        ,{" "}
                        {farmLocation.longitude.toFixed(
                          6
                        )}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.gpsError}>
                      {t("farm.locationNotDetectedShort")}
                    </Text>
                  )}
                </View>

                {!gettingLocation && (
                  <TouchableOpacity
                    style={styles.gpsRefreshButton}
                    onPress={getCurrentLocation}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="refresh"
                      size={19}
                      color="#2E7D32"
                    />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.locationHint}>
                {t("farm.gpsHint")}
              </Text>

              <Input
                label={t("farm.latitudeLabel")}
                placeholder={t("farm.latitudePlaceholder")}
                keyboardType="decimal-pad"
                value={farmForm.latitude}
                onChangeText={(text) =>
                  setFarmForm((previous) => ({
                    ...previous,
                    latitude: text,
                  }))
                }
              />

              <Input
                label={t("farm.longitudeLabel")}
                placeholder={t("farm.longitudePlaceholder")}
                keyboardType="decimal-pad"
                value={farmForm.longitude}
                onChangeText={(text) =>
                  setFarmForm((previous) => ({
                    ...previous,
                    longitude: text,
                  }))
                }
              />

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (savingFarm ||
                    gettingLocation ||
                    !farmForm.latitude ||
                    !farmForm.longitude) &&
                    styles.disabledButton,
                ]}
                onPress={saveFarm}
                disabled={
                  savingFarm ||
                  gettingLocation ||
                  !farmForm.latitude ||
                  !farmForm.longitude
                }
                activeOpacity={0.8}
              >
                {savingFarm ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#FFFFFF"
                    />

                    <Text
                      style={styles.saveButtonText}
                    >
                      {t("farm.add")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* ADD / EDIT FIELD MODAL */}
      {/* ================================================= */}

      <Modal
        visible={fieldModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setFieldModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalKeyboard}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>
                  {editingField
                    ? t("farm.editField")
                    : t("farm.addField")}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {selectedFarm?.name || t("farm.title")}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  setFieldModalVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={23}
                  color="#555"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <Input
                label={t("farm.fieldNameLabel")}
                placeholder={t("farm.fieldNamePlaceholder")}
                value={fieldForm.name}
                voiceEnabled
                onChangeText={(text) =>
                  setFieldForm((prev) => ({
                    ...prev,
                    name: text,
                  }))
                }
              />

              <Input
                label={t("farm.cropLabel")}
                placeholder={t("farm.cropPlaceholder")}
                value={fieldForm.crop}
                voiceEnabled
                onChangeText={(text) =>
                  setFieldForm((prev) => ({
                    ...prev,
                    crop: text,
                  }))
                }
              />

              <Input
                label={t("farm.varietyLabel")}
                placeholder={t("farm.varietyPlaceholder")}
                value={fieldForm.variety}
                voiceEnabled
                onChangeText={(text) =>
                  setFieldForm((prev) => ({
                    ...prev,
                    variety: text,
                  }))
                }
              />

              <Input
                label={t("farm.stageLabel")}
                placeholder={t("farm.stagePlaceholder")}
                value={fieldForm.growth_stage}
                voiceEnabled
                onChangeText={(text) =>
                  setFieldForm((prev) => ({
                    ...prev,
                    growth_stage: text,
                  }))
                }
              />

              <Input
                label={t("farm.dateLabel")}
                placeholder={t("farm.datePlaceholder")}
                value={fieldForm.planting_date}
                onChangeText={(text) =>
                  setFieldForm((prev) => ({
                    ...prev,
                    planting_date: text,
                  }))
                }
              />

              <Input
                label={t("farm.areaLabel")}
                placeholder={t("farm.fieldAreaPlaceholder")}
                keyboardType="decimal-pad"
                value={fieldForm.area}
                onChangeText={(text) =>
                  setFieldForm((prev) => ({
                    ...prev,
                    area: text,
                  }))
                }
              />

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  savingField &&
                    styles.disabledButton,
                ]}
                onPress={saveField}
                disabled={savingField}
                activeOpacity={0.8}
              >
                {savingField ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#FFFFFF"
                    />

                    <Text
                      style={styles.saveButtonText}
                    >
                      {editingField
                        ? t("farm.saveChanges")
                        : t("farm.addField")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =====================================================
// INPUT COMPONENT
// =====================================================

function Input({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  voiceEnabled = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "decimal-pad";
  voiceEnabled?: boolean;
}) {
  const { language, t } = useI18n();
  const [recognizing, setRecognizing] = useState(false);
  const inputId = useId();

  useEffect(() => {
    if (!voiceEnabled || !speechRecognitionModule) return;

    const subscriptions = [
      speechRecognitionModule.addListener("start", () => {
        if (activeVoiceInputId === inputId) setRecognizing(true);
      }),
      speechRecognitionModule.addListener("end", () => {
        if (activeVoiceInputId === inputId) {
          activeVoiceInputId = null;
          setRecognizing(false);
        }
      }),
      speechRecognitionModule.addListener("result", (event) => {
        if (activeVoiceInputId !== inputId) return;
        const transcript = event.results?.[0]?.transcript?.trim();
        if (transcript) onChangeText(transcript);
      }),
      speechRecognitionModule.addListener("error", (event) => {
        if (activeVoiceInputId !== inputId) return;
        activeVoiceInputId = null;
        setRecognizing(false);
        Alert.alert(
          t("farm.voiceInputError"),
          event.message || t("farm.voiceInputErrorText"),
        );
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [inputId, onChangeText, t, voiceEnabled]);

  const toggleVoiceInput = async () => {
    if (!speechRecognitionModule) {
      Alert.alert(t("farm.voiceInputUnavailable"), t("farm.voiceInputUnavailableText"));
      return;
    }

    if (recognizing) {
      activeVoiceInputId = null;
      await speechRecognitionModule.stop();
      return;
    }

    try {
      const permission = await speechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t("farm.voicePermission"), t("farm.voicePermissionText"));
        return;
      }

      activeVoiceInputId = inputId;
      speechRecognitionModule.start({
        lang: language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN",
        interimResults: false,
        continuous: false,
      });
    } catch (error) {
      console.log("Voice input error:", error);
      Alert.alert(t("farm.voiceInputError"), t("farm.voiceInputErrorText"));
    }
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, voiceEnabled && styles.inputWithVoice]}
          placeholder={placeholder}
          placeholderTextColor="#A0A6A0"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="sentences"
        />

        {voiceEnabled && (
          <TouchableOpacity
            style={[styles.voiceButton, recognizing && styles.voiceButtonActive]}
            onPress={toggleVoiceInput}
            accessibilityLabel={recognizing ? t("farm.stopVoiceInput") : t("farm.startVoiceInput")}
            activeOpacity={0.75}
          >
            <Ionicons
              name={recognizing ? "mic" : "mic-outline"}
              size={20}
              color={recognizing ? "#FFFFFF" : "#2E7D32"}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// =====================================================
// FIELD CARD
// =====================================================

function FieldCard({
  field,
  onEdit,
  onDelete,
}: {
  field: Field;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();

  return (
    <View style={styles.fieldCard}>
      <View style={styles.fieldTop}>
        <View style={styles.fieldIcon}>
          <Ionicons
            name="grid-outline"
            size={21}
            color="#2E7D32"
          />
        </View>

        <View style={styles.fieldMain}>
          <Text
            style={styles.fieldName}
            numberOfLines={1}
          >
            {field.name}
          </Text>

          <Text style={styles.cropName}>
            {field.crop}
          </Text>
        </View>

        <View style={styles.fieldActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Ionicons
              name="create-outline"
              size={19}
              color="#2E7D32"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Ionicons
              name="trash-outline"
              size={19}
              color="#D32F2F"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fieldDetails}>
        <DetailItem
          icon="leaf-outline"
          label={t("farm.varietyLabel")}
          value={field.variety}
        />

        <DetailItem
          icon="trending-up-outline"
          label={t("farm.stageLabel")}
          value={field.growth_stage}
        />

        <DetailItem
          icon="calendar-outline"
          label={t("farm.dateLabel")}
          value={field.planting_date}
        />

        <DetailItem
          icon="resize-outline"
          label={t("farm.areaShort")}
          value={`${field.area} ${t("farm.acres")}`}
        />
      </View>
    </View>
  );
}

// =====================================================
// DETAIL ITEM
// =====================================================

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <Ionicons
        name={icon}
        size={14}
        color="#7D877D"
      />

      <View style={styles.detailTextContainer}>
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
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

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
    top: 110,
    opacity: 0.035,
    transform: [{ rotate: "-18deg" }],
  },

  scrollContent: {
    paddingBottom: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F8F3",
    paddingHorizontal: 30,
  },

  loadingIcon: {
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

  // HEADER

  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#1B5E20",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#737B73",
  },

  addFarmButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  // SUMMARY

  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
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

  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#263326",
  },

  summaryLabel: {
    marginTop: 1,
    fontSize: 11,
    color: "#7C847C",
  },

  summaryDivider: {
    width: 1,
    height: 35,
    backgroundColor: "#E1E6E1",
  },

  // SECTION

  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 27,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  sectionCount: {
    fontSize: 12,
    color: "#7A827A",
  },

  // FARM

  farmCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  farmHeader: {
    minHeight: 82,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  farmIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  farmInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  farmName: {
    fontSize: 16,
    fontWeight: "750",
    color: "#263326",
  },

  farmMeta: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    marginLeft: 4,
    fontSize: 11,
    color: "#7B847B",
  },

  farmExpanded: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: "#EDF0ED",
  },

  locationRow: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  locationText: {
    marginLeft: 6,
    fontSize: 11,
    color: "#6F786F",
  },

  fieldSectionHeader: {
    marginTop: 17,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  fieldSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },

  addFieldButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 7,
  },

  addFieldText: {
    marginLeft: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32",
  },

  noFieldCard: {
    paddingVertical: 22,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: "#F7F9F6",
    alignItems: "center",
  },

  noFieldTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },

  noFieldText: {
    marginTop: 3,
    fontSize: 11,
    color: "#8A918A",
    textAlign: "center",
  },

  // FIELD

  fieldCard: {
    marginTop: 8,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#F7F9F6",
    borderWidth: 1,
    borderColor: "#E5EAE4",
  },

  fieldTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  fieldMain: {
    flex: 1,
    minWidth: 0,
  },

  fieldName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },

  cropName: {
    marginTop: 3,
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },

  fieldActions: {
    flexDirection: "row",
    marginLeft: 8,
  },

  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },

  fieldDetails: {
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#E4E9E3",
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
  },

  detailItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
  },

  detailTextContainer: {
    flex: 1,
    minWidth: 0,
    marginLeft: 6,
    paddingRight: 7,
  },

  detailLabel: {
    fontSize: 9,
    color: "#8A918A",
  },

  detailValue: {
    marginTop: 1,
    fontSize: 11,
    color: "#4B534B",
    fontWeight: "600",
  },

  // EMPTY

  emptyCard: {
    marginHorizontal: 20,
    marginTop: 30,
    padding: 28,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
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

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 17,
    fontSize: 19,
    fontWeight: "800",
    color: "#333",
  },

  emptyText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#7A827A",
    textAlign: "center",
  },

  emptyButton: {
    marginTop: 19,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    marginLeft: 7,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  footerText: {
    marginHorizontal: 30,
    marginTop: 20,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 17,
    color: "#929A92",
  },

  bottomSpace: {
    height: 25,
  },

  // MODAL

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  modalKeyboard: {
    maxHeight: "90%",
  },

  modalContainer: {
    maxHeight: "90%",
    backgroundColor: "#F5F8F3",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#263326",
  },

  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#7A827A",
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  // INPUT

  inputGroup: {
    marginBottom: 15,
  },

  inputLabel: {
    marginBottom: 7,
    fontSize: 12,
    fontWeight: "700",
    color: "#465046",
  },

  input: {
    height: 49,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE5DE",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#263326",
  },

  inputRow: {
    position: "relative",
    justifyContent: "center",
  },

  inputWithVoice: {
    paddingRight: 52,
  },

  voiceButton: {
    position: "absolute",
    right: 8,
    width: 35,
    height: 35,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
  },

  voiceButtonActive: {
    backgroundColor: "#2E7D32",
  },

  // GPS

  gpsCard: {
    marginTop: 2,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#CDE6CF",
    flexDirection: "row",
    alignItems: "center",
  },

  gpsIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  gpsInfo: {
    flex: 1,
    minWidth: 0,
  },

  gpsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#315A34",
  },

  gpsSuccess: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: "#2E7D32",
  },

  gpsCoordinates: {
    marginTop: 2,
    fontSize: 10,
    color: "#657265",
  },

  gpsError: {
    marginTop: 3,
    fontSize: 11,
    color: "#D32F2F",
  },

  gpsLoadingRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  gpsLoadingText: {
    marginLeft: 7,
    fontSize: 10,
    color: "#657265",
  },

  gpsRefreshButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  locationHint: {
    marginTop: 8,
    marginBottom: 5,
    fontSize: 11,
    lineHeight: 16,
    color: "#858D85",
  },

  // SAVE

  saveButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 7,
    marginBottom: 10,
  },

  disabledButton: {
    opacity: 0.55,
  },

  saveButtonText: {
    marginLeft: 7,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
} as any);