import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    text: { type: String, default: '' },
    detectedMood: { type: String, default: '' },
    faceEmotion: { type: String, default: '' },
    moodConfidence: { type: Number, default: 0 },
    aiResponse: { type: String, default: '' },
    spotifyRecommendations: [
      {
        title: String,
        artist: String,
        spotifyUrl: String,
        mood: String,
      },
    ],
    isDraft: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const journalModel =
  mongoose.models.journal || mongoose.model('journal', journalSchema);

export default journalModel;
