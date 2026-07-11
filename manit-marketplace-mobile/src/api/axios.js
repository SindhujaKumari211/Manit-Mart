import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

// apiHost is configurable in app.json under expo.extra.apiHost (defaults to localhost on web)
const apiHost =
  Constants.expoConfig?.extra?.apiHost ||
  (Platform.OS === "web" ? "http://localhost:5000" : "http://192.168.0.116:5000");

const API = axios.create({
  baseURL: `${apiHost}/api`,
});

export default API;
