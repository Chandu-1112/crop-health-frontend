import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL = "https://crop-health-ai-occv.onrender.com";

const TOKEN_KEY = "@crop_health_token";
const TOKEN_TYPE_KEY = "@crop_health_token_type";
const CACHE_PREFIX = "@crop_health_cache:";
const TTL_CACHE_PREFIX = "@crop_health_ttl_cache:";
const REQUEST_TIMEOUT_MS = 45000;

const isCacheableGet = (endpoint: string, options: RequestInit) =>
  !options.method &&
  !endpoint.includes("/auth/") &&
  !endpoint.includes("/diagnosis/");

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true
) {
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (requiresAuth) {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const tokenType = await AsyncStorage.getItem(TOKEN_TYPE_KEY);

    if (token) {
      headers.set(
        "Authorization",
        `${tokenType || "Bearer"} ${token}`
      );
    }
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (isCacheableGet(endpoint, options)) {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${endpoint}`);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();

  let data: any;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  if (isCacheableGet(endpoint, options)) {
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${endpoint}`,
      JSON.stringify(data),
    );
  }

  return data;
}

export async function cachedApiRequest<T>(
  endpoint: string,
  ttlMs: number,
  options: RequestInit = {},
  forceRefresh = false,
): Promise<T> {
  const cacheKey = `${TTL_CACHE_PREFIX}${endpoint.replace("?refresh=true", "")}`;
  const cachedValue = await AsyncStorage.getItem(cacheKey);
  let cached: { savedAt: number; data: T } | null = null;

  if (cachedValue) {
    try {
      cached = JSON.parse(cachedValue);
    } catch {
      await AsyncStorage.removeItem(cacheKey);
    }
  }

  if (
    !forceRefresh &&
    cached &&
    Date.now() - cached.savedAt < ttlMs
  ) {
    return cached.data;
  }

  try {
    const data = await apiRequest(endpoint, options) as T;
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({ savedAt: Date.now(), data }),
    );
    return data;
  } catch (error) {
    if (cached) {
      return cached.data;
    }
    throw error;
  }
}