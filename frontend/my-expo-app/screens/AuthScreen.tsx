import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import axios from 'axios';
import { useAuth } from '../stores/useAuth'; // We will create this Zustand store
import { API_URL } from 'config'; // We will create this

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'Auth'>;
};

export default function AuthScreen({ navigation }: Props) {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { setToken, setUser } = useAuth(); // Assuming Zustand usage

    const handleAuth = async () => {
        if (!email || !password || (!isLogin && !name)) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/signup';
            const payload = isLogin ? { email, password } : { name, email, password };


            console.log("API URL:", `${API_URL}${endpoint}`);
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log(data);

            setToken(data.token);
            setUser(data.user);

            // Navigate to Home internally inside Auth screen or let top-level navigator handle it via auth state
            navigation.replace('Home');
        } catch (error: any) {
            console.error(error);
            Alert.alert("Authentication Failed", error.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background justify-center px-8"
        >
            <View className="items-center mb-10">
                <View className="mb-10 items-center">
                    <Text className="text-primary font-black text-5xl italic tracking-tighter mb-2">morn morn</Text>
                    <Text className="text-textMuted text-center font-medium">Build consistency. Win your mornings.</Text>
                </View>
                <Text className="text-textMain/70 text-lg mt-2">
                    {isLogin ? 'Welcome back, disciplined.' : 'Start your journey.'}
                </Text>
            </View>

            <View className="space-y-4">
                {!isLogin && (
                    <View className='mb-2'>
                        <Text className="text-textMain font-medium mb-1 ml-1">Name</Text>
                        <View className="w-full h-[52px] bg-surface px-4 rounded-2xl border border-surfaceLight drop-shadow-none justify-center">
                            <TextInput
                                placeholder="Your name"
                                placeholderTextColor="#cad2c5"
                                value={name}
                                onChangeText={setName}
                                className="flex-1 text-textMain text-base font-medium"
                            />
                        </View>
                    </View>
                )}

                <View className='mb-2'>
                    <Text className="text-textMain font-medium mb-1 ml-1">Email</Text>
                    <View className="w-full h-[52px] bg-surface px-4 rounded-2xl border border-surfaceLight drop-shadow-none justify-center">
                        <TextInput
                            placeholder="you@example.com"
                            placeholderTextColor="#cad2c5"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            className="flex-1 text-textMain text-base font-medium"
                        />
                    </View>
                </View>

                <View className="mb-2">
                    <Text className="text-textMain font-medium mb-1 ml-1">Password</Text>
                    <View className="w-full h-[52px] bg-surface px-4 rounded-2xl border border-surfaceLight drop-shadow-none justify-center">
                        <TextInput
                            placeholder="••••••••"
                            placeholderTextColor="#cad2c5"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            className="flex-1 text-textMain text-base font-medium"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleAuth}
                    disabled={loading}
                    className={`w-full bg-primary py-4 rounded-full items-center drop-shadow-none mt-4 ${loading ? 'opacity-70' : ''}`}
                >
                    <Text className="text-background font-bold text-lg">
                        {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mt-8">
                <Text className="text-textMain/70">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                    <Text className="text-primary font-semibold">
                        {isLogin ? "Sign Up" : "Sign In"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
