import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import Field from "../../components/Field";
import AppIcon from "../../components/AppIcon";
import { IconButton, PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Spacing } from "../../theme/colors";

const categories = ["Supermarket", "Restaurant", "Health Store", "Bakery", "Pharmacy", "Other"];
const MAX_IMAGE_DATA_URL_LENGTH = 5500000;
const DEFAULT_CENTER = { latitude: 36.82, longitude: 10.2 };

const readUriAsDataUrl = async (uri, mimeType) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read selected image."));
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (result.startsWith("data:image/")) {
        resolve(result);
        return;
      }

      const base64 = result.split(",")[1];
      resolve(base64 ? `data:${mimeType};base64,${base64}` : "");
    };
    reader.readAsDataURL(blob);
  });
};

function buildPickerHTML(lat, lng) {
  const hasPoint = lat != null && lng != null;
  const initLat = hasPoint ? lat : DEFAULT_CENTER.latitude;
  const initLng = hasPoint ? lng : DEFAULT_CENTER.longitude;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #e8efe9; }
    #map { width: 100%; height: 100%; }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false }).setView([${initLat}, ${initLng}], ${hasPoint ? 15 : 12});

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd', maxZoom: 19
  }).addTo(map);

  var marker = null;

  function notify(lat, lng) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'locationPicked', lat: lat, lng: lng }));
    }
  }

  function placeMarker(lat, lng, silent) {
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on('dragend', function() {
        var p = marker.getLatLng();
        notify(p.lat, p.lng);
      });
    }
    if (!silent) notify(lat, lng);
  }

  ${hasPoint ? `placeMarker(${initLat}, ${initLng}, true);` : ""}

  map.on('click', function(e) {
    placeMarker(e.latlng.lat, e.latlng.lng);
  });
</script>
</body>
</html>`;
}

export default function SellerEstablishmentFormScreen({ navigation }) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const imageDataUrlRef = useRef("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Restaurant");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [imageStatus, setImageStatus] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  const categoryLabels = {
    Supermarket: t("map.supermarket"),
    Restaurant: t("map.restaurant"),
    "Health Store": t("map.healthStore"),
    Bakery: t("map.bakery"),
    Pharmacy: t("map.pharmacy"),
    Other: t("admin.form.other"),
  };

  useEffect(() => {
    const load = async () => {
      try {
        const establishment = await api.myEstablishment(token);
        if (establishment) {
          setName(establishment.name || "");
          setCategory(establishment.category || "Restaurant");
          setDescription(establishment.description || "");
          setAddress(establishment.address || "");
          setPhone(establishment.phone || "");
          setHours(establishment.hours || "");
          setCoverImageUrl(establishment.coverImageUrl || "");
          setImageStatus(establishment.coverImageUrl ? t("admin.form.currentImage") : "");
          if (establishment.coordinates?.latitude != null && establishment.coordinates?.longitude != null) {
            setLatitude(establishment.coordinates.latitude);
            setLongitude(establishment.coordinates.longitude);
          }
        }
      } catch (error) {
        Alert.alert(t("seller.form.loadFailed"), error.message);
      } finally {
        setMapReady(true);
      }
    };

    load();
  }, []);

  const leafletHTML = useMemo(() => buildPickerHTML(latitude, longitude), [mapReady]);

  const handleMapMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "locationPicked") {
        setLatitude(msg.lat);
        setLongitude(msg.lng);
      }
    } catch (_) {}
  };

  const pickImage = async () => {
    setImageStatus(t("admin.form.image.checking"));

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setImageStatus(t("admin.form.image.denied"));
      Alert.alert(t("admin.form.image.permissionTitle"), t("admin.form.image.permissionMsg"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      base64: true,
      mediaTypes: ["images"],
      quality: 0.25,
    });

    if (result.canceled) {
      setImageStatus(t("admin.form.image.cancelled"));
      return;
    }

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      setImageStatus(t("admin.form.image.cantRead"));
      Alert.alert(t("admin.form.image.errorTitle"), t("admin.form.image.cantReadMsg"));
      return;
    }

    try {
      setImageProcessing(true);
      setImageStatus(t("admin.form.image.reading"));
      const mimeType = asset.mimeType || "image/jpeg";
      const dataUrl = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : await readUriAsDataUrl(asset.uri, mimeType);

      if (!dataUrl.startsWith("data:image/")) {
        setImageStatus(t("admin.form.image.readFailed"));
        Alert.alert(t("admin.form.image.errorTitle"), t("admin.form.image.cantReadMsg"));
        return;
      }

      if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
        setImageStatus(t("admin.form.image.tooLarge", { size: Math.ceil(dataUrl.length / 1024) }));
        Alert.alert(t("admin.form.image.tooLargeTitle"), t("admin.form.image.tooLargeMsg"));
        return;
      }

      imageDataUrlRef.current = dataUrl;
      setRemoveImage(false);
      setCoverImageUrl(asset.uri);
      setImageStatus(t("admin.form.image.ready", { size: Math.ceil(dataUrl.length / 1024) }));
    } catch (error) {
      setImageStatus(t("admin.form.image.failed"));
      Alert.alert(t("admin.form.image.errorTitle"), t("admin.form.image.failedMsg"));
    } finally {
      setImageProcessing(false);
    }
  };

  const save = async () => {
    const nextErrors = {};
    if (!name.trim()) {
      nextErrors.name = t("seller.form.errors.nameRequired");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      if (!token) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsgShort"));
        return;
      }

      setLoading(true);
      const body = {
        name: name.trim(),
        category,
        description,
        address,
        phone,
        hours,
      };

      if (removeImage) {
        body.coverImageUrl = "";
      }
      if (imageDataUrlRef.current) {
        body.coverImageUrl = imageDataUrlRef.current;
      }
      if (latitude != null && longitude != null) {
        body.latitude = latitude;
        body.longitude = longitude;
      }

      await api.upsertMyEstablishment(token, body);

      Alert.alert(t("seller.form.saved"), t("seller.form.savedMsg"), [
        { text: t("admin.ok"), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t("seller.form.saveFailed"), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <SectionHeader
          eyebrow={t("seller.form.eyebrow")}
          title={t("seller.form.title")}
          right={<IconButton icon="close" onPress={() => navigation.goBack()} />}
        />
        <Field
          label={t("seller.form.name")}
          value={name}
          error={errors.name}
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: "" }));
          }}
        />
        <View style={styles.categoryWrap}>
          <Text style={styles.label}>{t("seller.form.category")}</Text>
          <View style={styles.categories}>
            {categories.map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.categoryPill, category === item && styles.categoryPillActive]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === item && styles.categoryTextActive,
                  ]}
                >
                  {categoryLabels[item] || item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Field
          label={t("seller.form.description")}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Field label={t("seller.form.address")} value={address} onChangeText={setAddress} />
        <View style={styles.split}>
          <Field
            label={t("seller.form.phone")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.flex}
          />
          <Field
            label={t("seller.form.hours")}
            value={hours}
            onChangeText={setHours}
            placeholder="08:00 - 19:00"
            style={styles.flex}
          />
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.label}>{t("seller.form.coverImage")}</Text>
          <View
            style={[styles.imageStatusBox, imageStatus ? styles.imageStatusBoxActive : null]}
          >
            <Text style={styles.imageStatus}>{imageStatus || t("admin.form.noImage")}</Text>
          </View>
          <View style={styles.imageActions}>
            <SecondaryButton
              title={
                imageProcessing
                  ? t("admin.form.preparing")
                  : coverImageUrl
                    ? t("admin.form.replaceImage")
                    : t("admin.form.uploadImage")
              }
              icon="image"
              disabled={imageProcessing || loading}
              onPress={pickImage}
              style={styles.imageAction}
            />
            {coverImageUrl ? (
              <SecondaryButton
                title={t("admin.form.remove")}
                icon="trash"
                disabled={imageProcessing || loading}
                onPress={() => {
                  setCoverImageUrl("");
                  imageDataUrlRef.current = "";
                  setImageStatus(t("admin.form.removeStatus"));
                  setRemoveImage(true);
                }}
                style={styles.imageAction}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.locationSection}>
          <Text style={styles.label}>{t("seller.form.location")}</Text>
          <Text style={styles.locationHint}>{t("seller.form.locationHint")}</Text>
          <View style={styles.mapBox}>
            {mapReady ? (
              <WebView
                style={StyleSheet.absoluteFillObject}
                source={{ html: leafletHTML }}
                onMessage={handleMapMessage}
                javaScriptEnabled
                originWhitelist={["*"]}
                mixedContentMode="compatibility"
              />
            ) : null}
          </View>
          <View style={styles.coordsRow}>
            <AppIcon name="map-pin" size={14} color={Colors.secondary} />
            <Text style={styles.coordsText}>
              {latitude != null && longitude != null
                ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                : t("seller.form.noLocation")}
            </Text>
          </View>
        </View>

        <PrimaryButton
          title={t("seller.form.save")}
          icon="save"
          loading={loading || imageProcessing}
          disabled={imageProcessing}
          onPress={save}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  split: {
    flexDirection: "row",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  label: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
  categoryWrap: {
    gap: 8,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryPill: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  categoryPillActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  categoryText: {
    color: Colors.textMuted,
    fontWeight: "800",
  },
  categoryTextActive: {
    color: Colors.surface,
  },
  imageSection: {
    gap: 8,
  },
  imageActions: {
    flexDirection: "row",
    gap: 10,
  },
  imageAction: {
    flex: 1,
  },
  imageStatusBox: {
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  imageStatusBoxActive: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondaryPale,
  },
  imageStatus: {
    color: Colors.textDark,
    fontSize: 12,
    fontWeight: "800",
  },
  locationSection: {
    gap: 8,
  },
  locationHint: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  mapBox: {
    height: 220,
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Colors.divider,
  },
  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coordsText: {
    color: Colors.textDark,
    fontSize: 12,
    fontWeight: "700",
  },
});
