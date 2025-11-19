import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserAchievementStats, checkTimeBasedAchievements } from "@/lib/achievements"

// GET user's achievements
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId") || session.user.id
    const category = searchParams.get("category")
    const unlockedOnly = searchParams.get("unlockedOnly") === "true"

    // Check time-based achievements before fetching
    await checkTimeBasedAchievements(userId)

    // Get all achievements
    const whereAchievement: any = {}
    if (category) {
      whereAchievement.category = category
    }

    const achievements = await prisma.achievement.findMany({
      where: whereAchievement,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
    })

    // Get user's progress for each achievement
    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId,
        ...(unlockedOnly ? { isUnlocked: true } : {}),
      },
      include: {
        achievement: true,
      },
    })

    // Map achievements with user progress
    const achievementsWithProgress = achievements.map(achievement => {
      const userAchievement = userAchievements.find(
        ua => ua.achievementId === achievement.id
      )

      // Hide achievement details if it's hidden and not unlocked
      if (achievement.isHidden && (!userAchievement || !userAchievement.isUnlocked)) {
        return {
          id: achievement.id,
          key: achievement.key,
          category: achievement.category,
          nameEn: '???',
          nameTr: '???',
          descriptionEn: 'Hidden achievement',
          descriptionTr: 'Gizli başarı',
          icon: '🔒',
          reputationBonus: achievement.reputationBonus,
          requiredCount: achievement.requiredCount,
          isHidden: true,
          sortOrder: achievement.sortOrder,
          progress: 0,
          isUnlocked: false,
          unlockedAt: null,
        }
      }

      return {
        ...achievement,
        progress: userAchievement?.progress || 0,
        isUnlocked: userAchievement?.isUnlocked || false,
        unlockedAt: userAchievement?.unlockedAt || null,
      }
    })

    // Get achievement statistics
    const stats = await getUserAchievementStats(userId)

    return NextResponse.json({
      achievements: achievementsWithProgress,
      stats,
    })
  } catch (error) {
    console.error("Get achievements error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
