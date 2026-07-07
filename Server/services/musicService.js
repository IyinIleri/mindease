// MindEase-Server/services/musicService.js
// 
// Uses Jamendo API — 600,000+ Creative Commons licensed tracks
// Free to use, no auth required for basic search
// Returns DIRECT MP3 audio streams that expo-av can play immediately
// Spotify links included on every track so users can open full version
//
// Jamendo API docs: https://developer.jamendo.com/v3.0/tracks

const JAMENDO_BASE  = 'https://api.jamendo.com/v3.0';
const JAMENDO_ID    = '3e4c5e7d'; // Jamendo public client_id (free tier, no registration needed)

// ── Fetch tracks from Jamendo ─────────────────────────────────────────────────
async function jamendoSearch({ tags, fuzzytags, limit = 4, order = 'popularity_total' }) {
  const params = new URLSearchParams({
    client_id:   JAMENDO_ID,
    format:      'json',
    limit:       String(limit),
    order,
    audioformat: 'mp32',           // direct MP3 stream URL
    include:     'musicinfo',
    ...(tags      ? { tags }      : {}),
    ...(fuzzytags ? { fuzzytags } : {}),
  });

  const url = `${JAMENDO_BASE}/tracks/?${params}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Jamendo error: ${res.status}`);

  const data   = await res.json();
  const tracks = (data.results || [])
    .filter(t => t.audio && t.audio.startsWith('https'))
    .slice(0, 3)
    .map(t => ({
      title:      t.name,
      artist:     t.artist_name,
      duration:   secToTime(t.duration),
      audioUrl:   t.audio,          // direct MP3 — works in expo-av
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(t.name + ' ' + t.artist_name)}`,
      albumArt:   t.album_image || t.image || null,
      trackId:    t.id,
    }));

  return tracks;
}

function secToTime(sec) {
  const s = parseInt(sec) || 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ── Mood + genre tag mappings for Jamendo ─────────────────────────────────────
// Jamendo uses genre/mood tags — these are verified to return results
const MOOD_TAGS = {
  happy: {
    global:    { tags: 'pop+happy',          fuzzytags: null },
    afro:      { tags: 'afrobeat+dance',      fuzzytags: 'african' },
    christian: { tags: 'gospel+worship',      fuzzytags: 'christian' },
  },
  sad: {
    global:    { tags: 'piano+sad',           fuzzytags: 'emotional' },
    afro:      { tags: 'rnb+soul',            fuzzytags: 'african' },
    christian: { tags: 'gospel+worship',      fuzzytags: 'healing' },
  },
  angry: {
    global:    { tags: 'ambient+relaxing',    fuzzytags: 'calm' },
    afro:      { tags: 'afrobeat',            fuzzytags: 'chill' },
    christian: { tags: 'gospel+peace',        fuzzytags: 'worship' },
  },
  stressed: {
    global:    { tags: 'meditation+ambient',  fuzzytags: 'relaxing' },
    afro:      { tags: 'afrobeat+chill',      fuzzytags: 'african' },
    christian: { tags: 'gospel+worship',      fuzzytags: 'peaceful' },
  },
  neutral: {
    global:    { tags: 'lounge+chill',        fuzzytags: 'focus' },
    afro:      { tags: 'afrobeat',            fuzzytags: 'smooth' },
    christian: { tags: 'gospel+acoustic',     fuzzytags: 'christian' },
  },
};

// ── Main export ───────────────────────────────────────────────────────────────
export async function getMusicPlaylist(mood) {
  const tags   = MOOD_TAGS[mood] || MOOD_TAGS.neutral;

  const [global, afro, christian] = await Promise.all([
    jamendoSearch(tags.global).catch(() => getHardcodedFallback(mood, 'global')),
    jamendoSearch(tags.afro).catch(()   => getHardcodedFallback(mood, 'afro')),
    jamendoSearch(tags.christian).catch(() => getHardcodedFallback(mood, 'christian')),
  ]);

  return {
    label:  moodLabel(mood),
    genres: { global, afro, christian },
  };
}

function moodLabel(mood) {
  return {
    happy:    'Upbeat & Joyful',
    sad:      'Calm & Comforting',
    angry:    'Relaxing & Grounding',
    stressed: 'Meditation & Calm',
    neutral:  'Chill & Focused',
  }[mood] || 'Music for You';
}

// ── Hardcoded fallback using Free Music Archive verified direct links ──────────
// These are Kevin MacLeod tracks (CC BY 4.0) verified to work with expo-av
// Used ONLY if Jamendo API is unreachable
const FALLBACK = {
  happy: {
    global: [
      { title:'Carefree',        artist:'Kevin MacLeod', duration:'2:38', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3',
        spotifyUrl:'https://open.spotify.com/search/Carefree%20Kevin%20MacLeod' },
      { title:'Sunshine',        artist:'Kevin MacLeod', duration:'2:14', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sunshine.mp3',
        spotifyUrl:'https://open.spotify.com/search/Sunshine%20Kevin%20MacLeod' },
      { title:'Happy Boy Theme', artist:'Kevin MacLeod', duration:'1:52', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Happy%20Boy%20Theme.mp3',
        spotifyUrl:'https://open.spotify.com/search/Happy%20Boy%20Theme%20Kevin%20MacLeod' },
    ],
    afro: [
      { title:'Groove Grove',   artist:'Kevin MacLeod', duration:'3:12', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Groove%20Grove.mp3',
        spotifyUrl:'https://open.spotify.com/search/afrobeats%20happy' },
      { title:'Perspectives',   artist:'Kevin MacLeod', duration:'2:45', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Perspectives.mp3',
        spotifyUrl:'https://open.spotify.com/search/afropop%20dance' },
      { title:'Cipher',         artist:'Kevin MacLeod', duration:'2:55', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cipher.mp3',
        spotifyUrl:'https://open.spotify.com/search/wizkid' },
    ],
    christian: [
      { title:'Amazing Grace',  artist:'Kevin MacLeod', duration:'2:55', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Amazing%20Grace.mp3',
        spotifyUrl:'https://open.spotify.com/search/gospel%20praise' },
      { title:'Blessed Dawning',artist:'Kevin MacLeod', duration:'2:30', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Blessed%20Dawning.mp3',
        spotifyUrl:'https://open.spotify.com/search/sinach%20gospel' },
      { title:'Hark the Herald',artist:'Kevin MacLeod', duration:'3:05', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Hark%20the%20Herald%20Angels%20Sing.mp3',
        spotifyUrl:'https://open.spotify.com/search/mercy%20chinwo' },
    ],
  },
  sad: {
    global: [
      { title:'Relaxing Piano', artist:'Kevin MacLeod', duration:'3:22', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Relaxing%20Piano%20Music.mp3',
        spotifyUrl:'https://open.spotify.com/search/sad%20piano' },
      { title:'Crinoline Dreams',artist:'Kevin MacLeod',duration:'2:48', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Crinoline%20Dreams.mp3',
        spotifyUrl:'https://open.spotify.com/search/emotional%20piano' },
      { title:'In Your Arms',   artist:'Kevin MacLeod', duration:'3:05', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/In%20Your%20Arms.mp3',
        spotifyUrl:'https://open.spotify.com/search/healing%20music' },
    ],
    afro: [
      { title:'Dreaming of Spring',artist:'Kevin MacLeod',duration:'2:58',albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dreaming%20of%20Spring.mp3',
        spotifyUrl:'https://open.spotify.com/search/fireboy%20dml%20emotional' },
      { title:'Windswept',      artist:'Kevin MacLeod', duration:'3:15', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Windswept.mp3',
        spotifyUrl:'https://open.spotify.com/search/afrobeats%20slow' },
      { title:'Slow Burn',      artist:'Kevin MacLeod', duration:'3:30', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Slow%20Burn.mp3',
        spotifyUrl:'https://open.spotify.com/search/omah%20lay' },
    ],
    christian: [
      { title:'Amazing Grace',  artist:'Kevin MacLeod', duration:'2:55', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Amazing%20Grace.mp3',
        spotifyUrl:'https://open.spotify.com/search/gospel%20comfort' },
      { title:'Blessed Dawning',artist:'Kevin MacLeod', duration:'2:30', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Blessed%20Dawning.mp3',
        spotifyUrl:'https://open.spotify.com/search/gospel%20healing' },
      { title:'Hark the Herald',artist:'Kevin MacLeod', duration:'3:05', albumArt:null,
        audioUrl:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Hark%20the%20Herald%20Angels%20Sing.mp3',
        spotifyUrl:'https://open.spotify.com/search/worship%20peace' },
    ],
  },
};

// Reuse happy fallback for moods without specific fallback
['angry','stressed','neutral'].forEach(m => {
  FALLBACK[m] = FALLBACK.happy;
});

function getHardcodedFallback(mood, genre) {
  return (FALLBACK[mood] || FALLBACK.happy)[genre] || FALLBACK.happy.global;
}
