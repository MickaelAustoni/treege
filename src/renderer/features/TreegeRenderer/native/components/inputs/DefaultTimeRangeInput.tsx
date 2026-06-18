import { useCallback, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultTimeRangeInput = ({ field, extra }: InputRenderProps<"timerange">) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingStart, setSelectingStart] = useState(true);
  const { value } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;
  const { colors } = useTheme();
  const t = useTranslate();

  const timeRange = Array.isArray(value) ? value : [];
  const startTime = timeRange[0] || "";
  const endTime = timeRange[1] || "";

  const startParts = startTime.split(":");
  const parsedStartHours = Number.parseInt(startParts[0], 10);
  const parsedStartMinutes = Number.parseInt(startParts[1], 10);
  const startHours = Number.isNaN(parsedStartHours) ? 0 : parsedStartHours;
  const startMinutes = Number.isNaN(parsedStartMinutes) ? 0 : parsedStartMinutes;

  const endParts = endTime.split(":");
  const parsedEndHours = Number.parseInt(endParts[0], 10);
  const parsedEndMinutes = Number.parseInt(endParts[1], 10);
  const endHours = Number.isNaN(parsedEndHours) ? 0 : parsedEndHours;
  const endMinutes = Number.isNaN(parsedEndMinutes) ? 0 : parsedEndMinutes;

  const [selectedHours, setSelectedHours] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState(0);

  const hoursList = Array.from({ length: 24 }, (_, i) => i);
  const minutesList = Array.from({ length: 60 }, (_, i) => i);

  const formatTimeRange = () => {
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }
    if (startTime) {
      return startTime;
    }
    return t("renderer.defaultInputs.selectDateRange");
  };

  const handleConfirm = useCallback(() => {
    const timeString = `${String(selectedHours).padStart(2, "0")}:${String(selectedMinutes).padStart(2, "0")}`;

    if (selectingStart) {
      setValue([timeString, endTime]);
      setSelectingStart(false);
      setSelectedHours(endHours || 0);
      setSelectedMinutes(endMinutes || 0);
    } else {
      setValue([startTime, timeString]);
      setIsOpen(false);
      setSelectingStart(true);
    }
  }, [selectingStart, selectedHours, selectedMinutes, startTime, endTime, endHours, endMinutes, setValue]);

  const handleOpen = () => {
    setSelectedHours(startHours || 0);
    setSelectedMinutes(startMinutes || 0);
    setSelectingStart(true);
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
        <Text style={[styles.triggerText, { color: colors.text }, !startTime && { color: colors.textMuted }]} numberOfLines={1}>
          {formatTimeRange()}
        </Text>
        <Text style={styles.icon}>🕐</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{label || t("renderer.defaultInputs.selectDateRange")}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={[styles.closeButton, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.rangeIndicator, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.rangeIndicatorText, { color: colors.primary }]}>
                {selectingStart ? t("renderer.defaultInputs.startTime") : t("renderer.defaultInputs.endTime")}
              </Text>
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Hour</Text>
                <ScrollView style={styles.picker} contentContainerStyle={styles.pickerContent} showsVerticalScrollIndicator={false}>
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
                <ScrollView style={styles.picker} contentContainerStyle={styles.pickerContent} showsVerticalScrollIndicator={false}>
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
              <Text style={[styles.confirmButtonText, { color: colors.background }]}>{selectingStart ? "Next" : "Confirm"}</Text>
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
    marginBottom: 12,
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
  rangeIndicator: {
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 12,
    paddingVertical: 8,
  },
  rangeIndicatorText: {
    fontSize: 14,
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

export default DefaultTimeRangeInput;
