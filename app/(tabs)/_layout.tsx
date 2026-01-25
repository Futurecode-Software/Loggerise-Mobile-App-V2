import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  LayoutDashboard,
  Users,
  Truck,
  Menu,
  MessageCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

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
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Brand.primary, // Kurumsal yeşil - aktif tab
          tabBarInactiveTintColor: colors.tabIconDefault, // Gri - pasif tab
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 64 + Math.max(insets.bottom, 8),
            paddingBottom: Platform.OS === 'ios' ? 28 : Math.max(insets.bottom, 8),
            paddingTop: 8,
            position: 'relative',
            elevation: 0,
            shadowOpacity: 0,
            overflow: 'hidden', // FAB butonunun tab bar dışına taşan kısmını kırp
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
              color={focused ? Brand.primary : color}
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
            <Truck 
              size={24} 
              color={focused ? Brand.primary : color} 
              strokeWidth={focused ? 2.5 : 2} 
            />
          ),
          tabBarItemStyle: {
            paddingRight: 40, // Mesajlaşma butonundan uzaklaştırmak için sağa padding
          },
        }}
      />
      {/* 3. Mesajlar - Gizli tab (FAB butonu olarak gösterilecek) */}
      <Tabs.Screen
        name="messages"
        options={{
          href: null, // Tab bar'dan gizle
        }}
      />
      {/* 4. Müşteriler */}
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Müşteriler',
          tabBarIcon: ({ color, focused }) => (
            <Users 
              size={24} 
              color={focused ? Brand.primary : color} 
              strokeWidth={focused ? 2.5 : 2} 
            />
          ),
          tabBarItemStyle: {
            paddingLeft: 40, // Mesajlaşma butonundan uzaklaştırmak için sola padding
          },
        }}
      />
      {/* 5. Daha Fazla */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'Daha Fazla',
          tabBarIcon: ({ color, focused }) => (
            <Menu 
              size={24} 
              color={focused ? Brand.primary : color} 
              strokeWidth={focused ? 2.5 : 2} 
            />
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
      {/* Merkezi Mesajlar FAB Butonu - Tab bar'ın içine kesilmiş şekilde */}
      <MessagesFloatingButton unreadCount={unreadCount} insets={insets} />
    </View>
  );
}

// Merkezi Mesajlar FAB butonu - Tab bar'ın içine kesilmiş şekilde (görseldeki gibi)
function MessagesFloatingButton({ unreadCount, insets }: { unreadCount: number; insets: any }) {
  // Mesajlar sayfasına yönlendirme
  const handlePress = () => {
    router.push('/(tabs)/messages');
  };

  // Tab bar yüksekliği hesaplama - FAB butonu tab bar'ın içine kesilmiş görünecek
  const tabBarPaddingBottom = Platform.OS === 'ios' ? 28 : Math.max(insets.bottom, 8);
  const tabBarContentHeight = 40; // Icon + label + padding
  
  // FAB butonu daha yukarıda olacak - tab bar'ın üstüne daha fazla taşacak
  // Buton 72px yüksekliğinde (dış container), tab bar içeriği yaklaşık 40px
  // Butonun yarısı tab bar içinde, yarısı dışında olacak şekilde konumlandırıyoruz
  const fabBottom = tabBarPaddingBottom + 20; // Daha yukarıda - tab bar'ın üstüne daha fazla taşacak
  
  return (
    <TouchableOpacity
      style={[
        styles.messagesFab,
        {
          bottom: fabBottom,
        },
      ]}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      {/* Dairesel arka plan - iki katmanlı yapı ile inner shadow efekti */}
      <View style={styles.messagesFabContainer}>
        <View style={styles.messagesFabCircle}>
          <View style={styles.messagesFabInnerCircle}>
            <MessageCircle 
              size={24} 
              color={Brand.primary} 
              strokeWidth={2.5} 
            />
            {unreadCount > 0 && (
              <View style={styles.messageBadge}>
                <Text style={styles.messageBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Brand.primary, // Kurumsal yeşil
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  messageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messagesFab: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  messagesFabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesFabCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    // Inner shadow efekti için - React Native'de inset shadow yok, bu yüzden shadow ile yakın efekt oluşturuyoruz
    // Inner shadow: inset 2px 2px 5px rgba(0,0,0,0.1) benzeri görünüm için
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.5,
    elevation: 0, // Android'de inner shadow için elevation kullanmıyoruz
    // İç daire için container
    padding: 8, // (72 - 56) / 2 = 8
  },
  messagesFabInnerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Outer shadow: 0px 2px 8px rgba(0,0,0,0.08)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
