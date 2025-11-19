import { prisma } from "./prisma"

/**
 * Track progress and unlock achievements for a user
 * @param userId - The user ID
 * @param achievementKey - The achievement key to track
 * @param incrementBy - How much to increment progress (default: 1)
 * @returns The unlocked achievement if it was just unlocked, null otherwise
 */
export async function trackAchievement(
  userId: string,
  achievementKey: string,
  incrementBy: number = 1
) {
  try {
    // Get the achievement definition
    const achievement = await prisma.achievement.findUnique({
      where: { key: achievementKey },
    })

    if (!achievement) {
      console.log(`Achievement not found: ${achievementKey}`)
      return null
    }

    // Get or create user achievement progress
    let userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    })

    if (!userAchievement) {
      // Create new user achievement
      userAchievement = await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: 0,
          isUnlocked: false,
        },
      })
    }

    // If already unlocked, no need to update
    if (userAchievement.isUnlocked) {
      return null
    }

    // Increment progress
    const newProgress = userAchievement.progress + incrementBy

    // Check if achievement should be unlocked
    if (newProgress >= achievement.requiredCount) {
      // Unlock achievement
      const unlockedAchievement = await prisma.userAchievement.update({
        where: { id: userAchievement.id },
        data: {
          progress: newProgress,
          isUnlocked: true,
          unlockedAt: new Date(),
        },
        include: {
          achievement: true,
        },
      })

      // Add reputation bonus
      if (achievement.reputationBonus > 0) {
        await prisma.playerProfile.update({
          where: { userId },
          data: {
            reputationScore: {
              increment: achievement.reputationBonus,
            },
          },
        })
      }

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'RATING_RECEIVED', // Using this type as a generic achievement notification
          title: '🏆 Achievement Unlocked!',
          message: `You unlocked "${unlockedAchievement.achievement.nameEn}" (+${achievement.reputationBonus} reputation)`,
          link: '/profile',
        },
      })

      console.log(`🏆 Achievement unlocked for user ${userId}: ${achievementKey}`)
      return unlockedAchievement
    } else {
      // Just update progress
      await prisma.userAchievement.update({
        where: { id: userAchievement.id },
        data: { progress: newProgress },
      })

      return null
    }
  } catch (error) {
    console.error('Error tracking achievement:', error)
    return null
  }
}

/**
 * Check and unlock time-based achievements (veteran, legend)
 * @param userId - The user ID
 */
export async function checkTimeBased Achievements(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    })

    if (!user) return

    const daysSinceCreation = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Check veteran (30 days)
    if (daysSinceCreation >= 30) {
      await trackAchievement(userId, 'veteran')
    }

    // Check legend (90 days)
    if (daysSinceCreation >= 90) {
      await trackAchievement(userId, 'legend')
    }
  } catch (error) {
    console.error('Error checking time-based achievements:', error)
  }
}

/**
 * Check reputation-based achievements
 * @param userId - The user ID
 * @param currentReputation - Current reputation score
 */
export async function checkReputationAchievements(
  userId: string,
  currentReputation: number
) {
  try {
    if (currentReputation >= 25) {
      await trackAchievement(userId, 'trustworthy')
    }
    if (currentReputation >= 50) {
      await trackAchievement(userId, 'respected')
    }
    if (currentReputation >= 100) {
      await trackAchievement(userId, 'elite')
    }
  } catch (error) {
    console.error('Error checking reputation achievements:', error)
  }
}

/**
 * Get user's achievement statistics
 * @param userId - The user ID
 * @returns Achievement statistics
 */
export async function getUserAchievementStats(userId: string) {
  try {
    const totalAchievements = await prisma.achievement.count()
    const unlockedAchievements = await prisma.userAchievement.count({
      where: {
        userId,
        isUnlocked: true,
      },
    })

    const achievementsByCategory = await prisma.userAchievement.findMany({
      where: {
        userId,
        isUnlocked: true,
      },
      include: {
        achievement: true,
      },
    })

    const categoryStats = achievementsByCategory.reduce((acc, ua) => {
      const category = ua.achievement.category
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: totalAchievements,
      unlocked: unlockedAchievements,
      percentage: totalAchievements > 0
        ? Math.round((unlockedAchievements / totalAchievements) * 100)
        : 0,
      byCategory: categoryStats,
    }
  } catch (error) {
    console.error('Error getting user achievement stats:', error)
    return {
      total: 0,
      unlocked: 0,
      percentage: 0,
      byCategory: {},
    }
  }
}
