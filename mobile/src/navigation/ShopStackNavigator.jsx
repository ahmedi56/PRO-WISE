import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CategoryBrowserScreen from '../screens/CategoryBrowserScreen';
import { colors } from '../theme';

const Stack = createStackNavigator();

const ShopStackNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
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
            }}
        >
            <Stack.Screen
                name="Categories"
                component={CategoryBrowserScreen}
                options={{ title: 'Shop' }}
            />
            <Stack.Screen
                name="SubCategory"
                component={CategoryBrowserScreen}
                options={({ route }) => ({ title: route.params?.categoryName || 'Category' })}
            />
        </Stack.Navigator>
    );
};

export default ShopStackNavigator;
