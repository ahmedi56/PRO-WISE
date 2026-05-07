import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
    Main: undefined;
    Login: undefined;
    Register: undefined;
    EditProfile: undefined;
    QRScanner: undefined;
    ProductDetail: { id: string; product?: import('../types/product').Product };
    PendingApproval: undefined;
    TechnicianApplication: undefined;
    TechnicianPortal: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Shop: undefined;
    Scan: undefined;
    Profile: undefined;
};

export type ShopStackParamList = {
    Categories: undefined;
    SubCategory: { categoryId: string; categoryName: string };
    CompanyProducts: { companyId: string; companyName: string };
};

// Helper types for navigation and route props
export type RootStackNavigationProp<T extends keyof RootStackParamList> = 
    StackNavigationProp<RootStackParamList, T>;

export type RootStackRouteProp<T extends keyof RootStackParamList> = 
    RouteProp<RootStackParamList, T>;

export type MainTabNavigationProp<T extends keyof MainTabParamList> = 
    CompositeNavigationProp<
        BottomTabNavigationProp<MainTabParamList, T>,
        StackNavigationProp<RootStackParamList>
    >;
