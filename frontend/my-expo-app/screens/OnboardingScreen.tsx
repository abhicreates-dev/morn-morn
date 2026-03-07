import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export default function OnboardingScreen({ navigation }: Props) {
    const [isHolding, setIsHolding] = useState(false);
    const progress = useSharedValue(0);

    const resetProgress = () => {
        'worklet';
        progress.value = withTiming(0, { duration: 300 });
        runOnJS(setIsHolding)(false);
    };

    const completeAction = () => {
        navigation.replace('Auth');
    };

    const longPressGesture = Gesture.LongPress()
        .minDuration(2000)
        .onStart(() => {
            'worklet';
            runOnJS(setIsHolding)(true);
            progress.value = withTiming(1, {
                duration: 2000,
                easing: Easing.linear
            }, (finished) => {
                if (finished) {
                    runOnJS(completeAction)();
                }
            });
        })
        .onEnd(() => {
            'worklet';
            if (progress.value < 1) {
                resetProgress();
            }
        })
        .onFinalize(() => {
            'worklet';
            if (progress.value < 1) {
                resetProgress();
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progress.value * 100}%`,
        };
    });

    return (
        <GestureHandlerRootView style={styles.container}>
            <View className="flex-1 bg-background justify-center items-center px-6">
                {/* Placeholder for vector art */}
                <View className="w-48 h-48 bg-surface rounded-full items-center justify-center mb-12 border border-surfaceLight">
                    <Text className="text-primary text-6xl">✨</Text>
                </View>

                <Text className="text-textMain text-3xl font-semibold mb-6 text-center">
                    I make a promise to myself.
                </Text>

                <Text className="text-textMuted text-lg text-center mb-2 leading-relaxed">
                    I will not lie to myself.
                </Text>
                <Text className="text-textMuted text-lg text-center mb-16 leading-relaxed">
                    I will become better every day.
                </Text>

                <GestureDetector gesture={longPressGesture}>
                    <View className="w-full max-w-xs h-16 bg-surfaceLight rounded-full overflow-hidden justify-center relative active:opacity-90">
                        <Animated.View
                            className="absolute left-0 top-0 bottom-0 bg-primary"
                            style={animatedStyle}
                        />
                        <Text className="text-textMain text-center font-semibold text-lg z-10">
                            {isHolding ? "Keep holding..." : "Hold to Accept"}
                        </Text>
                    </View>
                </GestureDetector>
                <Text className="text-textMuted text-sm mt-4">Hold for 2 seconds</Text>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
});
