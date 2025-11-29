import { useCactusLM } from 'cactus-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createMemoryStore } from '../sdk/src';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isMemoryReady, setIsMemoryReady] = useState(false);
  const [memoryStats, setMemoryStats] = useState({ total: 0, preferences: 0 });
  const scrollViewRef = useRef<ScrollView>(null);
  
  const cactusLM = useCactusLM();
  const memoryRef = useRef(createMemoryStore({
    appId: 'com.example.empchat',
    debug: true,
  }));

  // Initialize memory and Cactus
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Setup memory
      const memory = memoryRef.current;
      const hasAccess = await memory.isReady();
      
      if (!hasAccess) {
        const granted = await memory.setup();
        if (!granted) {
          Alert.alert('Permission Required', 'Memory features require folder access');
          return;
        }
      }

      await memory.initialize();
      setIsMemoryReady(true);
      
      // Load memory stats
      await updateMemoryStats();

      // Download Cactus model if needed
      if (!cactusLM.isDownloaded) {
        Alert.alert('Downloading Model', 'Cactus LLM is downloading...');
        await cactusLM.download();
      }

      // Add welcome message
      setMessages([{
        role: 'system',
        content: '🧠 Memory-enabled chat ready! Your preferences and context are remembered across sessions.',
        timestamp: Date.now(),
      }]);

    } catch (error) {
      console.error('Initialization failed:', error);
      Alert.alert('Error', 'Failed to initialize app');
    }
  };

  const updateMemoryStats = async () => {
    try {
      const stats = await memoryRef.current.stats();
      const preferences = await memoryRef.current.read({ type: 'preference' });
      setMemoryStats({
        total: stats.totalEntries,
        preferences: preferences.length,
      });
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  };

  const getRelevantContext = async (userMessage: string): Promise<string> => {
    try {
      // Get recent memories and preferences
      const recentMemories = await memoryRef.current.read({
        since: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
        limit: 5,
      });

      const preferences = await memoryRef.current.read({
        type: 'preference',
        limit: 3,
      });

      // Search for relevant memories
      const searchResults = await memoryRef.current.search(userMessage);
      const relevantSearches = searchResults.slice(0, 2);

      const allContext = [...preferences, ...relevantSearches, ...recentMemories];
      const uniqueContext = Array.from(new Map(allContext.map(m => [m.id, m])).values());

      if (uniqueContext.length === 0) {
        return '';
      }

      return uniqueContext.map(m => m.content).join('; ');
    } catch (error) {
      console.error('Failed to get context:', error);
      return '';
    }
  };

  const extractMemoriesFromConversation = async (userMessage: string, aiResponse: string) => {
    try {
      // Simple heuristics to extract memories
      const memory = memoryRef.current;

      // Detect preferences
      if (userMessage.toLowerCase().includes('prefer') || 
          userMessage.toLowerCase().includes('like') ||
          userMessage.toLowerCase().includes('want')) {
        await memory.write({
          content: `User preference: ${userMessage}`,
          type: 'preference',
          tags: ['conversation', 'preference'],
        });
      }

      // Detect facts about user
      if (userMessage.toLowerCase().includes('i am') || 
          userMessage.toLowerCase().includes("i'm") ||
          userMessage.toLowerCase().includes('my name is')) {
        await memory.write({
          content: `User info: ${userMessage}`,
          type: 'fact',
          tags: ['conversation', 'personal'],
        });
      }

      // Store conversation context
      await memory.write({
        content: `Conversation: User said "${userMessage.substring(0, 100)}"`,
        type: 'conversation',
        tags: ['chat'],
        meta: { response: aiResponse.substring(0, 100) },
      });

      await updateMemoryStats();
    } catch (error) {
      console.error('Failed to extract memories:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !isMemoryReady) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const newUserMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      // Get context from memory
      const context = await getRelevantContext(userMessage);

      // Build messages for Cactus
      const cactusMessages = [
        {
          role: 'system' as const,
          content: context 
            ? `You are a helpful assistant. Context from previous conversations: ${context}. Use this context to provide personalized responses.`
            : 'You are a helpful assistant.',
        },
        {
          role: 'user' as const,
          content: userMessage,
        },
      ];

      // Get response from Cactus
      const result = await cactusLM.complete({
        messages: cactusMessages,
      });

      // Add assistant message
      const assistantMsg: Message = {
        role: 'assistant',
        content: result.response || cactusLM.completion || 'Sorry, I could not generate a response.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Extract and store memories
      await extractMemoriesFromConversation(userMessage, assistantMsg.content);

    } catch (error) {
      console.error('Send message failed:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const clearMemories = async () => {
    Alert.alert(
      'Clear Memories',
      'Are you sure you want to clear all stored memories?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await memoryRef.current.clear();
              await updateMemoryStats();
              Alert.alert('Success', 'All memories cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear memories');
            }
          },
        },
      ]
    );
  };

  if (cactusLM.isDownloading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          Downloading Cactus Model: {Math.round(cactusLM.downloadProgress * 100)}%
        </Text>
      </View>
    );
  }

  if (!isMemoryReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing Memory...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧠 EMP Chat</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {memoryStats.total} memories • {memoryStats.preferences} preferences
          </Text>
          <TouchableOpacity onPress={clearMemories} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
      >
        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              msg.role === 'system' && styles.systemBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.role === 'user' ? styles.userText : styles.assistantText,
              ]}
            >
              {msg.content}
            </Text>
            {msg.role !== 'system' && (
              <Text style={styles.timestamp}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFF',
  },
  assistantText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
