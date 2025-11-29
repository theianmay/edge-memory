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
import { colors, radius, shadows, spacing, typography } from './theme';

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
    appId: 'com.caesiusbay.empchat',
    debug: true,
  }));

  // Initialize memory and Cactus
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    let memoryInitialized = false;
    
    try {
      // Setup memory with better error handling
      const memory = memoryRef.current;
      
      try {
        const hasAccess = await memory.isReady();
        
        if (!hasAccess) {
          const granted = await memory.setup();
          if (!granted) {
            console.log('Memory access not granted, continuing without persistence');
            Alert.alert(
              'Limited Mode',
              'Memory features require folder access. App will work but memories won\'t persist.',
              [{ text: 'OK' }]
            );
          } else {
            await memory.initialize();
            memoryInitialized = true;
          }
        } else {
          await memory.initialize();
          memoryInitialized = true;
        }
        
        if (memoryInitialized) {
          await updateMemoryStats();
        }
      } catch (memError: any) {
        console.error('Memory initialization error:', memError);
        Alert.alert(
          'Memory Error',
          `Could not initialize memory: ${memError.message || 'Unknown error'}. Continuing without persistence.`,
          [{ text: 'OK' }]
        );
      }

      // Always set ready so app can be used
      setIsMemoryReady(true);

      // Download Cactus model if needed
      try {
        if (!cactusLM.isDownloaded) {
          console.log('Downloading Cactus model...');
          await cactusLM.download();
        }
      } catch (cactusError: any) {
        console.error('Cactus download error:', cactusError);
        Alert.alert(
          'Model Download Failed',
          `Could not download Cactus model: ${cactusError.message || 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      }

      // Add welcome message
      const welcomeMsg = memoryInitialized
        ? '🧠 Memory-enabled chat ready! Your preferences and context are remembered across sessions.'
        : '💬 Chat ready! Note: Memory persistence is disabled.';
      
      setMessages([{
        role: 'system',
        content: welcomeMsg,
        timestamp: Date.now(),
      }]);

    } catch (error: any) {
      console.error('Initialization failed:', error);
      setIsMemoryReady(true); // Still allow app to be used
      Alert.alert(
        'Initialization Error',
        `App started with limited features: ${error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
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
        try {
          await memory.write({
            content: `User preference: ${userMessage}`,
            type: 'preference',
            tags: ['conversation', 'preference'],
          });
        } catch (writeError) {
          console.log('Could not write preference memory:', writeError);
        }
      }

      // Detect facts about user
      if (userMessage.toLowerCase().includes('i am') || 
          userMessage.toLowerCase().includes("i'm") ||
          userMessage.toLowerCase().includes('my name is')) {
        try {
          await memory.write({
            content: `User info: ${userMessage}`,
            type: 'fact',
            tags: ['conversation', 'personal'],
          });
        } catch (writeError) {
          console.log('Could not write fact memory:', writeError);
        }
      }

      // Store conversation context
      try {
        await memory.write({
          content: `Conversation: User said "${userMessage.substring(0, 100)}"`,
          type: 'conversation',
          tags: ['chat'],
          meta: { response: aiResponse.substring(0, 100) },
        });
      } catch (writeError) {
        console.log('Could not write conversation memory:', writeError);
      }

      try {
        await updateMemoryStats();
      } catch (statsError) {
        console.log('Could not update memory stats:', statsError);
      }
    } catch (error) {
      console.error('Failed to extract memories:', error);
      // Don't show alert - this is background operation
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
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.loadingText}>
          Downloading Cactus Model: {Math.round(cactusLM.downloadProgress * 100)}%
        </Text>
      </View>
    );
  }

  if (!isMemoryReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
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
    backgroundColor: colors.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.base,
    color: colors.text.secondary,
  },
  header: {
    backgroundColor: colors.bg.secondary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: typography.sm,
    color: colors.text.secondary,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.error,
    borderRadius: radius.sm,
  },
  clearButtonText: {
    color: colors.text.primary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  messagesContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: colors.accent.subtle,
    borderWidth: 1,
    borderColor: colors.accent.primary + '40',
  },
  messageText: {
    fontSize: typography.base,
    lineHeight: typography.base * typography.normal,
  },
  userText: {
    color: colors.text.primary,
  },
  assistantText: {
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: typography.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.base,
    color: colors.text.primary,
    maxHeight: 100,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sendButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.bg.tertiary,
  },
  sendButtonText: {
    color: colors.text.primary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
});
