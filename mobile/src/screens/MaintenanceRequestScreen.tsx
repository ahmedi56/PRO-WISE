import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Alert, 
    KeyboardAvoidingView, 
    Platform,
    TouchableOpacity
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { maintenanceService } from '../services/maintenanceService';
import { RootState } from '../store';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import CustomDropdown from '../components/CustomDropdown';

const URGENCY_OPTIONS = ['low', 'medium', 'high'];
const CONTACT_METHODS = ['phone', 'email', 'in_app'];

const MaintenanceRequestScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const theme = useTheme();
    const { colors, typography, spacing, radius, shadows } = theme;
    const [loading, setLoading] = useState(false);

    const initialProductName = route.params?.productName || '';
    const companyId = route.params?.companyId || '';

    const [formData, setFormData] = useState({
        productName: initialProductName,
        issueDescription: '',
        urgency: 'medium',
        contactPhone: user?.phone || '',
        contactEmail: user?.email || '',
        contactMethod: 'in_app',
    });

    const handleSubmit = async () => {
        const { productName, issueDescription, urgency, contactPhone, contactEmail, contactMethod } = formData;
        
        if (!productName.trim() || !issueDescription.trim()) {
            Alert.alert('Missing Data', 'Please fill in the product name and issue description.');
            return;
        }

        try {
            setLoading(true);
            const requestData = {
                productName: productName.trim(),
                issueDescription: issueDescription.trim(),
                urgency,
                companyId: companyId || null,
                contactPhone: contactPhone.trim(),
                contactEmail: contactEmail.trim(),
                contactMethod,
            };

            await maintenanceService.createRequest(requestData);
            Alert.alert(
                'Success', 
                'Your maintenance request has been submitted successfully.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (err: any) {
            Alert.alert('Submission Error', err.message || 'Failed to submit maintenance request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color={colors.textStrong} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: colors.textStrong }]}>Request Service</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Input details to request hardware support</Text>
                    </View>

                    <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <CustomInput
                            label="Product / Asset Name"
                            placeholder="e.g. Asus ROG Laptop"
                            value={formData.productName}
                            onChangeText={(val) => setFormData({ ...formData, productName: val })}
                            icon="cube-outline"
                        />

                        <CustomInput
                            label="Issue Description"
                            placeholder="Please describe the defect or symptom in detail..."
                            value={formData.issueDescription}
                            onChangeText={(val) => setFormData({ ...formData, issueDescription: val })}
                            multiline
                            numberOfLines={4}
                            icon="bug-outline"
                        />

                        <CustomDropdown
                            label="Urgency Level"
                            placeholder="Select urgency"
                            value={formData.urgency}
                            options={URGENCY_OPTIONS}
                            onSelect={(val) => setFormData({ ...formData, urgency: val })}
                            icon="alert-circle-outline"
                        />

                        <View style={styles.sectionDivider} />
                        <Text style={[styles.sectionTitle, { color: colors.textStrong }]}>Contact Details</Text>

                        <CustomInput
                            label="Contact Phone"
                            placeholder="+123..."
                            value={formData.contactPhone}
                            onChangeText={(val) => setFormData({ ...formData, contactPhone: val })}
                            keyboardType="phone-pad"
                            icon="call-outline"
                        />

                        <CustomInput
                            label="Contact Email"
                            placeholder="operator@prowise.com"
                            value={formData.contactEmail}
                            onChangeText={(val) => setFormData({ ...formData, contactEmail: val })}
                            keyboardType="email-address"
                            icon="mail-outline"
                        />

                        <CustomDropdown
                            label="Preferred Contact Method"
                            placeholder="Select method"
                            value={formData.contactMethod}
                            options={CONTACT_METHODS}
                            onSelect={(val) => setFormData({ ...formData, contactMethod: val })}
                            icon="chatbox-ellipses-outline"
                        />

                        <CustomButton
                            title="Submit Support Request"
                            onPress={handleSubmit}
                            loading={loading}
                            containerStyle={{ marginTop: 24 }}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24, paddingTop: 64 },
    header: { marginBottom: 32 },
    backBtn: { marginBottom: 16 },
    title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
    subtitle: { fontSize: 16, fontWeight: '500' },
    formCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
    },
    sectionTitle: {
        fontWeight: '700',
        marginTop: 12,
        marginBottom: 12,
        fontSize: 14,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    sectionDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginVertical: 16
    }
});

export default MaintenanceRequestScreen;
