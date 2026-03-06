import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback, memo } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../stores/useAuth';
import { useFocusEffect } from '@react-navigation/native';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

interface Task {
    id: string;
    title: string;
    description: string;
    completeInHours: number;
    deadlineTimestamp: string;
    challengeStop: boolean;
    completed: boolean;
}

const CountdownTimer = memo(({ deadline }: { deadline: string }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const now = dayjs();
            const end = dayjs(deadline);
            const diffInfoHours = end.diff(now, 'hour');
            const diffInfoMinutes = end.diff(now, 'minute') % 60;
            const diffInfoSeconds = end.diff(now, 'second') % 60;

            if (end.isBefore(now)) {
                setTimeLeft('00h 00m left');
            } else {
                setTimeLeft(`${diffInfoHours}h ${diffInfoMinutes}m ${diffInfoSeconds}s left`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    return <Text className="text-textMain/60 mt-2 font-medium">{timeLeft}</Text>;
});

export default function HomeScreen({ navigation }: Props) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { token, logout } = useAuth();

    const currentMonthYear = dayjs().format('MMMM YYYY');

    // Generate dates for current week
    const dates = Array.from({ length: 14 }).map((_, i) => dayjs().subtract(7, 'day').add(i, 'day'));
    const currentDayStr = dayjs().format('YYYY-MM-DD');

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`${API_URL}/tasks/today`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(res.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTasks();
        }, [])
    );

    const renderTask = ({ item }: { item: Task }) => {
        const isActive = !item.challengeStop && !item.completed;

        return (
            <View className="bg-white rounded-3xl p-5 mb-4 drop-shadow-none border border-gray-300 flex-row items-center">
                {/* Status Icon */}
                <View className="mr-4">
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isActive ? 'border-green-500' : 'border-red-500'}`}>
                        <View className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'} ${isActive ? 'shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} />
                    </View>
                </View>

                {/* Content */}
                <View className="flex-1 mr-2">
                    <Text className="text-textMain font-bold text-lg" numberOfLines={1}>{item.title}</Text>
                    <Text className="text-textMain/70 text-sm mt-1" numberOfLines={1}>{item.description}</Text>
                    <CountdownTimer deadline={item.deadlineTimestamp} />
                </View>

                {/* Check Button */}
                {isActive && (
                    <TouchableOpacity
                        className="w-12 h-12 bg-gray-50 rounded-full justify-center items-center border border-gray-300 drop-shadow-none"
                        onPress={() => navigation.navigate('Verification', { taskId: item.id })}
                    >
                        <Feather name="check" size={24} color="#fac263" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background pt-14 pb-4">
            {/* Header */}
            <View className="px-6 mb-6 flex-row justify-between items-center">
                <Text className="text-textMain font-bold text-2xl uppercase tracking-widest">{currentMonthYear}</Text>
                <TouchableOpacity onPress={() => logout()}>
                    <Feather name="log-out" size={20} color="#242424" style={{ opacity: 0.5 }} />
                </TouchableOpacity>
            </View>

            {/* Calendar Strip */}
            <View className="mb-6">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                >
                    {dates.map((date, idx) => {
                        const isToday = date.format('YYYY-MM-DD') === currentDayStr;
                        return (
                            <View key={idx} className="items-center">
                                <Text className={`text-sm mb-2 ${isToday ? 'text-primary font-bold' : 'text-textMain/50'}`}>
                                    {date.format('dd')}
                                </Text>
                                <View className={`w-12 h-12 rounded-full justify-center items-center ${isToday ? 'bg-white border text-primary border-primary drop-shadow-none' : ''}`}>
                                    <Text className={`text-lg ${isToday ? 'text-primary font-bold' : 'text-textMain/80'}`}>
                                        {date.format('DD')}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Task List */}
            <View className="flex-1 px-6">
                {loading ? (
                    <ActivityIndicator size="large" color="#fac263" className="mt-10" />
                ) : tasks.length === 0 ? (
                    <View className="flex-1 justify-center items-center opacity-50">
                        <Text className="text-textMain text-lg text-center">No tasks for today. {"\n"}Create one!</Text>
                    </View>
                ) : (
                    <FlatList
                        data={tasks}
                        keyExtractor={item => item.id}
                        renderItem={renderTask}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}
            </View>

            {/* FAB */}
            <TouchableOpacity
                className="absolute bottom-8 right-6 w-16 h-16 bg-primary rounded-full justify-center items-center drop-shadow-none"
                onPress={() => navigation.navigate('HabitCreation')}
                activeOpacity={0.8}
            >
                <Feather name="plus" size={32} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}
