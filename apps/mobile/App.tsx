import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, Text, View } from "react-native";

const CLUB = {
  name: "SAFFLE FF Académie CI",
  tagline: "Centre de formation de football",
  location: "Sinfra, Côte d'Ivoire",
};

export default function App() {
  return (
    <View style={styles.container}>
      <Image
        source={require("./assets/logo.jpg")}
        style={styles.logo}
        resizeMode="contain"
      />
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
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
  },
  title: {
    color: "#fafafa",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
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
