/**
 * QuickSuggestions Component
 *
 * Categorized quick action suggestions for Loggy AI.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { suggestionCategories, SuggestionCategory } from './constants';

interface QuickSuggestionsProps {
  onSuggestionClick: (prompt: string) => void;
  isLoading: boolean;
  isAiConfigured: boolean;
}

export function QuickSuggestions({
  onSuggestionClick,
  isLoading,
  isAiConfigured,
}: QuickSuggestionsProps) {
  const colors = Colors.light;
  const [activeCategory, setActiveCategory] = useState(suggestionCategories[0].id);

  const activeCategoryData = suggestionCategories.find((cat) => cat.id === activeCategory);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Yapabileceklerim:</Text>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {suggestionCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryTab,
                {
                  backgroundColor: isActive ? Brand.primary + '15' : colors.surface,
                  borderColor: isActive ? Brand.primary : colors.border,
                },
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Icon size={14} color={isActive ? Brand.primary : colors.textMuted} />
              <Text
                style={[
                  styles.categoryTabText,
                  { color: isActive ? Brand.primary : colors.textMuted },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Suggestions List */}
      <View style={styles.suggestionsList}>
        {activeCategoryData?.suggestions.map((suggestion, idx) => {
          const Icon = activeCategoryData.icon;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.suggestionCard,
                { backgroundColor: colors.card, ...Shadows.sm },
              ]}
              onPress={() => onSuggestionClick(suggestion.prompt)}
              disabled={isLoading || !isAiConfigured}
            >
              <View
                style={[
                  styles.suggestionIcon,
                  {
                    backgroundColor: activeCategoryData.color + '15',
                  },
                ]}
              >
                <Icon size={18} color={activeCategoryData.color} />
              </View>
              <View style={styles.suggestionContent}>
                <Text style={[styles.suggestionTitle, { color: colors.text }]}>
                  {suggestion.title}
                </Text>
                <Text style={[styles.suggestionDescription, { color: colors.textMuted }]}>
                  {suggestion.description}
                </Text>
                <Text
                  style={[styles.suggestionPrompt, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  &quot;{suggestion.prompt}&quot;
                </Text>
              </View>
              <ArrowRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    ...Typography.headingSM,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  categoryTabs: {
    marginBottom: Spacing.md,
  },
  categoryTabsContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryTabText: {
    ...Typography.bodyXS,
    fontWeight: '500',
  },
  suggestionsList: {
    gap: Spacing.md,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionDescription: {
    ...Typography.bodyXS,
    marginBottom: 4,
  },
  suggestionPrompt: {
    ...Typography.bodyXS,
    fontStyle: 'italic',
  },
});
