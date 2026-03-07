import { View, Text, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { Feather } from '@expo/vector-icons';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'Result'>;
    route: RouteProp<RootStackParamList, 'Result'>;
};

export default function ResultScreen({ navigation, route }: Props) {
    const { success } = route.params;

    return (
        <View className={`flex-1 justify-center items-center px-6 ${success ? 'bg-surfaceLight' : 'bg-surface'}`}>
            <View className={`w-32 h-32 rounded-full justify-center items-center mb-8 ${success ? 'bg-primary' : 'bg-red-500'}`}>
                <Feather name={success ? "check" : "x"} size={64} color="#2f3e46" />
            </View>

            <Text className={`font-semibold text-4xl mb-4 text-center tracking-tight ${success ? 'text-textMain' : 'text-red-500'}`}>
                {success ? 'WELL DONE' : 'CHALLENGE FAILED'}
            </Text>

            <Text className={`font-semibold text-xl tracking-widest text-center mb-4 ${success ? 'text-textMain' : 'text-red-400'}`}>
                {success ? 'YOU DID IT' : 'You ran out of time.\nStart again tomorrow.'}
            </Text>

            {success && (
                <Text className="text-textMuted text-base text-center mb-16 px-4">
                    Your 0.01 SOL has been returned to your wallet.
                </Text>
            )}

            <TouchableOpacity
                onPress={() => navigation.replace('Home')}
                className={`w-full py-5 rounded-full items-center drop-shadow-none ${success ? 'bg-primary' : 'bg-red-500'}`}
            >
                <Text className={`font-bold text-lg tracking-widest text-background`}>
                    BACK TO HOME
                </Text>
            </TouchableOpacity>
        </View>
    );
}
