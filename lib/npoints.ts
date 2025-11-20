import { prisma } from "./prisma"
import { TransactionType } from "@prisma/client"

/**
 * Add N-Points to a user's balance
 * @param userId - User ID
 * @param amount - Amount to add (positive number)
 * @param type - Transaction type
 * @param description - Optional description
 * @param reference - Optional reference ID (e.g., purchase ID, wheel spin ID)
 * @returns Updated balance
 */
export async function addNPoints(
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string,
  reference?: string
) {
  if (amount <= 0) {
    throw new Error("Amount must be positive")
  }

  try {
    // Update player profile balance
    const profile = await prisma.playerProfile.update({
      where: { userId },
      data: {
        nPoints: {
          increment: amount,
        },
      },
    })

    // Create transaction record
    await prisma.nPointsTransaction.create({
      data: {
        userId,
        amount,
        type,
        description,
        reference,
      },
    })

    console.log(`✅ Added ${amount} N-Points to user ${userId} (${type})`)
    return profile.nPoints
  } catch (error) {
    console.error("Error adding N-Points:", error)
    throw error
  }
}

/**
 * Deduct N-Points from a user's balance
 * @param userId - User ID
 * @param amount - Amount to deduct (positive number)
 * @param type - Transaction type
 * @param description - Optional description
 * @param reference - Optional reference ID
 * @returns Updated balance
 */
export async function deductNPoints(
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string,
  reference?: string
) {
  if (amount <= 0) {
    throw new Error("Amount must be positive")
  }

  try {
    // Check if user has enough balance
    const profile = await prisma.playerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      throw new Error("Player profile not found")
    }

    if (profile.nPoints < amount) {
      throw new Error("Insufficient N-Points balance")
    }

    // Update balance
    const updatedProfile = await prisma.playerProfile.update({
      where: { userId },
      data: {
        nPoints: {
          decrement: amount,
        },
      },
    })

    // Create transaction record (negative amount)
    await prisma.nPointsTransaction.create({
      data: {
        userId,
        amount: -amount,
        type,
        description,
        reference,
      },
    })

    console.log(`✅ Deducted ${amount} N-Points from user ${userId} (${type})`)
    return updatedProfile.nPoints
  } catch (error) {
    console.error("Error deducting N-Points:", error)
    throw error
  }
}

/**
 * Get user's N-Points balance
 * @param userId - User ID
 * @returns Current balance
 */
export async function getNPointsBalance(userId: string): Promise<number> {
  try {
    const profile = await prisma.playerProfile.findUnique({
      where: { userId },
      select: { nPoints: true },
    })

    return profile?.nPoints || 0
  } catch (error) {
    console.error("Error getting N-Points balance:", error)
    return 0
  }
}

/**
 * Get user's transaction history
 * @param userId - User ID
 * @param limit - Number of transactions to fetch (default: 50)
 * @returns Transaction history
 */
export async function getTransactionHistory(userId: string, limit: number = 50) {
  try {
    const transactions = await prisma.nPointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return transactions
  } catch (error) {
    console.error("Error getting transaction history:", error)
    return []
  }
}

/**
 * Calculate N-Points reward based on Aim Trainer score
 * @param score - Final score
 * @param accuracy - Accuracy percentage
 * @returns N-Points to award
 */
export function calculateAimTrainerReward(score: number, accuracy: number): number {
  let nPoints = 0

  // Base reward from score
  if (score >= 300) {
    nPoints += 50 // Excellent
  } else if (score >= 200) {
    nPoints += 30 // Very Good
  } else if (score >= 100) {
    nPoints += 15 // Good
  } else if (score >= 50) {
    nPoints += 5 // Okay
  }

  // Accuracy bonus
  if (accuracy >= 90) {
    nPoints += 20 // 90%+ accuracy
  } else if (accuracy >= 80) {
    nPoints += 10 // 80%+ accuracy
  } else if (accuracy >= 70) {
    nPoints += 5 // 70%+ accuracy
  }

  return nPoints
}

/**
 * Get leaderboard rewards for top 3 players
 * @returns Reward amounts for 1st, 2nd, 3rd place
 */
export function getLeaderboardRewards() {
  return {
    1: 1000, // 1st place: 1000 N-Points
    2: 500,  // 2nd place: 500 N-Points
    3: 250,  // 3rd place: 250 N-Points
  }
}
