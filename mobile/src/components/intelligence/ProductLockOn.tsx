import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Dimensions } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withRepeat, 
    withSequence,
    Easing 
} from 'react-native-reanimated';
import { colors, spacing, radius } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ProductLockOnProps {
    visible: boolean;
    productName: string;
    onComplete: () => void;
}

const ProductLockOn: React.FC<ProductLockOnProps> = ({ visible, productName, onComplete }) => {
    const scale = useSharedValue(2);
    const opacity = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 300 });
            scale.value = withTiming(1, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
            rotate.value = withRepeat(withTiming(360, { duration: 2000, easing: Easing.linear }), -1);
            
            const timer = setTimeout(() => {
                opacity.value = withTiming(0, { duration: 300 }, () => {
                    onComplete();
                });
            }, 2000);

            return () => clearTimeout(timer);
        } else {
            opacity.value = 0;
            scale.value = 2;
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }]
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotate.value}deg` }]
    }));

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.container}>
                <Animated.View style={[styles.target, animatedStyle]}>
                    <Animated.View style={[styles.ring, ringStyle]} />
                    <View style={styles.corners}>
                        <View style={[styles.corner, styles.tl]} />
                        <View style={[styles.corner, styles.tr]} />
                        <View style={[styles.corner, styles.bl]} />
                        <View style={[styles.corner, styles.br]} />
                    </View>
                    <Ionicons name="scan-outline" size={80} color={colors.primary} />
                    <View style={styles.info}>
                        <Text style={styles.status}>ASSET IDENTIFIED</Text>
                        <Text style={styles.name}>{productName.toUpperCase()}</Text>
                        <Text style={styles.lock}>LOCK-ON ESTABLISHED</Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: 'rgba(10, 10, 15, 0.95)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    target: { 
        width: 300, 
        height: 300, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    ring: { 
        position: 'absolute', 
        width: 260, 
        height: 260, 
        borderRadius: 130, 
        borderWidth: 2, 
        borderColor: colors.primary, 
        borderStyle: 'dashed',
        opacity: 0.3
    },
    corners: { 
        position: 'absolute', 
        width: '100%', 
        height: '100%' 
    },
    corner: { 
        position: 'absolute', 
        width: 40, 
        height: 40, 
        borderColor: colors.primary, 
        borderWidth: 4 
    },
    tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    info: { 
        marginTop: 40, 
        alignItems: 'center' 
    },
    status: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
    name: { color: '#FFF', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    lock: { color: colors.success, fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});

export default ProductLockOn;
