import React, { useState, useEffect } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity, 
    ActivityIndicator, 
    Dimensions, 
    Alert 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { parseQRCodeUrl } from '../utils/qrValidation';
import { RootStackNavigationProp } from '../navigation/types';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

interface QRScannerScreenProps {
    navigation: RootStackNavigationProp<'QRScanner'>;
}

const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [torch, setTorch] = useState(false);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);

        const result = parseQRCodeUrl(data);

        if (result.valid && result.productId) {
            navigation.navigate('ProductDetail', { id: result.productId });
            // Reset scan state after a delay if user returns to this screen
            setTimeout(() => setScanned(false), 2000);
        } else {
            // Use native Alert instead of custom UI to avoid layout bugs
            Alert.alert(
                'Invalid QR Code',
                result.error || 'This is not a valid PRO-WISE product QR code.',
                [{ text: 'OK', onPress: () => setScanned(false) }],
                { cancelable: false }
            );
        }
    };

    if (!permission) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                enableTorch={torch}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            />

            {/* Overlay UI */}
            <View style={[styles.overlay, StyleSheet.absoluteFill]}>
                <View style={styles.unfocusedContainer}></View>
                <View style={styles.middleRow}>
                    <View style={styles.unfocusedContainer}></View>
                    <View style={styles.scanArea}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                        {scanned && (
                            <ActivityIndicator size="large" color={colors.primary} />
                        )}
                    </View>
                    <View style={styles.unfocusedContainer}></View>
                </View>
                <View style={styles.unfocusedContainer}>
                    <Text style={styles.instructionText}>
                        Position the QR code inside the frame to scan
                    </Text>
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => setTorch(!torch)}
                >
                    <Ionicons
                        name={torch ? 'flash' : 'flash-outline'}
                        size={24}
                        color="white"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg,
        padding: spacing.xl,
    },
    message: {
        fontSize: typography.body.fontSize,
        color: colors.text,
        textAlign: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    overlay: {
        flex: 1,
    },
    unfocusedContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    middleRow: {
        flexDirection: 'row',
        height: SCAN_AREA_SIZE,
    },
    scanArea: {
        width: SCAN_AREA_SIZE,
        height: SCAN_AREA_SIZE,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: colors.primary,
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    instructionText: {
        color: 'white',
        fontSize: typography.body.fontSize,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
    controls: {
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    controlButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
});

export default QRScannerScreen;
