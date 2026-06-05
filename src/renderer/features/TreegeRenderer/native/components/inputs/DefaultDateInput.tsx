import { useCallback, useMemo, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultDateInput = (field: InputFieldProps<"date">, extra: InputExtraProps<"date">) => {
  const [isOpen, setIsOpen] = useState(false);
  const { value, placeholder } = field;
  const { node, setValue, error, label, helperText } = extra;
  const { colors } = useTheme();
  const t = useTranslate();
  const dateValue = value ? new Date(value) : undefined;

  const { year, month, today } = useMemo(() => {
    const selectedDate = dateValue || new Date();
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return { month: m, today: now, year: y };
  }, [dateValue]);

  const [currentYear, setCurrentYear] = useState(year);
  const [currentMonth, setCurrentMonth] = useState(month);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    const previousMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const calendarDays = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      calendarDays.push({
        date: new Date(currentYear, currentMonth - 1, previousMonthDays - i),
        day: previousMonthDays - i,
        isCurrentMonth: false,
      });
    }

    for (let day = 1; day <= daysCount; day++) {
      calendarDays.push({
        date: new Date(currentYear, currentMonth, day),
        day,
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      calendarDays.push({
        date: new Date(currentYear, currentMonth + 1, day),
        day,
        isCurrentMonth: false,
      });
    }

    return calendarDays;
  }, [currentYear, currentMonth]);

  const handleSelectDate = useCallback(
    (date: Date) => {
      if (node.data.disablePast && date < today) {
        return;
      }
      setValue(date.toISOString());
      setIsOpen(false);
    },
    [node.data.disablePast, today, setValue],
  );

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const formatDate = () => {
    if (!dateValue) {
      return placeholder || t("renderer.defaultInputs.selectDate");
    }
    return dateValue.toLocaleDateString();
  };

  const isDateDisabled = (date: Date) => {
    if (!node.data.disablePast) {
      return false;
    }
    return date < today;
  };

  const isSelected = (date: Date) => {
    if (!dateValue) {
      return false;
    }
    return (
      date.getDate() === dateValue.getDate() && date.getMonth() === dateValue.getMonth() && date.getFullYear() === dateValue.getFullYear()
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label || node.data.name}
        {node.data.required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>

      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.input, borderColor: colors.border }, error && { borderColor: colors.error }]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: colors.text }, !value && { color: colors.textMuted }]} numberOfLines={1}>
          {formatDate()}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{label || node.data.name}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={[styles.closeButton, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
                <Text style={[styles.navButtonText, { color: colors.primary }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.monthYear, { color: colors.text }]}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                <Text style={[styles.navButtonText, { color: colors.primary }]}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <Text key={day} style={[styles.weekDay, { color: colors.textMuted }]}>
                  {day}
                </Text>
              ))}
            </View>

            <FlatList
              data={days}
              keyExtractor={(item, index) => `${item.date.getTime()}-${index}`}
              numColumns={7}
              scrollEnabled={false}
              style={styles.calendar}
              contentContainerStyle={styles.calendarContent}
              renderItem={({ item }) => {
                const disabled = isDateDisabled(item.date);
                const selected = isSelected(item.date);

                return (
                  <TouchableOpacity
                    style={[
                      styles.dayCell,
                      !item.isCurrentMonth && styles.dayCellOtherMonth,
                      selected && { backgroundColor: colors.primary, borderRadius: 20 },
                      disabled && styles.dayCellDisabled,
                    ]}
                    onPress={() => handleSelectDate(item.date)}
                    disabled={disabled}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.text },
                        !item.isCurrentMonth && { color: colors.textMuted },
                        selected && { color: colors.background, fontWeight: "600" },
                        disabled && { color: colors.textMuted },
                      ]}
                    >
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  calendar: {
    flexGrow: 0,
    flexShrink: 1,
  },
  calendarContent: {
    flexGrow: 0,
  },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  closeButton: {
    fontSize: 24,
    fontWeight: "300",
  },
  container: {
    marginBottom: 16,
  },
  dayCell: {
    alignItems: "center",
    aspectRatio: 1,
    flex: 1,
    justifyContent: "center",
    margin: 2,
    maxWidth: "14.28%",
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
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
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  modalContent: {
    borderRadius: 12,
    maxHeight: "80%",
    padding: 16,
    width: "90%",
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
  monthYear: {
    fontSize: 16,
    fontWeight: "600",
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
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
  weekDay: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    maxWidth: "14.28%",
    textAlign: "center",
  },
  weekDays: {
    flexDirection: "row",
    marginBottom: 8,
  },
});

export default DefaultDateInput;
