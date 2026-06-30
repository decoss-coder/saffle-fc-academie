import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

const CLUB = {
  shortName: "SAFFLE FF",
  name: "Académie CI",
  tagline: "Centre de formation de football",
  location: "Sinfra, Côte d'Ivoire",
};

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.badge}>{CLUB.shortName}</Text>
      <Text style={styles.title}>{CLUB.name}</Text>
      <Text style={styles.location}>{CLUB.location}</Text>
      <Text style={styles.subtitle}>{CLUB.tagline}</Text>
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
    marginBottom: 4,
  },
  location: {
    color: "#71717a",
    fontSize: 14,
    marginBottom: 8,
  },
  subtitle: {
    color: "#a1a1aa",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
