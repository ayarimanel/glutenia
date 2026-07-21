const UserGamification = require("../models/UserGamification");
const XpLedger = require("../models/XpLedger");
const Badge = require("../models/Badge");
const UserBadge = require("../models/UserBadge");
const User = require("../models/User");

const LEVEL_THRESHOLDS = { 1: 0, 2: 150, 3: 350, 4: 600, 5: 800, 6: 1200, 7: 1800, 8: 2200, 9: 2700, 10: 3500 };

function calculateLevel(totalXp) {
  if (totalXp >= 3500) {
    return 10 + Math.floor((totalXp - 3500) / 800);
  }
  let level = 1;
  for (const [lvl, minXp] of Object.entries(LEVEL_THRESHOLDS)) {
    if (totalXp >= minXp) level = Number(lvl);
  }
  return level;
}

// Everything the client needs to render a level/XP bar, so it never has to
// keep its own copy of LEVEL_THRESHOLDS.
function getLevelInfo(totalXp) {
  const currentLevel = calculateLevel(totalXp);
  const currentLevelMinXp =
    currentLevel <= 10 ? LEVEL_THRESHOLDS[currentLevel] : 3500 + (currentLevel - 10) * 800;
  const nextLevelXp =
    currentLevel < 10 ? LEVEL_THRESHOLDS[currentLevel + 1] : 3500 + (currentLevel - 9) * 800;
  const xpToNextLevel = Math.max(0, nextLevelXp - totalXp);
  const progressRatio =
    nextLevelXp > currentLevelMinXp
      ? Math.min(1, (totalXp - currentLevelMinXp) / (nextLevelXp - currentLevelMinXp))
      : 1;

  return { currentLevel, currentLevelMinXp, nextLevelXp, xpToNextLevel, progressRatio };
}

// Returns the number of whole days between two dates (ignoring time)
function daysBetween(a, b) {
  const t1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const t2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((t1 - t2) / 86400000);
}

// actionType -> which UserGamification counter it advances and the flat XP it awards
const ACTION_CONFIG = {
  barcode_scan: { counterField: "scanCount", metric: "scanCount", xp: 5 },
  label_scan: { counterField: "ingredientCheckCount", metric: "ingredientCheckCount", xp: 10 },
  event_rsvp: { counterField: "eventAttendanceCount", metric: "eventAttendanceCount", xp: 25 },
  order_placed: { counterField: "orderCount", metric: "orderCount", xp: 40 },
};

async function awardXP(userId, amount, sourceType, sourceId = null) {
  try {
    await XpLedger.create({ userId, amount, sourceType, sourceId });

    const updated = await UserGamification.findOneAndUpdate(
      { userId },
      { $inc: { totalXp: amount } },
      { new: true, upsert: true }
    );

    const newTotal = updated.totalXp;
    const oldLevel = updated.currentLevel;
    const newLevel = calculateLevel(newTotal);
    const leveledUp = newLevel > oldLevel;

    if (leveledUp) {
      await UserGamification.updateOne({ userId }, { currentLevel: newLevel });
    }

    return { newTotal, newLevel, leveledUp };
  } catch (err) {
    console.error("[gamificationService] awardXP error:", err);
    return null;
  }
}

async function updateStreak(userId) {
  try {
    let gamification = await UserGamification.findOne({ userId });
    if (!gamification) {
      gamification = await UserGamification.create({ userId, currentStreak: 1, lastActivityDate: new Date() });
      return { currentStreak: 1, shieldConsumed: false, streakReset: false };
    }

    const today = new Date();
    let shieldConsumed = false;
    let streakReset = false;

    if (!gamification.lastActivityDate) {
      gamification.currentStreak = 1;
      gamification.lastActivityDate = today;
    } else {
      const diff = daysBetween(today, gamification.lastActivityDate);

      if (diff === 0) {
        // Already recorded today — no-op. recordAction can call this multiple
        // times per day (once per real action), so this guard matters.
      } else if (diff === 1) {
        gamification.currentStreak += 1;
        gamification.lastActivityDate = today;
      } else {
        if (gamification.streakShields > 0) {
          gamification.streakShields -= 1;
          shieldConsumed = true;
        } else {
          gamification.currentStreak = 1;
          streakReset = true;
        }
        gamification.lastActivityDate = today;
      }
    }

    if (gamification.currentStreak > gamification.longestStreak) {
      gamification.longestStreak = gamification.currentStreak;
    }

    await gamification.save();

    return {
      currentStreak: gamification.currentStreak,
      shieldConsumed,
      streakReset,
    };
  } catch (err) {
    console.error("[gamificationService] updateStreak error:", err);
    return null;
  }
}

async function checkAndAwardBadges(userId, metric, currentValue) {
  try {
    const eligibleBadges = await Badge.find({ targetMetric: metric, targetValue: { $lte: currentValue } });
    if (eligibleBadges.length === 0) return [];

    const existingRecords = await UserBadge.find({
      userId,
      badgeId: { $in: eligibleBadges.map((b) => b._id) },
    }).select("badgeId");
    const existingIds = new Set(existingRecords.map((ub) => ub.badgeId.toString()));

    const newBadges = eligibleBadges.filter((b) => !existingIds.has(b._id.toString()));
    if (newBadges.length === 0) return [];

    await UserBadge.insertMany(
      newBadges.map((b) => ({ userId, badgeId: b._id, earnedAt: new Date() })),
      { ordered: false }
    );

    for (const badge of newBadges) {
      if (badge.xpReward > 0) {
        await awardXP(userId, badge.xpReward, "badge_unlock", badge.slug);
      }
    }

    return newBadges.map((b) => ({
      slug: b.slug,
      name: b.name,
      description: b.description,
      category: b.category,
      xpReward: b.xpReward,
    }));
  } catch (err) {
    console.error("[gamificationService] checkAndAwardBadges error:", err);
    return [];
  }
}

// A couple of optional badges are keyed off account age rather than an
// action counter, so they can't go through recordAction's per-action path —
// check them lazily whenever gamification data is fetched instead.
async function checkLazyJourneyBadges(userId, userCreatedAt) {
  if (!userCreatedAt) return [];
  const accountAgeDays = Math.floor((Date.now() - new Date(userCreatedAt)) / 86400000);
  return checkAndAwardBadges(userId, "accountAgeDays", accountAgeDays);
}

// Single entry point for every real user action that should earn XP. Wraps
// its own try/catch so a gamification bug never breaks the underlying
// scan/RSVP/order request that triggered it.
async function recordAction(userId, actionType, metadata = {}) {
  try {
    const config = ACTION_CONFIG[actionType];
    if (!config) return null;

    const updatedGamification = await UserGamification.findOneAndUpdate(
      { userId },
      { $inc: { [config.counterField]: 1 } },
      { new: true, upsert: true }
    );
    const currentValue = updatedGamification[config.counterField];

    const xpResult = await awardXP(userId, config.xp, actionType, metadata?.sourceId ?? null);
    const streakResult = await updateStreak(userId);
    const badgesUnlocked = await checkAndAwardBadges(userId, config.metric, currentValue);

    return {
      xpGained: config.xp,
      leveledUp: xpResult?.leveledUp ?? false,
      newLevel: xpResult?.newLevel ?? updatedGamification.currentLevel,
      newTotalXp: xpResult?.newTotal ?? updatedGamification.totalXp,
      currentStreak: streakResult?.currentStreak ?? updatedGamification.currentStreak,
      badgesUnlocked,
    };
  } catch (err) {
    console.error("[gamificationService] recordAction error:", err);
    return null;
  }
}

// Lightweight payload for surfaces that load on every app open (Home strip)
// and can't afford the full profile query.
async function getHomeGamificationData(userId) {
  try {
    const gamification = await UserGamification.findOne({ userId });
    if (!gamification) return null;

    const { currentLevel, nextLevelXp, xpToNextLevel, progressRatio } = getLevelInfo(gamification.totalXp);

    return {
      currentLevel,
      totalXp: gamification.totalXp,
      nextLevelXp,
      xpToNextLevel,
      progressRatio,
      currentStreak: gamification.currentStreak,
    };
  } catch (err) {
    console.error("[gamificationService] getHomeGamificationData error:", err);
    return null;
  }
}

async function getProfileGamificationData(userId) {
  try {
    const user = await User.findById(userId).select("createdAt");
    if (user) {
      await checkLazyJourneyBadges(userId, user.createdAt);
    }

    let gamification = await UserGamification.findOne({ userId });
    if (!gamification) {
      gamification = await UserGamification.create({ userId });
    }

    const levelInfo = getLevelInfo(gamification.totalXp);
    const gamificationWithLevel = {
      ...gamification.toObject(),
      ...levelInfo,
    };

    const earnedBadges = await UserBadge.find({ userId })
      .populate("badgeId")
      .sort({ isPinned: -1, earnedAt: -1 });
    const pinnedBadges = earnedBadges.filter((ub) => ub.isPinned);

    const earnedBadgeIds = new Set(earnedBadges.map((ub) => ub.badgeId?._id?.toString()).filter(Boolean));
    const lockedCatalog = await Badge.find({ _id: { $nin: [...earnedBadgeIds] } }).sort({
      category: 1,
      targetValue: 1,
    });

    const lockedBadgeProgress = lockedCatalog.map((badge) => {
      const currentProgress = badge.targetMetric === "accountAgeDays"
        ? Math.floor((Date.now() - new Date(user?.createdAt ?? Date.now())) / 86400000)
        : gamification[badge.targetMetric] ?? 0;
      return {
        badge: {
          slug: badge.slug,
          name: badge.name,
          description: badge.description,
          category: badge.category,
          targetMetric: badge.targetMetric,
          targetValue: badge.targetValue,
          xpReward: badge.xpReward,
        },
        currentProgress: Math.min(currentProgress, badge.targetValue),
        ratio: badge.targetValue > 0 ? currentProgress / badge.targetValue : 0,
      };
    });

    // Top 3 nearest to completion, for compact previews (e.g. AccountScreen).
    const inProgressBadges = [...lockedBadgeProgress].sort((a, b) => b.ratio - a.ratio).slice(0, 3);

    // Every locked badge with its progress, catalog-ordered, for the full badge grid.
    const lockedBadges = lockedBadgeProgress;

    return { gamification: gamificationWithLevel, earnedBadges, pinnedBadges, inProgressBadges, lockedBadges };
  } catch (err) {
    console.error("[gamificationService] getProfileGamificationData error:", err);
    return null;
  }
}

module.exports = {
  awardXP,
  updateStreak,
  checkAndAwardBadges,
  recordAction,
  getHomeGamificationData,
  getProfileGamificationData,
  calculateLevel,
  getLevelInfo,
};
