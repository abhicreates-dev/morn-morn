import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import axios from 'axios';
import { useAuth } from '../stores/useAuth'; // We will create this Zustand store
import { API_URL } from '../config';

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

            const response = await axios.post(`${API_URL}${endpoint}`, payload, {
                headers: { 'Content-Type': 'application/json' },
            });

            const data = response.data;

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
                <View className="w-20 h-20 bg-primary/20 rounded-full justify-center items-center mb-4">
                    <Text className="text-primary text-3xl">☀️</Text>
                </View>
                <Text className="text-textMain text-4xl font-bold">Morn Morn</Text>
                <Text className="text-textMain/70 text-lg mt-2">
                    {isLogin ? 'Welcome back, disciplined.' : 'Start your journey.'}
                </Text>
            </View>

            <View className="space-y-4">
                {!isLogin && (
                    <View>
                        <Text className="text-textMain font-medium mb-1 ml-1">Name</Text>
                        <TextInput
                            placeholder="Your name"
                            value={name}
                            onChangeText={setName}
                            className="w-full bg-white px-4 py-3 rounded-2xl border border-gray-200 text-textMain"
                            placeholderTextColor="#a0aec0"
                        />
                    </View>
                )}

                <View>
                    <Text className="text-textMain font-medium mb-1 ml-1">Email</Text>
                    <TextInput
                        placeholder="you@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="w-full bg-white px-4 py-3 rounded-2xl border border-gray-200 text-textMain"
                        placeholderTextColor="#a0aec0"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-textMain font-medium mb-1 ml-1">Password</Text>
                    <TextInput
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        className="w-full bg-white px-4 py-3 rounded-2xl border border-gray-200 text-textMain"
                        placeholderTextColor="#a0aec0"
                    />
                </View>

                <TouchableOpacity
                    onPress={handleAuth}
                    disabled={loading}
                    className={`w-full bg-primary py-4 rounded-full items-center shadow-sm ${loading ? 'opacity-70' : ''}`}
                >
                    <Text className="text-textMain font-bold text-lg">
                        {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mt-8">
                <Text className="text-textMain/70">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                    <Text className="text-primary font-bold">
                        {isLogin ? "Sign Up" : "Sign In"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
