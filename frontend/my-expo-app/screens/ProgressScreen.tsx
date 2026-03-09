import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useState, useCallback } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../stores/useAuth';
import { useFocusEffect } from '@react-navigation/native';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'Progress'>;
};

interface ProgressTask {
    id: string;
    dateCreated: string;
    completed: boolean;
}

export default function ProgressScreen({ navigation }: Props) {
    const [tasks, setTasks] = useState<ProgressTask[]>([]);
    const [loading, setLoading] = useState(true);
    const { token, logout } = useAuth();

    const fetchProgress = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await axios.get(`${API_URL}/tasks/progress`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTasks(res.data);
        } catch (error: any) {
            if (error?.response?.status === 401) {
                logout();
                navigation.replace('Auth');
            } else {
                setTasks([]);
            }
        } finally {
            setLoading(false);
        }
    }, [token, logout, navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchProgress();
        }, [fetchProgress])
    );

    const last7Days = Array.from({ length: 7 }).map((_, i) => dayjs().subtract(6 - i, 'day'));
    const createdTotal = tasks.length;
    const completedTotal = tasks.filter((t) => t.completed).length;
    const completionPct = createdTotal > 0 ? Math.round((completedTotal / createdTotal) * 100) : 0;

    const completedByDay: Record<string, number> = {};
    last7Days.forEach((d) => {
        const key = d.format('YYYY-MM-DD');
        completedByDay[key] = tasks.filter(
            (t) => dayjs(t.dateCreated).format('YYYY-MM-DD') === key && t.completed
        ).length;
    });

    if (loading) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color="#84a98c" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background pt-14 pb-8">
            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                {/* Header with back + Progress */}
                <View className="flex-row justify-between items-center mb-6 mt-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                        <Feather name="arrow-left" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text className="text-textMain text-lg">Progress</Text>
                    <View className="w-10" />
                </View>

                {/* 1. Progress header: Fire Streak UI */}
                <View className="items-center mb-10 mt-6 relative">
                    <View className="relative items-center justify-center">
                        <View className='rounded-2xl overflow-hidden'>
                            <Video
                                source={require('../assets/fire3.mp4')}
                                style={{ width: 192, height: 192 }}
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay
                                isLooping
                                isMuted
                                useNativeControls={false}
                            />
                        </View>
                        <View className="absolute -bottom-6 bg-surface px-6 py-1 rounded-2xl border-[6px] border-background items-center justify-center">
                            <Text className="text-textMain font-black text-[64px] tracking-tighter leading-tight h-[72px]">
                                {completedTotal}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-textMain font-bold text-2xl mt-10">Tasks streak!</Text>
                </View>

                {/* 2. 7-day calendar row with tasks completed per day */}
                <View className="mb-8">
                    <Text className="text-textMuted text-sm mb-3">Last 7 days</Text>
                    <View className="flex-row justify-between">
                        {last7Days.map((date, idx) => {
                            const key = date.format('YYYY-MM-DD');
                            const count = completedByDay[key] ?? 0;
                            return (
                                <View key={idx} className="items-center flex-1">
                                    <Text className="text-textMuted text-xs mb-2">
                                        {date.format('dd')}
                                    </Text>
                                    <View className="w-12 h-12 rounded-md bg-surface  justify-center items-center">
                                        <Text className="text-textMain text-lg">
                                            {count}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* 3. Task Milestone: progress bar */}
                <View className="mb-8">
                    <Text className="text-textMain text-base mb-4">Task Milestone</Text>
                    <View className="h-3 bg-surface rounded-full overflow-hidden border border-surfaceLight">
                        <View
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${completionPct}%` }}
                        />
                    </View>
                    <Text className="text-textMuted text-sm mt-2">
                        {completedTotal} of {createdTotal} tasks completed
                    </Text>
                </View>

                {/* 4. Created vs Completed cards */}
                <View className="flex-row gap-4">
                    <View className="flex-1 bg-surface rounded-2xl  p-4">
                        <View className="flex-row items-center gap-2 mb-1">
                            <Feather name="file-plus" size={18} color="#84a98c" />
                            <Text className="text-textMuted text-sm">Created</Text>
                        </View>
                        <Text className="text-textMain text-2xl">{createdTotal}</Text>
                        <Text className="text-textMuted text-sm">tasks (last 7 days)</Text>
                    </View>
                    <View className="flex-1 bg-surface rounded-2xl  p-4">
                        <View className="flex-row items-center gap-2 mb-1">
                            <Feather name="check-circle" size={18} color="#84a98c" />
                            <Text className="text-textMuted text-sm">Completed</Text>
                        </View>
                        <Text className="text-textMain text-2xl">{completedTotal}</Text>
                        <Text className="text-textMuted text-sm">tasks (last 7 days)</Text>
                    </View>
                </View>
                <View className="mt-4 bg-surface rounded-2xl  p-4">
                    <View className="flex-row items-center gap-2 mb-1">
                        <Feather name="trending-up" size={18} color="#84a98c" />
                        <Text className="text-textMuted text-sm">Progress</Text>
                    </View>
                    <Text className="text-textMain text-2xl">{completionPct}%</Text>
                    <Text className="text-textMuted text-sm">completion rate</Text>
                </View>
            </ScrollView>
        </View>
    );
}
