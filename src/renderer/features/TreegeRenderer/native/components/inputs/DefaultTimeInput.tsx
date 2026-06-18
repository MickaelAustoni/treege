import { useCallback, useRef, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { InputRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultTimeInput = ({ field, extra }: InputRenderProps<"time">) => {
  const { value, placeholder } = field;
  const timeValue = value || "";
  const parts = timeValue.split(":");
  const parsedHours = Number.parseInt(parts[0], 10);
  const parsedMinutes = Number.parseInt(parts[1], 10);
  const hours = Number.isNaN(parsedHours) ? 0 : parsedHours;
  const minutes = Number.isNaN(parsedMinutes) ? 0 : parsedMinutes;
  const [selectedHours, setSelectedHours] = useState(hours || 0);
  const [selectedMinutes, setSelectedMinutes] = useState(minutes || 0);
  const [isOpen, setIsOpen] = useState(false);
  const { InputLabel, node, setValue, error, label, helperText } = extra;
  const { colors } = useTheme();
  const hoursScrollRef = useRef<ScrollView>(null);
  const minutesScrollRef = useRef<ScrollView>(null);
  const hoursList = Array.from({ length: 24 }, (_, i) => i);
  const minutesList = Array.from({ length: 60 }, (_, i) => i);

  const formatTime = () => {
    if (!value) {
      return placeholder || "Select time";
    }
    return value;
  };

  const handleConfirm = useCallback(() => {
    const timeString = `${String(selectedHours).padStart(2, "0")}:${String(selectedMinutes).padStart(2, "0")}`;
    setValue(timeString);
    setIsOpen(false);
  }, [selectedHours, selectedMinutes, setValue]);

  const handleOpen = () => {
    setSelectedHours(hours || 0);
    setSelectedMinutes(minutes || 0);
    setIsOpen(true);
  };

  return (
    <View style={styles.container}>
      <InputLabel label={label} required={node.data.required} />

      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.input, borderColor: colors.border }, error && { borderColor: colors.error }]}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: colors.text }, !value && { color: colors.textMuted }]} numberOfLines={1}>
          {formatTime()}
        </Text>
        <Text style={styles.icon}>🕐</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{label || placeholder || "Select time"}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={[styles.closeButton, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Hour</Text>
                <ScrollView
                  ref={hoursScrollRef}
                  style={styles.picker}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                >
                  {hoursList.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[styles.pickerItem, selectedHours === hour && { backgroundColor: colors.primary }]}
                      onPress={() => setSelectedHours(hour)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: colors.text },
                          selectedHours === hour && { color: colors.background, fontWeight: "600" },
                        ]}
                      >
                        {String(hour).padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={[styles.pickerSeparator, { color: colors.text }]}>:</Text>

              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Minute</Text>
                <ScrollView
                  ref={minutesScrollRef}
                  style={styles.picker}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                >
                  {minutesList.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[styles.pickerItem, selectedMinutes === minute && { backgroundColor: colors.primary }]}
                      onPress={() => setSelectedMinutes(minute)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: colors.text },
                          selectedMinutes === minute && { color: colors.background, fontWeight: "600" },
                        ]}
                      >
                        {String(minute).padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.confirmButtonText, { color: colors.background }]}>Confirm</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    fontSize: 24,
    fontWeight: "300",
  },
  confirmButton: {
    alignItems: "center",
    borderRadius: 6,
    marginTop: 16,
    paddingVertical: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    marginBottom: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  icon: {
    fontSize: 16,
  },
  modalContent: {
    borderRadius: 12,
    padding: 16,
    width: "80%",
  },
  modalHeader: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  picker: {
    maxHeight: 200,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  pickerContent: {
    paddingVertical: 8,
  },
  pickerItem: {
    alignItems: "center",
    borderRadius: 6,
    marginVertical: 2,
    paddingVertical: 10,
  },
  pickerItemText: {
    fontSize: 18,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  pickerSeparator: {
    fontSize: 24,
    fontWeight: "600",
  },
  trigger: {
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
  },
});

export default DefaultTimeInput;
