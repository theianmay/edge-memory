import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { EdgeMemoryEntry } from '../sdk/src';
import { createMemoryStore } from '../sdk/src';

export default function MemoriesScreen() {
  const [memories, setMemories] = useState<EdgeMemoryEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'preference' | 'fact' | 'conversation'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [memory] = useState(() => createMemoryStore({
    appId: 'com.caesiusbay.empchat',
    debug: true,
  }));

  useEffect(() => {
    loadMemories();
  }, [filter]);

  const loadMemories = async () => {
    try {
      // Try to initialize if not already
      try {
        const isReady = await memory.isReady();
        if (!isReady) {
          await memory.setup();
        }
        await memory.initialize();
      } catch (initError: any) {
        console.log('Memory not initialized:', initError.message);
        setMemories([]);
        return;
      }
      
      const filterOptions = filter === 'all' 
        ? {} 
        : { type: filter };
      
      const data = await memory.read(filterOptions);
      setMemories(data);
    } catch (error: any) {
      console.error('Failed to load memories:', error);
      Alert.alert('Error', `Could not load memories: ${error.message || 'Unknown error'}`);
      setMemories([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemories();
    setRefreshing(false);
  };

  const deleteMemory = (id: string) => {
    Alert.alert(
      'Delete Memory',
      'Are you sure you want to delete this memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await memory.delete(id);
              await loadMemories();
              Alert.alert('Success', 'Memory deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete memory');
            }
          },
        },
      ]
    );
  };

  const exportMemories = async () => {
    try {
      const exported = await memory.export();
      Alert.alert('Export', `Exported ${memories.length} memories to console`);
      console.log('Exported memories:', exported);
    } catch (error) {
      Alert.alert('Error', 'Failed to export memories');
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'preference': return '#007AFF';
      case 'fact': return '#34C759';
      case 'conversation': return '#FF9500';
      case 'event': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'preference': return '⚙️';
      case 'fact': return '📌';
      case 'conversation': return '💬';
      case 'event': return '📅';
      default: return '📝';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Memory Store</Text>
        <Text style={styles.headerSubtitle}>{memories.length} memories stored</Text>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'preference', 'fact', 'conversation'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.exportButton} onPress={exportMemories}>
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Memories List */}
      <ScrollView
        style={styles.memoriesList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {memories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No memories yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start chatting to create memories
            </Text>
          </View>
        ) : (
          memories.map((mem) => (
            <View key={mem.id} style={styles.memoryCard}>
              <View style={styles.memoryHeader}>
                <View style={styles.memoryTypeContainer}>
                  <Text style={styles.memoryIcon}>{getTypeIcon(mem.type)}</Text>
                  <View
                    style={[
                      styles.memoryTypeBadge,
                      { backgroundColor: getTypeColor(mem.type) },
                    ]}
                  >
                    <Text style={styles.memoryTypeText}>
                      {mem.type || 'note'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => deleteMemory(mem.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.memoryContent}>{mem.content}</Text>

              {mem.tags && mem.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {mem.tags.map((tag, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.memoryFooter}>
                <Text style={styles.memoryTimestamp}>
                  {new Date(mem.ts).toLocaleString()}
                </Text>
                <Text style={styles.memorySource}>{mem.src}</Text>
              </View>

              {mem.meta && Object.keys(mem.meta).length > 0 && (
                <View style={styles.metaContainer}>
                  <Text style={styles.metaLabel}>Metadata:</Text>
                  <Text style={styles.metaText}>
                    {JSON.stringify(mem.meta, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  filterContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
  },
  exportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#34C759',
    marginLeft: 8,
  },
  exportButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  memoriesList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  memoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memoryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  memoryTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  memoryTypeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  memoryContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  memoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  memoryTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  memorySource: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  metaContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
});
