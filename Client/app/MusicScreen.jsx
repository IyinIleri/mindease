import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Linking, StatusBar,
  Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { moodAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';

const MOOD_ICON = {
  happy:'sunny-outline', sad:'rainy-outline',
  angry:'flame-outline', stressed:'thunderstorm-outline', neutral:'ellipse-outline',
};
const MOOD_LABEL = {
  happy:'Happy', sad:'Sad', angry:'Angry', stressed:'Stressed', neutral:'Calm',
};
const MOOD_GRADIENT = {
  happy:['#F59E0B','#FCD34D'], sad:['#3B82F6','#60A5FA'],
  angry:['#EF4444','#F87171'], stressed:['#059669','#34D399'],
  neutral:['#7C3AED','#A78BFA'],
};
const GENRES = [
  { key:'global',    label:'Global',    icon:'globe-outline',         color:'#3B82F6' },
  { key:'afro',      label:'Afrobeats', icon:'musical-notes-outline', color:'#F59E0B' },
  { key:'christian', label:'Christian', icon:'heart-outline',         color:'#7C3AED' },
];

// ── Animated playing bars ─────────────────────────────────────────────────────
function NowPlayingBars({ color }) {
  const bars = [
    useRef(new Animated.Value(0.35)).current,
    useRef(new Animated.Value(0.35)).current,
    useRef(new Animated.Value(0.35)).current,
  ];
  useEffect(() => {
    const anims = bars.map((b, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 140),
        Animated.timing(b, { toValue: 1,    duration: 380, useNativeDriver: true }),
        Animated.timing(b, { toValue: 0.35, duration: 380, useNativeDriver: true }),
      ]))
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:3 }}>
      {bars.map((b, i) => (
        <Animated.View key={i} style={{
          width:3, height:14, borderRadius:2,
          backgroundColor:color, opacity:b,
          transform:[{ scaleY:b }],
        }}/>
      ))}
    </View>
  );
}

// ── Album art or fallback icon ────────────────────────────────────────────────
function AlbumArt({ uri, size = 50, color, isActive, isPlaying }) {
  if (uri) {
    return (
      <Image source={{ uri }} style={{ width:size, height:size, borderRadius:12 }} />
    );
  }
  return (
    <View style={{ width:size, height:size, borderRadius:12,
      backgroundColor: isActive ? color : color + '22',
      alignItems:'center', justifyContent:'center' }}>
      {isActive && isPlaying
        ? <NowPlayingBars color={isActive ? 'white' : color} />
        : <Ionicons name="musical-note" size={size * 0.45}
            color={isActive ? 'white' : color} />}
    </View>
  );
}

export default function MusicScreen() {
  const router  = useRouter();
  const { theme: T, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const { mood = 'neutral' } = useLocalSearchParams();

  const [playlist,    setPlaylist]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [genre,       setGenre]       = useState('global');
  const [currentIdx,  setCurrentIdx]  = useState(null);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [posMs,       setPosMs]       = useState(0);
  const [durMs,       setDurMs]       = useState(0);

  const soundRef    = useRef(null);
  const idxRef      = useRef(null);
  const genreRef    = useRef('global');
  const playlistRef = useRef(null);
  const listAnim    = useRef(new Animated.Value(0)).current;
  const hdrScale    = useRef(new Animated.Value(0.92)).current;

  useEffect(() => { idxRef.current    = currentIdx; },  [currentIdx]);
  useEffect(() => { genreRef.current  = genre; },       [genre]);
  useEffect(() => { playlistRef.current = playlist; },  [playlist]);

  useEffect(() => {
    loadPlaylist();
    Animated.spring(hdrScale, { toValue:1, tension:60, friction:8, useNativeDriver:true }).start();
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    return () => { unload(); };
  }, [mood]);

  useEffect(() => {
    listAnim.setValue(0);
    Animated.timing(listAnim, { toValue:1, duration:300, useNativeDriver:true }).start();
    unload();
    setCurrentIdx(null);
  }, [genre]);

  const loadPlaylist = async () => {
    setLoading(true);
    const res = await moodAPI.playlist(mood);
    if (res.success) setPlaylist(res.playlist);
    else showToast('Could not load music. Check your connection.', 'error');
    setLoading(false);
  };

  const unload = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setIsPlaying(false);
    setIsBuffering(false);
    setPosMs(0);
    setDurMs(0);
  };

  const handleStatus = (status) => {
    if (!status.isLoaded) {
      if (status.error) {
        setIsBuffering(false);
        setCurrentIdx(null);
        showToast('Could not play this preview. Try another track.', 'error');
      }
      return;
    }
    setIsBuffering(!!status.isBuffering);
    setIsPlaying(!!status.isPlaying);
    if (status.durationMillis) {
      setDurMs(status.durationMillis);
      setPosMs(status.positionMillis || 0);
    }
    if (status.didJustFinish) {
      const songs = playlistRef.current?.genres?.[genreRef.current] || [];
      if (!songs.length) return;
      const next = ((idxRef.current ?? 0) + 1) % songs.length;
      playSongAt(songs, next);
    }
  };

  const playSongAt = async (songs, idx) => {
    const song = songs[idx];
    if (!song?.audioUrl) {
      showToast('No preview available for this track.', 'error');
      return;
    }
    await unload();
    setCurrentIdx(idx);
    idxRef.current = idx;
    setIsBuffering(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.audioUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        handleStatus,
      );
      soundRef.current = sound;
    } catch (err) {
      setIsBuffering(false);
      setCurrentIdx(null);
      showToast('Could not load preview. Try another track.', 'error');
    }
  };

  const toggleSong = async (idx) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const songs = playlist?.genres?.[genre] || [];
    if (!songs.length) return;
    if (currentIdx === idx && soundRef.current) {
      if (isPlaying) await soundRef.current.pauseAsync();
      else           await soundRef.current.playAsync();
      return;
    }
    await playSongAt(songs, idx);
  };

  const skip = async (dir) => {
    const songs = playlist?.genres?.[genre] || [];
    if (!songs.length) return;
    const next = ((currentIdx ?? 0) + dir + songs.length) % songs.length;
    await playSongAt(songs, next);
  };

  const openSpotify = async (url) => {
    if (!url) return;
    try { await Linking.openURL(url); } catch {}
  };

  const songs    = playlist?.genres?.[genre] || [];
  const curSong  = currentIdx !== null ? songs[currentIdx] : null;
  const gradient = MOOD_GRADIENT[mood] || MOOD_GRADIENT.neutral;
  const actGenre = GENRES.find(g => g.key === genre);
  const actColor = actGenre?.color || T.primary;
  const pct      = durMs > 0 ? posMs / durMs : 0;

  const fmt = ms => {
    if (!ms) return '0:00';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:T.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Toast visible={toast.visible} message={toast.message}
        type={toast.type} onHide={hideToast} />

      {/* Header */}
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:20,
        paddingTop:16, paddingBottom:14, borderBottomWidth:1,
        borderBottomColor:T.border, backgroundColor:T.bgCard }}>
        <TouchableOpacity onPress={() => { unload(); router.back(); }}>
          <Ionicons name="arrow-back" size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={{ flex:1, fontSize:20, fontWeight:'800',
          color:T.text, textAlign:'center' }}>Music</Text>
        <View style={{ width:24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: curSong ? 140 : 40 }}
        showsVerticalScrollIndicator={false}>

        {/* Mood hero card */}
        <Animated.View style={{ transform:[{ scale:hdrScale }],
          marginHorizontal:20, marginTop:20, borderRadius:28,
          overflow:'hidden', elevation:8,
          shadowColor:gradient[0], shadowOffset:{ width:0, height:8 },
          shadowOpacity:0.3, shadowRadius:20 }}>
          <LinearGradient colors={gradient} start={{ x:0,y:0 }} end={{ x:1,y:1 }}
            style={{ padding:24, alignItems:'center' }}>
            <Ionicons name={MOOD_ICON[mood] || 'ellipse-outline'} size={48} color="white" />
            <Text style={{ color:'white', fontSize:22, fontWeight:'800', marginTop:10 }}>
              {MOOD_LABEL[mood] || 'Calm'} Mood
            </Text>
            {playlist?.label && (
              <Text style={{ color:'rgba(255,255,255,0.8)', fontSize:13, marginTop:4 }}>
                {playlist.label}
              </Text>
            )}
            <View style={{ flexDirection:'row', alignItems:'center', marginTop:10,
              backgroundColor:'rgba(255,255,255,0.15)', borderRadius:12,
              paddingHorizontal:10, paddingVertical:4 }}>
              <Ionicons name="musical-notes-outline" size={14} color="white" />
              <Text style={{ color:'white', fontSize:11, marginLeft:5, fontWeight:'600' }}>
                Free Music · Open in Spotify
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Genre tabs */}
        <View style={{ flexDirection:'row', marginHorizontal:20, marginTop:18,
          backgroundColor:T.bgMuted, borderRadius:18, padding:4 }}>
          {GENRES.map(g => (
            <TouchableOpacity key={g.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setGenre(g.key);
              }}
              style={{ flex:1, flexDirection:'row', alignItems:'center',
                justifyContent:'center', paddingVertical:11, borderRadius:14,
                backgroundColor: genre===g.key ? T.bgCard : 'transparent',
                elevation: genre===g.key ? 2 : 0 }}>
              <Ionicons name={g.icon} size={14}
                color={genre===g.key ? g.color : T.textMuted} />
              <Text style={{ marginLeft:5, fontWeight:'700', fontSize:12,
                color: genre===g.key ? g.color : T.textMuted }}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview notice */}
        <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:20,
          marginTop:14, marginBottom:2, gap:6 }}>
          <Ionicons name="information-circle-outline" size={14} color={T.textMuted} />
          <Text style={{ fontSize:11, color:T.textMuted, fontWeight:'600', letterSpacing:0.3 }}>
            {genre==='afro' ? 'AFROBEATS & AFROPOP'
             : genre==='christian' ? 'GOSPEL & WORSHIP'
             : 'GLOBAL TRACKS'}
            {'  ·  30-sec previews · tap'}
            <Ionicons name="musical-notes-outline" size={11} color="#1DB954" />
            {' for full track'}
          </Text>
        </View>

        {loading ? (
          <View style={{ alignItems:'center', paddingVertical:60 }}>
            <ActivityIndicator size="large" color={T.primary} />
            <Text style={{ color:T.textMuted, marginTop:12, fontSize:13 }}>
              Loading from Spotify...
            </Text>
          </View>
        ) : (
          <Animated.View style={{ paddingHorizontal:20, marginTop:8,
            opacity:listAnim,
            transform:[{ translateY:listAnim.interpolate({
              inputRange:[0,1], outputRange:[16,0]
            })}] }}>

            {songs.length === 0 ? (
              <View style={{ alignItems:'center', paddingVertical:40 }}>
                <Ionicons name="musical-notes-outline" size={44} color={T.textMuted} />
                <Text style={{ color:T.textMuted, marginTop:12, fontSize:14 }}>
                  No previews available right now
                </Text>
                <Text style={{ color:T.textMuted, fontSize:12, marginTop:4 }}>
                  Spotify may not have preview URLs for this search
                </Text>
              </View>
            ) : songs.map((song, idx) => {
              const active = currentIdx === idx;
              return (
                <View key={idx}
                  style={{ flexDirection:'row', alignItems:'center',
                    backgroundColor: active ? actColor+'14' : T.bgCard,
                    borderRadius:20, padding:14, marginBottom:10,
                    borderWidth: active ? 1.5 : 0,
                    borderColor: active ? actColor : 'transparent',
                    elevation: active ? 4 : 1 }}>

                  {/* Album art / play button */}
                  <TouchableOpacity onPress={() => toggleSong(idx)}
                    style={{ marginRight:14 }}>
                    {active && isBuffering ? (
                      <View style={{ width:50, height:50, borderRadius:12,
                        backgroundColor:actColor, alignItems:'center', justifyContent:'center' }}>
                        <ActivityIndicator size="small" color="white" />
                      </View>
                    ) : active && isPlaying ? (
                      <View style={{ width:50, height:50, borderRadius:12,
                        backgroundColor:actColor, alignItems:'center', justifyContent:'center' }}>
                        <NowPlayingBars color="white" />
                      </View>
                    ) : (
                      <View style={{ width:50, height:50, borderRadius:12, overflow:'hidden' }}>
                        {song.albumArt ? (
                          <Image source={{ uri: song.albumArt }}
                            style={{ width:50, height:50 }} />
                        ) : (
                          <View style={{ width:50, height:50,
                            backgroundColor: actColor + '22',
                            alignItems:'center', justifyContent:'center' }}>
                            <Ionicons name="musical-note" size={22} color={actColor} />
                          </View>
                        )}
                        {/* Play overlay */}
                        <View style={{ position:'absolute', top:0, left:0,
                          width:50, height:50, borderRadius:12,
                          backgroundColor:'rgba(0,0,0,0.25)',
                          alignItems:'center', justifyContent:'center' }}>
                          <Ionicons name="play" size={18} color="white" />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Song info */}
                  <TouchableOpacity style={{ flex:1 }} onPress={() => toggleSong(idx)}>
                    <Text style={{ fontWeight:'700', fontSize:15,
                      color: active ? actColor : T.text }} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text style={{ fontSize:12, color:T.textMuted, marginTop:2 }}
                      numberOfLines={1}>
                      {song.artist}
                    </Text>
                    {/* Preview progress */}
                    {active && durMs > 0 && (
                      <View style={{ height:2, backgroundColor:T.bgMuted,
                        borderRadius:2, marginTop:7, overflow:'hidden' }}>
                        <View style={{ height:2, borderRadius:2,
                          backgroundColor:actColor, width:`${pct*100}%` }} />
                      </View>
                    )}
                    {/* Duration label */}
                    <Text style={{ fontSize:10, color:T.textMuted, marginTop:3 }}>
                      {active && durMs > 0 ? `${fmt(posMs)} / ${fmt(durMs)}` : song.duration}
                    </Text>
                  </TouchableOpacity>

                  {/* Spotify button */}
                  <TouchableOpacity onPress={() => openSpotify(song.spotifyUrl)}
                    style={{ padding:8 }}>
                    <Ionicons name="musical-notes-outline" size={24} color="#1DB954" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Mini player ─────────────────────────────────────────────────── */}
      {curSong && (
        <View style={{ position:'absolute', bottom:0, left:0, right:0,
          backgroundColor:T.bgCard, borderTopWidth:1, borderTopColor:T.border,
          paddingHorizontal:16, paddingTop:10, paddingBottom:20,
          elevation:20, shadowColor:'#000',
          shadowOffset:{ width:0, height:-4 }, shadowOpacity:0.12, shadowRadius:12 }}>

          {/* Progress bar */}
          <View style={{ height:3, backgroundColor:T.bgMuted,
            borderRadius:3, marginBottom:10, overflow:'hidden' }}>
            <View style={{ height:3, borderRadius:3,
              backgroundColor:actColor, width:`${pct*100}%` }} />
          </View>

          <View style={{ flexDirection:'row', alignItems:'center' }}>
            {/* Album art thumbnail */}
            <View style={{ width:40, height:40, borderRadius:10,
              overflow:'hidden', marginRight:12 }}>
              {curSong.albumArt ? (
                <Image source={{ uri:curSong.albumArt }}
                  style={{ width:40, height:40 }} />
              ) : (
                <View style={{ width:40, height:40,
                  backgroundColor:actColor+'22',
                  alignItems:'center', justifyContent:'center' }}>
                  {isPlaying
                    ? <NowPlayingBars color={actColor} />
                    : <Ionicons name="musical-note" size={16} color={actColor} />}
                </View>
              )}
            </View>

            {/* Title + time */}
            <View style={{ flex:1 }}>
              <Text style={{ fontWeight:'700', color:T.text, fontSize:13 }}
                numberOfLines={1}>{curSong.title}</Text>
              <Text style={{ fontSize:11, color:T.textMuted }}>
                {curSong.artist} · {fmt(posMs)} / {fmt(durMs)}
              </Text>
            </View>

            {/* Controls */}
            <TouchableOpacity onPress={() => skip(-1)} style={{ padding:8 }}>
              <Ionicons name="play-skip-back" size={20} color={T.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                if (!soundRef.current) return;
                if (isPlaying) await soundRef.current.pauseAsync();
                else           await soundRef.current.playAsync();
              }}
              style={{ width:44, height:44, borderRadius:22,
                backgroundColor:actColor, alignItems:'center',
                justifyContent:'center', marginHorizontal:8 }}>
              {isBuffering
                ? <ActivityIndicator size="small" color="white" />
                : <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="white" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => skip(1)} style={{ padding:8 }}>
              <Ionicons name="play-skip-forward" size={20} color={T.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => openSpotify(curSong.spotifyUrl)}
              style={{ padding:8, marginLeft:2 }}>
              <Ionicons name="musical-notes-outline" size={22} color="#1DB954" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
