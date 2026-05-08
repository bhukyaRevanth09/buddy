import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: "http://10.112.58.157:9090/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/*
========================
REFRESH CONTROL
========================
*/
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/*
========================
SAFE TOKEN GET
========================
*/
const getAccessToken = async () => {
  try {
    let token = await SecureStore.getItemAsync("accessToken");
    if (!token) return null;

    // remove Bearer
    if (token.startsWith("Bearer ")) {
      token = token.replace("Bearer ", "");
    }

    // if JSON saved
    try {
      const parsed = JSON.parse(token);
      if (parsed?.accessToken) {
        token = parsed.accessToken;
      }
    } catch {}

    return token;
  } catch {
    return null;
  }
};

/*
========================
REQUEST INTERCEPTOR
========================
*/
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
========================
RESPONSE INTERCEPTOR
========================
*/
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken =
          await SecureStore.getItemAsync("refreshToken");

        if (!refreshToken) {
          throw new Error("NO_REFRESH_TOKEN");
        }

        const res = await axios.post(
          "http://192.168.0.109:9090/api/auth/refresh-token",
          { refreshToken }
        );

        let newAccessToken = res.data.accessToken;

        if (!newAccessToken) {
          throw new Error("NO_ACCESS_TOKEN");
        }

        // remove Bearer
        if (newAccessToken.startsWith("Bearer ")) {
          newAccessToken = newAccessToken.replace("Bearer ", "");
        }

        await SecureStore.setItemAsync(
          "accessToken",
          newAccessToken
        );

        /*
        ========================
        RECONNECT SOCKET
        ========================
        */
        if (global.socketReconnect) {
          console.log("♻️ Reconnecting socket after refresh");
          global.socketReconnect();
        }

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);

      } catch (refreshError) {

        processQueue(refreshError, null);

        await Promise.all([
          SecureStore.deleteItemAsync("accessToken"),
          SecureStore.deleteItemAsync("refreshToken"),
          SecureStore.deleteItemAsync("userRole"),
        ]);

        return Promise.reject({
          message: "SESSION_EXPIRED",
          logout: true,
        });

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;