import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import API from "../../src/services/api";

export default function HomeScreen() {

  useEffect(() => {
    API.get("/api/products")
      .then(res => console.log("SUCCESS:", res.data))
      .catch(err => console.log("ERROR:", err.message));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>MANIT Marketplace 🚀</Text>
      <Text>Check console for backend response</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
  },
});