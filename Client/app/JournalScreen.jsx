import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Modal, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';
import { journalAPI, aiAPI } from '../services/api';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';
import { useTheme, MOOD_EMOJI, moodColor } from '../context/ThemeContext';

export default function JournalScreen() {
  const router = useRouter();
  const { theme: T, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const { faceEmotion, faceConfidence, faceDescription } = useLocalSearchParams();

  const [text, setText] = useState('');
  const [journalId, setJournalId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [combinedResult, setCombinedResult] = useState(null);
  const [textMood, setTextMood] = useState(null);
  const [journals, setJournals] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [view, setView] = useState('write');
  const [selectedJournal, setSelectedJournal] = useState(null);

  const debounceRef = useRef(null);
  const journalIdRef = useRef(null);

  useEffect(() => { loadJournals(); }, []);
  useEffect(() => { if (faceEmotion) createDraftWithFaceEmotion(); }, [faceEmotion]);

  const createDraftWithFaceEmotion = async () => {
    const res = await journalAPI.save('', null, faceEmotion, faceEmotion);
    if (res.success) { journalIdRef.current = res.journalId; setJournalId(res.journalId); }
  };

  const loadJournals = async () => {
    setListLoading(true);
    const res = await journalAPI.list();
    if (res.success) setJournals(res.journals);
    setListLoading(false);
  };

  const autoSave = useCallback(async (newText) => {
    if (!newText.trim()) return;
    setSaving(true);
    const res = await journalAPI.save(newText, journalIdRef.current,
      faceEmotion || '', combinedResult?.finalMood || faceEmotion || 'neutral');
    if (res.success) {
      journalIdRef.current = res.journalId;
      setJournalId(res.journalId);
      setLastSaved(dayjs().format('h:mm A'));
    }
    setSaving(false);
  }, [faceEmotion, combinedResult]);

  const handleTextChange = (val) => {
    setText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => autoSave(val), 1500);
  };



  // ── AI Advice ───────────────────────────────────────────────────────────────
  const handleGetAIAdvice = async () => {
    if (!text.trim()) { showToast('Write something first.'); return; }
    setAiLoading(true);
    if (!journalIdRef.current) await autoSave(text);

    const textAnalysis = await aiAPI.analyzeText(text);
    const detectedTextMood = textAnalysis.success ? textAnalysis.analysis.mood : 'neutral';
    const detectedTextConf = textAnalysis.success ? textAnalysis.analysis.confidence : 0.70;
    setTextMood(detectedTextMood);

    let finalMood = detectedTextMood;
    if (faceEmotion) {
      const combineRes = await aiAPI.combineMoods(faceEmotion, parseFloat(faceConfidence) || 0.75,
        detectedTextMood, detectedTextConf, journalIdRef.current);
      if (combineRes.success) { setCombinedResult(combineRes); finalMood = combineRes.finalMood; }
    }

    const adviceRes = await aiAPI.getAdvice(text, finalMood, journalIdRef.current, faceEmotion || '');
    if (adviceRes.success) setAiAdvice(adviceRes.advice);
    setAiLoading(false);
  };

  const handleFinalize = async () => {
    if (!text.trim()) { showToast('Write something first.'); return; }
    if (!journalIdRef.current) await autoSave(text);
    if (!journalIdRef.current) { showToast('Check your connection.', 'error'); return; }

    const res = await journalAPI.finalize(journalIdRef.current);
    if (res.success) {
      showToast('Journal entry saved!', 'success');
      setText(''); journalIdRef.current = null; setJournalId(null);
      setAiAdvice(''); setLastSaved(null); setTextMood(null); setCombinedResult(null);
      await loadJournals();
      setView('list');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      showToast(res.message || 'Could not save. Try again.', 'error');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Entry', 'This entry will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive',
        onPress: async () => { setSelectedJournal(null); await journalAPI.delete(id); loadJournals(); } },
    ]);
  };

  const activeMood = combinedResult?.finalMood || textMood || faceEmotion || null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Review Modal ───────────────────────────────────────────────────── */}
      <Modal visible={!!selectedJournal} animationType="slide"
        presentationStyle="pageSheet" onRequestClose={() => setSelectedJournal(null)}>
        {selectedJournal && (
          <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20,
              borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.bgCard }}>
              <TouchableOpacity onPress={() => setSelectedJournal(null)}>
                <Ionicons name="close" size={26} color={T.text} />
              </TouchableOpacity>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: T.text,
                marginLeft: 16 }}>Journal Entry</Text>
              <TouchableOpacity onPress={() => handleDelete(selectedJournal._id)}>
                <Ionicons name="trash-outline" size={22} color={T.error} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={{ color: T.textMuted, fontSize: 12, marginBottom: 16 }}>
                {dayjs(selectedJournal.createdAt).format('dddd, MMMM D, YYYY · h:mm A')}
              </Text>

              {/* Mood badges */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {selectedJournal.faceEmotion ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
                    paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8,
                    backgroundColor: moodColor(selectedJournal.faceEmotion, T) }}>
                    <Text style={{ fontSize: 12 }}></Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: T.text,
                      textTransform: 'capitalize' }}>{selectedJournal.faceEmotion}</Text>
                  </View>
                ) : null}
                {selectedJournal.detectedMood ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
                    paddingVertical: 6, borderRadius: 20, marginBottom: 8,
                    backgroundColor: moodColor(selectedJournal.detectedMood, T) }}>
                    <Text style={{ fontSize: 12 }}>✍️ </Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: T.text,
                      textTransform: 'capitalize' }}>{selectedJournal.detectedMood}</Text>
                  </View>
                ) : null}
              </View>

              {/* Full text */}
              <View style={{ backgroundColor: T.bgCard, borderRadius: 20, padding: 20,
                marginBottom: 16, elevation: 2 }}>
                <Text style={{ color: T.text, fontSize: 16, lineHeight: 28 }}>
                  {selectedJournal.text}
                </Text>
              </View>

              {/* AI advice */}
              {selectedJournal.aiResponse ? (
                <View style={{ borderRadius: 20, padding: 20, marginBottom: 16,
                  borderLeftWidth: 4, borderLeftColor: T.primary,
                  backgroundColor: T.primarySoft }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Ionicons name="sparkles" size={16} color={T.primary} />
                    <Text style={{ fontWeight: '800', color: T.primary, marginLeft: 8 }}>AI Insight</Text>
                  </View>
                  <Text style={{ color: T.text, fontSize: 14, lineHeight: 22 }}>
                    {selectedJournal.aiResponse}
                  </Text>
                </View>
              ) : null}

              {selectedJournal.detectedMood && (
                <TouchableOpacity onPress={() => {
                    setSelectedJournal(null);
                    router.push({ pathname: '/MusicScreen', params: { mood: selectedJournal.detectedMood } });
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    padding: 16, borderRadius: 20, backgroundColor: '#1DB954' }}>
                  <Ionicons name="musical-notes" size={20} color="white" />
                  <Text style={{ color: 'white', fontWeight: '800', marginLeft: 8 }}>
                    Play Music for this Mood
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: T.border,
        backgroundColor: T.bgCard }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '800', color: T.text,
          textAlign: 'center' }}>My Journal</Text>
        <TouchableOpacity onPress={() => setView(view === 'write' ? 'list' : 'write')}>
          <Ionicons name={view === 'write' ? 'list' : 'create-outline'} size={24} color={T.primary} />
        </TouchableOpacity>
      </View>

      {view === 'write' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

          {/* Face banner */}
          {faceEmotion ? (
            <View style={{ borderRadius: 20, padding: 16, marginBottom: 16, flexDirection: 'row',
              alignItems: 'center', backgroundColor: moodColor(faceEmotion, T) }}>
              <Text style={{ fontSize: 36 }}>{MOOD_EMOJI[faceEmotion]}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '800', color: T.text, fontSize: 14 }}>
                  Face scan: <Text style={{ textTransform: 'capitalize' }}>{faceEmotion}</Text>
                </Text>
                <Text style={{ color: T.textSub, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                  {faceDescription || `Your expression shows you're feeling ${faceEmotion}.`}
                </Text>
              </View>
              <Text style={{ fontWeight: '800', color: T.primary, fontSize: 13 }}>
                {Math.round((parseFloat(faceConfidence) || 0.75) * 100)}%
              </Text>
            </View>
          ) : null}

          {/* Date + save status */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: T.textMuted, fontSize: 13 }}>{dayjs().format('dddd, MMMM D')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {saving
                ? <><ActivityIndicator size="small" color={T.primary} />
                    <Text style={{ color: T.textMuted, fontSize: 11, marginLeft: 4 }}>Saving...</Text></>
                : lastSaved
                ? <><Ionicons name="checkmark-circle" size={14} color={T.success} />
                    <Text style={{ color: T.success, fontSize: 11, marginLeft: 4 }}>Saved {lastSaved}</Text></>
                : null}
            </View>
          </View>

          {/* Text input */}
          <View style={{ backgroundColor: T.bgCard, borderRadius: 24, padding: 20,
            elevation: 2, shadowColor: T.shadow, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1, shadowRadius: 12, marginBottom: 16 }}>
            <TextInput
              style={{ fontSize: 16, color: T.text, minHeight: 180,
                textAlignVertical: 'top', lineHeight: 26 }}
              multiline
              placeholder={faceEmotion
                ? `You look ${faceEmotion}. Want to write about it? ✍️`
                : 'How are you feeling today? Write freely...\n\nThis is your safe space. ✍️'}
              placeholderTextColor={T.textMuted}
              value={text}
              onChangeText={handleTextChange}
            />
          </View>

          {/* Combined result */}
          {combinedResult ? (
            <View style={{ borderRadius: 20, padding: 16, marginBottom: 16,
              backgroundColor: T.primarySoft, borderWidth: 1, borderColor: T.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="git-merge-outline" size={14} color={T.primary} />
                <Text style={{ fontWeight: '800', color: T.primary, fontSize: 12,
                  marginLeft: 6 }}>Combined Analysis</Text>
              </View>
              <Text style={{ color: T.textSub, fontSize: 12, lineHeight: 18 }}>
                {combinedResult.summary}
              </Text>
            </View>
          ) : null}

          {/* AI advice */}
          {aiAdvice ? (
            <View style={{ backgroundColor: T.bgCard, borderRadius: 24, padding: 20,
              marginBottom: 16, elevation: 2, borderLeftWidth: 4, borderLeftColor: T.primary }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 22 }}>{MOOD_EMOJI[activeMood] || ''}</Text>
                <View style={{ marginLeft: 10 }}>
                  <Text style={{ fontWeight: '800', color: T.text, fontSize: 14 }}>AI Wellness Advice</Text>
                  {activeMood && <Text style={{ color: T.primary, fontSize: 11,
                    textTransform: 'capitalize', marginTop: 1 }}>Based on your {activeMood} mood</Text>}
                </View>
              </View>
              <Text style={{ color: T.textSub, fontSize: 14, lineHeight: 22 }}>{aiAdvice}</Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/MusicScreen', params: { mood: activeMood || 'neutral' } })}
                style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
                  backgroundColor: '#1DB954', marginTop: 12 }}>
                <Ionicons name="musical-notes" size={14} color="white" />
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 12, marginLeft: 6 }}>
                  Music for my mood
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* AI button */}
          <TouchableOpacity onPress={handleGetAIAdvice} disabled={aiLoading}
            style={{ borderRadius: 20, padding: 16, alignItems: 'center', marginBottom: 12,
              flexDirection: 'row', justifyContent: 'center',
              backgroundColor: T.primarySoft, borderWidth: 1.5, borderColor: T.accent }}>
            {aiLoading ? <ActivityIndicator color={T.primary} />
              : <><Ionicons name="sparkles-outline" size={20} color={T.primary} />
                  <Text style={{ color: T.primary, fontWeight: '800', fontSize: 15,
                    marginLeft: 8 }}>
                    {faceEmotion ? 'Analyse Face + Journal ' : 'Get AI Advice '}
                  </Text></>}
          </TouchableOpacity>

          {/* Save button */}
          <TouchableOpacity onPress={handleFinalize}
            style={{ borderRadius: 20, overflow: 'hidden', elevation: 6,
              shadowColor: T.primary, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35, shadowRadius: 8 }}>
            <LinearGradient colors={['#7C3AED', '#A855F7']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ padding: 18, flexDirection: 'row', alignItems: 'center',
                justifyContent: 'center' }}>
              <Ionicons name="save-outline" size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginLeft: 8 }}>
                Save Journal Entry
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

      ) : (
        /* ── LIST view ──────────────────────────────────────────────────── */
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: T.textSub, fontSize: 13 }}>{journals.length} entries</Text>
            <TouchableOpacity onPress={() => setView('write')}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
                paddingVertical: 8, borderRadius: 16, backgroundColor: T.primary }}>
              <Ionicons name="add" size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 13, marginLeft: 4 }}>
                New Entry
              </Text>
            </TouchableOpacity>
          </View>

          {listLoading ? (
            <ActivityIndicator size="large" color={T.primary} style={{ marginTop: 60 }} />
          ) : journals.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Text style={{ fontSize: 52, marginBottom: 16 }}></Text>
              <Text style={{ color: T.textSub, fontSize: 16, fontWeight: '600' }}>No entries yet</Text>
              <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 6 }}>
                Tap "New Entry" to start writing
              </Text>
            </View>
          ) : journals.map((j) => (
            <TouchableOpacity key={j._id} onPress={() => setSelectedJournal(j)}
              style={{ backgroundColor: T.bgCard, borderRadius: 24, padding: 20,
                marginBottom: 16, elevation: 2,
                shadowColor: T.shadow, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1, shadowRadius: 12 }}
              activeOpacity={0.85}>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: T.textMuted, fontSize: 11 }}>
                  {dayjs(j.createdAt).format('MMM D, YYYY · h:mm A')}
                </Text>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(j._id); }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="trash-outline" size={15} color={T.error} />
                </TouchableOpacity>
              </View>

              {/* Mood badges */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                {j.faceEmotion ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                    marginRight: 6, backgroundColor: moodColor(j.faceEmotion, T) }}>
                    <Text style={{ fontSize: 10 }}></Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: T.text,
                      textTransform: 'capitalize' }}>{j.faceEmotion}</Text>
                  </View>
                ) : null}
                {j.detectedMood ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                    backgroundColor: moodColor(j.detectedMood, T) }}>
                    <Text style={{ fontSize: 10 }}>✍️ </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: T.text,
                      textTransform: 'capitalize' }}>{j.detectedMood}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={{ color: T.text, fontSize: 14, lineHeight: 22 }}
                numberOfLines={2}>{j.text}</Text>

              {j.aiResponse ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10,
                  paddingTop: 10, borderTopWidth: 1, borderTopColor: T.border }}>
                  <Ionicons name="sparkles" size={11} color={T.primary} />
                  <Text style={{ color: T.primary, fontSize: 11, marginLeft: 4, flex: 1 }}
                    numberOfLines={1}>{j.aiResponse}</Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ color: T.textMuted, fontSize: 11 }}>Tap to read full entry</Text>
                <Ionicons name="chevron-forward" size={11} color={T.textMuted} style={{ marginLeft: 2 }} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
