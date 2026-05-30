import React, { Suspense, lazy } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';
import { ProductDetailParamList } from './types';
import { ProductProvider, useProduct } from '../context/ProductContext';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { Ionicons } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator<ProductDetailParamList>();

// Lazy-loaded domain screens
const ProductOverviewScreen = lazy(() => import('../screens/product/ProductOverviewScreen'));
const ProductSpecsScreen = lazy(() => import('../screens/product/ProductSpecsScreen'));
const ProductGuidesScreen = lazy(() => import('../screens/product/ProductGuidesScreen'));
const ProductMediaScreen = lazy(() => import('../screens/product/ProductMediaScreen'));
const ProductComponentsScreen = lazy(() => import('../screens/product/ProductComponentsScreen'));

const LoadingFallback = () => (
    <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
    </View>
);

const LazyScreen = (Component: any) => (props: any) => (
    <Suspense fallback={<LoadingFallback />}>
        <Component {...props} />
    </Suspense>
);

interface ProductDetailNavigatorProps {
    route: RouteProp<RootStackParamList, 'ProductDetail'>;
}

const ProductDetailNavigator: React.FC<ProductDetailNavigatorProps> = ({ route }) => {
    const { id, product } = route.params;

    return (
        <ProductProvider initialData={product as any}>
            <NavigatorInner id={id} />
        </ProductProvider>
    );
};

const NavigatorInner: React.FC<{ id: string }> = ({ id }) => {
    const navigation = useNavigation();
    const { product, fetchProduct } = useProduct();

    React.useEffect(() => {
        fetchProduct(id);
    }, [id, fetchProduct]);

    React.useEffect(() => {
        if (product?.name) {
            navigation.setOptions({ 
                title: product.name.toUpperCase(),
                headerTitleStyle: {
                    fontSize: 14,
                    fontWeight: '900',
                    letterSpacing: 1,
                    color: colors.textStrong
                },
                headerStyle: {
                    backgroundColor: colors.bg,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.05)'
                }
            });
        }
    }, [product?.name, navigation]);

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: { 
                    fontSize: 10, 
                    fontWeight: '900',
                    textTransform: 'uppercase',
                },
                tabBarStyle: { 
                    backgroundColor: colors.bg,
                },
            }}
        >
            <Tab.Screen 
                name="Overview" 
                component={LazyScreen(ProductOverviewScreen)} 
                initialParams={{ id }}
                options={{ tabBarLabel: 'MANIFEST' }}
            />
            <Tab.Screen 
                name="Specs" 
                component={LazyScreen(ProductSpecsScreen)} 
                initialParams={{ id }}
                options={{ tabBarLabel: 'SPECS' }}
            />
            <Tab.Screen 
                name="Guides" 
                component={LazyScreen(ProductGuidesScreen)} 
                initialParams={{ id }}
                options={{ tabBarLabel: 'PROTOCOLS' }}
            />
            <Tab.Screen 
                name="Media" 
                component={LazyScreen(ProductMediaScreen)} 
                initialParams={{ id }}
                options={{ tabBarLabel: 'ARCHIVE' }}
            />
            <Tab.Screen 
                name="Components" 
                component={LazyScreen(ProductComponentsScreen)} 
                initialParams={{ id }}
                options={{ tabBarLabel: 'NODES' }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg,
    }
});

export default ProductDetailNavigator;
