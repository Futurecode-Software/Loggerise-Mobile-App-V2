import React, { memo, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { Send } from 'lucide-react-native';
import { Colors, Brand } from '@/constants/theme';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
}

function MessageInputComponent({ value, onChangeText, onSend, isSending }: MessageInputProps) {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const canSend = value.trim() && !isSending;

  return (
    <KeyboardStickyView offset={{ closed: 0, opened: 0 }} style={styles.stickyContainer}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: '#F0F2F5',
            paddingBottom:
              Platform.OS === 'android'
                ? Math.max(insets.bottom, 16)
                : insets.bottom > 0
                  ? insets.bottom
                  : 8,
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            placeholder="Mesaj yazın..."
            placeholderTextColor="#8696A0"
            value={value}
            onChangeText={onChangeText}
            multiline
            maxLength={5000}
            textAlignVertical="center"
            blurOnSubmit={false}
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

export const MessageInput = memo(MessageInputComponent);

const styles = StyleSheet.create({
  stickyContainer: {},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
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
