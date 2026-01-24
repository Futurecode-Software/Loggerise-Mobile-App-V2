import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Brand } from '@/constants/theme';

interface DateInputProps {
  label?: string;
  value: string; // YYYY-MM-DD format
  onChangeDate?: (date: string) => void;
  onChangeText?: (date: string) => void; // Backward compatibility
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  minimumDate?: string; // YYYY-MM-DD format
  maximumDate?: string; // YYYY-MM-DD format
}

export function DateInput({
  label,
  value,
  onChangeDate,
  onChangeText,
  error,
  placeholder = 'Tarih seçiniz',
  disabled = false,
  required = false,
  minimumDate,
  maximumDate,
}: DateInputProps) {
  const colors = Colors.light;
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(
    value ? new Date(value) : new Date()
  );

  // Handle date change from picker
  const onChange = (event: any, selectedDate?: Date) => {
    // On Android, picker auto-closes after selection
    if (Platform.OS === 'android') {
      setShow(false);
    }

    // If user cancelled (event.type === 'dismissed'), don't update
    if (event.type === 'dismissed') {
      setShow(false);
      return;
    }

    if (selectedDate) {
      setTempDate(selectedDate);

      // Format to YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split('T')[0];

      // Call the appropriate callback (prefer onChangeDate)
      if (onChangeDate) {
        onChangeDate(formattedDate);
      } else if (onChangeText) {
        onChangeText(formattedDate);
      }

      // On iOS, user needs to confirm, so keep picker open
      // On Android, picker auto-closes
      if (Platform.OS === 'android') {
        setShow(false);
      }
    }
  };

  // Show picker
  const showDatepicker = () => {
    if (!disabled) {
      setShow(true);
    }
  };

  // Format display value
  const displayValue = value ? formatDateForDisplay(value) : '';

  // Parse min/max dates
  const minDate = minimumDate ? new Date(minimumDate) : new Date(1900, 0, 1);
  const maxDate = maximumDate ? new Date(maximumDate) : new Date(2100, 11, 31);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background,
            borderColor: error ? '#DC2626' : colors.border,
          },
          disabled && styles.disabled,
        ]}
        onPress={showDatepicker}
        disabled={disabled}
      >
        <Text
          style={[
            styles.inputText,
            {
              color: displayValue ? colors.text : colors.textMuted,
            },
          ]}
        >
          {displayValue || placeholder}
        </Text>
        <Calendar
          size={20}
          color={disabled ? colors.textMuted : Brand.primary}
        />
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>
      )}

      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={tempDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}
    </View>
  );
}

// Format date for display (DD/MM/YYYY - Turkish format)
function formatDateForDisplay(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return dateString; // Return original if parsing fails
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodyMD,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  inputText: {
    ...Typography.bodyMD,
    flex: 1,
  },
  errorText: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
