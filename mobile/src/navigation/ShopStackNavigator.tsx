import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import CategoryBrowserScreen from '../screens/CategoryBrowserScreen';
import { colors } from '../theme';
import { ShopStackParamList } from './types';

const Stack = createStackNavigator<ShopStackParamList>();

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
    headerBackTitleVisible: false,
};

const ShopStackNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
                name="Categories"
                component={CategoryBrowserScreen as any}
                options={{ title: 'Shop' }}
            />
            <Stack.Screen
                name="SubCategory"
                component={CategoryBrowserScreen as any}
                options={({ route }) => ({ title: route.params?.categoryName || 'Category' })}
            />
        </Stack.Navigator>
    );
};

export default ShopStackNavigator;
