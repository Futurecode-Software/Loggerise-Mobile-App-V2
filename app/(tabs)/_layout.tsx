import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import {
  LayoutDashboard,
  Users,
  Truck,
  Menu,
  MapPin,
  MessageCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Colors, Brand } from '@/constants/theme';
import { useMessageContext } from '@/context/message-context';
// useColorScheme kaldirildi - her zaman light mode kullanilir

export default function TabLayout() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const { unreadCount } = useMessageContext();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64 + Math.max(insets.bottom, 8),
          paddingBottom: Platform.OS === 'ios' ? 28 : Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      {/* 1. Ana Sayfa */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard
              size={24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      {/* 2. Yükler */}
      <Tabs.Screen
        name="loads"
        options={{
          title: 'Yükler',
          tabBarIcon: ({ color, focused }) => (
            <Truck size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* 3. Mesajlar (YENİ - ortada) */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <MessageCircle size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              {unreadCount > 0 && (
                <View style={styles.messageBadge}>
                  <Text style={styles.messageBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      {/* 4. Müşteriler */}
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Müşteriler',
          tabBarIcon: ({ color, focused }) => (
            <Users size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* 5. Daha Fazla */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'Daha Fazla',
          tabBarIcon: ({ color, focused }) => (
            <Menu size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* Pozisyonlar - Tab'dan kaldırıldı (More menüsüne taşındı) */}
      <Tabs.Screen
        name="positions"
        options={{
          href: null,
        }}
      />
      {/* Profile - Gizli tab */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  messageBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  messageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
