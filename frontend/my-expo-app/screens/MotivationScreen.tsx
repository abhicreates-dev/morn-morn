import { View, Text } from 'react-native';
import { useEffect } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'Motivation'>;
};

export default function MotivationScreen({ navigation }: Props) {
    useEffect(() => {
        // Navigate back to Home after 2 seconds
        const timer = setTimeout(() => {
            navigation.replace('Home');
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View className="flex-1 bg-background justify-center items-center px-6">
            <View className="w-32 h-32 bg-surface rounded-full justify-center items-center mb-10 border border-surfaceLight">
                <Text className="text-5xl">🚀</Text>
            </View>
            <Text className="text-primary font-semibold text-5xl italic tracking-tighter mb-4 text-center">
                LETS GOOOOOO
            </Text>
            <Text className="text-textMain font-semibold text-2xl tracking-widest text-center mt-2">
                NOW GET BACK TO WORK
            </Text>
        </View>
    );
}
