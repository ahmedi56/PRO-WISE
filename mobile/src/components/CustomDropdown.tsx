import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { colors, spacing, radius } from '../theme';

interface CustomDropdownProps {
    label: string;
    value: string;
    options: string[];
    onSelect: (val: string) => void;
    icon?: string;
    placeholder?: string;
    disabled?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
    label, value, options, onSelect, icon, placeholder = "Select option", disabled = false
}) => {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity 
                style={[styles.inputButton, disabled && styles.disabledInput]} 
                onPress={() => !disabled && setModalVisible(true)}
                activeOpacity={0.7}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {icon && <Ionicons name={icon as any} size={20} color={colors.textMuted} style={styles.icon} />}
                    <Text style={[styles.valueText, !value && styles.placeholderText]}>
                        {value || placeholder}
                    </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textStrong} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.optionItem} 
                                    onPress={() => {
                                        onSelect(item);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.optionText, item === value && styles.selectedOptionText]}>
                                        {item}
                                    </Text>
                                    {item === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: spacing.md },
    label: { fontSize: 13, fontWeight: '700', color: colors.textStrong, marginBottom: 8 },
    inputButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceContainer,
        borderRadius: radius.md,
        padding: spacing.base,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'space-between',
        height: 56
    },
    disabledInput: { opacity: 0.5 },
    icon: { marginRight: 10 },
    valueText: { fontSize: 15, color: colors.textStrong, flex: 1 },
    placeholderText: { color: colors.textMuted },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '60%', padding: spacing.lg },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textStrong },
    optionItem: { paddingVertical: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
    optionText: { fontSize: 15, color: colors.text },
    selectedOptionText: { color: colors.primary, fontWeight: 'bold' }
});

export default CustomDropdown;
