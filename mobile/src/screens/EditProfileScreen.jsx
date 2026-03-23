import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser, resetSuccess } from '../store/slices/authSlice';
import { colors, spacing, radius, typography, shadows } from '../theme';

const EditProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user, loading, error, updateSuccess } = useSelector((state) => state.auth);

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setUsername(user.username || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    useEffect(() => {
        if (updateSuccess) {
            Alert.alert('Success', 'Profile updated successfully');
            dispatch(resetSuccess());
            navigation.goBack();
        }
        if (error && !loading) {
            Alert.alert('Error', error);
        }
    }, [updateSuccess, error, loading, dispatch, navigation]);

    const handleUpdate = () => {
        dispatch(updateUser({ name, username, email, phone }));
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="John Doe"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="johndoe"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholder="+1 234 567 890"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                            <Text style={styles.buttonText}>Save Changes</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { flexGrow: 1, padding: spacing.lg },
    form: { marginTop: spacing.base },
    inputGroup: { marginBottom: spacing.lg },
    label: { color: colors.text, marginBottom: spacing.sm, fontSize: typography.sm.fontSize, fontWeight: '600' },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.base,
        color: colors.textStrong,
        fontSize: typography.body.fontSize,
    },
    button: {
        backgroundColor: colors.primary,
        padding: spacing.base,
        borderRadius: radius.md,
        alignItems: 'center',
        marginTop: spacing.sm,
        ...shadows.glow,
    },
    buttonText: { color: '#fff', fontSize: typography.bodyBold.fontSize, fontWeight: typography.bodyBold.fontWeight },
});

export default EditProfileScreen;
