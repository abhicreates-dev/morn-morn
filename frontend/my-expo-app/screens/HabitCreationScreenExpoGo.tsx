import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../stores/useAuth';
import { Feather } from '@expo/vector-icons';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'HabitCreation'>;
};

/**
 * Expo Go version: no wallet/MWA. Creates task without staking.
 * Use a development build to stake 0.01 SOL.
 */
export default function HabitCreationScreenExpoGo({ navigation }: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [hoursMode, setHoursMode] = useState<'24' | '48' | 'custom'>('24');
    const [customHours, setCustomHours] = useState('');

    const [aiSuggestion, setAiSuggestion] = useState('');
    const [fetchingAi, setFetchingAi] = useState(false);
    const [creating, setCreating] = useState(false);

    const { token } = useAuth();

    const getHours = (): number => {
        if (hoursMode === '24') return 24;
        if (hoursMode === '48') return 48;
        return parseInt(customHours) || 24;
    };

    const getMockAiSuggestion = async () => {
        if (!title || !description) {
            Alert.alert("Missing Info", "Please fill out title and description first to get a suggestion.");
            return;
        }
        setFetchingAi(true);
        setTimeout(() => {
            setAiSuggestion("Try making this goal more measurable. For example, specify an exact metric to meet.");
            setFetchingAi(false);
        }, 1500);
    };

    const handleCreate = async () => {
        if (!title) {
            Alert.alert("Error", "Title is required");
            return;
        }
        const hours = getHours();
        if (hours <= 0) {
            Alert.alert("Error", "Please enter a valid number of hours.");
            return;
        }

        setCreating(true);
        try {
            await axios.post(
                `${API_URL}/tasks`,
                {
                    title,
                    description,
                    completeInHours: hours,
                    aiSuggestion: aiSuggestion || undefined,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            navigation.replace('Motivation');
        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.message || error?.message || "Please try again.";
            Alert.alert("Failed to create task", msg);
        } finally {
            setCreating(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView className="flex-1 px-6 pt-16 pb-10" showsVerticalScrollIndicator={false}>
                <View className="flex-row items-center mb-10">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 pl-0">
                        <Feather name="arrow-left" size={28} color="#ffffff" />
                    </TouchableOpacity>
                    <Text className="text-textMain text-3xl font-semibold">New Habit</Text>
                </View>

                <View className="space-y-6">
                    <View className="mb-2">
                        <Text className="text-textMain font-semibold mb-1 ml-1 text-base">Title</Text>
                        <View className="w-full h-[60px] bg-surface px-4 rounded-2xl border border-surfaceLight justify-center">
                            <TextInput
                                placeholder="e.g. Morning Run, Reading, Water"
                                value={title}
                                onChangeText={setTitle}
                                className="flex-1 text-textMain text-base font-medium"
                                placeholderTextColor="#cad2c5"
                            />
                        </View>
                    </View>

                    <View className='mb-5'>
                        <Text className="text-textMain font-semibold mb-1 ml-1 text-base">Description</Text>
                        <TextInput
                            placeholder="Detailed explanation of the goal..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            textAlignVertical="top"
                            className="w-full h-32 bg-surface px-4 py-3 rounded-2xl border border-surfaceLight text-textMain font-medium text-base"
                            placeholderTextColor="#cad2c5"
                        />
                    </View>

                    <View>
                        <Text className="text-textMain font-semibold mb-1 ml-1 text-base">Complete In (Hours)</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setHoursMode('24')}
                                className={`flex-1 py-4 rounded-3xl items-center border ${hoursMode === '24' ? 'bg-primary border-primary' : 'bg-surface border-surfaceLight'}`}
                            >
                                <Text className={`font-semibold text-lg ${hoursMode === '24' ? 'text-background' : 'text-textMain'}`}>24h</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setHoursMode('48')}
                                className={`flex-1 py-4 rounded-3xl items-center border ${hoursMode === '48' ? 'bg-primary border-primary' : 'bg-surface border-surfaceLight'}`}
                            >
                                <Text className={`font-semibold text-lg ${hoursMode === '48' ? 'text-background' : 'text-textMain'}`}>48h</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setHoursMode('custom')}
                                className={`flex-1 py-4 rounded-3xl items-center border ${hoursMode === 'custom' ? 'bg-primary border-primary' : 'bg-surface border-surfaceLight'}`}
                            >
                                <Text className={`font-semibold text-lg ${hoursMode === 'custom' ? 'text-background' : 'text-textMain'}`}>Cstm</Text>
                            </TouchableOpacity>
                        </View>
                        {hoursMode === 'custom' && (
                            <View className="w-full mt-3 h-[60px] bg-surface px-4 rounded-2xl border border-surfaceLight justify-center">
                                <TextInput
                                    placeholder="Enter hours (e.g. 5)"
                                    value={customHours}
                                    onChangeText={setCustomHours}
                                    keyboardType="numeric"
                                    className="flex-1 text-textMain text-center font-semibold text-lg"
                                    placeholderTextColor="#cad2c5"
                                />
                            </View>
                        )}
                    </View>

                    <View className="mt-4 p-5 bg-surface rounded-3xl border border-surfaceLight">
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center gap-2">
                                <Text className="text-1xl">✨</Text>
                                <Text className="text-primary font-semibold text-base">AI Suggestion</Text>
                            </View>
                            {!aiSuggestion && !fetchingAi && (
                                <TouchableOpacity onPress={getMockAiSuggestion} className="bg-primary/20 px-3 py-1 rounded-full">
                                    <Text className="text-primary font-semibold text-xs">Generate</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {fetchingAi ? (
                            <ActivityIndicator size="small" color="#84a98c" className="my-2" />
                        ) : aiSuggestion ? (
                            <Text className="text-textMuted leading-5 italic">{aiSuggestion}</Text>
                        ) : (
                            <Text className="text-textMuted text-sm">Write a title and description to get feedback.</Text>
                        )}
                    </View>
                </View>

                <View className="h-32" />
            </ScrollView>

            <View className="absolute bottom-24 left-6 right-6 items-center">
                <Text className="text-textMuted text-xs text-center">
                    Running in Expo Go — no SOL staking. Use a dev build to stake 0.01 SOL.
                </Text>
            </View>

            <View className="absolute bottom-8 left-6 right-6">
                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={creating}
                    className={`w-full bg-primary py-5 rounded-full items-center drop-shadow-none ${creating ? 'opacity-70' : ''}`}
                >
                    <Text className="text-background font-bold text-xl uppercase tracking-widest">
                        {creating ? 'Creating...' : 'Create Habit'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
