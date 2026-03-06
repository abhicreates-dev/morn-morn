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

export default function HabitCreationScreen({ navigation }: Props) {
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
        // Simulate AI delay
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
        } catch (error) {
            console.error(error);
            Alert.alert("Failed to create task", "Please try again.");
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
                {/* Header */}
                <View className="flex-row items-center mb-10">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 pl-0">
                        <Feather name="arrow-left" size={28} color="#242424" />
                    </TouchableOpacity>
                    <Text className="text-textMain text-3xl font-bold">New Habit</Text>
                </View>

                {/* Form Fields */}
                <View className="space-y-6">
                    <View className="mb-2">
                        <Text className="text-textMain font-bold mb-1 ml-1 text-base">Title</Text>
                        <View className="w-full h-[50px] bg-white px-5 rounded-2xl border border-gray-300  drop-shadow-none  justify-center">
                            <TextInput
                                placeholder="e.g. Read 20 pages"
                                value={title}
                                onChangeText={setTitle}
                                className="flex-1 text-textMain font-medium text-lg"
                                placeholderTextColor="#a0aec0"
                            />
                        </View>
                    </View>

                    <View className='mb-5'>
                        <Text className="text-textMain font-bold mb-1 ml-1 text-base">Description</Text>
                        <TextInput
                            placeholder="Detailed explanation of the goal..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            textAlignVertical="top"
                            className="w-full h-32 bg-white px-5 py-4 rounded-3xl border border-gray-300  drop-shadow-none text-textMain font-medium text-base"
                            placeholderTextColor="#a0aec0"
                        />
                    </View>

                    <View>
                        <Text className="text-textMain font-bold mb-1 ml-1 text-base">Complete In (Hours)</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setHoursMode('24')}
                                className={`flex-1 py-4 rounded-3xl items-center border ${hoursMode === '24' ? 'bg-primary border-primary' : 'bg-white border-gray-300  drop-shadow-none'}`}
                            >
                                <Text className={`font-bold text-lg ${hoursMode === '24' ? 'text-white' : 'text-textMain'}`}>24h</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setHoursMode('48')}
                                className={`flex-1 py-4 rounded-3xl items-center border ${hoursMode === '48' ? 'bg-primary border-primary' : 'bg-white border-gray-300  drop-shadow-none'}`}
                            >
                                <Text className={`font-bold text-lg ${hoursMode === '48' ? 'text-white' : 'text-textMain'}`}>48h</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setHoursMode('custom')}
                                className={`flex-1 py-4 rounded-3xl items-center border ${hoursMode === 'custom' ? 'bg-primary border-primary' : 'bg-white border-gray-300  drop-shadow-none'}`}
                            >
                                <Text className={`font-bold text-lg ${hoursMode === 'custom' ? 'text-white' : 'text-textMain'}`}>Cstm</Text>
                            </TouchableOpacity>
                        </View>
                        {hoursMode === 'custom' && (
                            <View className="w-full mt-3 h-[60px] bg-white px-5 rounded-3xl border border-gray-100 shadow-sm justify-center">
                                <TextInput
                                    placeholder="Enter hours (e.g. 72)"
                                    value={customHours}
                                    onChangeText={setCustomHours}
                                    keyboardType="numeric"
                                    className="flex-1 text-textMain text-center font-bold text-lg"
                                    placeholderTextColor="#a0aec0"
                                />
                            </View>
                        )}
                    </View>

                    {/* AI Suggestion Box */}
                    <View className="mt-4 p-5 bg-[#faf5ea] rounded-3xl border border-[#f5e6cc]">
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center gap-2">
                                <Text className="text-1xl">✨</Text>
                                <Text className="text-primary font-bold text-base">AI Suggestion</Text>
                            </View>
                            {!aiSuggestion && !fetchingAi && (
                                <TouchableOpacity onPress={getMockAiSuggestion} className="bg-primary/20 px-3 py-1 rounded-full">
                                    <Text className="text-primary font-bold text-xs">Generate</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {fetchingAi ? (
                            <ActivityIndicator size="small" color="#fac263" className="my-2" />
                        ) : aiSuggestion ? (
                            <Text className="text-textMain/80 leading-5 italic">{aiSuggestion}</Text>
                        ) : (
                            <Text className="text-textMain/40 text-sm">Write a title and description to get feedback.</Text>
                        )}
                    </View>
                </View>

                {/* Spacing for bottom button */}
                <View className="h-32" />
            </ScrollView>

            {/* Floating Create Button */}
            <View className="absolute bottom-8 left-6 right-6">
                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={creating}
                    className={`w-full bg-textMain py-5 rounded-full items-center drop-shadow-none ${creating ? 'opacity-70' : ''}`}
                >
                    <Text className="text-primary font-bold text-xl uppercase tracking-widest">
                        {creating ? 'Creating...' : 'Create Habit'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
