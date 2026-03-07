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
                    <TouchableOpacity className="mt-4" onPress={() => navigation.goBack()}>
                        <Feather name="arrow-left" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text className="text-textMain text-3xl font-semibold">Verify Task</Text>
                </View>

                <Text className="text-textMain/70 text-base mb-6 leading-relaxed">
                    Provide proof that you have completed this challenge. The AI will review it.
                </Text>

                {/* Proof Type Selector */}
                <View className="flex-row gap-4 mb-8">
                    <TouchableOpacity
                        onPress={() => setProofType('photo')}
                        className={`flex-1 py-4 rounded-3xl items-center border ${proofType === 'photo' ? 'bg-primary border-primary' : 'bg-surface border-surfaceLight drop-shadow-none'}`}
                    >
                        <Feather name="camera" size={24} color={proofType === 'photo' ? '#2f3e46' : '#ffffff'} />
                        <Text className={`font-semibold mt-2 ${proofType === 'photo' ? 'text-background' : 'text-textMain'}`}>Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setProofType('text')}
                        className={`flex-1 py-4 rounded-3xl items-center border ${proofType === 'text' ? 'bg-primary border-primary' : 'bg-surface border-surfaceLight drop-shadow-none'}`}
                    >
                        <Feather name="file-text" size={24} color={proofType === 'text' ? '#2f3e46' : '#ffffff'} />
                        <Text className={`font-semibold mt-2 ${proofType === 'text' ? 'text-background' : 'text-textMain'}`}>Explain</Text>
                    </TouchableOpacity>
                </View>

                {/* Proof Entry Area */}
                {proofType === 'photo' ? (
                    <View className="h-48 bg-surface border border-surfaceLight drop-shadow-none rounded-3xl justify-center items-center border-dashed">
                        <Feather name="upload-cloud" size={40} color="#84a98c" className="mb-4" />
                        <Text className="text-textMuted font-medium">Tap to upload a screenshot</Text>
                        <Text className="text-textMuted text-xs mt-2">(Mocked for now)</Text>
                    </View>
                ) : (
                    <View>
                        <Text className="text-textMain font-semibold mb-2 ml-1 text-base">Explanation</Text>
                        <TextInput
                            placeholder="How did you complete it? (Type 'fail' to mock failure)"
                            value={explanation}
                            onChangeText={setExplanation}
                            multiline
                            textAlignVertical="top"
                            className="w-full h-48 bg-surface px-5 py-4 rounded-3xl border border-surfaceLight drop-shadow-none text-textMain font-medium text-base"
                            placeholderTextColor="#cad2c5"
                        />
                    </View>
                )}

            </ScrollView>

            {/* Verification Action */}
            <View className="absolute bottom-8 left-6 right-6">
                <TouchableOpacity
                    onPress={handleVerify}
                    disabled={verifying}
                    className={`w-full bg-primary py-5 rounded-full items-center drop-shadow-none flex-row justify-center ${verifying ? 'opacity-80' : ''}`}
                >
                    {verifying && <ActivityIndicator size="small" color="#2f3e46" className="mr-3" />}
                    <Text className="text-background font-bold text-xl uppercase tracking-widest">
                        {verifying ? 'AI Analyzing...' : 'Submit Proof'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
