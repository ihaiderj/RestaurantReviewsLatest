import { View, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const CHAT_USER = {
  name: 'Bessie Cooper',
  status: 'Online',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&q=80',
};

const MESSAGES = [
  {
    id: '1',
    text: 'Lorem ipsum is simply dummy text of the printing and typesetting industry.',
    time: '08:04 pm',
    sender: 'Bessie Cooper',
    type: 'text',
  },
  {
    id: '2',
    text: 'Lorem ipsum is simply dummy text of the printing and typesetting industry.',
    time: '08:04 pm',
    sender: 'Esther Howard',
    type: 'text',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80',
    time: '08:04 pm',
    sender: 'Bessie Cooper',
    type: 'image',
  },
  {
    id: '4',
    audio: 'audio-file.mp3',
    duration: '0:13',
    time: '08:04 pm',
    sender: 'Esther Howard',
    type: 'audio',
  },
];

export default function ChatDetailScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');

  const renderMessage = (msg: any) => {
    const isOwn = msg.sender === 'Bessie Cooper';
    
    switch (msg.type) {
      case 'text':
        return (
          <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
            <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
              <ThemedText style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
                {msg.text}
              </ThemedText>
            </View>
            <ThemedText style={styles.messageTime}>{msg.time}</ThemedText>
            {!isOwn && (
              <Image source={{ uri: CHAT_USER.avatar }} style={styles.messageAvatar} />
            )}
          </View>
        );
      
      case 'image':
        return (
          <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
            <View style={[styles.imageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
              <Image source={{ uri: msg.image }} style={styles.messageImage} />
            </View>
            <ThemedText style={styles.messageTime}>{msg.time}</ThemedText>
            {!isOwn && (
              <Image source={{ uri: CHAT_USER.avatar }} style={styles.messageAvatar} />
            )}
          </View>
        );
      
      case 'audio':
        return (
          <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
            <View style={[styles.audioBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
              <TouchableOpacity style={styles.audioPlayButton}>
                <Ionicons name="play" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={styles.audioWaveform}>
                {/* Audio waveform visualization */}
                <View style={styles.waveformBar} />
              </View>
              <ThemedText style={styles.audioDuration}>{msg.duration}</ThemedText>
            </View>
            <ThemedText style={styles.messageTime}>{msg.time}</ThemedText>
            {!isOwn && (
              <Image source={{ uri: CHAT_USER.avatar }} style={styles.messageAvatar} />
            )}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Image source={{ uri: CHAT_USER.avatar }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <ThemedText style={styles.userName}>{CHAT_USER.name}</ThemedText>
            <ThemedText style={styles.userStatus}>{CHAT_USER.status}</ThemedText>
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Date Separator */}
      <View style={styles.dateSeparator}>
        <ThemedText style={styles.dateText}>TODAY</ThemedText>
      </View>

      {/* Messages */}
      <ScrollView 
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {MESSAGES.map((msg) => (
          <View key={msg.id}>
            {renderMessage(msg)}
          </View>
        ))}
      </ScrollView>

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add" size={24} color="#666" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message here..."
          placeholderTextColor="#666"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton}>
          <Ionicons name="mic" size={24} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#6B4EFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userStatus: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  menuButton: {
    padding: 8,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  ownBubble: {
    backgroundColor: '#6B4EFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 8,
  },
  imageBubble: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 16,
  },
  audioBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
    minWidth: 200,
  },
  audioPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B4EFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  audioWaveform: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  waveformBar: {
    height: 2,
    backgroundColor: '#6B4EFF',
  },
  audioDuration: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  attachButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
    backgroundColor: '#6B4EFF',
    borderRadius: 20,
    marginLeft: 8,
  },
}); 