import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "./api";

const TOKEN_KEY = "@crop_health_token";
const TOKEN_TYPE_KEY = "@crop_health_token_type";

export async function login(
  mobile: string,
  password: string
) {
  const data = await apiRequest(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        mobile: mobile.trim(),
        password,
      }),
    },
    false
  );

  if (!data?.access_token) {
    throw new Error("Login response did not contain an access token");
  }

  await AsyncStorage.setItem(
    TOKEN_KEY,
    data.access_token
  );

  await AsyncStorage.setItem(
    TOKEN_TYPE_KEY,
    data.token_type || "Bearer"
  );

  return data;
}

export async function logout() {
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    TOKEN_TYPE_KEY,
  ]);
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getCurrentUser() {
  return apiRequest("/api/auth/me");
}