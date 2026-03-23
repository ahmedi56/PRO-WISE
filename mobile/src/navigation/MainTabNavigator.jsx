import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShopStackNavigator from './ShopStackNavigator';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const ICONS = {
    Home: 'home-outline',
    Shop: 'grid-outline',
    Profile: 'person-outline',
};

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarStyle: {
                    backgroundColor: colors.glass,
                    borderTopColor: colors.glassBorder,
                    borderTopWidth: 1,
                    paddingBottom: 6,
                    paddingTop: 6,
                    height: 60,
                    position: 'absolute',
                    elevation: 0,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                tabBarIcon: ({ color, size }) => {
                    const iconName = ICONS[route.name] || 'square-outline';
                    return <Ionicons name={iconName} size={size + 2} color={color} />;
                },
                headerStyle: {
                    backgroundColor: colors.bg,
                    borderBottomColor: colors.border,
                    borderBottomWidth: 1,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                headerTitleStyle: {
                    fontWeight: '700',
                    color: colors.textStrong,
                },
                headerTintColor: colors.textStrong,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Shop" component={ShopStackNavigator} options={{ headerShown: false }} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
