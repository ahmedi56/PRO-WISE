import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import CategoryBrowserScreen from '../screens/CategoryBrowserScreen';
import CompanyProductsScreen from '../screens/CompanyProductsScreen';
import { View, StyleSheet, Text } from 'react-native';
import { colors, typography, spacing } from '../theme';
import { ShopStackParamList } from './types';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';

const Stack = createStackNavigator<ShopStackParamList>();
const StackNavigator = Stack.Navigator as any;

const BrandedHeader: React.FC<{ title: string }> = ({ title }) => (
    <View style={styles.headerContainer}>
        <View style={styles.headerLogo}>
            <ProWiseLogoSvg width={24} height={24} />
        </View>
        <Text style={styles.headerTitleText}>{title}</Text>
    </View>
);

const screenOptions: StackNavigationOptions = {
    headerStyle: {
        backgroundColor: colors.bg,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        shadowOpacity: 0,
        elevation: 0,
        height: 72,
    },
    headerTitle: ({ children }) => <BrandedHeader title={children as string} />,
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

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: spacing.sm,
    },
    headerLogo: {
        marginRight: spacing.sm,
    },
    headerTitleText: {
        ...typography.h3,
        color: colors.textStrong,
        fontWeight: '700',
    },
});

const ShopStackNavigator: React.FC = () => {
    return (
        <StackNavigator screenOptions={screenOptions}>
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
            <Stack.Screen
                name="CompanyProducts"
                component={CompanyProductsScreen as any}
                options={({ route }) => ({ title: route.params?.companyName || 'Products' })}
            />
        </StackNavigator>
    );
};

export default ShopStackNavigator;
