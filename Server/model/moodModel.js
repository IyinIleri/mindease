import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    mood: { type: String, required: true },
    faceEmotion: { type: String, default: '' },
    textSentiment: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    journalId: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

const moodModel =
  mongoose.models.mood || mongoose.model('mood', moodSchema);

export default moodModel;
