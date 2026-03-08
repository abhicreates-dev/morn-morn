import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../App';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../stores/useAuth';
import { normalizeApiKey, verifyPhotoWithGemini } from '../lib/gemini';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'Verification'>;
    route: RouteProp<RootStackParamList, 'Verification'>;
};

type SelectedImage = { base64: string; mimeType: string; uri?: string };

export default function VerificationScreen({ navigation, route }: Props) {
    const { taskId, taskTitle, taskDescription } = route.params;
    const { token } = useAuth();

    const taskTextForGemini = [taskTitle, taskDescription].filter(Boolean).join(' – ') || 'Task';

    const [proofType, setProofType] = useState<'photo' | 'text'>('text');
    const [explanation, setExplanation] = useState('');
    const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
    const [verifying, setVerifying] = useState(false);

    const pickImage = async (useCamera: boolean) => {
        try {
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert("Permission", "Camera access is needed to take a photo.");
                    return;
                }
                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                    base64: true,
                });
                if (!result.canceled && result.assets?.[0]?.base64) {
                    const asset = result.assets[0];
                    setSelectedImage({
                        base64: String(asset.base64),
                        mimeType: asset.mimeType ?? 'image/jpeg',
                        uri: asset.uri,
                    });
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert("Permission", "Photo library access is needed to choose a photo.");
                    return;
                }
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                    base64: true,
                });
                if (!result.canceled && result.assets?.[0]?.base64) {
                    const asset = result.assets[0];
                    setSelectedImage({
                        base64: String(asset.base64),
                        mimeType: asset.mimeType ?? 'image/jpeg',
                        uri: asset.uri,
                    });
                }
            }
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Could not pick image.");
        }
    };

    const showPhotoOptions = () => {
        Alert.alert("Add photo", "Choose a photo as proof.", [
            { text: "Take photo", onPress: () => pickImage(true) },
            { text: "Choose from gallery", onPress: () => pickImage(false) },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const handleVerify = async () => {
        if (proofType === 'text' && explanation.trim().length === 0) {
            Alert.alert("Missing Proof", "Please write an explanation to verify your task.");
            return;
        }
        if (proofType === 'photo' && !selectedImage) {
            Alert.alert("Missing Photo", "Please select a photo to verify your task.");
            return;
        }

        setVerifying(true);
        try {
            let success: boolean;
            let proofExplanation: string;

            if (proofType === 'photo' && selectedImage) {
                const apiKey = normalizeApiKey(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
                if (!apiKey) {
                    Alert.alert("API Key Missing", "Add EXPO_PUBLIC_GEMINI_API_KEY to your .env for photo verification.");
                    setVerifying(false);
                    return;
                }
                const raw = await verifyPhotoWithGemini(
                    selectedImage.base64,
                    selectedImage.mimeType,
                    taskTextForGemini,
                    apiKey
                );
                success = raw === 'true' || (raw.includes('true') && !raw.includes('false'));
                proofExplanation = 'Photo verified by AI';
            } else {
                success = !explanation.toLowerCase().includes('fail');
                proofExplanation = explanation;
            }

            await axios.post(
                `${API_URL}/tasks/complete`,
                { taskId, success, proofExplanation },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            navigation.replace('Result', { success });
        } catch (error: any) {
            console.error("Verification error", error);
            Alert.alert("Error", error?.response?.data?.message ?? error?.message ?? "Could not complete verification.");
        } finally {
            setVerifying(false);
        }
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
                    <TouchableOpacity
                        onPress={showPhotoOptions}
                        className="h-48 bg-surface border border-surfaceLight drop-shadow-none rounded-3xl justify-center items-center border-dashed"
                    >
                        {selectedImage?.uri ? (
                            <View className="w-full h-full rounded-3xl overflow-hidden">
                                <Image source={{ uri: selectedImage.uri }} className="w-full h-full" resizeMode="cover" />
                                <View className="absolute inset-0 justify-end pb-2 items-center">
                                    <Text className="text-textMain font-medium bg-black/50 px-3 py-1 rounded">Tap to change</Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                <Feather name="upload-cloud" size={40} color="#84a98c" className="mb-4" />
                                <Text className="text-textMuted font-medium">Tap to upload a photo</Text>
                                <Text className="text-textMuted text-xs mt-2">Camera or gallery</Text>
                            </>
                        )}
                    </TouchableOpacity>
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
