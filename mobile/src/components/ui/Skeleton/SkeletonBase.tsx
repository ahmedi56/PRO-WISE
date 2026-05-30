import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { glass } from '../../../theme';

interface SkeletonBaseProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: any;
}

const SkeletonBase: React.FC<SkeletonBaseProps> = ({ 
    width = '100%', 
    height = 20, 
    borderRadius = 4,
    style 
}) => {
    const animatedValue = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-width as any, width as any], // Approximated
    });

    return (
        <View style={[
            styles.container, 
            { width, height, borderRadius, backgroundColor: glass.shimmer[0] }, 
            style
        ]}>
            <Animated.View style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateX }] }
            ]}>
                <LinearGradient
                    colors={glass.shimmer as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
});

export default SkeletonBase;
