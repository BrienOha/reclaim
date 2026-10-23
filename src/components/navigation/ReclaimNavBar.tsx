import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useThemeStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

export interface NavItem {
  id: string;
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', route: '/', icon: 'flash', color: '#FFE600' },
  { id: 'hobbies', label: 'Hobbies', route: '/hobbies', icon: 'color-palette', color: '#FF7A00' },
  { id: 'todos', label: 'To-Do', route: '/todos', icon: 'checkbox', color: '#38B6FF' },
  { id: 'journal', label: 'Journal', route: '/journal', icon: 'book', color: '#B388FF' },
  { id: 'finance', label: 'Finance', route: '/finance', icon: 'wallet', color: '#00E599' },
  { id: 'goals', label: 'Goals', route: '/goals', icon: 'trophy', color: '#FF5388' },
];

export const ReclaimNavBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { colors, isDark, toggleTheme } = useThemeStore();
  const { currency } = useCurrencyStore();

  const isDesktop = width >= 840;

  const handleNav = (route: string) => {
    triggerHaptic('light');
    router.replace(route as any);
  };

  const handleUrgeClick = () => {
    triggerHaptic('heavy');
    router.push('/urge' as any);
  };

  const handleSettingsClick = () => {
    triggerHaptic('light');
    router.push('/settings' as any);
  };

  // DESKTOP / WEB SIDEBAR
  if (isDesktop) {
    return (
      <View
        style={[
          styles.desktopSidebar,
          {
            backgroundColor: colors.cardBg,
            borderRightColor: colors.border,
            borderRightWidth: NeoBorders.chunky,
          },
        ]}
      >
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: colors.electricYellow,
                borderColor: colors.border,
                borderWidth: NeoBorders.default,
              },
              NeoShadows.sm,
            ]}
          >
            <Ionicons name="shield-checkmark" size={24} color="#000000" />
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>RECLAIM</Text>
            <Text style={[styles.brandSubtitle, { color: colors.muted }]}>
              HABIT & CREATION
            </Text>
          </View>
        </View>

        {/* Big Urge Panic Button */}
        <Pressable
          onPress={handleUrgeClick}
          style={({ pressed }) => [
            styles.sidebarUrgeBtn,
            {
              backgroundColor: colors.hotPink,
              borderColor: colors.border,
              borderWidth: NeoBorders.default,
              borderRadius: NeoRadii.md,
              transform: pressed ? [{ scale: 0.98 }] : [{ rotate: '-0.5deg' }],
            },
            NeoShadows.md,
          ]}
        >
          <Ionicons name="flame" size={20} color="#000000" />
          <Text style={styles.sidebarUrgeText}>{"I'M CRAVING (URGE)"}</Text>
        </Pressable>

        {/* Navigation Links */}
        <View style={styles.linksContainer}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.route === '/' ? pathname === '/' : pathname.startsWith(item.route);

            return (
              <Pressable
                key={item.id}
                onPress={() => handleNav(item.route)}
                style={({ pressed }) => [
                  styles.desktopNavItem,
                  {
                    backgroundColor: isActive ? item.color : 'transparent',
                    borderColor: isActive ? colors.border : 'transparent',
                    borderWidth: NeoBorders.default,
                    borderRadius: NeoRadii.md,
                    transform: pressed ? [{ scale: 0.97 }] : [],
                  },
                  isActive && NeoShadows.sm,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isActive ? '#000000' : colors.text}
                />
                <Text
                  style={[
                    styles.desktopNavLabel,
                    {
                      color: isActive ? '#000000' : colors.text,
                      fontWeight: isActive ? '900' : '700',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Bottom Bar Settings & Utilities */}
        <View
          style={[
            styles.desktopBottomBar,
            {
              borderTopColor: colors.border,
              borderTopWidth: NeoBorders.hairline * 1.5,
            },
          ]}
        >
          {/* Theme Toggle */}
          <Pressable
            onPress={toggleTheme}
            style={[
              styles.utilBtn,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                borderWidth: NeoBorders.hairline * 1.5,
                borderRadius: NeoRadii.sm,
              },
            ]}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={16}
              color={colors.text}
            />
            <Text style={[styles.utilText, { color: colors.text }]}>
              {isDark ? 'LIGHT' : 'DARK'}
            </Text>
          </Pressable>

          {/* Settings */}
          <Pressable
            onPress={handleSettingsClick}
            style={[
              styles.utilBtn,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                borderWidth: NeoBorders.hairline * 1.5,
                borderRadius: NeoRadii.sm,
              },
            ]}
          >
            <Ionicons name="settings-sharp" size={16} color={colors.text} />
            <Text style={[styles.utilText, { color: colors.text }]}>
              {currency.code} • SETTINGS
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // MOBILE BOTTOM TAB BAR
  return (
    <View
      style={[
        styles.mobileBottomBar,
        {
          backgroundColor: colors.cardBg,
          borderTopColor: colors.border,
          borderTopWidth: NeoBorders.chunky,
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.route === '/' ? pathname === '/' : pathname.startsWith(item.route);

        return (
          <Pressable
            key={item.id}
            onPress={() => handleNav(item.route)}
            style={({ pressed }) => [
              styles.mobileTabItem,
              {
                backgroundColor: isActive ? item.color : 'transparent',
                borderColor: isActive ? colors.border : 'transparent',
                borderWidth: isActive ? 2.5 : 0,
                borderRadius: NeoRadii.sm,
                transform: pressed ? [{ scale: 0.9 }] : [],
              },
              isActive && NeoShadows.sm,
            ]}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={isActive ? '#000000' : colors.text}
            />
            <Text
              style={[
                styles.mobileTabLabel,
                {
                  color: isActive ? '#000000' : colors.text,
                  fontWeight: isActive ? '900' : '700',
                },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}

      {/* Mobile Floating Urge Trigger */}
      <Pressable
        onPress={handleUrgeClick}
        style={({ pressed }) => [
          styles.mobileUrgeFab,
          {
            backgroundColor: colors.hotPink,
            borderColor: colors.border,
            borderWidth: NeoBorders.default,
            transform: pressed ? [{ scale: 0.92 }] : [{ translateY: -14 }],
          },
          NeoShadows.md,
        ]}
      >
        <Ionicons name="flame" size={24} color="#000000" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  // Desktop
  desktopSidebar: {
    width: 250,
    flexShrink: 0,
    height: '100%',
    padding: 20,
    justifyContent: 'space-between',
    zIndex: 50,
  },
  brandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000000',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sidebarUrgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 24,
    shadowColor: '#000000',
  },
  sidebarUrgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.2,
  },
  linksContainer: {
    flex: 1,
    gap: 6,
  },
  desktopNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000000',
  },
  desktopNavLabel: {
    fontSize: 14,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  desktopBottomBar: {
    paddingTop: 16,
    gap: 10,
  },
  utilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  utilText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // Mobile
  mobileBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 6,
    zIndex: 100,
  },
  mobileTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginHorizontal: 2,
    shadowColor: '#000000',
  },
  mobileTabLabel: {
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  mobileUrgeFab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    marginHorizontal: 4,
  },
});
