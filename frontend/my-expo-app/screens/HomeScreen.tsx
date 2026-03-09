import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback, useRef, memo } from 'react';
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
                setTimeLeft('00:00:00');
            } else {
                const pad = (n: number) => n.toString().padStart(2, '0');
                setTimeLeft(`${pad(diffInfoHours)}:${pad(diffInfoMinutes)}:${pad(diffInfoSeconds)}`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    return <Text className="text-textMain/80 font-medium text-xl tracking-widest">{timeLeft}</Text>;
});

export default function HomeScreen({ navigation }: Props) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { token, logout, user } = useAuth();

    const getOrdinalNum = (n: number) => {
        return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
    };

    const firstName = user?.name ? user.name.split(' ')[0] : '';
    const dayVar = dayjs().date();
    const formattedDate = `${getOrdinalNum(dayVar)} ${dayjs().format('MMMM')}`;

    // Past 7 days + today + next 13 days (scroll left for old dates, today visible by default)
    const dates = Array.from({ length: 21 }).map((_, i) => dayjs().subtract(7, 'day').add(i, 'day'));
    const currentDayStr = dayjs().format('YYYY-MM-DD');
    const calendarRef = useRef<ScrollView>(null);
    const DATE_ITEM_WIDTH = 48 + 12; // w-12 + gap
    const TODAY_INDEX = 7;

    useEffect(() => {
        const t = setTimeout(() => {
            calendarRef.current?.scrollTo({ x: TODAY_INDEX * DATE_ITEM_WIDTH, animated: false });
        }, 100);
        return () => clearTimeout(t);
    }, []);

    const fetchTasks = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
    
        try {
            const res = await axios.get(`${API_URL}/tasks/today`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            console.log("TASKS FROM API:", res.data);   // 👈 ADD THIS
    
            setTasks(res.data);
        } catch (error: any) {
            if (error?.response?.status === 401) {
                logout();
                navigation.replace('Auth');
            } else {
                console.error('Error fetching tasks:', error);
                setTasks([]);
            }
        } finally {
            setLoading(false);
        }
    }, [token, logout, navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchTasks();
        }, [fetchTasks])
    );

    const renderTask = ({ item }: { item: Task }) => {
        const isActive = !item.challengeStop && !item.completed;
        const isFailed = item.challengeStop && !item.completed;
        const isSuccess = item.completed;

        let backLayerClass = 'bg-surfaceLight/80';
        if (isSuccess) backLayerClass = 'bg-primary/80';
        else if (isFailed) backLayerClass = 'bg-red-500/80';

        return (
            <View className="mb-6 pl-1 pb-2">
                <View className="relative">
                    {/* Background layer */}
                    <View className={`absolute top-0 -left-1 right-0 h-full rounded-2xl ${backLayerClass}`} />

                    {/* Main Foreground Card */}
                    <View className="bg-surface rounded-2xl py-4 px-5 relative z-10 w-full ml-0 border border-surfaceLight/30">
                        {/* Header Row */}
                        <View className="flex-row justify-between items-start mb-1 mt-1">
                            <Text className="text-textMain font-medium tracking-tight text-[18px] flex-1 mr-4 leading-tight" numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Feather name="arrow-up-right" size={20} color="#cad2c5" />
                        </View>

                        {/* Description (approx 60% width) */}
                        <View className="w-[65%] mb-2">
                            <Text className="text-textMuted text-base leading-snug" numberOfLines={1}>
                                {item.description}
                            </Text>
                        </View>

                        {/* Footer Row */}
                        <View className="flex-row justify-between items-end mt-1">
                            <View className="flex-1 justify-end">
                                <CountdownTimer deadline={item.deadlineTimestamp} />
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity
                                disabled={!isActive}
                                className={`px-5 py-2 rounded-2xl border flex-row items-center ml-4 ${isActive ? 'border-surfaceLight bg-surface' : 'border-surfaceLight/50 bg-background/50 opacity-60'}`}
                                onPress={() => navigation.navigate('Verification', { taskId: item.id, taskTitle: item.title, taskDescription: item.description })}
                            >
                                <Text className="text-textMain font-medium mr-2 text-base w-20 text-center">
                                    {isSuccess ? 'Done' : 'Complete'}
                                </Text>
                                <View className="ml-1 justify-center items-center">
                                    <Feather name="arrow-up-right" size={18} color="#cad2c5" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background pt-14 pb-4">
            {/* Header */}
            <View className="px-6 mb-6 flex-row justify-between items-start mt-2">
                <View>
                    <Text className="text-textMain font-semibold text-2xl tracking-tight leading-tight mb-1">Welcome, {firstName}</Text>
                    <Text className="text-textMuted font-medium">{formattedDate} 2026</Text>
                </View>
                <TouchableOpacity onPress={() => { logout(); navigation.replace('Auth'); }} className="mt-1">
                    <Feather name="log-out" size={20} color="#cad2c5" />
                </TouchableOpacity>
            </View>

            {/* Calendar Strip */}
            <View className="mb-6">
                <ScrollView
                    ref={calendarRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                >
                    {dates.map((date, idx) => {
                        const isToday = date.format('YYYY-MM-DD') === currentDayStr;
                        return (
                            <View key={idx} className="items-center">
                                <Text className={`text-sm mb-2 ${isToday ? 'text-textMain font-semibold' : 'text-textMuted'}`}>
                                    {date.format('dd')}
                                </Text>
                                <View className={`w-12 h-12  rounded-md justify-center items-center ${isToday ? 'bg-primary drop-shadow-none' : 'bg-surface'}`}>
                                    <Text className={`text-lg ${isToday ? 'text-background font-semibold' : 'text-textMuted font-medium'}`}>
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
                    <ActivityIndicator size="large" color="#84a98c" className="mt-10" />
                ) : tasks.length === 0 ? (
                    <View className="flex-1 justify-center items-center opacity-50">
                        <Text className="text-textMuted text-lg text-center">No tasks for today. {"\n"}Create one!</Text>
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
                <Feather name="plus" size={32} color="#2f3e46" />
            </TouchableOpacity>
        </View>
    );
}
