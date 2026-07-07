import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  email:              { type: String, required: true, unique: true },
  password:           { type: String, required: true },
  verifyOtp:          { type: String, default: '' },
  verifyOtpExpireAt:  { type: Number, default: 0 },
  isAccountVerified:  { type: Boolean, default: false },
  resetOtp:           { type: String, default: '' },
  resetOtpExpireAt:   { type: Number, default: 0 },

  // ── Streak tracking ──────────────────────────────────────────────────────
  currentStreak:      { type: Number, default: 0 },
  longestStreak:      { type: Number, default: 0 },
  lastJournalDate:    { type: String, default: '' }, // 'YYYY-MM-DD'
  totalJournals:      { type: Number, default: 0 },

  // ── Onboarding ───────────────────────────────────────────────────────────
  onboardingDone:     { type: Boolean, default: false },
  onboardingGoal:     { type: String, default: '' },    // e.g. 'reduce stress'
  stressLevel:        { type: String, default: '' },    // 'low' | 'medium' | 'high'
  reason:             { type: String, default: '' },    // why they joined
});

const userModel = mongoose.models.user || mongoose.model('user', userSchema);
export default userModel;
