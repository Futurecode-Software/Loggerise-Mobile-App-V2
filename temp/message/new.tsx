/**
 * New Conversation Screen
 *
 * Screen for starting a new direct message conversation.
 * Uses shared UserSelectList component.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { FullScreenHeader } from '@/components/header';
import { Colors, Brand, Typography, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNewConversation } from '@/hooks/use-new-conversation';
import { UserSelectList } from '@/components/message';

export default function NewConversationScreen() {
  const colors = Colors.light;
  const { user } = useAuth();
  const currentUserId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id || 0;

  const {
    searchQuery,
    setSearchQuery,
    filteredUsers,
    isLoading,
    isCreating,
    error,
    handleUserSelect,
    refetch,
  } = useNewConversation({ currentUserId });

  return (
    <View style={[styles.container, { backgroundColor: '#F0F2F5' }]}>
      {/* Full Screen Header */}
      <FullScreenHeader
        title="Yeni Mesaj"
        subtitle="Mesajlaşmak istediğiniz kişiyi seçin"
        showBackButton
        rightIcons={
          <TouchableOpacity
            style={[styles.groupButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => router.push('/message/group/new' as any)}
            activeOpacity={0.7}
          >
            <Users size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Content Area */}
      <View style={styles.contentArea}>
        <UserSelectList
          users={filteredUsers}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onUserSelect={handleUserSelect}
          isLoading={isLoading}
          isCreating={isCreating}
          error={error}
          onRetry={refetch}
          isGroupMode={false}
        />

        {/* Loading Overlay */}
        {isCreating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={[styles.loadingOverlayText, { color: colors.text }]}>
              Konuşma başlatılıyor...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  groupButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlayText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
});
