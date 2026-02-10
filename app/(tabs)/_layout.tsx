/**
 * Tab Layout with Custom Tab Bar
 *
 * Premium bottom navigation with floating message FAB
 */

import React from 'react'
import { Tabs, useRouter } from 'expo-router'
import { CustomTabBar } from '@/components/navigation'
import { DashboardColors } from '@/constants/dashboard-theme'
import { useMessageContext } from '@/context/message-context'

export default function TabLayout() {
  const router = useRouter()
  const { unreadCount: messageCount } = useMessageContext()

  const handleMessagePress = () => {
    router.navigate('/(tabs)/messages')
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none', // Hide default tab bar
        },
        sceneContainerStyle: {
          backgroundColor: DashboardColors.background
        }
      }}
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          messageCount={messageCount}
          onMessagePress={handleMessagePress}
        />
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
        }}
      />
      <Tabs.Screen
        name="loads"
        options={{
          title: 'Yükler',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          // Hidden from tab bar, accessed via FAB
          href: null,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Cariler',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Daha Fazla',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          // Hidden from tab bar
          href: null,
        }}
      />
      <Tabs.Screen
        name="positions"
        options={{
          href: null,
        }}
      />
    </Tabs>
  )
}
