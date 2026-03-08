import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRef, useEffect } from 'react';
import { Video, ResizeMode } from 'expo-av';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_HEIGHT * 0.6;

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'Motivation'>;
};

export default function MotivationScreen({ navigation }: Props) {
    const videoRef = useRef<Video>(null);

    useEffect(() => {
        return () => {
            videoRef.current?.unloadAsync?.();
        };
    }, []);

    return (
        <View className="flex-1 bg-background">
            {/* Top ~60%: Video */}
            <View style={{ height: VIDEO_HEIGHT }} className="bg-surface overflow-hidden ">
                <Video
                    ref={videoRef}
                    source={require('../assets/taskcreated2.mp4')}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    isMuted
                    useNativeControls={false}
                />
            </View>

            {/* Border */}
            <View className="h-px bg-surfaceLight w-full" />

            {/* Bottom: Text + Button */}
            <View className="flex-1 bg-surface px-6 pt-8 pb-10  justify-around">
                <View className="items-center mb-4">
                    <Text className="text-primary font-medium text-5xl tracking-tighter text-left ">
                        Lets goooo, now get back to work
                    </Text>
                    <Text className="text-textMuted text-base text-left mt-4 leading-5 ">
                        The challenge has started and your stake is on the line complete the task and return to claim your crypto
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.replace('Home')}
                    activeOpacity={0.8}
                    className="w-full bg-primary py-5 rounded-2xl items-center justify-center border border-surfaceLight"
                >
                    <Text className="text-background font-bold text-lg uppercase tracking-widest">
                        Continue
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
