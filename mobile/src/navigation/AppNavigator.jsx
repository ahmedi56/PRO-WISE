import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../store/slices/authSlice';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';
import EditProfileScreen from '../screens/EditProfileScreen';
import { colors } from '../theme';

const Stack = createStackNavigator();

const screenOptions = {
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

const AppNavigator = () => {
    const dispatch = useDispatch();
    const { token, loading } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    if (loading) {
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={screenOptions}>
                {token ? (
                    <>
                        <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="QRScanner" component={require('../screens/QRScannerScreen').default} options={{ title: 'Scan QR Code' }} />
                        <Stack.Screen name="ProductDetail" component={require('../screens/ProductDetailScreen').default} />
                        <Stack.Screen name="ProductForm" component={require('../screens/ProductFormScreen').default} options={({ route }) => ({ title: route.params?.id ? 'Edit Product' : 'Add Product' })} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
