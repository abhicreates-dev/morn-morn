import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRef, useEffect } from 'react';
import { Video, ResizeMode } from 'expo-av';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_HEIGHT * 0.6;

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'Result'>;
    route: RouteProp<RootStackParamList, 'Result'>;
};

export default function ResultScreen({ navigation, route }: Props) {
    const { success } = route.params;
    const videoRef = useRef<Video>(null);

    useEffect(() => {
        return () => {
            videoRef.current?.unloadAsync?.();
        };
    }, []);

    const heading = success ? 'YOU WON' : 'YOU LOST';
    const subheading = success
        ? 'Your 0.01 SOL has been returned to your wallet.'
        : 'Your 0.01 SOL has been awarded to the one who completed it.';

    return (
        <View className="flex-1 bg-background">
            {/* Top ~60%: Video */}
            <View style={{ height: VIDEO_HEIGHT }} className="bg-surface overflow-hidden">
                <Video
                    ref={videoRef}
                    source={success ? require('../assets/challengewon.mp4') : require('../assets/challengelost.mp4')}
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
            <View className="flex-1 bg-background px-6 pt-8 pb-10 justify-between">
                <View className="items-center">
                    <Text className={`font-bold text-6xl tracking-tighter text-center  ${success ? 'text-primary' : 'text-red-500'}`}>
                        {heading}
                    </Text>
                    <Text className="text-textMuted text-xs text-center mt-4 leading-5 max-w-sm">
                        {subheading}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.replace('Home')}
                    activeOpacity={0.8}
                    className={`w-full py-5 rounded-2xl items-center justify-center border ${success ? 'bg-primary border-surfaceLight' : 'bg-red-500 border-red-400'}`}
                >
                    <Text className="text-background font-bold text-lg uppercase tracking-widest">
                        Back to Home
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
