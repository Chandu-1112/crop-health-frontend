
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";

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

type Diagnosis = {
  id: number;
  field_id: number;
  image_url: string;
  disease: string;
  confidence: number;
  severity: string;
  affected_area: number;
  diagnosis_source: string;
  status: string;
  explanation: string;
};

export default function DiagnoseScreen() {
  const { t } = useI18n();
  const entryAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);

  const [selectedFarm, setSelectedFarm] =
    useState<Farm | null>(null);

  const [selectedField, setSelectedField] =
    useState<Field | null>(null);

  const [imageUri, setImageUri] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [loadingFields, setLoadingFields] =
    useState(false);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [showFarmList, setShowFarmList] =
    useState(false);

  const [showFieldList, setShowFieldList] =
    useState(false);

  useEffect(() => {
    Animated.timing(entryAnimation, {
      toValue: 1,
      duration: 460,
      useNativeDriver: true,
    }).start();
  }, [entryAnimation]);

  /* ===================================================== */
  /* LOAD FARMS */
  /* ===================================================== */

  const loadFarms = async () => {
    try {
      setLoading(true);

      const data = await apiRequest("/api/farms");

      const farmList: Farm[] = Array.isArray(data)
        ? data
        : [];

      setFarms(farmList);

      console.log(
        "Diagnose farms loaded:",
        farmList.length
      );

      if (farmList.length === 0) {
        setSelectedFarm(null);
        setSelectedField(null);
        setFields([]);
      }
    } catch (error: any) {
      console.log(
        "Diagnose farm loading error:",
        error?.message
      );

      Alert.alert(
        t("diagnose.loadFarmsError"),
        error?.message || t("alert.tryAgain")
      );
    } finally {
      setLoading(false);
    }
  };

  /* ===================================================== */
  /* LOAD FIELDS */
  /* ===================================================== */

  const loadFields = async (farmId: number) => {
    try {
      setLoadingFields(true);

      setFields([]);
      setSelectedField(null);

      const data = await apiRequest(
        `/api/farms/${farmId}/fields`
      );

      const fieldList: Field[] = Array.isArray(data)
        ? data
        : [];

      setFields(fieldList);

      console.log(
        `Diagnose fields for farm ${farmId}:`,
        fieldList.length
      );
    } catch (error: any) {
      console.log(
        "Diagnose field loading error:",
        error?.message
      );

      Alert.alert(
        t("diagnose.loadFieldsError"),
        error?.message || t("alert.tryAgain")
      );
    } finally {
      setLoadingFields(false);
    }
  };

  /* ===================================================== */
  /* LOAD WHEN SCREEN OPENS */
  /* ===================================================== */

  useFocusEffect(
    useCallback(() => {
      loadFarms();
    }, [])
  );

  /* ===================================================== */
  /* SELECT FARM */
  /* ===================================================== */

  const handleFarmSelect = async (farm: Farm) => {
    setSelectedFarm(farm);
    setShowFarmList(false);
    setShowFieldList(false);

    await loadFields(farm.id);
  };

  /* ===================================================== */
  /* SELECT FIELD */
  /* ===================================================== */

  const handleFieldSelect = (field: Field) => {
    setSelectedField(field);
    setShowFieldList(false);
  };

  /* ===================================================== */
  /* CAMERA */
  /* ===================================================== */

  const takePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          t("auth.cameraPermission"),
          t("auth.cameraPermissionText")
        );
        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets?.length
      ) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert(
        t("auth.cameraError"),
        error?.message ||
          t("auth.cameraErrorText")
      );
    }
  };

  /* ===================================================== */
  /* GALLERY */
  /* ===================================================== */

  const chooseFromGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          t("auth.galleryPermission"),
          t("auth.galleryPermissionText")
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets?.length
      ) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert(
        t("diagnose.galleryError"),
        error?.message ||
          t("diagnose.galleryErrorText")
      );
    }
  };

  /* ===================================================== */
  /* ANALYZE */
  /* ===================================================== */

  const analyzeCrop = async () => {
    if (!selectedFarm) {
      Alert.alert(
        t("diagnose.selectFarm"),
        t("diagnose.selectFarmText")
      );
      return;
    }

    if (!selectedField) {
      Alert.alert(
        t("diagnose.selectField"),
        t("diagnose.selectFieldText")
      );
      return;
    }

    if (!imageUri) {
      Alert.alert(
        t("diagnose.addImage"),
        t("diagnose.addImageText")
      );
      return;
    }

    try {
      setAnalyzing(true);

      const formData = new FormData();

      formData.append(
        "field_id",
        String(selectedField.id)
      );

      const imageFile = new File(imageUri);
      if (!imageFile.exists || imageFile.size === 0) {
        throw new Error("The selected crop image is empty.");
      }

      formData.append(
        "image",
        imageFile,
        imageFile.name || "crop.jpg"
      );

      console.log(
        "Starting crop diagnosis:",
        selectedField.id
      );

      const data: Diagnosis = await apiRequest(
        "/api/diagnosis/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      console.log(
        "Diagnosis response:",
        data
      );

      if (!data?.id) {
        throw new Error(
          "Diagnosis was created but no diagnosis ID was returned."
        );
      }

      router.push({
        pathname: "/diagnosis-result",
        params: {
          diagnosisId: String(data.id),
        },
      });
    } catch (error: any) {
      console.log(
        "Diagnosis error:",
        error?.message
      );

      Alert.alert(
        t("diagnose.failed"),
        error?.message ||
          t("diagnose.failedText")
      );
    } finally {
      setAnalyzing(false);
    }
  };

  /* ===================================================== */
  /* RESET IMAGE */
  /* ===================================================== */

  const removeImage = () => {
    setImageUri(null);
  };

  /* ===================================================== */
  /* LOADING */
  /* ===================================================== */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <View style={styles.loadingIcon}>
          <Ionicons
            name="scan-outline"
            size={34}
            color="#2E7D32"
          />
        </View>

        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />

        <Text style={styles.loadingTitle}>
          {t("diagnose.loading")}
        </Text>

        <Text style={styles.loadingSubtitle}>
          {t("diagnose.loadingSubtitle")}
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
            transform: [{ translateY: entryAnimation.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
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
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="scan-outline"
              size={27}
              color="#2E7D32"
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {t("diagnose.title")}
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              {t("diagnose.subtitle")}
            </Text>
          </View>
        </View>

        {/* STEP INDICATOR */}

        <ScrollReveal scrollY={scrollY}>
        <View style={styles.stepsCard}>
          <Step
            number="1"
            title={t("diagnose.fieldStep")}
            active={!!selectedField}
          />

          <View style={styles.stepLine} />

          <Step
            number="2"
            title={t("diagnose.photoStep")}
            active={!!imageUri}
          />

          <View style={styles.stepLine} />

          <Step
            number="3"
            title={t("diagnose.analyzeStep")}
            active={analyzing}
          />
        </View>
        </ScrollReveal>

        {/* FARM SELECTION */}

        <Text style={styles.sectionTitle}>
          {t("diagnose.selectFarm")}
        </Text>

        {farms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="leaf-outline"
              size={32}
              color="#2E7D32"
            />

            <Text style={styles.emptyTitle}>
              {t("diagnose.noFarms")}
            </Text>

            <Text style={styles.emptyText}>
              {t("diagnose.noFarmsText")}
            </Text>

            <ScrollReveal scrollY={scrollY}>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() =>
                router.push(
                  "/(tabs)/farm"
                )
              }
            >
              <Ionicons
                name="add"
                size={19}
                color="#FFFFFF"
              />

              <Text
                style={styles.emptyButtonText}
              >
                {t("diagnose.addFarm")}
              </Text>
            </TouchableOpacity>
            </ScrollReveal>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.selector}
              onPress={() =>
                setShowFarmList(
                  !showFarmList
                )
              }
              activeOpacity={0.8}
            >
              <View
                style={styles.selectorIcon}
              >
                <Ionicons
                  name="leaf-outline"
                  size={22}
                  color="#2E7D32"
                />
              </View>

              <View
                style={styles.selectorContent}
              >
                <Text
                  style={styles.selectorLabel}
                >
                  {t("diagnose.farmLabel")}
                </Text>

                <Text
                  style={[
                    styles.selectorValue,
                    !selectedFarm &&
                      styles.placeholder,
                  ]}
                  numberOfLines={1}
                >
                  {selectedFarm?.name ||
                    t("diagnose.chooseFarm")}
                </Text>
              </View>

              <Ionicons
                name={
                  showFarmList
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={21}
                color="#6F786F"
              />
            </TouchableOpacity>

            {showFarmList && (
              <View style={styles.dropdown}>
                {farms.map((farm) => (
                  <TouchableOpacity
                    key={farm.id}
                    style={[
                      styles.dropdownItem,
                      selectedFarm?.id ===
                        farm.id &&
                        styles.dropdownItemSelected,
                    ]}
                    onPress={() =>
                      handleFarmSelect(farm)
                    }
                  >
                    <View
                      style={
                        styles.dropdownIcon
                      }
                    >
                      <Ionicons
                        name="leaf"
                        size={18}
                        color="#2E7D32"
                      />
                    </View>

                    <View
                      style={
                        styles.dropdownText
                      }
                    >
                      <Text style={styles.dropdownSubtitle}>
                        {t("diagnose.fieldName")}
                      </Text>
                      <Text
                        style={
                          styles.dropdownTitle
                        }
                      >
                        {farm.name}
                      </Text>

                      <Text
                        style={
                          styles.dropdownSubtitle
                        }
                      >
                        {farm.area} {t("farm.acres")}
                      </Text>
                    </View>

                    {selectedFarm?.id ===
                      farm.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#2E7D32"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* FIELD SELECTION */}

        {farms.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {t("diagnose.selectField")}
            </Text>

            <TouchableOpacity
              style={[
                styles.selector,
                !selectedFarm &&
                  styles.selectorDisabled,
              ]}
              disabled={!selectedFarm}
              onPress={() =>
                setShowFieldList(
                  !showFieldList
                )
              }
              activeOpacity={0.8}
            >
              <View
                style={styles.selectorIcon}
              >
                <Ionicons
                  name="grid-outline"
                  size={22}
                  color={
                    selectedFarm
                      ? "#2E7D32"
                      : "#A5ADA5"
                  }
                />
              </View>

              <View
                style={styles.selectorContent}
              >
                <Text
                  style={styles.selectorLabel}
                >
                  {t("diagnose.fieldLabel")}
                </Text>

                <Text
                  style={[
                    styles.selectorValue,
                    !selectedField &&
                      styles.placeholder,
                  ]}
                  numberOfLines={1}
                >
                  {loadingFields
                    ? t("diagnose.loadingFields")
                    : selectedField?.name ||
                      (selectedFarm
                        ? fields.length > 0
                          ? t("diagnose.chooseField")
                          : t("diagnose.noFields")
                        : t("diagnose.selectFarmFirst"))}
                </Text>
              </View>

              {loadingFields ? (
                <ActivityIndicator
                  size="small"
                  color="#2E7D32"
                />
              ) : (
                <Ionicons
                  name={
                    showFieldList
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={21}
                  color={
                    selectedFarm
                      ? "#6F786F"
                      : "#A5ADA5"
                  }
                />
              )}
            </TouchableOpacity>

            {showFieldList &&
              fields.length > 0 && (
                <View style={styles.dropdown}>
                  {fields.map((field) => (
                    <TouchableOpacity
                      key={field.id}
                      style={[
                        styles.dropdownItem,
                        selectedField?.id ===
                          field.id &&
                          styles.dropdownItemSelected,
                      ]}
                      onPress={() =>
                        handleFieldSelect(
                          field
                        )
                      }
                    >
                      <View
                        style={
                          styles.dropdownIcon
                        }
                      >
                        <Ionicons
                          name="grid"
                          size={18}
                          color="#2E7D32"
                        />
                      </View>

                      <View
                        style={
                          styles.dropdownText
                        }
                      >
                        <Text
                          style={
                            styles.dropdownTitle
                          }
                        >
                          {field.name}
                        </Text>

                        <Text
                          style={
                            styles.dropdownSubtitle
                          }
                        >
                          {field.crop} •{" "}
                          {field.area} {t("farm.acres")}
                        </Text>
                      </View>

                      {selectedField?.id ===
                        field.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#2E7D32"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

            {selectedFarm &&
              !loadingFields &&
              fields.length === 0 && (
                <View
                  style={styles.noFieldCard}
                >
                  <Ionicons
                    name="grid-outline"
                    size={24}
                    color="#8A9389"
                  />

                  <View
                    style={
                      styles.noFieldContent
                    }
                  >
                    <Text
                      style={
                        styles.noFieldTitle
                      }
                    >
                      {t("diagnose.noFields")}
                    </Text>

                    <Text
                      style={
                        styles.noFieldText
                      }
                    >
                      {t("diagnose.addFieldHint")}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        "/(tabs)/farm"
                      )
                    }
                  >
                    <Text
                      style={
                        styles.addFieldLink
                      }
                    >
                      {t("diagnose.addLink")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
          </>
        )}

        {/* IMAGE SECTION */}

        <Text style={styles.sectionTitle}>
          {t("result.cropImage")}
        </Text>

        {!imageUri ? (
          <ScrollReveal scrollY={scrollY}>
          <View
            style={styles.imageUploadCard}
          >
            <View
              style={styles.imageUploadIcon}
            >
              <Ionicons
                name="camera-outline"
                size={35}
                color="#2E7D32"
              />
            </View>

            <Text
              style={styles.imageUploadTitle}
            >
              {t("diagnose.clearPicture")}
            </Text>

            <Text
              style={styles.imageUploadText}
            >
              {t("diagnose.pictureHint")}
            </Text>

            <View
              style={styles.imageButtons}
            >
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={takePhoto}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="camera"
                  size={21}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.cameraButtonText
                  }
                >
                  {t("diagnose.takePhoto")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.galleryButton}
                onPress={
                  chooseFromGallery
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="images-outline"
                  size={21}
                  color="#2E7D32"
                />

                <Text
                  style={
                    styles.galleryButtonText
                  }
                >
                  {t("diagnose.choosePhoto")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollReveal>
        ) : (
          <View style={styles.previewCard}>
            <View
              style={styles.previewHeader}
            >
              <View>
                <Text
                  style={styles.previewTitle}
                >
                  {t("diagnose.cropPhoto")}
                </Text>

                <Text
                  style={styles.previewSubtitle}
                >
                  {t("diagnose.readyForAnalysis")}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={removeImage}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#D32F2F"
                />
              </TouchableOpacity>
            </View>

            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />

            <TouchableOpacity
              style={
                styles.changeImageButton
              }
              onPress={
                chooseFromGallery
              }
            >
              <Ionicons
                name="image-outline"
                size={18}
                color="#2E7D32"
              />

              <Text
                style={
                  styles.changeImageText
                }
              >
                {t("diagnose.changePhoto")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SELECTED FIELD INFO */}

        {selectedField && (
          <View
            style={styles.selectedInfoCard}
          >
            <View
              style={styles.selectedInfoIcon}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color="#2E7D32"
              />
            </View>

            <View
              style={
                styles.selectedInfoContent
              }
            >
              <Text
                style={styles.selectedInfoLabel}
              >
                {t("diagnose.diagnosing")}
              </Text>

              <Text
                style={styles.selectedInfoTitle}
              >
                {selectedField.name}
              </Text>

              <Text
                style={styles.selectedInfoText}
              >
                {selectedField.crop} •{" "}
                {selectedField.variety ||
                  t("diagnose.varietyUnknown")}
              </Text>
            </View>
          </View>
        )}

        {/* ANALYZE BUTTON */}

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            (!selectedField ||
              !imageUri ||
              analyzing) &&
              styles.analyzeButtonDisabled,
          ]}
          onPress={analyzeCrop}
          disabled={
            !selectedField ||
            !imageUri ||
            analyzing
          }
          activeOpacity={0.85}
        >
          {analyzing ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.analyzeButtonText
                }
              >
                {t("diagnose.analyzing")}
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="sparkles"
                size={22}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.analyzeButtonText
                }
              >
                {t("diagnose.analyze")}
              </Text>

              <Ionicons
                name="arrow-forward"
                size={20}
                color="#FFFFFF"
              />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          {t("diagnose.disclaimer")}
        </Text>

        <View style={styles.bottomSpace} />
      <Text style={styles.footerText}>{t("app.footerCredit")}</Text>
      </Animated.ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ========================================================= */
/* STEP */
/* ========================================================= */

function Step({
  number,
  title,
  active,
}: {
  number: string;
  title: string;
  active: boolean;
}) {
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepCircle,
          active &&
            styles.stepCircleActive,
        ]}
      >
        {active ? (
          <Ionicons
            name="checkmark"
            size={15}
            color="#FFFFFF"
          />
        ) : (
          <Text
            style={[
              styles.stepNumber,
              active &&
                styles.stepNumberActive,
            ]}
          >
            {number}
          </Text>
        )}
      </View>

      <Text
        style={[
          styles.stepTitle,
          active &&
            styles.stepTitleActive,
        ]}
      >
        {title}
      </Text>
    </View>
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
    width: 340,
    height: 340,
    right: -120,
    top: 100,
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
  },

  /* ---------------- Header ---------------- */

  header: {
    paddingHorizontal: 22,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1B5E20",
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#707870",
  },

  /* ---------------- Steps ---------------- */

  stepsCard: {
    marginHorizontal: 22,
    marginBottom: 6,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  step: {
    alignItems: "center",
    minWidth: 58,
  },

  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EEF1ED",
    justifyContent: "center",
    alignItems: "center",
  },

  stepCircleActive: {
    backgroundColor: "#2E7D32",
  },

  stepNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7B847B",
  },

  stepNumberActive: {
    color: "#FFFFFF",
  },

  stepTitle: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "600",
    color: "#8A9389",
  },

  stepTitleActive: {
    color: "#2E7D32",
  },

  stepLine: {
    height: 1,
    flex: 1,
    backgroundColor: "#DDE3DB",
    marginHorizontal: 6,
    marginBottom: 17,
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

  /* ---------------- Selector ---------------- */

  selector: {
    marginHorizontal: 22,
    minHeight: 70,
    padding: 12,
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

  selectorDisabled: {
    opacity: 0.7,
  },

  selectorIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  selectorContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  selectorLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8A9389",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  selectorValue: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "700",
    color: "#263326",
  },

  placeholder: {
    color: "#969E96",
    fontWeight: "500",
  },

  /* ---------------- Dropdown ---------------- */

  dropdown: {
    marginHorizontal: 22,
    marginTop: 6,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  dropdownItem: {
    minHeight: 65,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2EF",
  },

  dropdownItemSelected: {
    backgroundColor: "#F1F8F1",
  },

  dropdownIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  dropdownText: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  dropdownTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#263326",
  },

  dropdownSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "#7A827A",
  },

  /* ---------------- Empty Farm ---------------- */

  emptyCard: {
    marginHorizontal: 22,
    padding: 25,
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

  emptyTitle: {
    marginTop: 11,
    fontSize: 16,
    fontWeight: "700",
    color: "#263326",
  },

  emptyText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#7A827A",
    textAlign: "center",
  },

  emptyButton: {
    marginTop: 15,
    height: 43,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  /* ---------------- No Fields ---------------- */

  noFieldCard: {
    marginHorizontal: 22,
    marginTop: 8,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },

  noFieldContent: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  noFieldTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
  },

  noFieldText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: "#7A827A",
  },

  addFieldLink: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2E7D32",
  },

  /* ---------------- Image Upload ---------------- */

  imageUploadCard: {
    marginHorizontal: 22,
    padding: 23,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCEADB",
    borderStyle: "dashed",
  },

  imageUploadIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  imageUploadTitle: {
    marginTop: 13,
    fontSize: 16,
    fontWeight: "700",
    color: "#263326",
  },

  imageUploadText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#7A827A",
    textAlign: "center",
    maxWidth: 290,
  },

  imageButtons: {
    width: "100%",
    marginTop: 17,
    flexDirection: "row",
    gap: 9,
  },

  cameraButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  cameraButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  galleryButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F0F7EF",
    borderWidth: 1,
    borderColor: "#CFE3CF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  galleryButtonText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "700",
  },

  /* ---------------- Preview ---------------- */

  previewCard: {
    marginHorizontal: 22,
    padding: 13,
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

  previewHeader: {
    paddingHorizontal: 3,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  previewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#263326",
  },

  previewSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "#2E7D32",
  },

  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FDECEC",
    justifyContent: "center",
    alignItems: "center",
  },

  previewImage: {
    width: "100%",
    height: 250,
    borderRadius: 14,
    backgroundColor: "#EEF1ED",
  },

  changeImageButton: {
    height: 40,
    marginTop: 9,
    borderRadius: 11,
    backgroundColor: "#F0F7EF",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },

  changeImageText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32",
  },

  /* ---------------- Selected Info ---------------- */

  selectedInfoCard: {
    marginHorizontal: 22,
    marginTop: 15,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#F0F7EF",
    borderWidth: 1,
    borderColor: "#DCEADB",
    flexDirection: "row",
    alignItems: "center",
  },

  selectedInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedInfoContent: {
    flex: 1,
    marginLeft: 11,
  },

  selectedInfoLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: "#2E7D32",
  },

  selectedInfoTitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    color: "#263326",
  },

  selectedInfoText: {
    marginTop: 2,
    fontSize: 11,
    color: "#6F786F",
  },

  /* ---------------- Analyze ---------------- */

  analyzeButton: {
    marginHorizontal: 22,
    marginTop: 19,
    height: 53,
    borderRadius: 14,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    elevation: 2,
  },

  analyzeButtonDisabled: {
    backgroundColor: "#AAB8AA",
    elevation: 0,
  },

  analyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  disclaimer: {
    marginHorizontal: 30,
    marginTop: 11,
    fontSize: 10,
    lineHeight: 15,
    color: "#8A9389",
    textAlign: "center",
  },

  bottomSpace: {
    height: 30,
  },
  footerText: {
    color: "#7A857A",
    fontSize: 12,
    marginTop: 28,
    textAlign: "center",
  },
});
