/**
 * MessageInput Component
 *
 * Modern mesaj giriş alanı - CLAUDE.md tasarım standartlarına uygun
 * Dashboard theme renkleri ve geliştirilmiş UX
 */

import React, { memo, useRef, useState, useMemo } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
  Text
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'

interface MessageInputProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  isSending: boolean
}

// Basit kelime önerileri (gerçek uygulamada backend'den gelebilir)
function generateSuggestions(text: string): string[] {
  if (!text || text.length < 2) return []

  const word = text.toLowerCase().trim()
  const suggestions: string[] = []

  // Basit örnek öneriler
  if (word.includes('şirket')) {
    suggestions.push('Şirket', 'Şirkette', 'Şirketlerin')
  } else if (word.includes('müşteri')) {
    suggestions.push('Müşteri', 'Müşteriler', 'Müşteriye')
  } else if (word.includes('fatura')) {
    suggestions.push('Fatura', 'Faturalar', 'Faturayı')
  } else if (word.includes('yük')) {
    suggestions.push('Yük', 'Yükler', 'Yüke')
  }

  return suggestions.slice(0, 3)
}

function MessageInputComponent({ value, onChangeText, onSend, isSending }: MessageInputProps) {
  const insets = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState(false)

  const canSend = value.trim() && !isSending
  const suggestions = useMemo(() => generateSuggestions(value), [value])
  const showSuggestions = isFocused && suggestions.length > 0

  const handleSuggestionPress = (suggestion: string) => {
    onChangeText(suggestion)
    inputRef.current?.focus()
  }

  return (
    <KeyboardStickyView
      offset={{ closed: 0, opened: 0 }}
      style={styles.stickyContainer}
    >
      {/* Klavye Üstü Öneri Çubuğu */}
      {showSuggestions && (
        <View style={styles.suggestionBar}>
          <TouchableOpacity style={styles.suggestionBarButton}>
            <Ionicons name="grid-outline" size={18} color={DashboardColors.textMuted} />
          </TouchableOpacity>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.suggestionBarButton}>
            <Ionicons name="mic-outline" size={18} color={DashboardColors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          { paddingBottom: Math.max(insets.bottom, DashboardSpacing.sm) }
        ]}
      >
        <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Mesaj yazın..."
            placeholderTextColor={DashboardColors.textMuted}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline
            maxLength={5000}
            textAlignVertical="center"
            blurOnSubmit={false}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity
          onPress={onSend}
          disabled={!canSend}
          activeOpacity={0.7}
          style={styles.sendButtonContainer}
        >
          {canSend ? (
            <LinearGradient
              colors={[DashboardColors.primary, DashboardColors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButton}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" style={styles.sendIcon} />
              )}
            </LinearGradient>
          ) : (
            <View style={styles.sendButtonInactive}>
              <Ionicons name="send" size={18} color={DashboardColors.textMuted} style={styles.sendIcon} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardStickyView>
  )
}

export const MessageInput = memo(MessageInputComponent)

const styles = StyleSheet.create({
  stickyContainer: {
    backgroundColor: DashboardColors.background
  },
  suggestionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.sm,
    paddingTop: DashboardSpacing.xs,
    paddingBottom: DashboardSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight,
    gap: DashboardSpacing.xs
  },
  suggestionBarButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: DashboardColors.surface
  },
  suggestionsScroll: {
    flex: 1,
    gap: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.xs
  },
  suggestionChip: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.surface,
    marginRight: DashboardSpacing.xs,
    ...DashboardShadows.sm
  },
  suggestionText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: DashboardSpacing.md,
    paddingTop: DashboardSpacing.sm,
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.background
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius['2xl'],
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: Platform.OS === 'ios' ? DashboardSpacing.sm : DashboardSpacing.xs,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    ...DashboardShadows.sm
  },
  inputWrapperFocused: {
    borderColor: DashboardColors.primary,
    borderWidth: 1.5
  },
  input: {
    fontSize: DashboardFontSizes.base,
    lineHeight: 22,
    minHeight: 24,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
    color: DashboardColors.textPrimary
  },
  sendButtonContainer: {
    marginBottom: Platform.OS === 'ios' ? 2 : 4
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...DashboardShadows.glow
  },
  sendButtonInactive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DashboardColors.borderLight
  },
  sendIcon: {
    marginLeft: 2
  }
})
