import { StatusBar } from "expo-status-bar";
import { Alert, StyleSheet, View } from "react-native";
import { TreegeRenderer } from "treege/renderer-native";
import flow from "~/example/json/treege.json";
import { Flow } from "@/shared/types/node";

export default function App() {
  const handleSubmit = (values: any) => {
    Alert.alert("Form Submitted", JSON.stringify(values, null, 2), [{ text: "OK" }]);
  };

  return (
    <View style={styles.container}>
      <TreegeRenderer
        flow={flow  as Flow}
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
  scrollContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
