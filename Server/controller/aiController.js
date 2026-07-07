import journalModel from '../model/journalModel.js';
import moodModel from '../model/moodModel.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

async function callGroq(messages, model = GROQ_MODEL) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, max_tokens: 500, messages }),
  });
  if (!response.ok) throw new Error(`Groq API error: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0].message.content.trim();
}


export const getAIAdvice = async (req, res) => {
  const { text, mood, journalId, faceEmotion, userId } = req.body;
  if (!text || !mood) {
    return res.json({ success: false, message: 'text and mood are required' });
  }
  try {
    let previousMood = 'None';
    if (userId) {
      const prev = await moodModel.findOne({ userId }).sort({ createdAt: -1 }).skip(1);
      if (prev) previousMood = prev.mood;
    }

    const emotionContext = faceEmotion && faceEmotion !== mood
      ? `Facial Expression detected by camera: ${faceEmotion}\nJournal writing tone: ${mood}`
      : `Detected mood: ${mood}`;

    const TONE = {
      sad: 'gentle, warm, comforting — like a close friend who truly cares',
      anxious: 'calm, steady, reassuring — like a hand on the shoulder',
      stressed: 'calm, steady, reassuring — like a hand on the shoulder',
      angry: 'grounded, non-judgmental, steady — not confrontational',
      happy: 'uplifting, celebratory, warm',
      neutral: 'gently supportive and encouraging',
    };

    const advice = await callGroq([
      {
        role: 'system',
        content: `You are an emotionally intelligent, deeply empathetic mental wellness companion in an app called MindEase.

Your entire purpose is to make this person feel genuinely heard, understood, and safe.

TONE: ${TONE[mood] || TONE[faceEmotion] || 'warm and caring'}

HOW TO RESPOND:
1. Open by reflecting what they are feeling — show you actually read and understood their entry
2. If their previous mood was "${previousMood}" and it is the same or worse, gently acknowledge the pattern without alarming them
3. Offer 1 or 2 simple, realistic actions (breathing, rest, music, a short walk, writing more)
4. Keep the response 3-5 sentences — short enough to read, rich enough to feel real
5. End with genuine encouragement that feels personal, not generic

STRICT RULES:
- Never sound like a bot or a therapy manual
- Never use bullet points — write as flowing natural prose
- Never use clinical or complex words
- Never judge, diagnose, or alarm
- If mood is sad, stressed, or anxious — mention calming music or the breathing exercise available in the app`,
      },
      {
        role: 'user',
        content: `${emotionContext}\nPrevious mood: ${previousMood}\n\nJournal Entry:\n"${text}"\n\nResponse:`,
      },
    ]);

    if (journalId) {
      await journalModel.findByIdAndUpdate(journalId, {
        aiResponse: advice, detectedMood: mood, faceEmotion: faceEmotion || '',
      });
    }
    return res.json({ success: true, advice });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ─── POST /api/ai/analyze ─────────────────────────────────────────────────────
export const analyzeJournalText = async (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ success: false, message: 'text is required' });
  try {
    const raw = await callGroq([
      {
        role: 'system',
        content: `Analyze the emotional tone. Reply ONLY with JSON (no markdown):
{"mood":"happy|sad|angry|stressed|neutral","sentiment":"positive|negative|neutral","confidence":0.85}`,
      },
      { role: 'user', content: text },
    ]);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response');
    return res.json({ success: true, analysis: JSON.parse(jsonMatch[0]) });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ─── POST /api/ai/emotion ─────────────────────────────────────────────────────
export const analyzeEmotion = async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.json({ success: false, message: 'imageBase64 is required' });
  try {
    const raw = await callGroq([
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          {
            type: 'text',
            text: `Analyze the facial expression. Reply ONLY with JSON (no markdown):
{"mood":"happy|sad|angry|stressed|neutral","confidence":0.85,"description":"one warm sentence about what you observe"}
Only use: happy, sad, angry, stressed, neutral.`,
          },
        ],
      },
    ], GROQ_VISION_MODEL);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response');
    const result = JSON.parse(jsonMatch[0]);
    const valid = ['happy', 'sad', 'angry', 'stressed', 'neutral'];
    if (!valid.includes(result.mood)) result.mood = 'neutral';
    return res.json({ success: true, mood: result.mood, confidence: result.confidence, description: result.description });
  } catch (error) {
    return res.json({ success: false, message: error.message, mood: 'neutral' });
  }
};

// ─── POST /api/ai/combine ─────────────────────────────────────────────────────
export const combineMoodSources = async (req, res) => {
  const { faceEmotion, faceConfidence, textMood, textConfidence, journalId } = req.body;
  if (!faceEmotion && !textMood) {
    return res.json({ success: false, message: 'At least one emotion source required' });
  }
  try {
    let finalMood, finalConfidence, method;
    if (faceEmotion && textMood) {
      finalMood = faceEmotion;
      finalConfidence = faceEmotion === textMood
        ? Math.min(0.99, ((faceConfidence || 0.75) + (textConfidence || 0.75)) / 2 + 0.1)
        : (faceConfidence || 0.75) * 0.85;
      method = faceEmotion === textMood ? 'both_agreed' : 'face_priority';
    } else {
      finalMood = faceEmotion || textMood;
      finalConfidence = faceConfidence || textConfidence || 0.70;
      method = faceEmotion ? 'face_only' : 'text_only';
    }
    if (journalId) {
      await journalModel.findByIdAndUpdate(journalId, {
        detectedMood: finalMood, faceEmotion: faceEmotion || '', moodConfidence: finalConfidence,
      });
    }
    return res.json({
      success: true, finalMood, finalConfidence, faceEmotion, textMood, method,
      summary: method === 'both_agreed'
        ? `Both your face and writing confirm you're feeling ${finalMood}. (${Math.round(finalConfidence * 100)}% confidence)`
        : method === 'face_priority'
        ? `Your face shows ${faceEmotion} while your writing reflects ${textMood}.`
        : `Detected from ${faceEmotion ? 'your face' : 'your writing'}: ${finalMood}.`,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
// Ease — the ultra-human AI companion
export const chatWithAI = async (req, res) => {
  const { messages, mood, userId } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.json({ success: false, message: 'messages array required' });
  }
  try {
    let previousMood = null;
    let totalEntries = 0;
    if (userId) {
      const prev = await moodModel.findOne({ userId }).sort({ createdAt: -1 });
      if (prev) previousMood = prev.mood;
      totalEntries = await moodModel.countDocuments({ userId });
    }

    const contextNote = previousMood
      ? `The user's recent recorded mood was: ${previousMood}. They have logged ${totalEntries} mood entries total.`
      : 'This may be an early session for the user.';

    const reply = await callGroq([
      {
        role: 'system',
        content: `You are Ease — a deeply human, emotionally intelligent companion inside MindEase, a mental wellness app.

You are NOT a chatbot. You are NOT a therapist. You are a warm, genuine friend who truly listens and cares.

${contextNote}
Current session mood context: ${mood || 'not specified'}

YOUR PERSONALITY:
- Warm, calm, and unhurried — never rushed or scripted
- You remember what was said earlier in THIS conversation and refer back to it naturally
- You sometimes ask one gentle follow-up question to understand better
- You validate feelings before offering any suggestions
- You can be lightly playful when the mood is light, deeply gentle when it is heavy
- You speak in plain everyday language — never clinical, never robotic
- You use short sentences. Natural rhythm. Like real conversation.

RULES:
- NEVER start with "I understand" or "I hear you" — these sound fake. Find more natural ways
- NEVER give a list of bullet points — just talk naturally
- NEVER say things like "It is important to..." or "You should consider..."
- NEVER diagnose or use clinical terms
- Keep responses SHORT (3-5 sentences max) — leave space for them to respond
- If someone seems in serious distress, gently and warmly suggest speaking to someone they trust or a professional, but do not be alarmist
- You can reference the breathing exercise or music features in the app if it genuinely fits

WHAT YOU ARE DOING:
- First and foremost: making this person feel less alone
- Helping them process what they are feeling, not fixing it
- Being a calm, safe presence they can come back to anytime`,
      },
      ...messages,
    ]);
    return res.json({ success: true, reply });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ─── POST /api/ai/transcribe ──────────────────────────────────────────────────
// Voice to text using Groq Whisper
export const transcribeAudio = async (req, res) => {
  const { audioBase64, mimeType } = req.body;
  if (!audioBase64) return res.json({ success: false, message: 'audioBase64 is required' });

  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const blob = new Blob([audioBuffer], { type: mimeType || 'audio/m4a' });

    const formData = new FormData();
    formData.append('file', blob, 'recording.m4a');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');
    formData.append('language', 'en');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: formData,
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return res.json({ success: true, text: data.text });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
