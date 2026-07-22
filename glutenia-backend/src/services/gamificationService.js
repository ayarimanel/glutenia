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

const ENGAGEMENT_TITLE_BRACKETS = [
  { max: 2, title: "Rookie" },
  { max: 4, title: "Regular" },
  { max: 6, title: "Enthusiast" },
  { max: 8, title: "Veteran" },
  { max: 10, title: "Master" },
  { max: Infinity, title: "Legend" },
];

// Purely activity-based title for the XP/Level card — deliberately distinct
// vocabulary from account.stageTitles.* (the role+experience-based title
// shown in the profile pill and Journey tracker), so the two "what stage am
// I at" surfaces on the profile actually mean different things instead of
// both showing the same string.
function getEngagementTitle(currentLevel) {
  const bracket = ENGAGEMENT_TITLE_BRACKETS.find((b) => currentLevel <= b.max);
  return bracket.title;
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
  product_contribution: { counterField: "productContributionCount", metric: "productContributionCount", xp: 20 },
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

// Shared by every badge-checking path: given a candidate list already known
// to be eligible, filters out ones already earned, inserts the rest, and
// awards their XP. Only awards XP for records that actually inserted — with
// {ordered:false}, a concurrent caller can race for the same badge (the
// unique {userId,badgeId} index on UserBadge rejects the loser), and that
// partial failure must not block XP for the ones that did land.
async function _awardEligibleBadges(userId, eligibleBadges) {
  if (eligibleBadges.length === 0) return [];

  const existingRecords = await UserBadge.find({
    userId,
    badgeId: { $in: eligibleBadges.map((b) => b._id) },
  }).select("badgeId");
  const existingIds = new Set(existingRecords.map((ub) => ub.badgeId.toString()));

  const newBadges = eligibleBadges.filter((b) => !existingIds.has(b._id.toString()));
  if (newBadges.length === 0) return [];

  let insertedIds = new Set(newBadges.map((b) => b._id.toString()));
  try {
    await UserBadge.insertMany(
      newBadges.map((b) => ({ userId, badgeId: b._id, earnedAt: new Date() })),
      { ordered: false }
    );
  } catch (err) {
    const writeErrors = err?.writeErrors || err?.result?.result?.writeErrors || [];
    const failedIndexes = new Set(writeErrors.map((we) => we.index));
    insertedIds = new Set(
      newBadges.filter((_, index) => !failedIndexes.has(index)).map((b) => b._id.toString())
    );
    if (insertedIds.size === 0) {
      console.error("[gamificationService] _awardEligibleBadges insertMany error:", err.message);
    }
  }

  const awardedBadges = newBadges.filter((b) => insertedIds.has(b._id.toString()));

  for (const badge of awardedBadges) {
    if (badge.xpReward > 0) {
      await awardXP(userId, badge.xpReward, "badge_unlock", badge.slug);
    }
  }

  return awardedBadges.map((b) => ({
    slug: b.slug,
    name: b.name,
    description: b.description,
    category: b.category,
    xpReward: b.xpReward,
  }));
}

async function checkAndAwardBadges(userId, metric, currentValue) {
  try {
    const user = await User.findById(userId).select("role_type");
    // Badges tagged for one role only are excluded for the other; "both"
    // (the schema default) and unset role_type both fall through to the
    // "both"-only badges so onboarding-incomplete accounts aren't blocked.
    const trackFilter = user?.role_type
      ? { $in: [user.role_type, "both"] }
      : "both";

    const eligibleBadges = await Badge.find({
      targetMetric: metric,
      targetValue: { $lte: currentValue },
      track: trackFilter,
    });

    return await _awardEligibleBadges(userId, eligibleBadges);
  } catch (err) {
    console.error("[gamificationService] checkAndAwardBadges error:", err);
    return [];
  }
}

// Badges tied to a fact the user told us during onboarding (self-reported
// experience, confidence, goal) rather than an activity counter — a
// one-time eligibility check against a declared value, not a threshold
// crossed by repeated action, so — like checkLazyJourneyBadges — it's
// checked lazily (on profile view, and right after an onboarding save)
// instead of through recordAction.
async function checkProfileFactBadges(userId) {
  try {
    const user = await User.findById(userId).select(
      "role_type experience_level primary_goal eating_out_frequency confidence_identifying_gf"
    );
    if (!user) return [];

    const trackFilter = user.role_type ? { $in: [user.role_type, "both"] } : "both";
    const candidates = await Badge.find({ targetField: { $ne: null }, track: trackFilter });

    const eligibleBadges = candidates.filter((badge) => {
      const userValue = user[badge.targetField];
      return userValue != null && (badge.targetEquals || []).includes(userValue);
    });

    return await _awardEligibleBadges(userId, eligibleBadges);
  } catch (err) {
    console.error("[gamificationService] checkProfileFactBadges error:", err);
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
      engagementTitle: getEngagementTitle(currentLevel),
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
    await checkProfileFactBadges(userId);

    let gamification = await UserGamification.findOne({ userId });
    if (!gamification) {
      gamification = await UserGamification.create({ userId });
    }

    const levelInfo = getLevelInfo(gamification.totalXp);
    const gamificationWithLevel = {
      ...gamification.toObject(),
      ...levelInfo,
      engagementTitle: getEngagementTitle(levelInfo.currentLevel),
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
  checkProfileFactBadges,
  recordAction,
  getHomeGamificationData,
  getProfileGamificationData,
  calculateLevel,
  getLevelInfo,
  getEngagementTitle,
};
