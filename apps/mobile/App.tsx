import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.badge}>SAFFLE FC</Text>
      <Text style={styles.title}>Académie</Text>
      <Text style={styles.subtitle}>
        Application mobile iOS et Android — administration, sport et paiements.
      </Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  badge: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 3,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#fafafa",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: "#a1a1aa",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
