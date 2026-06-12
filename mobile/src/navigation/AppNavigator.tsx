import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';

const NavContainer = NavigationContainer as any;
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../store/slices/authSlice';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';
import EditProfileScreen from '../screens/EditProfileScreen';
import { colors } from '../theme';
import { RootState, AppDispatch } from '../store';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();
const StackNavigator = Stack.Navigator as any;

const screenOptions: StackNavigationOptions = {
    headerStyle: {
        backgroundColor: colors.bg,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        shadowOpacity: 0,
        elevation: 0,
    },
    headerTintColor: colors.textStrong,
    headerTitleStyle: { fontWeight: '700' },
    cardStyle: { backgroundColor: colors.bg },
};

const AppNavigator: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { token, loading } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    if (loading) {
        return null;
    }

    const linking = {
        prefixes: ['prowise://', 'https://prowise-app.com'],
        config: {
            screens: {
                Main: {
                    screens: {
                        Home: 'home',
                        Shop: {
                            path: 'shop',
                            screens: {
                                Categories: 'categories',
                                SubCategory: 'category/:categoryId',
                                CompanyProducts: 'company-products/:companyId',
                            }
                        },
                        Scan: 'scan',
                        Notifications: 'notifications',
                        TechnicianPortal: 'technician/portal',
                        Profile: 'profile',
                    }
                },
                EditProfile: 'profile/edit',
                Search: 'search',
                QRScanner: 'scan-qr',
                ProductDetail: 'products/:id',
                TechnicianApplication: 'technician/apply',
                TechnicianPortal: 'technician/portal-full',
                ProductForm: 'products/:id/edit',
                MaintenanceHistory: 'maintenance/history',
                MaintenanceRequest: 'maintenance/request',
            }
        }
    };

    return (
        <NavContainer linking={linking}>
            <StackNavigator screenOptions={screenOptions}>
                {token ? (
                    <>
                        <CustomStackScreenGroup navigation={navigation} token={token} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen as any} options={{ headerShown: false }} />
                        <Stack.Screen name="Register" component={RegisterScreen as any} options={{ headerShown: false }} />
                        <Stack.Screen name="ForgotPassword" component={require('../screens/ForgotPasswordScreen').default} options={{ headerShown: false }} />
                    </>
                )}
            </StackNavigator>
        </NavContainer>
    );
};

// Helper component to house Stack Screens to keep JSX clean
const CustomStackScreenGroup: React.FC<{ navigation: any; token: string }> = () => {
    return (
        <>
            <Stack.Screen name="Main" component={MainTabNavigator as any} options={{ headerShown: false }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen as any} />
            <Stack.Screen 
                name="Search" 
                component={require('../screens/SearchScreen').default} 
                options={{ title: 'System Search' }} 
            />
            <Stack.Screen 
                name="QRScanner" 
                component={require('../screens/QRScannerScreen').default} 
                options={{ title: 'Scan QR Code' }} 
            />
            <Stack.Screen 
                name="ProductDetail" 
                component={require('../screens/ProductDetailScreen').default} 
            />
            <Stack.Screen 
                name="TechnicianApplication" 
                component={require('../screens/TechnicianApplicationScreen').default} 
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="TechnicianPortal" 
                component={require('../screens/TechnicianPortalScreen').default} 
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="ProductForm" 
                component={require('../screens/ProductFormScreen').default} 
            />
            <Stack.Screen 
                name="MaintenanceHistory" 
                component={require('../screens/MaintenanceHistoryScreen').default} 
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="MaintenanceRequest" 
                component={require('../screens/MaintenanceRequestScreen').default} 
                options={{ headerShown: false }}
            />
        </>
    );
};

export default AppNavigator;
