import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import CategoryBrowserScreen from '../screens/CategoryBrowserScreen';
import CompanyProductsScreen from '../screens/CompanyProductsScreen';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';
import { ShopStackParamList } from './types';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';

const Stack = createStackNavigator<ShopStackParamList>();

const BrandedHeader: React.FC<{ title: string; colors: any; typography: any }> = ({ title, colors, typography }) => (
    <View style={styles.headerContainer}>
        <View style={styles.headerLogo}>
            <ProWiseLogoSvg width={24} height={24} />
        </View>
        <Text style={[styles.headerTitleText, { color: colors.textStrong }]}>{title}</Text>
    </View>
);

const ShopStackNavigator: React.FC = () => {
    const { colors, typography, spacing } = useTheme();

    const screenOptions: StackNavigationOptions = {
        headerStyle: {
            backgroundColor: colors.bg,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
            shadowOpacity: 0,
            elevation: 0,
            height: 72,
        },
        headerTitle: ({ children }) => <BrandedHeader title={children as string} colors={colors} typography={typography} />,
        headerTitleAlign: 'left',
        headerTintColor: colors.textStrong,
        headerLeftContainerStyle: {
            paddingLeft: 0,
        },
        headerTitleContainerStyle: {
            marginLeft: 0,
        },
        cardStyle: { backgroundColor: colors.bg },
        headerBackTitleVisible: false,
    };

    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
                name="Categories"
                component={CategoryBrowserScreen as any}
                options={{ title: 'Registry' }}
            />
            <Stack.Screen
                name="SubCategory"
                component={CategoryBrowserScreen as any}
                options={({ route }) => ({ title: route.params?.categoryName || 'Category' })}
            />
            <Stack.Screen
                name="CompanyProducts"
                component={CompanyProductsScreen as any}
                options={({ route }) => ({ title: route.params?.companyName || 'Products' })}
            />
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 12,
    },
    headerLogo: {
        marginRight: 12,
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: '700',
    },
});

export default ShopStackNavigator;
