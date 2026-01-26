import React, { memo, useRef, useState, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { Send, Grid3x3, Mic } from 'lucide-react-native';
import { Colors, Brand, Typography, Spacing } from '@/constants/theme';

interface LoggyInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// Basit kelime önerileri (gerçek uygulamada backend'den gelebilir)
function generateSuggestions(text: string): string[] {
  if (!text || text.length < 2) return [];
  
  const word = text.toLowerCase().trim();
  const suggestions: string[] = [];
  
  // Loggy AI için özel öneriler
  if (word.includes('yük') || word.includes('yuk')) {
    suggestions.push('Yük oluştur', 'Yük ara', 'Yük listesi');
  } else if (word.includes('cari') || word.includes('müşteri')) {
    suggestions.push('Cari ara', 'Müşteri ekle', 'Cari bakiye');
  } else if (word.includes('fatura')) {
    suggestions.push('Fatura ara', 'Fatura kes', 'Fatura bakiye');
  } else if (word.includes('stok')) {
    suggestions.push('Stok durumu', 'Stok hareketleri', 'Stok transferi');
  } else if (word.includes('araç') || word.includes('arac')) {
    suggestions.push('Araç ara', 'Araç ekle', 'Araç durumu');
  }
  
  return suggestions.slice(0, 3);
}

function LoggyInputComponent({ 
  value, 
  onChangeText, 
  onSend, 
  isSending,
  disabled = false,
  placeholder = 'Mesaj yazın...',
}: LoggyInputProps) {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const canSend = value.trim() && !isSending && !disabled;
  const suggestions = useMemo(() => generateSuggestions(value), [value]);
  const showSuggestions = isFocused && suggestions.length > 0 && !disabled;

  const handleSuggestionPress = (suggestion: string) => {
    if (disabled) return;
    onChangeText(suggestion);
    inputRef.current?.focus();
  };

  return (
    <KeyboardStickyView 
      offset={{ closed: 0, opened: 0 }}
      style={styles.stickyContainer}
    >
      {/* Klavye Üstü Öneri Çubuğu */}
      {showSuggestions && (
        <View style={[styles.suggestionBar, { backgroundColor: '#F0F2F5' }]}>
          <TouchableOpacity style={styles.suggestionBarButton} disabled={disabled}>
            <Grid3x3 size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestionChip, { backgroundColor: colors.surface }]}
                onPress={() => handleSuggestionPress(suggestion)}
                disabled={disabled}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.suggestionBarButton} disabled={disabled}>
            <Mic size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: '#FFFFFF',
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor="#8696A0"
            value={value}
            onChangeText={onChangeText}
            onFocus={() => !disabled && setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline
            maxLength={5000}
            textAlignVertical="center"
            blurOnSubmit={false}
            editable={!disabled}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, canSend ? styles.sendButtonActive : styles.sendButtonInactive]}
          onPress={onSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardStickyView>
  );
}

export const LoggyInput = memo(LoggyInputComponent);

const styles = StyleSheet.create({
  stickyContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 0,
  },
  suggestionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    paddingBottom: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: Spacing.xs,
    marginBottom: 0,
  },
  suggestionBarButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsScroll: {
    flex: 1,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  suggestionText: {
    ...Typography.bodySM,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 0,
    gap: 8,
    marginBottom: 0,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
    minHeight: 24,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: Brand.primary,
  },
  sendButtonInactive: {
    backgroundColor: '#B8C4CE',
  },
});
