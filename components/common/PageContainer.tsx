/**
 * PageContainer - Status bar ile uyumlu sayfa container'ı
 *
 * Edge-to-edge modu için SafeAreaView ile wrap edilmiş
 * Tüm sayfalarda kullanılmalı
 */

import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface PageContainerProps {
  children: React.ReactNode
  style?: ViewStyle
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}

export function PageContainer({
  children,
  style,
  edges = ['top'] // Varsayılan: sadece üstte padding
}: PageContainerProps) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
