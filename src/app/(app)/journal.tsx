import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Sticker } from '@/components/ui/Sticker';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineStore } from '@/lib/offlineStore';
import { Database, CanvasItem } from '@/types/database.types';
import { JOURNAL_FONTS, JournalFont, NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];

// Built-in Neo-brutalist sticker pack
const STICKER_PACK = [
  { id: 'st-focus', text: 'RADICAL FOCUS 🔥', color: 'pink' as const },
  { id: 'st-clean', text: 'DOPAMINE FREE ⚡', color: 'yellow' as const },
  { id: 'st-proud', text: 'PROUD OF THIS ✨', color: 'mint' as const },
  { id: 'st-craft', text: 'CREATIVE SPARK 🎨', color: 'blue' as const },
  { id: 'st-level', text: 'LEVEL UP 🚀', color: 'orange' as const },
  { id: 'st-work', text: 'DEEP WORK 🧠', color: 'lilac' as const },
  { id: 'st-100', text: '100% INTENTIONAL 💯', color: 'yellow' as const },
  { id: 'st-reclaim', text: 'RECLAIMED 🛡️', color: 'mint' as const },
];

export default function JournalScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<number | null>(null);

  // Editor State: null = list, 1 = Step 1 Write, 2 = Step 2 Decorate
  const [editorStep, setEditorStep] = useState<1 | 2 | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<number>(5);
  const [selectedFont, setSelectedFont] = useState<JournalFont>('Space Grotesk');
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedCanvasItemId, setSelectedCanvasItemId] = useState<string | null>(null);

  // Undo / Redo history stacks for canvas
  const [historyStack, setHistoryStack] = useState<CanvasItem[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasItem[][]>([]);

  // Export success banner
  const [exportedBanner, setExportedBanner] = useState(false);

  const loadEntries = async () => {
    if (!user) return;
    const loaded = await OfflineStore.getJournalEntries(user.id);
    setEntries(loaded);
  };

  useEffect(() => {
    loadEntries();
  }, [user]);

  const pushCanvasState = (newItems: CanvasItem[]) => {
    setHistoryStack((prev) => [...prev, canvasItems]);
    setRedoStack([]);
    setCanvasItems(newItems);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    triggerHaptic('light');
    const prev = historyStack[historyStack.length - 1];
    setRedoStack((r) => [...r, canvasItems]);
    setHistoryStack((h) => h.slice(0, h.length - 1));
    setCanvasItems(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    triggerHaptic('light');
    const next = redoStack[redoStack.length - 1];
    setHistoryStack((h) => [...h, canvasItems]);
    setRedoStack((r) => r.slice(0, r.length - 1));
    setCanvasItems(next);
  };

  // Open New Entry
  const handleStartNewEntry = () => {
    triggerHaptic('medium');
    setEditingId(null);
    setTitle('');
    setBody('');
    setMood(5);
    setSelectedFont('Space Grotesk');
    setCanvasItems([]);
    setHistoryStack([]);
    setRedoStack([]);
    setEditorStep(1);
  };

  // Open Existing Entry
  const handleEditEntry = (entry: JournalEntry) => {
    triggerHaptic('light');
    setEditingId(entry.id);
    setTitle(entry.title);
    setBody(entry.body);
    setMood(entry.mood || 5);
    setSelectedFont((entry.font_family as JournalFont) || 'Space Grotesk');
    setCanvasItems(entry.canvas_layout || []);
    setHistoryStack([]);
    setRedoStack([]);
    setEditorStep(1);
  };

  // Add Sticker to Canvas
  const handleAddSticker = (sticker: typeof STICKER_PACK[0]) => {
    triggerHaptic('success');
    const newItem: CanvasItem = {
      id: `item-${Date.now()}`,
      type: 'sticker',
      stickerKey: sticker.text,
      x: 30 + Math.random() * 40,
      y: 40 + Math.random() * 50,
      width: 180,
      height: 44,
      zIndex: canvasItems.length + 1,
    };
    pushCanvasState([...canvasItems, newItem]);
    setSelectedCanvasItemId(newItem.id);
  };

  // Pick Photo from Gallery
  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      triggerHaptic('success');
      const newItem: CanvasItem = {
        id: `photo-${Date.now()}`,
        type: 'photo',
        uri: result.assets[0].uri,
        x: 40,
        y: 60,
        width: 180,
        height: 180,
        zIndex: canvasItems.length + 1,
        borderColor: '#000000',
        borderWidth: 4,
      };
      pushCanvasState([...canvasItems, newItem]);
      setSelectedCanvasItemId(newItem.id);
    }
  };

  // Canvas Item Actions: Resize, Layer Up/Down, Duplicate, Delete
  const handleResizeItem = (delta: number) => {
    if (!selectedCanvasItemId) return;
    const next = canvasItems.map((item) => {
      if (item.id === selectedCanvasItemId) {
        const nextW = Math.max(80, item.width + delta);
        const nextH = Math.max(30, item.height + (item.type === 'photo' ? delta : delta * 0.3));
        return { ...item, width: nextW, height: nextH };
      }
      return item;
    });
    pushCanvasState(next);
  };

  const handleMoveItem = (dx: number, dy: number) => {
    if (!selectedCanvasItemId) return;
    const next = canvasItems.map((item) => {
      if (item.id === selectedCanvasItemId) {
        return { ...item, x: item.x + dx, y: item.y + dy };
      }
      return item;
    });
    setCanvasItems(next);
  };

  const handleLayerOrder = (direction: 'up' | 'down') => {
    if (!selectedCanvasItemId) return;
    const next = canvasItems.map((item) => {
      if (item.id === selectedCanvasItemId) {
        return {
          ...item,
          zIndex: direction === 'up' ? item.zIndex + 2 : Math.max(1, item.zIndex - 2),
        };
      }
      return item;
    });
    pushCanvasState(next);
  };

  const handleDeleteItem = () => {
    if (!selectedCanvasItemId) return;
    triggerHaptic('warning');
    const next = canvasItems.filter((i) => i.id !== selectedCanvasItemId);
    pushCanvasState(next);
    setSelectedCanvasItemId(null);
  };

  const handleDuplicateItem = () => {
    if (!selectedCanvasItemId) return;
    triggerHaptic('light');
    const item = canvasItems.find((i) => i.id === selectedCanvasItemId);
    if (!item) return;

    const dup: CanvasItem = {
      ...item,
      id: `dup-${Date.now()}`,
      x: item.x + 20,
      y: item.y + 20,
      zIndex: canvasItems.length + 1,
    };
    pushCanvasState([...canvasItems, dup]);
    setSelectedCanvasItemId(dup.id);
  };

  // Save Journal Entry
  const handleSaveEntry = async () => {
    if (!title.trim() || !user) return;
    triggerHaptic('success');

    const entryId = editingId || `journal-${Date.now()}`;
    const newEntry: JournalEntry = {
      id: entryId,
      user_id: user.id,
      entry_date: new Date().toISOString().split('T')[0],
      title: title.trim(),
      body: body.trim(),
      mood,
      font_family: selectedFont,
      canvas_layout: canvasItems,
      exported_image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const nextEntries = editingId
      ? entries.map((e) => (e.id === editingId ? newEntry : e))
      : [newEntry, ...entries];

    setEntries(nextEntries);
    await OfflineStore.saveJournalEntries(nextEntries, user.id);
    setEditorStep(null);
  };

  // Export as Image Simulation
  const handleExportImage = () => {
    triggerHaptic('success');
    setExportedBanner(true);
    setTimeout(() => setExportedBanner(false), 3500);
  };

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = selectedMoodFilter ? e.mood === selectedMoodFilter : true;
    return matchesSearch && matchesMood;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              CUSTOMIZABLE JOURNAL
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Step 1: Write text • Step 2: Decorate with stickers & photos.
            </Text>
          </View>
          <Button
            title="+ Write Entry"
            onPress={handleStartNewEntry}
            variant="lilac"
            size="sm"
          />
        </View>

        {/* Export Banner Alert */}
        {exportedBanner && (
          <Card bgColor={colors.mintGreen} style={styles.exportBanner}>
            <Text style={styles.exportBannerText}>
              📸 JOURNAL PAGE EXPORTED SUCCESSFULLY! READY TO SHARE.
            </Text>
          </Card>
        )}

        {/* STEP 1: WRITE MODE MODAL */}
        <Modal
          visible={editorStep === 1}
          onClose={() => setEditorStep(null)}
          title="STEP 1: WRITE YOUR ENTRY"
          subtitle="Reflect honestly on cravings, mood, and creative breakthroughs."
          headerColor={colors.lilac}
        >
          <Input
            label="ENTRY TITLE"
            placeholder="e.g. Day 5 of Breaking The Doomscroll Cycle"
            value={title}
            onChangeText={setTitle}
          />

          {/* Mood 1-5 selector */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            HOW WAS YOUR MINDSET TODAY?
          </Text>
          <View style={styles.moodSelectorRow}>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <Chip
                key={lvl}
                label={`${lvl} ${lvl === 5 ? '⚡' : lvl === 1 ? '😫' : '✨'}`}
                color={lvl >= 4 ? 'mint' : lvl === 3 ? 'yellow' : 'pink'}
                isSelected={mood === lvl}
                onPress={() => setMood(lvl)}
              />
            ))}
          </View>

          {/* Exactly 15 Google Fonts Picker */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            SELECT TYPOGRAPHY (15 GOOGLE FONTS):
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fontPillsRow}
          >
            {JOURNAL_FONTS.map((font) => (
              <Chip
                key={font}
                label={font}
                color="yellow"
                isSelected={selectedFont === font}
                onPress={() => setSelectedFont(font)}
              />
            ))}
          </ScrollView>

          {/* Body Editor with Live Font Family Styling */}
          <Input
            label={`BODY TEXT (${selectedFont.toUpperCase()})`}
            placeholder="Write your thoughts, reflections, progress..."
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={6}
            inputStyle={{
              fontFamily: selectedFont,
              fontSize: 16,
              lineHeight: 24,
            }}
          />

          <View style={styles.stepButtonsRow}>
            <Button
              title="Save As Text Only"
              onPress={handleSaveEntry}
              variant="outline"
              style={styles.stepBtn}
            />
            <Button
              title="Step 2: Decorate Canvas →"
              onPress={() => {
                if (!title.trim()) return;
                triggerHaptic('medium');
                setEditorStep(2);
              }}
              variant="lilac"
              style={styles.stepBtn}
            />
          </View>
        </Modal>

        {/* STEP 2: DECORATE CANVAS STUDIO MODAL */}
        <Modal
          visible={editorStep === 2}
          onClose={() => setEditorStep(null)}
          title="STEP 2: DECORATE CANVAS"
          subtitle="Add stickers, photos from gallery, resize and arrange freely."
          headerColor={colors.electricYellow}
        >
          {/* Canvas Toolbar Controls: Undo/Redo/Photo/Sticker */}
          <View style={styles.canvasToolbar}>
            <Button
              title="Undo"
              onPress={handleUndo}
              variant="outline"
              size="sm"
              disabled={historyStack.length === 0}
            />
            <Button
              title="Redo"
              onPress={handleRedo}
              variant="outline"
              size="sm"
              disabled={redoStack.length === 0}
            />
            <Button
              title="+ Add Photo"
              onPress={handlePickPhoto}
              variant="sky"
              size="sm"
            />
            <Button
              title="Export 📸"
              onPress={handleExportImage}
              variant="mint"
              size="sm"
            />
          </View>

          {/* Built-in Sticker Pack Tray */}
          <Text style={[styles.trayLabel, { color: colors.muted }]}>
            TAP TO STICK NEO-BRUTALIST BADGES:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stickerTray}
          >
            {STICKER_PACK.map((st) => (
              <Chip
                key={st.id}
                label={st.text}
                color={st.color}
                onPress={() => handleAddSticker(st)}
              />
            ))}
          </ScrollView>

          {/* THE JOURNAL CANVAS SURFACE */}
          <View
            style={[
              styles.canvasSurface,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
              },
              NeoShadows.lg,
            ]}
          >
            {/* Written Entry Content Rendered on Canvas */}
            <View style={styles.canvasTextContent}>
              <Text style={[styles.canvasEntryTitle, { color: '#000000' }]}>
                {title || 'Untitled Entry'}
              </Text>
              <Text style={[styles.canvasEntryDate, { color: '#444444' }]}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} • {selectedFont}
              </Text>
              <Text
                style={[
                  styles.canvasEntryBody,
                  { color: '#111111', fontFamily: selectedFont },
                ]}
              >
                {body || 'Start writing your reflection...'}
              </Text>
            </View>

            {/* Draggable / Positioned Canvas Items */}
            {canvasItems.map((item) => {
              const isSelected = selectedCanvasItemId === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    triggerHaptic('light');
                    setSelectedCanvasItemId(item.id);
                  }}
                  style={[
                    styles.canvasPlacedItem,
                    {
                      left: item.x,
                      top: item.y,
                      width: item.width,
                      height: item.height,
                      zIndex: item.zIndex,
                    },
                    isSelected && {
                      borderColor: colors.hotPink,
                      borderWidth: 2.5,
                      borderStyle: 'dashed',
                    },
                  ]}
                >
                  {item.type === 'sticker' ? (
                    <Sticker
                      text={item.stickerKey || 'BADGE'}
                      color="yellow"
                      rotation={0}
                    />
                  ) : (
                    <Image
                      source={{ uri: item.uri }}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderWidth: item.borderWidth || 3.5,
                        borderColor: item.borderColor || '#000000',
                      }}
                      resizeMode="cover"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Active Canvas Item Controls */}
          {selectedCanvasItemId && (
            <Card style={styles.itemControlsCard}>
              <Text style={[styles.controlsLabel, { color: colors.text }]}>
                SELECTED ITEM CONTROLS:
              </Text>
              <View style={styles.controlsRow}>
                {/* D-Pad Positioning */}
                <Button
                  title="↑"
                  onPress={() => handleMoveItem(0, -15)}
                  variant="outline"
                  size="sm"
                />
                <Button
                  title="↓"
                  onPress={() => handleMoveItem(0, 15)}
                  variant="outline"
                  size="sm"
                />
                <Button
                  title="←"
                  onPress={() => handleMoveItem(-15, 0)}
                  variant="outline"
                  size="sm"
                />
                <Button
                  title="→"
                  onPress={() => handleMoveItem(15, 0)}
                  variant="outline"
                  size="sm"
                />

                {/* Resize */}
                <Button
                  title="Size +"
                  onPress={() => handleResizeItem(20)}
                  variant="accent"
                  size="sm"
                />
                <Button
                  title="Size -"
                  onPress={() => handleResizeItem(-20)}
                  variant="accent"
                  size="sm"
                />

                {/* Layer order */}
                <Button
                  title="Layer Up"
                  onPress={() => handleLayerOrder('up')}
                  variant="mint"
                  size="sm"
                />
                <Button
                  title="Duplicate"
                  onPress={handleDuplicateItem}
                  variant="sky"
                  size="sm"
                />
                <Button
                  title="Delete"
                  onPress={handleDeleteItem}
                  variant="danger"
                  size="sm"
                />
              </View>
            </Card>
          )}

          {/* Final Save Action */}
          <Button
            title="Save Finished Decorated Page 🎉"
            onPress={handleSaveEntry}
            variant="lilac"
            size="lg"
            style={styles.finalSaveBtn}
          />
        </Modal>

        {/* SEARCH AND MOOD FILTERS */}
        <Card style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={20} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search journal entries..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.moodFiltersRow}>
            <Text style={[styles.filterLabel, { color: colors.muted }]}>
              FILTER MOOD:
            </Text>
            <Chip
              label="ALL"
              isSelected={selectedMoodFilter === null}
              onPress={() => setSelectedMoodFilter(null)}
            />
            {[5, 4, 3, 2, 1].map((m) => (
              <Chip
                key={m}
                label={`Mood ${m}`}
                isSelected={selectedMoodFilter === m}
                onPress={() =>
                  setSelectedMoodFilter(selectedMoodFilter === m ? null : m)
                }
              />
            ))}
          </View>
        </Card>

        {/* ENTRIES LIST */}
        {filteredEntries.length === 0 ? (
          <EmptyState
            title="NO JOURNAL ENTRIES FOUND"
            description="Document your recovery milestones, creative projects, and reflections."
            actionTitle="+ Create First Entry"
            onAction={handleStartNewEntry}
          />
        ) : (
          filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              style={styles.entryCard}
              onPress={() => handleEditEntry(entry)}
            >
              <View style={styles.entryHeader}>
                <View style={styles.entryTitleRow}>
                  <Text style={[styles.entryTitle, { color: colors.text }]}>
                    {entry.title}
                  </Text>
                  <Text style={[styles.entryDate, { color: colors.muted }]}>
                    {entry.entry_date}
                  </Text>
                </View>
                <Chip
                  label={`MOOD ${entry.mood || 5}/5`}
                  color={
                    (entry.mood || 5) >= 4
                      ? 'mint'
                      : (entry.mood || 5) === 3
                      ? 'yellow'
                      : 'pink'
                  }
                />
              </View>

              <Text
                style={[
                  styles.entrySnippet,
                  { color: colors.muted, fontFamily: entry.font_family },
                ]}
                numberOfLines={3}
              >
                {entry.body}
              </Text>

              <View style={styles.entryFooter}>
                <Chip label={entry.font_family} color="outline" />
                {entry.canvas_layout && entry.canvas_layout.length > 0 && (
                  <Sticker
                    text={`${entry.canvas_layout.length} STICKERS/PHOTOS`}
                    color="lilac"
                    rotation={1}
                  />
                )}
                <Text style={[styles.entryActionText, { color: colors.hotPink }]}>
                  OPEN & DECORATE →
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 18,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  exportBanner: {
    padding: 12,
    marginBottom: 14,
  },
  exportBannerText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 6,
  },
  moodSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  fontPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  stepButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  stepBtn: {
    flex: 1,
  },
  canvasToolbar: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  trayLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  stickerTray: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  canvasSurface: {
    width: '100%',
    minHeight: 380,
    borderWidth: NeoBorders.chunky,
    borderRadius: NeoRadii.md,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    marginBottom: 16,
  },
  canvasTextContent: {
    maxWidth: '85%',
  },
  canvasEntryTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  canvasEntryDate: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 14,
  },
  canvasEntryBody: {
    fontSize: 16,
    lineHeight: 24,
  },
  canvasPlacedItem: {
    position: 'absolute',
    padding: 4,
  },
  itemControlsCard: {
    padding: 12,
    marginBottom: 14,
  },
  controlsLabel: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  finalSaveBtn: {
    width: '100%',
    marginTop: 8,
  },
  searchCard: {
    padding: 12,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  moodFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  entryCard: {
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryTitleRow: {
    flex: 1,
    marginRight: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  entryDate: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  entrySnippet: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  entryActionText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
