import { View, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { getDeepSeekResponse } from '@/services/deepseek';

const { width } = Dimensions.get('window');

const CHAT_LIST = [
  {
    id: '1',
    name: 'Carla Schoen',
    message: 'Perfect, will check it',
    time: '09:34 PM',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&q=80',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Sheila Lemke',
    message: 'Thanks',
    time: '09:34 PM',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&q=80',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Deanna Botsford V',
    message: 'Welcome!',
    time: '09:34 PM',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&q=80',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Mr. Katie Bergnaum',
    message: 'Good Morning!',
    time: '09:34 PM',
    avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=100&h=100&q=80',
    isOnline: true,
  },
  {
    id: '5',
    name: 'Armando Ferry',
    message: 'Share image Please!',
    time: '09:34 PM',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&q=80',
    isOnline: false,
  },
  {
    id: '6',
    name: 'Annette Fritsch',
    message: 'Thanks!',
    time: '09:34 PM',
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=100&h=100&q=80',
    isOnline: true,
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const askDeepSeek = async () => {
    try {
      setIsLoading(true);
      const result = await getDeepSeekResponse([
        {
          role: 'user',
          content: 'What are some good restaurants in New York?'
        }
      ]);
      setResponse(result.choices[0].message.content);
    } catch (error) {
      console.error('DeepSeek error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Chat</ThemedText>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Restaurant Owner"
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {/* Chat List */}
      <ScrollView 
        style={styles.chatList}
        showsVerticalScrollIndicator={false}
      >
        {CHAT_LIST.map((chat) => (
          <TouchableOpacity 
            key={chat.id}
            style={styles.chatItem}
            onPress={() => router.push('/chat-detail')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: chat.avatar }} 
                style={styles.avatar}
              />
              {chat.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <ThemedText style={styles.chatName}>{chat.name}</ThemedText>
                <ThemedText style={styles.chatTime}>{chat.time}</ThemedText>
              </View>
              <ThemedText style={styles.chatMessage}>{chat.message}</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ThemedText>{isLoading ? 'Loading...' : response}</ThemedText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#6B4EFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '500',
  },
  chatTime: {
    fontSize: 12,
    color: '#666',
  },
  chatMessage: {
    fontSize: 14,
    color: '#666',
  },
}); 