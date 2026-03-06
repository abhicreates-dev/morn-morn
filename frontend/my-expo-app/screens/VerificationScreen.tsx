import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../stores/useAuth';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'Verification'>;
    route: RouteProp<RootStackParamList, 'Verification'>;
};

export default function VerificationScreen({ navigation, route }: Props) {
    const { taskId } = route.params;
    const { token } = useAuth();

    const [proofType, setProofType] = useState<'photo' | 'text'>('text');
    const [explanation, setExplanation] = useState('');
    const [verifying, setVerifying] = useState(false);

    const handleVerify = async () => {
        if (proofType === 'text' && explanation.trim().length === 0) {
            Alert.alert("Missing Proof", "Please write an explanation to verify your task.");
            return;
        }

        setVerifying(true);

        // Simulate direct-to-frontend AI validation layer
        setTimeout(async () => {
            // Mock logic: randomly succeed or fail based on keyword (to test both flows)
            // If user types "fail" explicitly, we trigger failure. Otherwise success.
            const isSuccess = !explanation.toLowerCase().includes('fail');

            try {
                // Send actual result to backend
                await axios.post(
                    `${API_URL}/tasks/complete`,
                    {
                        taskId,
                        success: isSuccess,
                        proofExplanation: explanation,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                navigation.replace('Result', { success: isSuccess });
            } catch (error) {
                console.error("Verification backend error", error);
                Alert.alert("Error", "Could not complete verification process.");
                setVerifying(false);
            }
        }, 2000);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView className="flex-1 px-6 pt-16 pb-10" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="flex-row items-center mb-8">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 py-2 pr-4">
                        <Feather name="arrow-left" size={28} color="#242424" />
                    </TouchableOpacity>
                    <Text className="text-textMain text-3xl font-bold">Verify Task</Text>
                </View>

                <Text className="text-textMain/70 text-base mb-6 leading-relaxed">
                    Provide proof that you have completed this challenge. The AI will review it.
                </Text>

                {/* Proof Type Selector */}
                <View className="flex-row gap-4 mb-8">
                    <TouchableOpacity
                        onPress={() => setProofType('photo')}
                        className={`flex-1 py-4 rounded-3xl items-center border ${proofType === 'photo' ? 'bg-primary border-primary' : 'bg-white border-gray-300 drop-shadow-none'}`}
                    >
                        <Feather name="camera" size={24} color={proofType === 'photo' ? '#fff' : '#242424'} />
                        <Text className={`font-bold mt-2 ${proofType === 'photo' ? 'text-white' : 'text-textMain'}`}>Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setProofType('text')}
                        className={`flex-1 py-4 rounded-3xl items-center border ${proofType === 'text' ? 'bg-primary border-primary' : 'bg-white border-gray-300 drop-shadow-none'}`}
                    >
                        <Feather name="file-text" size={24} color={proofType === 'text' ? '#fff' : '#242424'} />
                        <Text className={`font-bold mt-2 ${proofType === 'text' ? 'text-white' : 'text-textMain'}`}>Explain</Text>
                    </TouchableOpacity>
                </View>

                {/* Proof Entry Area */}
                {proofType === 'photo' ? (
                    <View className="h-48 bg-white border border-gray-300 drop-shadow-none rounded-3xl justify-center items-center border-dashed">
                        <Feather name="upload-cloud" size={40} color="#fac263" className="mb-4" />
                        <Text className="text-textMain/50 font-medium">Tap to upload a screenshot</Text>
                        <Text className="text-textMain/40 text-xs mt-2">(Mocked for now)</Text>
                    </View>
                ) : (
                    <View>
                        <Text className="text-textMain font-bold mb-2 ml-1 text-base">Explanation</Text>
                        <TextInput
                            placeholder="How did you complete it? (Type 'fail' to mock failure)"
                            value={explanation}
                            onChangeText={setExplanation}
                            multiline
                            textAlignVertical="top"
                            className="w-full h-48 bg-white px-5 py-4 rounded-3xl border border-gray-300 drop-shadow-none text-textMain font-medium text-base"
                            placeholderTextColor="#a0aec0"
                        />
                    </View>
                )}

            </ScrollView>

            {/* Verification Action */}
            <View className="absolute bottom-8 left-6 right-6">
                <TouchableOpacity
                    onPress={handleVerify}
                    disabled={verifying}
                    className={`w-full bg-textMain py-5 rounded-full items-center drop-shadow-none flex-row justify-center ${verifying ? 'opacity-80' : ''}`}
                >
                    {verifying && <ActivityIndicator size="small" color="#fac263" className="mr-3" />}
                    <Text className="text-primary font-bold text-xl uppercase tracking-widest">
                        {verifying ? 'AI Analyzing...' : 'Submit Proof'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
