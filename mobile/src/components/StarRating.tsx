import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: number;
    color?: string;
    onRatingPress?: (rating: number) => void;
    style?: ViewStyle;
    disabled?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
    rating,
    maxRating = 5,
    size = 20,
    color = '#FFD700', // Gold
    onRatingPress,
    style,
    disabled = false
}) => {
    const stars = [];

    for (let i = 1; i <= maxRating; i++) {
        const isFull = i <= Math.floor(rating);
        const isHalf = !isFull && i <= Math.ceil(rating);

        stars.push(
            <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => onRatingPress && onRatingPress(i)}
                disabled={disabled || !onRatingPress}
            >
                <Ionicons
                    name={isFull ? 'star' : (isHalf ? 'star-half' : 'star-outline')}
                    size={size}
                    color={color}
                    style={{ marginHorizontal: size / 10 }}
                />
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.container, style]}>
            {stars}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default StarRating;
