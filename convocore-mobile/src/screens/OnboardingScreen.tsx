import React, { useEffect, useState } from "react";
import { View, Text, Switch, StyleSheet, Button, Linking, ScrollView } from "react-native";
import { ConsentPrefs, loadConsent, saveConsent } from "../services/consent";

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const [prefs, setPrefs] = useState<ConsentPrefs>({ contacts: false, calendar: false, location: false });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await loadConsent();
      setPrefs(stored);
      setLoading(false);
    })();
  }, []);

  const toggle = (key: keyof ConsentPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const proceed = async () => {
    await saveConsent(prefs);
    onDone();
  };

  if (loading) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to Convocore Mobile AI</Text>
      <Text style={styles.description}>
        We value your privacy. The assistant can optionally access data on your device to provide smarter features:
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Contacts (to call by name)</Text>
        <Switch value={prefs.contacts} onValueChange={() => toggle("contacts")} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Calendar (to answer schedule queries)</Text>
        <Switch value={prefs.calendar} onValueChange={() => toggle("calendar")} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Location (to answer "Where am I?" queries)</Text>
        <Switch value={prefs.location} onValueChange={() => toggle("location")} />
      </View>

      <Text style={styles.policy} onPress={() => Linking.openURL("https://convocore.ai/privacy")}>View Privacy Policy</Text>

      <View style={styles.row}>
        <Switch value={agreed} onValueChange={setAgreed} />
        <Text style={styles.label}>I agree to the Privacy Policy</Text>
      </View>

      <Button title="Continue" onPress={proceed} disabled={!agreed} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  description: { fontSize: 16, marginBottom: 24, textAlign: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 8 },
  label: { flex: 1, fontSize: 16 },
  policy: { color: "blue", textAlign: "center", marginVertical: 16, textDecorationLine: "underline" },
});
