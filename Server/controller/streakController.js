import userModel from '../model/userModel.js';
import moodModel from '../model/moodModel.js';
import journalModel from '../model/journalModel.js';

// Helper — today's date as 'YYYY-MM-DD'
const today = () => new Date().toISOString().split('T')[0];
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

// ─── Update streak when user journals ────────────────────────────────────────
export const updateStreak = async (userId) => {
  try {
    const user = await userModel.findById(userId);
    if (!user) return;

    const todayStr = today();
    const yesterdayStr = yesterday();

    if (user.lastJournalDate === todayStr) return; // already journaled today

    let newStreak = 1;
    if (user.lastJournalDate === yesterdayStr) {
      newStreak = (user.currentStreak || 0) + 1; // continued streak
    }

    const newLongest = Math.max(newStreak, user.longestStreak || 0);

    await userModel.findByIdAndUpdate(userId, {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastJournalDate: todayStr,
      $inc: { totalJournals: 1 },
    });
  } catch (_) {}
};

// ─── GET /api/streak ──────────────────────────────────────────────────────────
export const getStreak = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await userModel.findById(userId).select(
      'currentStreak longestStreak lastJournalDate totalJournals name'
    );
    if (!user) return res.json({ success: false, message: 'User not found' });

    // Check if streak is still active (journaled today or yesterday)
    const todayStr = today();
    const yesterdayStr = yesterday();
    const isActive = user.lastJournalDate === todayStr || user.lastJournalDate === yesterdayStr;

    return res.json({
      success: true,
      currentStreak: isActive ? user.currentStreak : 0,
      longestStreak: user.longestStreak,
      lastJournalDate: user.lastJournalDate,
      totalJournals: user.totalJournals,
      journaledToday: user.lastJournalDate === todayStr,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ─── GET /api/streak/summary — weekly mood summary ───────────────────────────
export const getWeeklySummary = async (req, res) => {
  const { userId } = req.body;
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const moods = await moodModel.find({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: 1 });

    // Count moods
    const counts = moods.reduce((acc, m) => {
      acc[m.mood] = (acc[m.mood] || 0) + 1;
      return acc;
    }, {});

    const topMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    // Build last 7 days array
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = moods.find(m => m.createdAt.toISOString().split('T')[0] === dateStr);
      days.push({ date: dateStr, mood: entry?.mood || null });
    }

    return res.json({
      success: true,
      days,
      counts,
      topMood: topMood ? topMood[0] : null,
      totalThisWeek: moods.length,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ─── POST /api/streak/onboarding ─────────────────────────────────────────────
export const saveOnboarding = async (req, res) => {
  const { userId, reason, stressLevel, goal } = req.body;
  try {
    await userModel.findByIdAndUpdate(userId, {
      onboardingDone: true,
      reason: reason || '',
      stressLevel: stressLevel || '',
      onboardingGoal: goal || '',
    });
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
