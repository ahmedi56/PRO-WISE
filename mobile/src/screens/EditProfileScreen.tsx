import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform, 
    ScrollView 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser, resetSuccess } from '../store/slices/authSlice';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { RootState, AppDispatch } from '../store';
import { RootStackNavigationProp } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

interface EditProfileScreenProps {
    navigation: RootStackNavigationProp<'EditProfile'>;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading, error, updateSuccess } = useSelector((state: RootState) => state.auth);

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.firstName || user.name || '');
            setUsername(user.username || '');
            setEmail(user.email || '');
            setPhone((user as any).phone || '');
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
        dispatch(updateUser({ firstName: name, username, email, phone }));
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.form}>
                    <CustomInput
                        label="Full Name"
                        icon="person-outline"
                        placeholder="John Doe"
                        value={name}
                        onChangeText={setName}
                    />

                    <CustomInput
                        label="Username"
                        icon="at-outline"
                        placeholder="johndoe"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

                    <CustomInput
                        label="Email Address"
                        icon="mail-outline"
                        placeholder="you@company.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <CustomInput
                        label="Phone Number"
                        icon="call-outline"
                        placeholder="+1 234 567 890"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />

                    <CustomButton
                        title="Save Changes"
                        onPress={handleUpdate}
                        loading={loading}
                        style={{ marginTop: spacing.md }}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { flexGrow: 1, padding: spacing.lg },
    form: { marginTop: spacing.base },
});

export default EditProfileScreen;
