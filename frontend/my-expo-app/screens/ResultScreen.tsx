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
        <View className={`flex-1 justify-center items-center px-6 ${success ? 'bg-background' : 'bg-red-50'}`}>
            <View className={`w-32 h-32 rounded-full justify-center items-center mb-10 ${success ? 'bg-green-100' : 'bg-red-100'}`}>
                {success ? (
                    <Text className="text-6xl text-green-500">🎉</Text>
                ) : (
                    <Feather name="x" size={64} color="#ef4444" />
                )}
            </View>

            <Text className={`font-black text-4xl mb-4 text-center tracking-tight ${success ? 'text-primary' : 'text-red-500'}`}>
                {success ? 'WELL DONE' : 'CHALLENGE FAILED'}
            </Text>

            <Text className="text-textMain/80 font-bold text-xl tracking-widest text-center mb-4">
                {success ? 'YOU DID IT' : 'You ran out of time.\nStart again tomorrow.'}
            </Text>

            {success && (
                <Text className="text-textMain/70 text-base text-center mb-16 px-4">
                    Your 0.01 SOL has been returned to your wallet.
                </Text>
            )}

            <TouchableOpacity
                onPress={() => navigation.replace('Home')}
                className={`w-full py-5 rounded-full items-center drop-shadow-none ${success ? 'bg-textMain' : 'bg-red-500'}`}
            >
                <Text className={`font-bold text-lg tracking-widest ${success ? 'text-primary' : 'text-white'}`}>
                    BACK TO HOME
                </Text>
            </TouchableOpacity>
        </View>
    );
}
