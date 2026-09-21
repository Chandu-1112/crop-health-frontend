import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "te" | "hi";

const LANGUAGE_KEY = "crop-health-language";

const screenTranslations: Record<Language, Record<string, string>> = {
  en: {
    "auth.required": "Required", "auth.mobileRequired": "Please enter your mobile number.", "auth.passwordRequired": "Please enter your password.",
    "auth.loginFailed": "Login Failed", "auth.loginError": "Unable to login. Please try again.", "auth.enterMobile": "Enter mobile number", "auth.enterPassword": "Enter password", "auth.loggingIn": "Logging in...", "auth.appSubtitle": "Smarter crop care, healthier harvests", "auth.footer": "AI-powered crop health monitoring",
    "auth.createAccount": "Create Account", "auth.startProtecting": "Start protecting your crops with AI", "auth.enterName": "Enter your name", "auth.createPassword": "Create a password", "auth.confirmYourPassword": "Confirm your password", "auth.preferredLanguage": "Preferred Language", "auth.creatingAccount": "Creating account...", "auth.alreadyAccount": "Already have an account?", "auth.footerSignup": "Your crop health journey starts here 🌱", "auth.invalidMobile": "Invalid Mobile", "auth.validMobile": "Please enter a valid mobile number.", "auth.weakPassword": "Weak Password", "auth.passwordLength": "Password must be at least 6 characters.", "auth.passwordMismatch": "Password Mismatch", "auth.passwordsNoMatch": "Passwords do not match.", "auth.registrationSuccess": "Registration Successful 🎉", "auth.accountCreated": "Your account has been created. Please login.", "auth.continue": "Continue", "auth.registrationFailed": "Registration Failed", "auth.registrationError": "Unable to create your account. Please try again.", "auth.cameraPermission": "Camera Permission Required", "auth.cameraPermissionText": "Please allow camera access to take a crop photo.", "auth.cameraError": "Camera Error", "auth.cameraErrorText": "Unable to open the camera.", "auth.galleryPermission": "Gallery Permission Required", "auth.galleryPermissionText": "Please allow photo library access to choose a crop image.",
    "weather.fieldTitle": "Field Weather", "weather.sample": "Sample values - tap refresh for live weather", "weather.subtitle": "GPS-based weather monitoring", "weather.noFarms": "No farms found", "weather.noFarmsText": "Add a farm first so we can provide weather information for your fields.", "weather.goFarm": "Go to My Farm", "weather.selectFarm": "Select Farm", "weather.selectField": "Select Field", "weather.noFields": "No fields have been added to this farm yet.", "weather.gettingLatest": "Getting latest weather...", "weather.current": "Current field weather", "weather.humidity": "Humidity", "weather.rainfall": "Rainfall", "weather.wind": "Wind", "weather.feelsLike": "Feels Like", "weather.pressure": "Atmospheric Pressure", "weather.gps": "GPS Location", "weather.updated": "Updated", "weather.unavailable": "Weather unavailable", "weather.unavailableText": "Unable to get weather for this field.", "weather.dataUnavailable": "Weather data is not available.", "weather.loadFields": "Unable to load fields", "weather.loadFarms": "Unable to load your farms.", "weather.loadingFarms": "Loading your farms...",
    "forecast.subtitle": "Crop health risk outlook", "forecast.selectFarm": "Select Farm", "forecast.selectField": "Select Field", "forecast.noFarms": "No farms found", "forecast.noFarmsText": "Add a farm first to view crop health forecasts.", "forecast.noFields": "No fields found", "forecast.noFieldsText": "Add a field to this farm before viewing its health forecast.", "forecast.addFarm": "Manage Farm", "forecast.loading": "Loading forecast...", "forecast.unavailable": "Forecast unavailable", "forecast.unavailableText": "Unable to load crop health forecast.", "forecast.error": "Error", "forecast.loadFarms": "Unable to load farms", "forecast.loadFields": "Unable to load fields", "forecast.detected": "Detected", "forecast.noLatestDiagnosis": "No latest diagnosis", "forecast.sampleDiagnosis": "Sample forecast - live diagnosis unavailable", "forecast.sampleLabel": "Sample values - live forecast unavailable", "forecast.currentRisk": "Current Risk", "forecast.diagnosis": "Latest Diagnosis", "forecast.disease": "Disease", "forecast.confidence": "Confidence", "forecast.severity": "Severity", "forecast.outlook": "Risk Outlook", "forecast.days3": "3-Day", "forecast.days5": "5-Day", "forecast.days7": "7-Day", "forecast.daily": "Daily Forecast", "forecast.highestRisk": "Highest Risk", "forecast.refresh": "Refresh",
    "result.notFound": "Diagnosis Not Found", "result.noId": "No diagnosis ID was provided.", "result.goBack": "Go Back", "result.loadErrorTitle": "Unable to Load Result", "result.loadError": "Unable to load the diagnosis result.", "result.loading": "Loading diagnosis result...", "result.back": "Back", "result.headerSubtitle": "AI-powered crop health analysis", "result.analysisComplete": "Analysis Complete", "result.complete": "Analysis Complete", "result.analysisText": "Your crop diagnosis is ready.", "result.cropImage": "Crop Image", "result.imageUnavailable": "Image unavailable", "result.diagnosisDetails": "Diagnosis Details",     "result.disease": "Detected Disease", "result.speakDisease": "Play disease name", "result.speechUnavailable": "Unable to play the disease name.", "result.unknown": "Unknown condition", "result.confidence": "AI Confidence", "result.confidenceHint": "Higher confidence means the AI found stronger visual evidence for this diagnosis.", "result.affectedArea": "Affected Area", "result.affectedAreaHint": "Estimated crop area needing attention", "result.noAffectedArea": "No affected area detected", "result.severity": "Disease severity", "result.explanation": "Explanation", "result.symptoms": "Symptoms", "result.noSymptoms": "No symptoms were recorded.", "result.noExplanation": "No detailed explanation was provided for this diagnosis.", "result.whyDiagnosis": "Why This Diagnosis?", "result.source": "Diagnosis Source", "result.aiAnalysis": "AI Analysis", "result.status": "Status", "result.completed": "Completed", "result.id": "Diagnosis ID", "result.monitor": "Monitor this diagnosis", "result.monitorTitle": "Diagnosis monitoring", "result.monitorText": "Use Alerts, Weather, and Forecast to watch this field for new risks. Recheck the crop after treatment or if symptoms change.", "result.newDiagnosis": "Start New Diagnosis", "result.warningTitle": "Important", "result.warningText": "AI results are intended as decision-support guidance. For severe or uncertain cases, consult an agricultural expert or laboratory for confirmation.", "result.checkOfficerTitle": "Confirm before treatment", "result.checkOfficerText": "Please check with your local agriculture officer before using any treatment.", "result.confirmationTitle": "Expert or lab confirmation", "result.confirmationSubtitle": "Request a second opinion", "result.confirmationText": "Ask an agricultural expert or lab to confirm this AI result before taking action.", "result.confirmationRequested": "Confirmation requested", "result.confirmationPending": "Your request is waiting for an expert response.", "result.confirmationStatus": "Status", "result.requestConfirmation": "Request confirmation", "result.confirmationRequestTitle": "Request confirmation?", "result.confirmationRequestText": "We'll send this diagnosis to an agricultural expert for review.", "result.requestSentTitle": "Request sent", "result.requestSentText": "An expert or lab can now review your diagnosis.", "result.requestFailedTitle": "Request failed", "result.requestFailedText": "Unable to request confirmation. Please try again.", "result.cancel": "Cancel", "result.comingNext": "Coming Next", "result.comingNextText": "Treatment and crop monitoring will be available in the next module.", "result.retry": "Try Again", "result.recommendations": "Next Recommended steps", "result.noRecommendations": "No recommendations are available yet.", "result.prevention": "Prevention", "result.pesticideSafety": "Pesticide safety", "result.action": "Recommended action",
  },
  te: {
    "weather.humidity": "తేమ", "weather.rainfall": "వర్షపాతం", "weather.wind": "గాలి",
    "auth.required": "అవసరం", "auth.mobileRequired": "మీ మొబైల్ నంబర్ నమోదు చేయండి.", "auth.passwordRequired": "మీ పాస్‌వర్డ్ నమోదు చేయండి.", "auth.loginFailed": "లాగిన్ విఫలమైంది", "auth.loginError": "లాగిన్ చేయలేకపోయాము. మళ్లీ ప్రయత్నించండి.", "auth.enterMobile": "మొబైల్ నంబర్ నమోదు చేయండి", "auth.enterPassword": "పాస్‌వర్డ్ నమోదు చేయండి", "auth.loggingIn": "లాగిన్ అవుతోంది...", "auth.appSubtitle": "తెలివైన పంట సంరక్షణ, ఆరోగ్యకరమైన దిగుబడులు", "auth.footer": "AI ఆధారిత పంట ఆరోగ్య పర్యవేక్షణ", "auth.welcome": "తిరిగి స్వాగతం", "auth.loginDescription": "మీ పంటలను పర్యవేక్షించడానికి మరియు రక్షించడానికి లాగిన్ చేయండి.", "auth.noAccount": "ఖాతా లేదా?", "auth.mobile": "మొబైల్ నంబర్", "auth.password": "పాస్‌వర్డ్", "auth.login": "లాగిన్", "auth.signup": "నమోదు", "auth.createAccount": "ఖాతా సృష్టించండి", "auth.startProtecting": "AIతో మీ పంటలను రక్షించడం ప్రారంభించండి", "auth.enterName": "మీ పేరు నమోదు చేయండి", "auth.createPassword": "పాస్‌వర్డ్ సృష్టించండి", "auth.confirmYourPassword": "మీ పాస్‌వర్డ్ నిర్ధారించండి", "auth.preferredLanguage": "ఇష్టమైన భాష", "auth.creatingAccount": "ఖాతా సృష్టిస్తోంది...", "auth.alreadyAccount": "ఇప్పటికే ఖాతా ఉందా?", "auth.footerSignup": "మీ పంట ఆరోగ్య ప్రయాణం ఇక్కడ ప్రారంభమవుతుంది 🌱", "auth.invalidMobile": "చెల్లని మొబైల్", "auth.validMobile": "చెల్లుబాటు అయ్యే మొబైల్ నంబర్ నమోదు చేయండి.", "auth.weakPassword": "బలహీనమైన పాస్‌వర్డ్", "auth.passwordLength": "పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.", "auth.passwordMismatch": "పాస్‌వర్డ్ సరిపోలలేదు", "auth.passwordsNoMatch": "పాస్‌వర్డ్‌లు సరిపోలడం లేదు.", "auth.registrationSuccess": "నమోదు విజయవంతమైంది 🎉", "auth.accountCreated": "మీ ఖాతా సృష్టించబడింది. దయచేసి లాగిన్ చేయండి.", "auth.continue": "కొనసాగించండి", "auth.registrationFailed": "నమోదు విఫలమైంది", "auth.registrationError": "మీ ఖాతాను సృష్టించలేకపోయాము. మళ్లీ ప్రయత్నించండి.", "auth.cameraPermission": "కెమెరా అనుమతి అవసరం", "auth.cameraPermissionText": "పంట ఫోటో తీయడానికి కెమెరా అనుమతించండి.", "auth.cameraError": "కెమెరా లోపం", "auth.cameraErrorText": "కెమెరా తెరవలేకపోయాము.", "auth.galleryPermission": "గ్యాలరీ అనుమతి అవసరం", "auth.galleryPermissionText": "పంట చిత్రాన్ని ఎంచుకోవడానికి ఫోటో లైబ్రరీ అనుమతించండి.",
  },
  hi: {
    "weather.humidity": "नमी", "weather.rainfall": "वर्षा", "weather.wind": "हवा",
    "auth.required": "आवश्यक", "auth.mobileRequired": "अपना मोबाइल नंबर दर्ज करें।", "auth.passwordRequired": "अपना पासवर्ड दर्ज करें।", "auth.loginFailed": "लॉगिन विफल", "auth.loginError": "लॉगिन नहीं हो सका। फिर कोशिश करें।", "auth.enterMobile": "मोबाइल नंबर दर्ज करें", "auth.enterPassword": "पासवर्ड दर्ज करें", "auth.loggingIn": "लॉगिन हो रहा है...", "auth.appSubtitle": "स्मार्ट फसल देखभाल, बेहतर पैदावार", "auth.footer": "AI-संचालित फसल स्वास्थ्य निगरानी", "auth.welcome": "वापसी पर स्वागत है", "auth.loginDescription": "अपनी फसलों की निगरानी और सुरक्षा के लिए लॉगिन करें।", "auth.noAccount": "खाता नहीं है?", "auth.mobile": "मोबाइल नंबर", "auth.password": "पासवर्ड", "auth.login": "लॉगिन", "auth.signup": "साइन अप", "auth.createAccount": "खाता बनाएं", "auth.startProtecting": "AI से अपनी फसलों की सुरक्षा शुरू करें", "auth.enterName": "अपना नाम दर्ज करें", "auth.createPassword": "पासवर्ड बनाएं", "auth.confirmYourPassword": "अपना पासवर्ड पुष्टि करें", "auth.preferredLanguage": "पसंदीदा भाषा", "auth.creatingAccount": "खाता बनाया जा रहा है...", "auth.alreadyAccount": "पहले से खाता है?", "auth.footerSignup": "आपकी फसल स्वास्थ्य यात्रा यहां शुरू होती है 🌱", "auth.invalidMobile": "अमान्य मोबाइल", "auth.validMobile": "मान्य मोबाइल नंबर दर्ज करें।", "auth.weakPassword": "कमजोर पासवर्ड", "auth.passwordLength": "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।", "auth.passwordMismatch": "पासवर्ड मेल नहीं खाते", "auth.passwordsNoMatch": "पासवर्ड मेल नहीं खाते।", "auth.registrationSuccess": "पंजीकरण सफल 🎉", "auth.accountCreated": "आपका खाता बन गया है। कृपया लॉगिन करें।", "auth.continue": "जारी रखें", "auth.registrationFailed": "पंजीकरण विफल", "auth.registrationError": "खाता नहीं बन सका। फिर कोशिश करें।", "auth.cameraPermission": "कैमरा अनुमति आवश्यक", "auth.cameraPermissionText": "फसल की फोटो लेने के लिए कैमरा अनुमति दें।", "auth.cameraError": "कैमरा त्रुटि", "auth.cameraErrorText": "कैमरा नहीं खुल सका।", "auth.galleryPermission": "गैलरी अनुमति आवश्यक", "auth.galleryPermissionText": "फसल की तस्वीर चुनने के लिए फोटो लाइब्रेरी अनुमति दें।",
  },
};

const extraTranslations: Record<Language, Record<string, string>> = {
  en: {
    "auth.appName": "Crop Health", "weather.gps": "GPS location", "weather.sample": "Sample values - tap refresh for live weather", "weather.loadingHome": "Getting latest weather...", "weather.unavailableHome": "Weather unavailable", "weather.refreshHint": "Tap refresh to try again.", "forecast.calculating": "Calculating crop risk forecast...", "forecast.currentRiskLabel": "Current risk", "forecast.latestDiagnosis": "Latest diagnosis", "forecast.details": "View detailed forecast", "forecast.unavailableHome": "Forecast unavailable", "forecast.requiredData": "A crop diagnosis and weather data are needed to calculate future crop-health risk.", "forecast.peak": "Peak", "risk.high": "High", "risk.medium": "Medium", "risk.low": "Low", "alert.connection": "Please check your connection and try again.", "alert.somethingWrong": "Something went wrong.",
    "home.aiInsight": "AI INSIGHT", "home.yourFarms": "Your Farms", "home.loadError": "Unable to load dashboard", "home.farms": "Farms", "home.fields": "Fields", "home.diagnoses": "Diagnoses", "home.alerts": "Alerts", "home.account": "Your account", "home.quickActions": "Quick Actions", "home.currentWeather": "Current field weather", "home.hello": "Hello", "home.cropHealth": "Crop health", "home.noDisease": "No disease identified",     "home.allClear": "All clear", "home.manage": "Manage", "home.field": "field", "home.fieldsPlural": "fields", "home.noFarms": "No farms added yet", "home.protectTitle": "Protect your crops early", "home.protectText": "AI diagnosis, weather signals and field history work together to help you make better crop-health decisions.", "home.footerCredit": "Developed by CropCoders Team", "home.cropRiskForecast": "Crop Risk Forecast", "home.forecastButtonText": "View the 3, 5 and 7 day risk forecast for your crops.", "home.farmOverview": "Farm Overview", "home.quickDiagnosis": "Quick Diagnosis", "home.scanCrop": "Scan a Crop", "home.scanCropText": "Take a clear photo of a leaf and let AI identify possible crop health problems.", "home.startDiagnosis": "Start diagnosis",
    "farm.noFarmsText": "Add your first farm to start managing your crops and fields.", "farm.farmSingular": "farm", "farm.farmPlural": "farms", "farm.alertLoad": "Unable to load farms", "farm.fields": "Fields", "farm.acres": "acres", "farm.fieldSingular": "field", "farm.noFields": "No fields added", "farm.addFieldHint": "Add a field to start tracking crop health.", "farm.footerHint": "Add fields to enable crop diagnosis and monitoring.", "farm.deleteFieldConfirm": "Are you sure you want to delete", "farm.deleteFarm": "Delete farm?", "farm.deleteFarmConfirm": "Are you sure you want to delete this farm and all its fields", "farm.farmDeleted": "Farm deleted", "farm.farmDeletedText": "The farm and its fields have been removed.", "farm.deleteFarmError": "Unable to delete farm", "farm.locationPermission": "Location permission required", "farm.locationPermissionText": "Crop Health needs your location to automatically save your farm's GPS coordinates.", "farm.locationDetected": "Location detected", "farm.locationNotDetectedShort": "Location not detected", "farm.locationError": "Unable to get location", "farm.locationErrorText": "Please make sure your phone's GPS/location service is turned on and try again.", "farm.missingInfo": "Missing information", "farm.farmNameRequired": "Please enter a farm name.", "farm.invalidArea": "Invalid area", "farm.invalidFarmArea": "Please enter a valid farm area.", "farm.invalidLocation": "Invalid location", "farm.invalidLocationText": "Enter a valid latitude from -90 to 90 and longitude from -180 to 180.", "farm.locationNotDetected": "Location not detected", "farm.locationTryAgain": "We couldn't get your GPS location. Please try again.", "farm.getLocation": "Get Location", "farm.added": "Farm added", "farm.addedText": "Your farm has been added successfully.", "farm.addError": "Unable to add farm", "farm.fieldNameRequired": "Please enter a field name.", "farm.cropRequired": "Please enter the crop name.", "farm.varietyRequired": "Please enter the crop variety.", "farm.stageRequired": "Please enter the growth stage.", "farm.dateRequired": "Please enter the planting date.", "farm.invalidFieldArea": "Please enter a valid field area.", "farm.fieldUpdated": "Field updated", "farm.fieldUpdatedText": "Your field has been updated successfully.", "farm.fieldAdded": "Field added", "farm.fieldAddedText": "Your field has been added successfully.", "farm.updateFieldError": "Unable to update field", "farm.addFieldError": "Unable to add field", "farm.deleteField": "Delete field?", "farm.delete": "Delete", "farm.fieldDeleted": "Field deleted", "farm.fieldDeletedText": "The field has been removed.", "farm.deleteFieldError": "Unable to delete field",
    "farm.nameLabel": "Farm name", "farm.namePlaceholder": "e.g. Reddy Farm", "farm.areaLabel": "Area (acres)", "farm.areaPlaceholder": "e.g. 5", "farm.latitudeLabel": "Latitude", "farm.latitudePlaceholder": "e.g. 17.3850", "farm.longitudeLabel": "Longitude", "farm.longitudePlaceholder": "e.g. 78.4867", "farm.fieldNameLabel": "Field name", "farm.fieldNamePlaceholder": "e.g. Field 1", "farm.cropLabel": "Crop", "farm.cropPlaceholder": "e.g. Tomato", "farm.varietyLabel": "Variety", "farm.varietyPlaceholder": "e.g. Arka Rakshak", "farm.stageLabel": "Growth stage", "farm.stagePlaceholder": "e.g. Flowering", "farm.dateLabel": "Planting date", "farm.datePlaceholder": "YYYY-MM-DD", "farm.fieldAreaPlaceholder": "e.g. 2", "farm.areaShort": "Area", "farm.editField": "Edit Field", "farm.saveChanges": "Save Changes", "farm.startVoiceInput": "Start voice input", "farm.stopVoiceInput": "Stop voice input", "farm.voicePermission": "Microphone permission required", "farm.voicePermissionText": "Allow microphone and speech recognition access to enter text by voice.", "farm.voiceInputError": "Voice input error", "farm.voiceInputErrorText": "Unable to convert speech to text. Please try again or type instead.", "farm.voiceInputUnavailable": "Voice input requires an app update", "farm.voiceInputUnavailableText": "Please use a development build with speech recognition enabled, or type the text instead.",
    "diagnose.loadFarmsError": "Unable to load farms", "diagnose.loadFieldsError": "Unable to load fields", "diagnose.loadingFields": "Loading fields...", "diagnose.addFieldHint": "Add a field to this farm to continue.", "diagnose.analyzing": "Analyzing crop...", "diagnose.analyze": "Analyze crop", "diagnose.galleryError": "Gallery Error", "diagnose.galleryErrorText": "Unable to open the gallery.", "diagnose.addImage": "Add Crop Image", "diagnose.addImageText": "Please take a photo or choose an image first.", "diagnose.failed": "Diagnosis Failed", "diagnose.failedText": "Unable to analyze the crop. Please try again.", "diagnose.selectFarmText": "Please select a farm first.", "diagnose.selectFieldText": "Please select a field first.", "diagnose.fieldStep": "Field", "diagnose.photoStep": "Photo", "diagnose.analyzeStep": "Analyze", "diagnose.start": "Start diagnosis", "diagnose.chooseFarm": "Choose your farm", "diagnose.chooseField": "Choose your field", "diagnose.noFields": "No fields in this farm", "diagnose.selectFarmFirst": "Select a farm first", "diagnose.varietyUnknown": "Variety not specified",
    "alerts.loadError": "Unable to load alerts", "alerts.updateError": "Unable to update alert", "alerts.deleteTitle": "Delete alert?", "alerts.deleteText": "This alert will be permanently removed.", "alerts.delete": "Delete",         "offline.open": "Offline Diagnosis", "offline.backToLogin": "Back to Login", "offline.backToHome": "Back to Home", "offline.homeHint": "Photo plus symptom clues for a safer preliminary result.", "offline.title": "Offline Diagnosis", "offline.chooseSymptom": "Choose the closest symptom", "offline.accuracy": "This result combines the selected crop and symptom clue. It is still preliminary because no trained offline image model is installed.", "offline.subtitle": "Choose a crop and add a photo for a preliminary offline result.", "offline.chooseCrop": "Choose crop", "offline.addImage": "Add a crop image", "offline.imageReady": "Image selected", "offline.camera": "Camera", "offline.gallery": "Gallery", "offline.possibleResult": "Possible result", "offline.advice": "Remove severely affected leaves, improve airflow, avoid wetting foliage, and monitor the crop closely. Use only locally registered products and follow the label.", "offline.warning": "Offline result only. This demo uses a limited local catalog and is not a trained image model. Confirm serious cases when internet or expert support is available.",
  },
  te: {
    "auth.appName": "క్రాప్ హెల్త్", "weather.gps": "GPS స్థానం", "weather.sample": "నమూనా విలువలు - ప్రత్యక్ష వాతావరణం కోసం రిఫ్రెష్ నొక్కండి", "weather.loadingHome": "తాజా వాతావరణాన్ని పొందుతోంది...", "weather.unavailableHome": "వాతావరణం అందుబాటులో లేదు", "weather.refreshHint": "మళ్లీ ప్రయత్నించడానికి రిఫ్రెష్ నొక్కండి.", "forecast.calculating": "పంట ప్రమాద అంచనాను లెక్కిస్తోంది...", "forecast.currentRiskLabel": "ప్రస్తుత ప్రమాదం", "forecast.latestDiagnosis": "తాజా నిర్ధారణ", "forecast.details": "వివరమైన అంచనా చూడండి", "forecast.unavailableHome": "అంచనా అందుబాటులో లేదు", "forecast.requiredData": "భవిష్యత్ పంట ఆరోగ్య ప్రమాదాన్ని లెక్కించడానికి పంట నిర్ధారణ మరియు వాతావరణ డేటా అవసరం.", "forecast.peak": "గరిష్ఠం", "risk.high": "అధికం", "risk.medium": "మధ్యస్థం", "risk.low": "తక్కువ", "alert.connection": "మీ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.", "alert.somethingWrong": "ఏదో తప్పు జరిగింది.",
    "home.loadError": "డాష్‌బోర్డ్ లోడ్ కాలేదు", "home.farms": "పొలాలు", "home.fields": "క్షేత్రాలు", "home.diagnoses": "నిర్ధారణలు", "home.alerts": "హెచ్చరికలు", "home.account": "మీ ఖాతా", "home.quickActions": "త్వరిత చర్యలు", "home.currentWeather": "ప్రస్తుత పొలం వాతావరణం", "home.hello": "నమస్కారం", "home.cropHealth": "పంట ఆరోగ్యం", "home.noDisease": "వ్యాధి గుర్తించబడలేదు", "home.allClear": "అన్నీ సవ్యంగా ఉన్నాయి", "home.yourFarms": "మీ పొలాలు", "home.manage": "నిర్వహించండి", "home.field": "క్షేత్రం", "home.fieldsPlural": "క్షేత్రాలు", "home.noFarms": "ఇంకా పొలాలు జోడించలేదు", "home.protectTitle": "మీ పంటలను ముందుగానే రక్షించండి", "home.protectText": "AI నిర్ధారణ, వాతావరణ సంకేతాలు మరియు క్షేత్ర చరిత్ర కలిసి మెరుగైన పంట ఆరోగ్య నిర్ణయాలు తీసుకోవడంలో సహాయపడతాయి.", "home.footerCredit": "CropCoders Team అభివృద్ధి చేసింది", "home.cropRiskForecast": "పంట ప్రమాద అంచనా", "home.farmOverview": "పొలం సమీక్ష", "home.quickDiagnosis": "త్వరిత నిర్ధారణ", "home.scanCrop": "పంటను స్కాన్ చేయండి", "home.scanCropText": "ఆకు స్పష్టమైన ఫోటో తీసి పంట ఆరోగ్య సమస్యలను AIతో గుర్తించండి.", "home.startDiagnosis": "నిర్ధారణ ప్రారంభించండి",
    "farm.alertLoad": "పొలాలను లోడ్ చేయలేకపోయాము", "farm.fields": "క్షేత్రాలు", "farm.acres": "ఎకరాలు", "farm.fieldSingular": "క్షేత్రం", "farm.noFields": "క్షేత్రాలు జోడించబడలేదు", "farm.addFieldHint": "పంట ఆరోగ్యాన్ని గమనించడానికి ఒక క్షేత్రాన్ని జోడించండి.", "farm.footerHint": "పంట నిర్ధారణ మరియు పర్యవేక్షణ కోసం క్షేత్రాలను జోడించండి.", "farm.deleteFarm": "పొలాన్ని తొలగించాలా?", "farm.deleteFarmConfirm": "ఈ పొలం మరియు దాని అన్ని క్షేత్రాలను తొలగించాలా", "farm.farmDeleted": "పొలం తొలగించబడింది", "farm.farmDeletedText": "పొలం మరియు దాని క్షేత్రాలు తొలగించబడ్డాయి.", "farm.deleteFarmError": "పొలాన్ని తొలగించలేకపోయాము", "farm.locationPermission": "స్థాన అనుమతి అవసరం", "farm.locationPermissionText": "మీ పొలం GPS కోఆర్డినేట్‌లను సేవ్ చేయడానికి క్రాప్ హెల్త్ AIకి మీ స్థానం అవసరం.", "farm.locationDetected": "స్థానం గుర్తించబడింది", "farm.locationError": "స్థానం పొందలేకపోయాము", "farm.locationErrorText": "మీ ఫోన్ GPS/స్థాన సేవ ఆన్‌లో ఉందని నిర్ధారించుకుని మళ్లీ ప్రయత్నించండి.", "farm.missingInfo": "సమాచారం లేదు", "farm.farmNameRequired": "పొలం పేరు నమోదు చేయండి.", "farm.invalidArea": "చెల్లని విస్తీర్ణం", "farm.invalidFarmArea": "చెల్లుబాటు అయ్యే పొలం విస్తీర్ణం నమోదు చేయండి.", "farm.locationNotDetected": "స్థానం గుర్తించబడలేదు", "farm.locationTryAgain": "మీ GPS స్థానాన్ని పొందలేకపోయాము. మళ్లీ ప్రయత్నించండి.", "farm.getLocation": "స్థానం పొందండి", "farm.added": "పొలం జోడించబడింది", "farm.addedText": "మీ పొలం విజయవంతంగా జోడించబడింది.", "farm.addError": "పొలం జోడించలేకపోయాము", "farm.fieldNameRequired": "క్షేత్రం పేరు నమోదు చేయండి.", "farm.cropRequired": "పంట పేరు నమోదు చేయండి.", "farm.varietyRequired": "పంట రకం నమోదు చేయండి.", "farm.stageRequired": "వృద్ధి దశ నమోదు చేయండి.", "farm.dateRequired": "నాటిన తేదీ నమోదు చేయండి.", "farm.invalidFieldArea": "చెల్లుబాటు అయ్యే క్షేత్ర విస్తీర్ణం నమోదు చేయండి.", "farm.fieldUpdated": "క్షేత్రం నవీకరించబడింది", "farm.fieldUpdatedText": "మీ క్షేత్రం విజయవంతంగా నవీకరించబడింది.", "farm.fieldAdded": "క్షేత్రం జోడించబడింది", "farm.fieldAddedText": "మీ క్షేత్రం విజయవంతంగా జోడించబడింది.", "farm.updateFieldError": "క్షేత్రం నవీకరించలేకపోయాము", "farm.addFieldError": "క్షేత్రం జోడించలేకపోయాము", "farm.deleteField": "క్షేత్రాన్ని తొలగించాలా?", "farm.delete": "తొలగించు", "farm.fieldDeleted": "క్షేత్రం తొలగించబడింది", "farm.fieldDeletedText": "క్షేత్రం తొలగించబడింది.", "farm.deleteFieldError": "క్షేత్రం తొలగించలేకపోయాము",
    "farm.nameLabel": "పొలం పేరు", "farm.namePlaceholder": "ఉదా. రెడ్డి పొలం", "farm.areaLabel": "విస్తీర్ణం (ఎకరాలు)", "farm.areaPlaceholder": "ఉదా. 5", "farm.fieldNameLabel": "క్షేత్రం పేరు", "farm.fieldNamePlaceholder": "ఉదా. క్షేత్రం 1", "farm.cropLabel": "పంట", "farm.cropPlaceholder": "ఉదా. టమాటా", "farm.varietyLabel": "రకం", "farm.varietyPlaceholder": "ఉదా. అర్క రక్షక్", "farm.stageLabel": "వృద్ధి దశ", "farm.stagePlaceholder": "ఉదా. పుష్పించే దశ", "farm.dateLabel": "నాటిన తేదీ", "farm.datePlaceholder": "YYYY-MM-DD", "farm.fieldAreaPlaceholder": "ఉదా. 2", "farm.areaShort": "విస్తీర్ణం", "farm.editField": "క్షేత్రం సవరించండి", "farm.saveChanges": "మార్పులను సేవ్ చేయండి", "farm.startVoiceInput": "వాయిస్ ఇన్‌పుట్ ప్రారంభించండి", "farm.stopVoiceInput": "వాయిస్ ఇన్‌పుట్ ఆపండి", "farm.voicePermission": "మైక్రోఫోన్ అనుమతి అవసరం", "farm.voicePermissionText": "వాయిస్ ద్వారా టెక్స్ట్ నమోదు చేయడానికి మైక్రోఫోన్ మరియు స్పీచ్ గుర్తింపు అనుమతించండి.", "farm.voiceInputError": "వాయిస్ ఇన్‌పుట్ లోపం", "farm.voiceInputErrorText": "మాటలను టెక్స్ట్‌గా మార్చలేకపోయాము. మళ్లీ ప్రయత్నించండి లేదా టైప్ చేయండి.", "farm.voiceInputUnavailable": "వాయిస్ ఇన్‌పుట్‌కు యాప్ నవీకరణ అవసరం", "farm.voiceInputUnavailableText": "స్పీచ్ గుర్తింపు ఉన్న డెవలప్‌మెంట్ బిల్డ్‌ను ఉపయోగించండి లేదా టెక్స్ట్ టైప్ చేయండి.",
    "diagnose.loadFarmsError": "పొలాలను లోడ్ చేయలేకపోయాము", "diagnose.loadFieldsError": "క్షేత్రాలను లోడ్ చేయలేకపోయాము", "diagnose.loadingFields": "క్షేత్రాలను లోడ్ చేస్తోంది...", "diagnose.analyzing": "పంటను విశ్లేషిస్తోంది...", "diagnose.analyze": "పంటను విశ్లేషించండి", "diagnose.addFieldHint": "కొనసాగించడానికి ఈ పొలంలో ఒక క్షేత్రాన్ని జోడించండి.", "diagnose.galleryError": "గ్యాలరీ లోపం", "diagnose.galleryErrorText": "గ్యాలరీ తెరవలేకపోయాము.", "diagnose.addImage": "పంట చిత్రం జోడించండి", "diagnose.addImageText": "ముందుగా ఫోటో తీయండి లేదా చిత్రాన్ని ఎంచుకోండి.", "diagnose.failed": "నిర్ధారణ విఫలమైంది", "diagnose.failedText": "పంటను విశ్లేషించలేకపోయాము. మళ్లీ ప్రయత్నించండి.", "diagnose.selectFarmText": "ముందుగా పొలం ఎంచుకోండి.", "diagnose.selectFieldText": "ముందుగా క్షేత్రం ఎంచుకోండి.", "diagnose.fieldStep": "క్షేత్రం", "diagnose.photoStep": "ఫోటో", "diagnose.analyzeStep": "విశ్లేషణ", "diagnose.start": "నిర్ధారణ ప్రారంభించండి",         "alerts.loadError": "హెచ్చరికలను లోడ్ చేయలేకపోయాము",             "offline.open": "ఆఫ్‌లైన్ నిర్ధారణ", "offline.backToLogin": "లాగిన్‌కు తిరిగి వెళ్లండి", "offline.backToHome": "హోమ్‌కు తిరిగి వెళ్లండి", "offline.title": "ఆఫ్‌లైన్ నిర్ధారణ", "offline.chooseSymptom": "దగ్గరగా ఉన్న లక్షణాన్ని ఎంచుకోండి", "offline.accuracy": "ఈ ఫలితం ఎంచుకున్న పంట మరియు లక్షణంపై ఆధారపడి ఉంటుంది. శిక్షణ పొందిన ఆఫ్‌లైన్ చిత్ర నమూనా లేనందున ఇది ప్రాథమిక ఫలితం మాత్రమే.", "offline.subtitle": "పంటను ఎంచుకుని ప్రాథమిక ఆఫ్‌లైన్ ఫలితం కోసం ఫోటో జోడించండి.", "offline.chooseCrop": "పంటను ఎంచుకోండి", "offline.addImage": "పంట చిత్రాన్ని జోడించండి", "offline.imageReady": "చిత్రం ఎంచుకోబడింది", "offline.camera": "కెమెరా", "offline.gallery": "గ్యాలరీ", "offline.possibleResult": "సంభావ్య ఫలితం", "offline.advice": "తీవ్రంగా ప్రభావితమైన ఆకులను తొలగించి, గాలి ప్రసరణ మెరుగుపరచండి, ఆకులను తడపకుండా పంటను గమనించండి. స్థానికంగా నమోదైన ఉత్పత్తులను మాత్రమే లేబుల్ ప్రకారం వాడండి.", "offline.warning": "ఇది ఆఫ్‌లైన్ ప్రాథమిక ఫలితం మాత్రమే. ఇది పరిమిత స్థానిక జాబితాను ఉపయోగిస్తుంది; శిక్షణ పొందిన చిత్ర నమూనా కాదు. తీవ్రమైన పరిస్థితులను ఆన్‌లైన్‌లో నిర్ధారించండి.", "alerts.updateError": "హెచ్చరికను నవీకరించలేకపోయాము", "alerts.deleteTitle": "హెచ్చరికను తొలగించాలా?", "alerts.deleteText": "ఈ హెచ్చరిక శాశ్వతంగా తొలగించబడుతుంది.", "alerts.delete": "తొలగించు",
  },
  hi: {
    "auth.appName": "क्रॉप हेल्थ", "weather.gps": "GPS स्थान", "weather.sample": "नमूना मान - लाइव मौसम के लिए रिफ्रेश दबाएं", "weather.loadingHome": "नवीनतम मौसम प्राप्त हो रहा है...", "weather.unavailableHome": "मौसम उपलब्ध नहीं है", "weather.refreshHint": "फिर कोशिश करने के लिए रिफ्रेश दबाएं।", "forecast.calculating": "फसल जोखिम पूर्वानुमान की गणना हो रही है...", "forecast.currentRiskLabel": "वर्तमान जोखिम", "forecast.latestDiagnosis": "नवीनतम जांच", "forecast.details": "विस्तृत पूर्वानुमान देखें", "forecast.unavailableHome": "पूर्वानुमान उपलब्ध नहीं है", "forecast.requiredData": "भविष्य के फसल स्वास्थ्य जोखिम की गणना के लिए फसल जांच और मौसम डेटा आवश्यक है।", "forecast.peak": "चरम", "risk.high": "उच्च", "risk.medium": "मध्यम", "risk.low": "कम", "alert.connection": "कृपया अपना कनेक्शन जांचकर फिर कोशिश करें।", "alert.somethingWrong": "कुछ गलत हो गया।",
    "home.loadError": "डैशबोर्ड लोड नहीं हो सका", "home.farms": "खेत", "home.fields": "क्षेत्र", "home.diagnoses": "जांच", "home.alerts": "सूचनाएं", "home.account": "आपका खाता", "home.quickActions": "त्वरित कार्रवाइयां", "home.currentWeather": "वर्तमान खेत का मौसम", "home.hello": "नमस्ते", "home.cropHealth": "फसल स्वास्थ्य", "home.noDisease": "कोई रोग नहीं मिला", "home.allClear": "सब ठीक है", "home.yourFarms": "आपके खेत", "home.manage": "प्रबंधन", "home.field": "क्षेत्र", "home.fieldsPlural": "क्षेत्र", "home.noFarms": "अभी कोई खेत नहीं जोड़ा गया", "home.protectTitle": "अपनी फसलों को जल्दी सुरक्षित करें", "home.protectText": "AI जांच, मौसम संकेत और खेत का इतिहास मिलकर बेहतर फसल स्वास्थ्य निर्णय लेने में मदद करते हैं।", "home.footerCredit": "CropCoders Team द्वारा विकसित", "home.cropRiskForecast": "फसल जोखिम पूर्वानुमान", "home.farmOverview": "खेत का अवलोकन", "home.quickDiagnosis": "त्वरित जांच", "home.scanCrop": "फसल स्कैन करें", "home.scanCropText": "पत्ते की स्पष्ट तस्वीर लेकर AI से फसल स्वास्थ्य समस्या पहचानें।", "home.startDiagnosis": "जांच शुरू करें",
    "farm.alertLoad": "खेत लोड नहीं हो सके", "farm.fields": "क्षेत्र", "farm.acres": "एकड़", "farm.fieldSingular": "क्षेत्र", "farm.noFields": "कोई क्षेत्र नहीं जोड़ा गया", "farm.addFieldHint": "फसल स्वास्थ्य की निगरानी शुरू करने के लिए क्षेत्र जोड़ें।", "farm.footerHint": "फसल जांच और निगरानी के लिए क्षेत्र जोड़ें।", "farm.deleteFarm": "खेत हटाएं?", "farm.deleteFarmConfirm": "क्या आप इस खेत और उसके सभी क्षेत्र हटाना चाहते हैं", "farm.farmDeleted": "खेत हटाया गया", "farm.farmDeletedText": "खेत और उसके क्षेत्र हटा दिए गए हैं।", "farm.deleteFarmError": "खेत हटाया नहीं जा सका", "farm.locationPermission": "स्थान की अनुमति आवश्यक है", "farm.locationPermissionText": "आपके खेत के GPS निर्देशांक सहेजने के लिए क्रॉप हेल्थ AI को आपके स्थान की आवश्यकता है।", "farm.locationDetected": "स्थान मिल गया", "farm.locationError": "स्थान नहीं मिल सका", "farm.locationErrorText": "कृपया फोन की GPS/स्थान सेवा चालू करके फिर कोशिश करें।", "farm.missingInfo": "जानकारी अधूरी है", "farm.farmNameRequired": "खेत का नाम दर्ज करें।", "farm.invalidArea": "अमान्य क्षेत्रफल", "farm.invalidFarmArea": "मान्य खेत क्षेत्रफल दर्ज करें।", "farm.locationNotDetected": "स्थान नहीं मिला", "farm.locationTryAgain": "GPS स्थान नहीं मिल सका। फिर कोशिश करें।", "farm.getLocation": "स्थान प्राप्त करें", "farm.added": "खेत जोड़ा गया", "farm.addedText": "आपका खेत सफलतापूर्वक जोड़ा गया।", "farm.addError": "खेत नहीं जोड़ा जा सका", "farm.fieldNameRequired": "क्षेत्र का नाम दर्ज करें।", "farm.cropRequired": "फसल का नाम दर्ज करें।", "farm.varietyRequired": "फसल की किस्म दर्ज करें।", "farm.stageRequired": "विकास अवस्था दर्ज करें।", "farm.dateRequired": "रोपण तिथि दर्ज करें।", "farm.invalidFieldArea": "मान्य क्षेत्रफल दर्ज करें।", "farm.fieldUpdated": "क्षेत्र अपडेट हुआ", "farm.fieldUpdatedText": "आपका क्षेत्र सफलतापूर्वक अपडेट हुआ।", "farm.fieldAdded": "क्षेत्र जोड़ा गया", "farm.fieldAddedText": "आपका क्षेत्र सफलतापूर्वक जोड़ा गया।", "farm.updateFieldError": "क्षेत्र अपडेट नहीं हो सका", "farm.addFieldError": "क्षेत्र नहीं जोड़ा जा सका", "farm.deleteField": "क्षेत्र हटाएं?", "farm.delete": "हटाएं", "farm.fieldDeleted": "क्षेत्र हटाया गया", "farm.fieldDeletedText": "क्षेत्र हटा दिया गया।", "farm.deleteFieldError": "क्षेत्र हटाया नहीं जा सका",
    "farm.nameLabel": "खेत का नाम", "farm.namePlaceholder": "जैसे रेड्डी फार्म", "farm.areaLabel": "क्षेत्रफल (एकड़)", "farm.areaPlaceholder": "जैसे 5", "farm.latitudeLabel": "अक्षांश", "farm.latitudePlaceholder": "जैसे 17.3850", "farm.longitudeLabel": "देशांतर", "farm.longitudePlaceholder": "जैसे 78.4867", "farm.fieldNameLabel": "क्षेत्र का नाम", "farm.fieldNamePlaceholder": "जैसे क्षेत्र 1", "farm.cropLabel": "फसल", "farm.cropPlaceholder": "जैसे टमाटर", "farm.varietyLabel": "किस्म", "farm.varietyPlaceholder": "जैसे अर्का रक्षक", "farm.stageLabel": "विकास अवस्था", "farm.stagePlaceholder": "जैसे फूल आना", "farm.dateLabel": "रोपण तिथि", "farm.datePlaceholder": "YYYY-MM-DD", "farm.fieldAreaPlaceholder": "जैसे 2", "farm.areaShort": "क्षेत्रफल", "farm.editField": "क्षेत्र संपादित करें", "farm.saveChanges": "बदलाव सहेजें", "farm.startVoiceInput": "वॉइस इनपुट शुरू करें", "farm.stopVoiceInput": "वॉइस इनपुट रोकें", "farm.voicePermission": "माइक्रोफ़ोन की अनुमति आवश्यक है", "farm.voicePermissionText": "आवाज़ से टेक्स्ट दर्ज करने के लिए माइक्रोफ़ोन और स्पीच पहचान की अनुमति दें।", "farm.voiceInputError": "वॉइस इनपुट में त्रुटि", "farm.voiceInputErrorText": "आवाज़ को टेक्स्ट में बदल नहीं सके। फिर से कोशिश करें या टाइप करें।", "farm.voiceInputUnavailable": "वॉइस इनपुट के लिए ऐप अपडेट आवश्यक है", "farm.voiceInputUnavailableText": "स्पीच पहचान वाले डेवलपमेंट बिल्ड का उपयोग करें या टेक्स्ट टाइप करें।",
    "diagnose.loadFarmsError": "खेत लोड नहीं हो सके", "diagnose.loadFieldsError": "क्षेत्र लोड नहीं हो सके", "diagnose.loadingFields": "क्षेत्र लोड हो रहे हैं...", "diagnose.analyzing": "फसल का विश्लेषण हो रहा है...", "diagnose.analyze": "फसल का विश्लेषण करें", "diagnose.addFieldHint": "जारी रखने के लिए इस खेत में एक क्षेत्र जोड़ें।", "diagnose.galleryError": "गैलरी त्रुटि", "diagnose.galleryErrorText": "गैलरी नहीं खुल सकी।", "diagnose.addImage": "फसल की तस्वीर जोड़ें", "diagnose.addImageText": "पहले फोटो लें या तस्वीर चुनें।", "diagnose.failed": "जांच विफल", "diagnose.failedText": "फसल का विश्लेषण नहीं हो सका। फिर कोशिश करें।", "diagnose.selectFarmText": "पहले खेत चुनें।", "diagnose.selectFieldText": "पहले क्षेत्र चुनें।", "diagnose.fieldStep": "क्षेत्र", "diagnose.photoStep": "फोटो", "diagnose.analyzeStep": "विश्लेषण",     "diagnose.start": "जांच शुरू करें",     "alerts.loadError": "सूचनाएं लोड नहीं हो सकीं",             "offline.open": "ऑफलाइन जांच", "offline.backToLogin": "लॉगिन पर वापस जाएं", "offline.backToHome": "होम पर वापस जाएं", "offline.title": "ऑफलाइन जांच", "offline.chooseSymptom": "सबसे मिलता-जुलता लक्षण चुनें", "offline.accuracy": "यह परिणाम चुनी गई फसल और लक्षण पर आधारित है। प्रशिक्षित ऑफलाइन इमेज मॉडल नहीं होने के कारण यह केवल प्रारंभिक परिणाम है।", "offline.subtitle": "फसल चुनें और प्रारंभिक ऑफलाइन परिणाम के लिए फोटो जोड़ें।", "offline.chooseCrop": "फसल चुनें", "offline.addImage": "फसल की तस्वीर जोड़ें", "offline.imageReady": "तस्वीर चुनी गई", "offline.camera": "कैमरा", "offline.gallery": "गैलरी", "offline.possibleResult": "संभावित परिणाम", "offline.advice": "बहुत प्रभावित पत्तियां हटाएं, हवा का प्रवाह सुधारें, पत्तियों को गीला करने से बचें और फसल पर नजर रखें। केवल स्थानीय रूप से पंजीकृत उत्पादों को लेबल के अनुसार उपयोग करें।", "offline.warning": "यह केवल प्रारंभिक ऑफलाइन परिणाम है। यह सीमित स्थानीय सूची का उपयोग करता है, प्रशिक्षित इमेज मॉडल नहीं। गंभीर मामलों की ऑनलाइन पुष्टि करें।", "alerts.updateError": "सूचना अपडेट नहीं हो सकी", "alerts.deleteTitle": "सूचना हटाएं?", "alerts.deleteText": "यह सूचना स्थायी रूप से हटा दी जाएगी।", "alerts.delete": "हटाएं",
  },
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    ...extraTranslations.en,
    ...screenTranslations.en,
    "tab.home": "Home",
    "tab.diagnose": "Diagnose",
    "tab.farm": "My Farm",
    "tab.alerts": "Alerts",
    "tab.profile": "Profile",
    "profile.title": "Profile",
    "profile.subtitle": "Manage your account and advisory language",
    "profile.farmer": "Farmer",
    "profile.mobileUnavailable": "Mobile number unavailable",
    "profile.yourName": "Your name",
    "profile.namePlaceholder": "Enter your name",
    "profile.advisoryLanguage": "Advisory language",
    "profile.saveChanges": "Save changes",
    "profile.signOut": "Sign out",
    "profile.loading": "Loading your profile...",
    "alert.loadTitle": "Unable to load profile",
    "alert.tryAgain": "Please try again.",
    "alert.nameRequired": "Name required",
    "alert.nameMinimum": "Please enter at least two characters.",
    "alert.updatedTitle": "Profile updated",
    "alert.updatedMessage": "Your preferences have been saved.",
    "alert.saveTitle": "Unable to save profile",
    "alert.signOutTitle": "Sign out",
    "alert.signOutMessage": "Are you sure you want to sign out?",
    "alert.cancel": "Cancel",
    "home.loadingTitle": "Preparing your farm dashboard",
    "home.loadingSubtitle": "Checking your crop health...",
    "home.subtitle": "Let's keep your crops healthy.",
    "home.aiMonitoring": "AI monitoring active",
    "home.aiMessage": "Keep an eye on your crops. Early detection can help prevent problems from spreading.",
    "home.checkHealth": "Check Crop Health",
    "home.fieldWeather": "Field Weather", "home.footerCredit": "Developed by CropCoders Team", "home.cropRiskForecast": "Crop Risk Forecast", "home.farmOverview": "Farm Overview", "home.quickDiagnosis": "Quick Diagnosis", "home.scanCrop": "Scan a Crop", "home.scanCropText": "Take a clear photo of a leaf and let AI identify possible crop health problems.", "home.startDiagnosis": "Start diagnosis", "diagnose.clearPicture": "Take a clear picture", "diagnose.fieldName": "Field name", "app.footerCredit": "Developed by CropCoders Team", "weather.refresh": "Refresh weather",
    "home.viewWeather": "View Weather",
    "home.viewForecast": "View Forecast",
    "home.noFarms": "No farms yet",
    "home.addFarm": "Add Your Farm",
    "diagnose.title": "Crop Diagnosis",
    "diagnose.subtitle": "Check your crop health with AI",
    "diagnose.loading": "Preparing diagnosis",
    "diagnose.loadingSubtitle": "Loading your farms and fields...",
    "diagnose.selectFarm": "Select Farm",
    "diagnose.selectField": "Select Field",
    "diagnose.addFarm": "Add Farm",
    "diagnose.takePhoto": "Take Photo",
    "diagnose.choosePhoto": "Choose from Gallery",
    "diagnose.analyze": "Analyze Crop",
    "farm.title": "My Farm",
    "farm.subtitle": "Manage your farms and crop fields",
    "farm.loading": "Loading your farms",
    "farm.loadingSubtitle": "Getting your fields ready...",
    "farm.add": "Add Your Farm",
    "farm.noFarms": "No farms yet",
    "farm.addField": "Add Field",
    "alerts.title": "Crop alerts",
    "alerts.subtitle": "Timely advice to protect your fields",
    "alerts.unread": "unread",
    "alerts.all": "All alerts",
    "alerts.empty": "No alerts yet",
    "alerts.caughtUp": "You are all caught up",
    "alerts.emptyText": "New weather risks, disease signals and management advice will appear here.",
    "weather.title": "Weather",
    "weather.loading": "Loading weather...",
    "weather.retry": "Try Again",
    "forecast.title": "Health Forecast",
    "forecast.loading": "Loading forecast...",
    "forecast.retry": "Try Again",
    "result.title": "Diagnosis Result",
    "result.complete": "Analysis Complete",
    "result.cropImage": "Crop Image",
    "auth.login": "Login",
    "auth.signup": "Sign Up",
    "auth.mobile": "Mobile Number",
    "auth.password": "Password",
    "auth.welcome": "Welcome Back",
    "auth.loginDescription": "Login to monitor and protect your crops.",
    "auth.noAccount": "Don't have an account?",
    "auth.createAccount": "Create Account",
    "auth.startProtecting": "Start protecting your crops with AI",
    "auth.fullName": "Full Name",
    "auth.confirmPassword": "Confirm Password",
  },
  te: {
    ...extraTranslations.te,
    ...screenTranslations.en,
    ...screenTranslations.te,
    "tab.home": "హోమ్", "tab.diagnose": "నిర్ధారణ", "tab.farm": "నా పొలం", "tab.alerts": "హెచ్చరికలు", "tab.profile": "ప్రొఫైల్",
    "farm.locationNotDetectedShort": "స్థానం గుర్తించబడలేదు", "farm.invalidLocation": "చెల్లని స్థానం", "farm.invalidLocationText": "-90 నుండి 90 వరకు అక్షాంశం, -180 నుండి 180 వరకు రేఖాంశం నమోదు చేయండి.", "farm.latitudeLabel": "అక్షాంశం", "farm.latitudePlaceholder": "ఉదా. 17.3850", "farm.longitudeLabel": "రేఖాంశం", "farm.longitudePlaceholder": "ఉదా. 78.4867",
    "profile.title": "ప్రొఫైల్", "profile.subtitle": "మీ ఖాతా మరియు సలహా భాషను నిర్వహించండి", "profile.farmer": "రైతు",
    "profile.mobileUnavailable": "మొబైల్ నంబర్ అందుబాటులో లేదు", "profile.yourName": "మీ పేరు", "profile.namePlaceholder": "మీ పేరు నమోదు చేయండి",
    "profile.advisoryLanguage": "సలహా భాష", "profile.saveChanges": "మార్పులను సేవ్ చేయండి", "profile.signOut": "సైన్ అవుట్",
    "profile.loading": "మీ ప్రొఫైల్ లోడ్ అవుతోంది...", "alert.loadTitle": "ప్రొఫైల్ లోడ్ కాలేదు", "alert.tryAgain": "దయచేసి మళ్లీ ప్రయత్నించండి.",
    "alert.nameRequired": "పేరు అవసరం", "alert.nameMinimum": "కనీసం రెండు అక్షరాలు నమోదు చేయండి.", "alert.updatedTitle": "ప్రొఫైల్ నవీకరించబడింది",
    "alert.updatedMessage": "మీ ప్రాధాన్యతలు సేవ్ చేయబడ్డాయి.", "alert.saveTitle": "ప్రొఫైల్ సేవ్ కాలేదు", "alert.signOutTitle": "సైన్ అవుట్",
    "alert.signOutMessage": "మీరు నిజంగా సైన్ అవుట్ చేయాలనుకుంటున్నారా?", "alert.cancel": "రద్దు చేయండి",
    "home.loadingTitle": "మీ పొలం డాష్‌బోర్డ్ సిద్ధం చేస్తోంది", "home.loadingSubtitle": "మీ పంట ఆరోగ్యాన్ని పరిశీలిస్తోంది...", "home.subtitle": "మీ పంటలను ఆరోగ్యంగా ఉంచుదాం.", "home.aiMonitoring": "AI పర్యవేక్షణ చురుకుగా ఉంది", "home.aiMessage": "మీ పంటలను గమనించండి. ముందస్తు గుర్తింపు సమస్యలు వ్యాపించకుండా సహాయపడుతుంది.", "home.checkHealth": "పంట ఆరోగ్యాన్ని తనిఖీ చేయండి",     "home.fieldWeather": "పొలం వాతావరణం", "home.footerCredit": "CropCoders Team అభివృద్ధి చేసింది", "home.cropRiskForecast": "పంట ప్రమాద అంచనా", "home.forecastButtonText": "మీ పంటల 3, 5 మరియు 7 రోజుల ప్రమాద అంచనాను చూడండి.", "home.farmOverview": "పొలం సమీక్ష", "home.quickDiagnosis": "త్వరిత నిర్ధారణ", "home.scanCrop": "పంటను స్కాన్ చేయండి", "home.scanCropText": "ఆకు స్పష్టమైన ఫోటో తీసి పంట ఆరోగ్య సమస్యలను AIతో గుర్తించండి.", "home.startDiagnosis": "నిర్ధారణ ప్రారంభించండి", "diagnose.clearPicture": "స్పష్టమైన చిత్రం తీయండి", "diagnose.fieldName": "క్షేత్రం పేరు", "app.footerCredit": "CropCoders Team అభివృద్ధి చేసింది", "weather.refresh": "వాతావరణాన్ని రిఫ్రెష్ చేయండి", "home.viewWeather": "వాతావరణం చూడండి", "home.viewForecast": "అంచనా చూడండి", "home.noFarms": "ఇంకా పొలాలు లేవు", "home.addFarm": "మీ పొలం జోడించండి",
    "diagnose.title": "పంట నిర్ధారణ", "diagnose.subtitle": "AIతో మీ పంట ఆరోగ్యాన్ని తనిఖీ చేయండి", "diagnose.loading": "నిర్ధారణ సిద్ధం చేస్తోంది", "diagnose.loadingSubtitle": "మీ పొలాలు మరియు క్షేత్రాలను లోడ్ చేస్తోంది...", "diagnose.selectFarm": "పొలం ఎంచుకోండి", "diagnose.selectField": "క్షేత్రం ఎంచుకోండి", "diagnose.addFarm": "పొలం జోడించండి", "diagnose.takePhoto": "ఫోటో తీయండి", "diagnose.choosePhoto": "గ్యాలరీ నుండి ఎంచుకోండి", "diagnose.analyze": "పంటను విశ్లేషించండి", "diagnose.chooseFarm": "మీ పొలాన్ని ఎంచుకోండి", "diagnose.chooseField": "మీ క్షేత్రాన్ని ఎంచుకోండి", "diagnose.noFields": "ఈ పొలంలో క్షేత్రాలు లేవు", "diagnose.selectFarmFirst": "ముందుగా పొలాన్ని ఎంచుకోండి", "diagnose.varietyUnknown": "రకం పేర్కొనలేదు",
    "farm.title": "నా పొలం", "farm.subtitle": "మీ పొలాలు మరియు పంట క్షేత్రాలను నిర్వహించండి", "farm.loading": "మీ పొలాలను లోడ్ చేస్తోంది", "farm.loadingSubtitle": "మీ క్షేత్రాలను సిద్ధం చేస్తోంది...", "farm.add": "మీ పొలం జోడించండి", "farm.noFarms": "ఇంకా పొలాలు లేవు", "farm.addField": "క్షేత్రం జోడించండి",
    "alerts.title": "పంట హెచ్చరికలు", "alerts.subtitle": "మీ క్షేత్రాలను రక్షించడానికి సమయానుకూల సలహా", "alerts.unread": "చదవనివి", "alerts.all": "అన్ని హెచ్చరికలు", "alerts.empty": "హెచ్చరికలు లేవు", "alerts.caughtUp": "అన్నీ చూసేశారు", "alerts.emptyText": "కొత్త వాతావరణ ప్రమాదాలు, వ్యాధి సంకేతాలు మరియు నిర్వహణ సలహాలు ఇక్కడ కనిపిస్తాయి.",
    "weather.title": "వాతావరణం", "weather.loading": "వాతావరణాన్ని లోడ్ చేస్తోంది...", "weather.retry": "మళ్లీ ప్రయత్నించండి", "forecast.title": "ఆరోగ్య అంచనా", "forecast.loading": "అంచనాను లోడ్ చేస్తోంది...", "forecast.retry": "మళ్లీ ప్రయత్నించండి", "result.title": "నిర్ధారణ ఫలితం", "result.complete": "విశ్లేషణ పూర్తయింది", "result.cropImage": "పంట చిత్రం", "auth.login": "లాగిన్", "auth.signup": "నమోదు", "auth.mobile": "మొబైల్ నంబర్", "auth.password": "పాస్‌వర్డ్",
  },
  hi: {
    ...extraTranslations.hi,
    ...screenTranslations.en,
    ...screenTranslations.hi,
    "tab.home": "होम", "tab.diagnose": "जांच", "tab.farm": "मेरा खेत", "tab.alerts": "सूचनाएं", "tab.profile": "प्रोफ़ाइल",
    "home.forecastButtonText": "अपनी फसलों का 3, 5 और 7 दिन का जोखिम पूर्वानुमान देखें।", "farm.locationNotDetectedShort": "स्थान नहीं मिला", "farm.invalidLocation": "अमान्य स्थान", "farm.invalidLocationText": "-90 से 90 तक अक्षांश और -180 से 180 तक देशांतर दर्ज करें।", "farm.latitudeLabel": "अक्षांश", "farm.latitudePlaceholder": "उदा. 17.3850", "farm.longitudeLabel": "देशांतर", "farm.longitudePlaceholder": "उदा. 78.4867",
    "profile.title": "प्रोफ़ाइल", "profile.subtitle": "अपना खाता और सलाह की भाषा प्रबंधित करें", "profile.farmer": "किसान",
    "profile.mobileUnavailable": "मोबाइल नंबर उपलब्ध नहीं है", "profile.yourName": "आपका नाम", "profile.namePlaceholder": "अपना नाम दर्ज करें",
    "profile.advisoryLanguage": "सलाह की भाषा", "profile.saveChanges": "बदलाव सहेजें", "profile.signOut": "साइन आउट",
    "profile.loading": "आपकी प्रोफ़ाइल लोड हो रही है...", "alert.loadTitle": "प्रोफ़ाइल लोड नहीं हो सकी", "alert.tryAgain": "कृपया फिर कोशिश करें।",
    "alert.nameRequired": "नाम आवश्यक है", "alert.nameMinimum": "कृपया कम से कम दो अक्षर दर्ज करें।", "alert.updatedTitle": "प्रोफ़ाइल अपडेट हुई",
    "alert.updatedMessage": "आपकी प्राथमिकताएं सहेज दी गई हैं।", "alert.saveTitle": "प्रोफ़ाइल सहेजी नहीं जा सकी", "alert.signOutTitle": "साइन आउट",
    "alert.signOutMessage": "क्या आप वाकई साइन आउट करना चाहते हैं?", "alert.cancel": "रद्द करें",
    "home.loadingTitle": "आपका खेत डैशबोर्ड तैयार हो रहा है", "home.loadingSubtitle": "आपकी फसल का स्वास्थ्य जांच रहे हैं...", "home.subtitle": "अपनी फसलों को स्वस्थ रखें।", "home.aiMonitoring": "AI निगरानी सक्रिय है", "home.aiMessage": "अपनी फसलों पर नज़र रखें। जल्दी पहचान समस्या फैलने से रोक सकती है।", "home.checkHealth": "फसल स्वास्थ्य जांचें", "home.fieldWeather": "खेत का मौसम", "home.footerCredit": "CropCoders Team द्वारा विकसित", "home.cropRiskForecast": "फसल जोखिम पूर्वानुमान", "home.farmOverview": "खेत का अवलोकन", "home.quickDiagnosis": "त्वरित जांच", "home.scanCrop": "फसल स्कैन करें", "home.scanCropText": "पत्ते की स्पष्ट तस्वीर लेकर AI से फसल स्वास्थ्य समस्या पहचानें।", "home.startDiagnosis": "जांच शुरू करें", "diagnose.clearPicture": "स्पष्ट तस्वीर लें", "diagnose.fieldName": "क्षेत्र का नाम", "app.footerCredit": "CropCoders Team द्वारा विकसित", "weather.refresh": "मौसम रिफ्रेश करें", "home.viewWeather": "मौसम देखें", "home.viewForecast": "पूर्वानुमान देखें", "home.noFarms": "अभी कोई खेत नहीं", "home.addFarm": "अपना खेत जोड़ें",
    "diagnose.title": "फसल जांच", "diagnose.subtitle": "AI से अपनी फसल का स्वास्थ्य जांचें", "diagnose.loading": "जांच तैयार हो रही है", "diagnose.loadingSubtitle": "आपके खेत और क्षेत्र लोड हो रहे हैं...", "diagnose.selectFarm": "खेत चुनें", "diagnose.selectField": "क्षेत्र चुनें", "diagnose.addFarm": "खेत जोड़ें", "diagnose.takePhoto": "फोटो लें", "diagnose.choosePhoto": "गैलरी से चुनें", "diagnose.analyze": "फसल का विश्लेषण करें",
    "farm.title": "मेरा खेत", "farm.subtitle": "अपने खेत और फसल क्षेत्र प्रबंधित करें", "farm.loading": "आपके खेत लोड हो रहे हैं", "farm.loadingSubtitle": "आपके क्षेत्र तैयार हो रहे हैं...", "farm.add": "अपना खेत जोड़ें", "farm.noFarms": "अभी कोई खेत नहीं", "farm.addField": "क्षेत्र जोड़ें",
    "alerts.title": "फसल सूचनाएं", "alerts.subtitle": "अपने क्षेत्रों की सुरक्षा के लिए समय पर सलाह", "alerts.unread": "अपठित", "alerts.all": "सभी सूचनाएं", "alerts.empty": "कोई सूचना नहीं", "alerts.caughtUp": "आपने सब देख लिया", "alerts.emptyText": "नए मौसम जोखिम, रोग संकेत और प्रबंधन सलाह यहां दिखाई देंगी।",
    "weather.title": "मौसम", "weather.loading": "मौसम लोड हो रहा है...", "weather.retry": "फिर कोशिश करें", "forecast.title": "स्वास्थ्य पूर्वानुमान", "forecast.loading": "पूर्वानुमान लोड हो रहा है...", "forecast.retry": "फिर कोशिश करें", "result.title": "जांच परिणाम", "result.complete": "विश्लेषण पूरा हुआ", "result.cropImage": "फसल की तस्वीर", "auth.login": "लॉगिन", "auth.signup": "साइन अप", "auth.mobile": "मोबाइल नंबर", "auth.password": "पासवर्ड",
  },
};

const sharedUiTranslations: Record<Language, Record<string, string>> = {
  en: {
    "home.viewFarm": "View Farm",
    "forecast.unknown": "Unknown",
    "diagnose.noFarms": "No farms available",
    "diagnose.noFarmsText": "Add a farm before starting a diagnosis.",
    "diagnose.farmLabel": "Farm",
    "diagnose.fieldLabel": "Field",
    "diagnose.addLink": "Add",
    "diagnose.pictureHint": "Capture or select a photo of the affected leaf or crop area.",
    "diagnose.cropPhoto": "Crop Photo",
    "diagnose.readyForAnalysis": "Ready for AI analysis",
    "diagnose.changePhoto": "Change Photo",
    "diagnose.diagnosing": "DIAGNOSING",
    "diagnose.disclaimer": "AI analysis provides guidance and may require expert or laboratory confirmation.",
    "farm.locationSuccess": "GPS coordinates detected successfully.",
    "farm.latitude": "Latitude",
    "farm.longitude": "Longitude",
    "profile.languageEnglish": "English",
    "profile.languageTelugu": "తెలుగు",
    "profile.languageHindi": "हिन्दी",
  },
  te: {
    "home.viewFarm": "పొలం చూడండి",
    "forecast.unknown": "తెలియదు",
    "diagnose.noFarms": "పొలాలు అందుబాటులో లేవు",
    "diagnose.noFarmsText": "నిర్ధారణ ప్రారంభించే ముందు ఒక పొలాన్ని జోడించండి.",
    "diagnose.farmLabel": "పొలం",
    "diagnose.fieldLabel": "క్షేత్రం",
    "diagnose.addLink": "జోడించండి",
    "diagnose.pictureHint": "ప్రభావిత ఆకు లేదా పంట ప్రాంతం ఫోటో తీయండి లేదా ఎంచుకోండి.",
    "diagnose.cropPhoto": "పంట ఫోటో",
    "diagnose.readyForAnalysis": "AI విశ్లేషణకు సిద్ధంగా ఉంది",
    "diagnose.changePhoto": "ఫోటో మార్చండి",
    "diagnose.diagnosing": "నిర్ధారిస్తోంది",
    "diagnose.disclaimer": "AI విశ్లేషణ మార్గదర్శకత్వం మాత్రమే; నిపుణుడు లేదా ప్రయోగశాల నిర్ధారణ అవసరం కావచ్చు.",
    "farm.locationSuccess": "GPS కోఆర్డినేట్‌లు విజయవంతంగా గుర్తించబడ్డాయి.",
    "farm.latitude": "అక్షాంశం",
    "farm.longitude": "రేఖాంశం",
    "profile.languageEnglish": "English",
    "profile.languageTelugu": "తెలుగు",
    "profile.languageHindi": "हिन्दी",
  },
  hi: {
    "home.viewFarm": "खेत देखें",
    "forecast.unknown": "अज्ञात",
    "diagnose.noFarms": "कोई खेत उपलब्ध नहीं है",
    "diagnose.noFarmsText": "जांच शुरू करने से पहले खेत जोड़ें।",
    "diagnose.farmLabel": "खेत",
    "diagnose.fieldLabel": "क्षेत्र",
    "diagnose.addLink": "जोड़ें",
    "diagnose.pictureHint": "प्रभावित पत्ती या फसल क्षेत्र की तस्वीर लें या चुनें।",
    "diagnose.cropPhoto": "फसल की तस्वीर",
    "diagnose.readyForAnalysis": "AI जांच के लिए तैयार",
    "diagnose.changePhoto": "तस्वीर बदलें",
    "diagnose.diagnosing": "जांच जारी",
    "diagnose.disclaimer": "AI जांच मार्गदर्शन देती है और विशेषज्ञ या प्रयोगशाला की पुष्टि आवश्यक हो सकती है।",
    "farm.locationSuccess": "GPS निर्देशांक सफलतापूर्वक मिल गए।",
    "farm.latitude": "अक्षांश",
    "farm.longitude": "देशांतर",
    "profile.languageEnglish": "English",
    "profile.languageTelugu": "తెలుగు",
    "profile.languageHindi": "हिन्दी",
  },
};

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored === "en" || stored === "te" || stored === "hi") setLanguageState(stored);
    });
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    void AsyncStorage.setItem(LANGUAGE_KEY, next);
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key: string) => {
      const recommendationLabels: Record<Language, Record<string, string>> = {
        en: {
          "result.recommendations": "Next Recommended steps",
          "result.noRecommendations": "No recommendations are available yet.",
          "result.prevention": "Prevention",
          "result.pesticideSafety": "Pesticide safety",
          "result.action": "Recommended action", "result.symptoms": "Symptoms", "result.noSymptoms": "No symptoms were recorded.", "result.healthy": "Healthy", "result.noDiseaseSymptoms": "No visible disease symptoms", "result.checkOfficerTitle": "Confirm before treatment", "result.checkOfficerText": "Please check with your local agriculture officer before using any treatment.", "common.high": "High", "common.severe": "Severe", "common.medium": "Medium", "common.moderate": "Moderate", "common.low": "Low", "common.pending": "Pending", "common.completed": "Completed", "common.reviewed": "Reviewed", "common.ai": "AI analysis", "expert.title": "Expert review queue", "expert.subtitle": "Review farmer requests and provide a confirmed diagnosis.", "expert.empty": "No pending requests.", "expert.farmer": "Farmer", "expert.diagnosis": "AI diagnosis", "expert.confidence": "Confidence", "expert.notesPlaceholder": "Enter your findings and safe advice", "expert.approve": "Approve", "expert.reject": "Reject", "expert.notesRequired": "Add review notes before submitting.", "expert.saved": "Review saved", "expert.savedText": "The farmer can now see the expert decision.", "expert.loadError": "Unable to load review requests.", "expert.saveError": "Unable to save this review.", "expert.openQueue": "Open expert review queue",
        },
        te: {
          "result.recommendations": "తదుపరి సిఫార్సు చేసిన దశలు",
          "result.noRecommendations": "ఇంకా సిఫార్సులు అందుబాటులో లేవు.",
          "result.prevention": "నివారణ",
          "result.pesticideSafety": "పురుగుమందుల భద్రత",
          "result.action": "సిఫార్సు చేసిన చర్య", "result.symptoms": "లక్షణాలు", "result.noSymptoms": "లక్షణాలు నమోదు కాలేదు.", "result.healthy": "ఆరోగ్యంగా ఉంది", "result.noDiseaseSymptoms": "వ్యాధి లక్షణాలు కనిపించలేదు", "result.checkOfficerTitle": "చికిత్సకు ముందు నిర్ధారించండి", "result.checkOfficerText": "ఏ చికిత్సను ఉపయోగించే ముందు స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.", "common.high": "అధిక", "common.severe": "తీవ్రమైన", "common.medium": "మధ్యస్థ", "common.moderate": "మితమైన", "common.low": "తక్కువ", "common.pending": "పెండింగ్‌లో ఉంది", "common.completed": "పూర్తయింది", "common.reviewed": "సమీక్షించబడింది", "common.ai": "AI విశ్లేషణ", "expert.title": "నిపుణుల సమీక్షల జాబితా", "expert.subtitle": "రైతుల అభ్యర్థనలను పరిశీలించి నిర్ధారిత నిర్ధారణ ఇవ్వండి.", "expert.empty": "పెండింగ్ అభ్యర్థనలు లేవు.", "expert.farmer": "రైతు", "expert.diagnosis": "AI నిర్ధారణ", "expert.confidence": "నమ్మకం", "expert.notesPlaceholder": "మీ పరిశీలనలు మరియు సురక్షిత సలహాను నమోదు చేయండి", "expert.approve": "ఆమోదించండి", "expert.reject": "తిరస్కరించండి", "expert.notesRequired": "సమర్పించే ముందు సమీక్ష గమనికలు నమోదు చేయండి.", "expert.saved": "సమీక్ష సేవ్ చేయబడింది", "expert.savedText": "రైతు ఇప్పుడు నిపుణుల నిర్ణయాన్ని చూడగలరు.", "expert.loadError": "సమీక్ష అభ్యర్థనలను లోడ్ చేయలేకపోయాము.", "expert.saveError": "సమీక్షను సేవ్ చేయలేకపోయాము.", "expert.openQueue": "నిపుణుల సమీక్ష తెరవండి",
        },
        hi: {
          "result.recommendations": "अगले सुझाए गए कदम",
          "result.noRecommendations": "अभी कोई सलाह उपलब्ध नहीं है।",
          "result.prevention": "रोकथाम",
          "result.pesticideSafety": "कीटनाशक सुरक्षा",
          "result.speakDisease": "रोग का नाम सुनें",
          "result.speechUnavailable": "रोग का नाम सुनाया नहीं जा सका।",
          "result.symptoms": "लक्षण",
          "result.noSymptoms": "कोई लक्षण दर्ज नहीं हैं।",
          "result.healthy": "स्वस्थ",
          "result.noDiseaseSymptoms": "रोग के लक्षण दिखाई नहीं दिए",
          "result.checkOfficerTitle": "उपचार से पहले पुष्टि करें",
          "result.checkOfficerText": "किसी भी उपचार से पहले स्थानीय कृषि अधिकारी से सलाह लें।",
          "result.action": "सुझाई गई कार्रवाई", "common.high": "उच्च", "common.severe": "गंभीर", "common.medium": "मध्यम", "common.moderate": "सामान्य", "common.low": "कम", "common.pending": "लंबित", "common.completed": "पूरा हुआ", "common.reviewed": "समीक्षा की गई", "common.ai": "AI जांच", "expert.title": "विशेषज्ञ समीक्षा सूची", "expert.subtitle": "किसानों के अनुरोधों की जांच कर पुष्टि की गई सलाह दें।", "expert.empty": "कोई लंबित अनुरोध नहीं है।", "expert.farmer": "किसान", "expert.diagnosis": "AI जांच", "expert.confidence": "विश्वास", "expert.notesPlaceholder": "अपने निष्कर्ष और सुरक्षित सलाह लिखें", "expert.approve": "स्वीकृत करें", "expert.reject": "अस्वीकार करें", "expert.notesRequired": "जमा करने से पहले समीक्षा नोट लिखें।", "expert.saved": "समीक्षा सहेजी गई", "expert.savedText": "किसान अब विशेषज्ञ का निर्णय देख सकता है।", "expert.loadError": "समीक्षा अनुरोध लोड नहीं हो सके।", "expert.saveError": "समीक्षा सहेजी नहीं जा सकी।", "expert.openQueue": "विशेषज्ञ समीक्षा खोलें",
        },
      };
      return recommendationLabels[language][key] ?? sharedUiTranslations[language][key] ?? translations[language][key] ?? sharedUiTranslations.en[key] ?? translations.en[key] ?? key;
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
