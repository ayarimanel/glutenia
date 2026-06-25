const UserGamification = require("../models/UserGamification");
const XpLedger = require("../models/XpLedger");
const Badge = require("../models/Badge");
const UserBadge = require("../models/UserBadge");
const Achievement = require("../models/Achievement");
const UserAchievement = require("../models/UserAchievement");

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

// Returns the number of whole days between two dates (ignoring time)
function daysBetween(a, b) {
  const t1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const t2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((t1 - t2) / 86400000);
}

const BADGE_THRESHOLDS = {
  scanCount:             { 1: "first_scan", 10: "ten_scans", 50: "fifty_scans", 100: "hundred_scans" },
  ingredientCheckCount:  { 50: "label_master" },
  communityPostCount:    { 1: "first_post" },
  helpfulVotesReceived:  { 10: "helpful_voice", 50: "community_pillar" },
  restaurantCheckinCount:{ 1: "first_checkin", 5: "explorer_5" },
  eventAttendanceCount:  { 1: "event_attendee", 5: "event_regular" },
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
        // already recorded today — no change
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

async function checkAndAwardBadges(userId, triggerMetric, currentValue) {
  try {
    const metricThresholds = BADGE_THRESHOLDS[triggerMetric];
    if (!metricThresholds) return [];

    const eligibleSlugs = Object.entries(metricThresholds)
      .filter(([threshold]) => currentValue >= Number(threshold))
      .map(([, slug]) => slug);

    if (eligibleSlugs.length === 0) return [];

    const badges = await Badge.find({ slug: { $in: eligibleSlugs } }).select("_id slug");
    const slugToId = {};
    badges.forEach((b) => { slugToId[b.slug] = b._id; });

    const existingRecords = await UserBadge.find({ userId }).select("badgeId");
    const existingIds = new Set(existingRecords.map((ub) => ub.badgeId.toString()));

    const newSlugs = [];
    const toInsert = [];
    for (const slug of eligibleSlugs) {
      const badgeId = slugToId[slug];
      if (badgeId && !existingIds.has(badgeId.toString())) {
        toInsert.push({ userId, badgeId, earnedAt: new Date() });
        newSlugs.push(slug);
      }
    }

    if (toInsert.length > 0) {
      await UserBadge.insertMany(toInsert, { ordered: false });
    }

    return newSlugs;
  } catch (err) {
    console.error("[gamificationService] checkAndAwardBadges error:", err);
    return [];
  }
}

async function updateAchievementProgress(userId, metric, newValue) {
  try {
    const achievements = await Achievement.find({ targetMetric: metric });
    const completedSlugs = [];

    for (const achievement of achievements) {
      let ua = await UserAchievement.findOne({ userId, achievementId: achievement._id });

      if (!ua) {
        ua = new UserAchievement({ userId, achievementId: achievement._id, currentProgress: 0 });
      }

      ua.currentProgress = newValue;

      if (ua.currentProgress >= achievement.targetValue && !ua.completedAt) {
        ua.completedAt = new Date();
        await ua.save();
        await awardXP(userId, achievement.xpReward, "achievement_complete", achievement.slug);
        completedSlugs.push(achievement.slug);
      } else {
        await ua.save();
      }
    }

    return completedSlugs;
  } catch (err) {
    console.error("[gamificationService] updateAchievementProgress error:", err);
    return [];
  }
}

async function getProfileGamificationData(userId) {
  try {
    const gamification = await UserGamification.findOne({ userId });

    const earnedBadges = await UserBadge.find({ userId }).populate("badgeId");
    const pinnedBadges = earnedBadges.filter((ub) => ub.isPinned);

    const allAchievements = await UserAchievement.find({ userId }).populate("achievementId");

    const topAchievements = allAchievements
      .filter((ua) => !ua.completedAt && ua.achievementId)
      .sort((a, b) => {
        const ratioA = a.currentProgress / a.achievementId.targetValue;
        const ratioB = b.currentProgress / b.achievementId.targetValue;
        return ratioB - ratioA;
      })
      .slice(0, 3);

    return { gamification, earnedBadges, pinnedBadges, topAchievements };
  } catch (err) {
    console.error("[gamificationService] getProfileGamificationData error:", err);
    return null;
  }
}

module.exports = { awardXP, updateStreak, checkAndAwardBadges, updateAchievementProgress, getProfileGamificationData };
