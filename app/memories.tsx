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
import { getMemoryStore } from './memoryStore';
import { colors, getTypeColor, getTypeIcon, radius, shadows, spacing, typography } from './theme';

export default function MemoriesScreen() {
  const [memories, setMemories] = useState<EdgeMemoryEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'preference' | 'fact' | 'conversation'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const memory = getMemoryStore();

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
      Alert.alert(
        'Exported to Console',
        `${memories.length} memories exported as JSON.\nCheck the console/logs to view.`,
        [{ text: 'OK' }]
      );
      console.log('📋 Exported memories (JSON):', exported);
    } catch (error) {
      Alert.alert('Error', 'Failed to export memories');
    }
  };

  // Type helpers moved to theme.ts

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Memory Store</Text>
        <Text style={styles.headerSubtitle}>{memories.length} memories stored</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {['all', 'preference', 'fact', 'conversation'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={styles.exportButton} 
            onPress={exportMemories}
            activeOpacity={0.7}
          >
            <Text style={styles.exportButtonText}>📋 Export JSON</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

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
    backgroundColor: colors.bg.primary,
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
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sm,
    color: colors.text.secondary,
  },
  filterWrapper: {
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingVertical: spacing.md,
  },
  filterContainer: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.tertiary,
    marginRight: spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: colors.accent.primary,
  },
  filterText: {
    fontSize: typography.sm,
    color: colors.text.secondary,
    fontWeight: typography.semibold,
  },
  filterTextActive: {
    color: colors.text.primary,
  },
  exportButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.success,
    marginLeft: spacing.sm,
  },
  exportButtonText: {
    fontSize: typography.sm,
    color: colors.text.primary,
    fontWeight: typography.semibold,
  },
  memoriesList: {
    flex: 1,
    padding: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.sm,
    color: colors.text.tertiary,
  },
  memoryCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  memoryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  memoryTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  memoryTypeText: {
    fontSize: typography.xs,
    color: colors.text.primary,
    fontWeight: typography.semibold,
    textTransform: 'capitalize',
  },
  deleteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.error,
    borderRadius: radius.sm,
  },
  deleteButtonText: {
    color: colors.text.primary,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  memoryContent: {
    fontSize: typography.base,
    lineHeight: typography.base * typography.normal,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginRight: spacing.xs + 2,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tagText: {
    fontSize: typography.xs,
    color: colors.text.secondary,
  },
  memoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  memoryTimestamp: {
    fontSize: typography.xs,
    color: colors.text.tertiary,
  },
  memorySource: {
    fontSize: typography.xs - 1,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
  metaContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  metaLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: typography.xs - 1,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
});
