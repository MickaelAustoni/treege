import { StatusBar } from "expo-status-bar";
import { Alert, StyleSheet, View } from "react-native";
import { TreegeRenderer } from "treege/renderer-native";
import { allFieldsFlow } from "./allFieldsFlow";

export default function App() {
  const handleSubmit = (values: any) => {
    Alert.alert("Form Submitted", JSON.stringify(values, null, 2), [{ text: "OK" }]);
  };

  return (
    <View style={styles.container}>
      <TreegeRenderer
        flow={allFieldsFlow}
        onSubmit={handleSubmit}
        contentContainerStyle={styles.scrollContent}
        theme="dark"
      />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FAFB",
    flex: 1,
  },
  // The form is taller than the screen: it scrolls from under the status bar down to the home indicator
  scrollContent: {
    paddingBottom: 48,
    paddingHorizontal: 16,
    paddingTop: 64,
  },
});
