import journalModel from '../model/journalModel.js';
import moodModel from '../model/moodModel.js';
import { updateStreak } from './streakController.js';

// ─── Auto-Save / Create ───────────────────────────────────────────────────────
export const saveJournal = async (req, res) => {
  const { userId, text, journalId, faceEmotion, detectedMood } = req.body;
  if (!userId) return res.json({ success: false, message: 'userId is required' });

  try {
    let journal;
    if (journalId) {
      journal = await journalModel.findByIdAndUpdate(
        journalId,
        {
          text: text || '',
          ...(faceEmotion && { faceEmotion }),
          ...(detectedMood && { detectedMood }),
        },
        { new: true }
      );
      if (!journal) return res.json({ success: false, message: 'Journal not found' });
    } else {
      journal = new journalModel({
        userId: userId.toString(), // ✅ always store as string
        text: text || '',
        faceEmotion: faceEmotion || '',
        detectedMood: detectedMood || '',
        isDraft: true,
      });
      await journal.save();
    }
    return res.json({ success: true, journalId: journal._id, updatedAt: journal.updatedAt });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ─── Get All Journals (finalized only) ───────────────────────────────────────
export const getJournals = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.json({ success: false, message: 'userId is required' });

  try {
    const journals = await journalModel
      .find({
        userId: userId.toString(), // ✅ match as string
        isDraft: false,            // ✅ only show saved entries, not drafts
      })
      .sort({ createdAt: -1 })
      .select('-__v');

    return res.json({ success: true, journals });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ─── Get Single Journal ───────────────────────────────────────────────────────
export const getJournalById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const journal = await journalModel.findById(id);
    if (!journal) return res.json({ success: false, message: 'Journal not found' });
    if (journal.userId !== userId.toString()) {
      return res.json({ success: false, message: 'Unauthorized' });
    }
    return res.json({ success: true, journal });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ─── Delete Journal ───────────────────────────────────────────────────────────
export const deleteJournal = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const journal = await journalModel.findById(id);
    if (!journal) return res.json({ success: false, message: 'Journal not found' });
    if (journal.userId !== userId.toString()) {
      return res.json({ success: false, message: 'Unauthorized' });
    }
    await journalModel.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Journal deleted' });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ─── Finalize Journal ─────────────────────────────────────────────────────────
export const finalizeJournal = async (req, res) => {
  const { id } = req.params;
  const { userId, spotifyRecommendations } = req.body;
  try {
    const journal = await journalModel.findById(id);
    if (!journal) return res.json({ success: false, message: 'Journal not found' });
    if (journal.userId !== userId.toString()) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    journal.isDraft = false;
    if (spotifyRecommendations) journal.spotifyRecommendations = spotifyRecommendations;
    await journal.save();

    if (journal.detectedMood) {
      await moodModel.create({
        userId: userId.toString(),
        mood: journal.detectedMood,
        faceEmotion: journal.faceEmotion || '',
        textSentiment: journal.detectedMood,
        confidence: journal.moodConfidence || 0,
        journalId: journal._id.toString(),
      });
    }

    await updateStreak(userId);
    return res.json({ success: true, message: 'Journal saved', journal });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
