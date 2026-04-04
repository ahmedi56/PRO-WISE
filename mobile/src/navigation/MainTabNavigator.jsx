import React, { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withRepeat, 
    withSequence, 
    withTiming,
    interpolateColor
} from 'react-native-reanimated';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShopStackNavigator from './ShopStackNavigator';
import { colors, shadows } from '../theme';

const Tab = createBottomTabNavigator();

const ICONS = {
    Home: 'home-outline',
    Shop: 'grid-outline',
    Scan: 'qr-code-outline',
    Profile: 'person-outline',
};

// --- Animated Icon Component for Standard Tabs ---
const AnimatedTabIcon = ({ name, focused, color, size }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.2 : 1, {
            damping: 12,
            stiffness: 100,
        });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Ionicons name={name} size={size + 2} color={color} />
        </Animated.View>
    );
};

// --- Animated Scan Button for the QR Scanner Tab ---
const AnimatedScanButton = ({ focused, size }) => {
    const scale = useSharedValue(1);
    const pulse = useSharedValue(1);

    useEffect(() => {
        // Pulse animation to draw eye to the main feature
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    useEffect(() => {
        // Immediate reaction to focus
        scale.value = withSpring(focused ? 1.15 : 1, {
            damping: 15,
            stiffness: 150,
        });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value * (focused ? 1 : pulse.value) }
        ],
        shadowOpacity: focused ? 0.4 : 0.2,
    }));

    return (
        <Animated.View style={[
            styles.scanButtonContainer,
            { width: size + 24, height: size + 24, borderRadius: (size + 24) / 2 },
            animatedStyle
        ]}>
            <Ionicons name="qr-code-outline" size={size + 4} color="white" />
        </Animated.View>
    );
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
                tabBarIcon: ({ focused, color, size }) => {
                    const iconName = ICONS[route.name] || 'square-outline';
                    
                    if (route.name === 'Scan') {
                        return <AnimatedScanButton focused={focused} size={size} />;
                    }

                    return (
                        <AnimatedTabIcon 
                            name={iconName} 
                            focused={focused} 
                            color={color} 
                            size={size} 
                        />
                    );
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
            <Tab.Screen 
                name="Scan" 
                component={require('../screens/QRScannerScreen').default} 
                options={{ 
                    title: 'Scan',
                    tabBarLabel: () => null // Hide label for the central Scan button
                }} 
            />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    scanButtonContainer: {
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        ...shadows.glow,
    }
});

export default MainTabNavigator;
