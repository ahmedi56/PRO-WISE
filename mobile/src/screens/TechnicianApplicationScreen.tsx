import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Alert, 
    KeyboardAvoidingView, 
    Platform,
    TouchableOpacity,
    LayoutAnimation
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { authService } from '../services/authService';
import { RootState } from '../store';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const PRESET_SKILLS = [
    'Smartphone Repair', 'Laptop Repair', 'Tablet Repair', 
    'Soldering', 'Micro-soldering', 'Data Recovery', 
    'Screen Replacement', 'Battery Service', 'Water Damage',
    'Console Repair', 'Audio/Visual', 'Appliances'
];

const TechnicianApplicationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const theme = useTheme();
    const { colors, typography, spacing, radius, shadows } = theme;
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        headline: user?.technicianProfile?.headline || '',
        bio: user?.technicianProfile?.bio || '',
        skills: user?.technicianProfile?.skills || [] as string[],
        experienceYears: String(user?.technicianProfile?.experienceYears || ''),
        experienceStartDate: user?.technicianProfile?.experienceStartDate || '',
        city: user?.technicianProfile?.city || '',
        governorate: user?.technicianProfile?.governorate || '',
        phone: user?.technicianProfile?.phone || user?.phone || '',
        cvLink: user?.technicianProfile?.cvLink || '',
    });

    const toggleSkill = (skill: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.includes(skill) 
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const handleSubmit = async () => {
        const { headline, bio, skills, experienceYears, city, governorate, phone } = formData;
        
        if (!headline || !bio || skills.length === 0 || !experienceYears || !city || !governorate || !phone) {
            Alert.alert('Missing Data', 'Please fill in all required fields to proceed.');
            return;
        }

        try {
            setLoading(true);
            const submissionData = {
                ...formData,
                experienceYears: Number(experienceYears),
                serviceCategories: ['General Electronics'], // Default for mobile
            };

            await authService.requestTechnicianUpgrade(submissionData);
            Alert.alert(
                'Success', 
                'Your application has been submitted for review.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Submission failed.');
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
                        <Text style={[styles.title, { color: colors.textStrong }]}>Become a Tech</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Apply to join our maintenance network</Text>
                    </View>

                    <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <CustomInput
                            label="Professional Headline"
                            placeholder="e.g. Senior Hardware Technician"
                            value={formData.headline}
                            onChangeText={(val) => setFormData({ ...formData, headline: val })}
                            icon="ribbon-outline"
                        />

                        <CustomInput
                            label="Biography"
                            placeholder="Brief description of your expertise..."
                            value={formData.bio}
                            onChangeText={(val) => setFormData({ ...formData, bio: val })}
                            multiline
                            numberOfLines={3}
                            icon="document-text-outline"
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <CustomInput
                                    label="Total Years"
                                    placeholder="0"
                                    value={formData.experienceYears}
                                    onChangeText={(val) => setFormData({ ...formData, experienceYears: val })}
                                    keyboardType="numeric"
                                    icon="time-outline"
                                />
                            </View>
                            <View style={{ flex: 1.5 }}>
                                <CustomInput
                                    label="Career Start"
                                    placeholder="YYYY-MM-DD"
                                    value={formData.experienceStartDate}
                                    onChangeText={(val) => setFormData({ ...formData, experienceStartDate: val })}
                                    icon="calendar-outline"
                                />
                            </View>
                        </View>

                        <CustomInput
                            label="Direct Phone"
                            placeholder="+123..."
                            value={formData.phone}
                            onChangeText={(val) => setFormData({ ...formData, phone: val })}
                            keyboardType="phone-pad"
                            icon="call-outline"
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <CustomInput
                                    label="Governorate"
                                    placeholder="Region"
                                    value={formData.governorate}
                                    onChangeText={(val) => setFormData({ ...formData, governorate: val })}
                                    icon="map-outline"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <CustomInput
                                    label="City"
                                    placeholder="City"
                                    value={formData.city}
                                    onChangeText={(val) => setFormData({ ...formData, city: val })}
                                    icon="navigate-outline"
                                />
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.textStrong }]}>Key Skills</Text>
                        <View style={styles.chipGrid}>
                            {PRESET_SKILLS.map(skill => (
                                <TouchableOpacity 
                                    key={skill}
                                    onPress={() => toggleSkill(skill)}
                                    style={[
                                        styles.chip,
                                        { backgroundColor: colors.bg, borderColor: colors.border },
                                        formData.skills.includes(skill) && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        { color: colors.textMuted },
                                        formData.skills.includes(skill) && { color: 'white', fontWeight: 'bold' }
                                    ]}>{skill}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.textStrong }]}>Documentation</Text>
                        <CustomInput
                            label="CV / Portfolio Link"
                            placeholder="e.g. LinkedIn or Drive Link"
                            value={formData.cvLink}
                            onChangeText={(val) => setFormData({ ...formData, cvLink: val })}
                            icon="link-outline"
                        />

                        <CustomButton
                            title="Submit Application"
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
    row: { flexDirection: 'row', gap: 16 },
    sectionTitle: {
        fontWeight: '700',
        marginTop: 24,
        marginBottom: 12,
        fontSize: 14,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 13,
    },
    uploadArea: {
        marginTop: 8,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadTitle: {
        fontWeight: '700',
        fontSize: 16,
        marginTop: 12
    },
    uploadSub: {
        fontSize: 12,
        marginTop: 4
    }
});

export default TechnicianApplicationScreen;
