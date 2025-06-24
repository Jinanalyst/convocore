import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import AssistantScreen from "./src/screens/AssistantScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import { loadConsent } from "./src/services/consent";

if (typeof window !== "undefined") {
  console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export default function App() {
  const [ready, setReady] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const prefs = await loadConsent();
      // if any consent stored or user has agreed before, skip onboarding
      const hasAny = Object.values(prefs).some(Boolean);
      setShowOnboarding(!hasAny);
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      {showOnboarding ? (
        <OnboardingScreen onDone={() => setShowOnboarding(false)} />
      ) : (
        <AssistantScreen />
      )}
    </SafeAreaView>
  );
}
