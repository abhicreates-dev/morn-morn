import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Video, ResizeMode } from 'expo-av';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_AREA_HEIGHT = SCREEN_HEIGHT * 0.42;

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif' });

export default function OnboardingScreen({ navigation }: Props) {
    const [isHolding, setIsHolding] = useState(false);
    const progress = useSharedValue(0);
    const cardOpacity = useSharedValue(0);
    const cardScale = useSharedValue(0.96);

    useEffect(() => {
        cardOpacity.value = withTiming(1, { duration: 500 });
        cardScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    }, []);

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
            progress.value = withTiming(
                1,
                { duration: 2000, easing: Easing.linear },
                (finished) => {
                    if (finished) {
                        runOnJS(completeAction)();
                    }
                }
            );
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

    const progressBarStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
        transform: [{ scale: cardScale.value }],
    }));

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.wrapper}>
                {/* Breathing space: looping background video (slightly larger area) */}
                <View style={styles.videoArea}>
                    <Video
                        source={require('../assets/onboarding.mp4')}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted
                        useNativeControls={false}
                    />
                </View>

                {/* Hint */}
               

                {/* Centered large squircle card with typography hierarchy */}
                <Animated.View
                    style={[
                        styles.squircleCard,
                        Platform.OS === 'ios' && styles.cardShadow,
                        cardAnimatedStyle,
                    ]}
                >
                    <Text style={[styles.smallSerif, { fontFamily: SERIF }]}>
                        I make a promise
                    </Text>
                    <Text style={[styles.largeBoldSerif, { fontFamily: SERIF }]}>
                        to myself.
                    </Text>
                    <View style={styles.spacing} />
                    <Text style={[styles.smallLightSerif, { fontFamily: SERIF }]}>
                        I will not lie to myself
                    </Text>
                    <Text style={[styles.largeBoldSerifLast, { fontFamily: SERIF }]}>
                        I will become better every day
                    </Text>
                </Animated.View>

                {/* Hold to accept - unchanged */}
                <View style={styles.holdSection}>
                    <GestureDetector gesture={longPressGesture}>
                        <View
                            style={[
                                styles.holdButton,
                                Platform.OS === 'ios' && styles.buttonShadow,
                            ]}
                        >
                            <Animated.View
                                style={[styles.progressFill, progressBarStyle]}
                            />
                            <Text style={styles.holdButtonText}>
                                {isHolding ? 'Keep holding...' : 'Hold to Accept'}
                            </Text>
                        </View>
                    </GestureDetector>
                    <Text style={styles.holdHint}>
                        PRESS AND HOLD TO GET STARTED
                    </Text>
                </View>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    wrapper: {
        flex: 1,
        backgroundColor: '#334B54',
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 32,
    },
    videoArea: {
        height: VIDEO_AREA_HEIGHT,
        width: '100%',
        overflow: 'hidden',
        marginBottom: 20,
        borderRadius: 20,
        backgroundColor: '#354f52',
    },
    hint: {
        fontSize: 14,
        color: '#cad2c5',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 24,
    },
    squircleCard: {
        paddingVertical: 32,
        paddingHorizontal: 28,
        borderRadius: 72,
        backgroundColor: '#354f52',
        borderWidth: 0.5,
        borderColor: '#52796f',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
    },
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
        elevation: 8,
    },
    smallSerif: {
        fontSize: 12,
        color: '#cad2c5',
        textAlign: 'center',
        fontWeight: '400',
    },
    largeBoldSerif: {
        fontSize: 24,
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: '700',
        marginTop: 4,
    },
    smallLightSerif: {
        fontSize: 15,
        color: '#cad2c5',
        textAlign: 'center',
        fontWeight: '300',
    },
    spacing: {
        height: 20,
    },
    largeBoldSerifLast: {
        fontSize: 24,
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: '700',
        marginTop: 8,
    },
    holdSection: {
        alignItems: 'center',
    },
    holdButton: {
        width: '100%',
        maxWidth: 340,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        justifyContent: 'center',
        backgroundColor: '#354f52',
        borderWidth: 0.5,
        borderColor: '#52796f',
    },
    progressFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#84a98c',
        borderRadius: 28,
    },
    holdButtonText: {
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
        zIndex: 10,
    },
    buttonShadow: {
        shadowColor: '#84a98c',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    holdHint: {
        color: '#cad2c5',
        fontSize: 11,
        marginTop: 12,
        letterSpacing: 1.2,
        fontWeight: '500',
    },
});
