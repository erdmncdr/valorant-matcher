import { prisma } from "./prisma"
import { TransactionType } from "@prisma/client"

// Referral commission rate (5%)
const REFERRAL_COMMISSION_RATE = 0.05

/**
 * Add N-Points to a user's balance
 * Also handles referral commission if the user was referred by someone
 * @param userId - User ID
 * @param amount - Amount to add (positive number)
 * @param type - Transaction type
 * @param description - Optional description
 * @param reference - Optional reference ID (e.g., purchase ID, wheel spin ID)
 * @param skipReferralCommission - Skip referral commission (e.g., for referral bonus itself)
 * @returns Updated balance
 */
export async function addNPoints(
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string,
  reference?: string,
  skipReferralCommission: boolean = false
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
      include: {
        referredByUser: {
          include: {
            playerProfile: true,
          },
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

    // Handle referral commission if applicable
    if (!skipReferralCommission && profile.referredByUserId && profile.referredByUser?.playerProfile) {
      await addReferralCommission(
        profile.referredByUser.playerProfile.id,
        userId,
        amount,
        type,
        description
      )
    }

    return profile.nPoints
  } catch (error) {
    console.error("Error adding N-Points:", error)
    throw error
  }
}

/**
 * Add referral commission to referrer's piggy bank
 * Only gives commission for the first 5 referrals
 * @param referrerProfileId - Profile ID of the referrer
 * @param referredUserId - User ID of the referred user who earned NP
 * @param sourceAmount - Original amount earned by referred user
 * @param transactionType - Type of transaction that generated this earning
 * @param description - Description of the original transaction
 */
async function addReferralCommission(
  referrerProfileId: string,
  referredUserId: string,
  sourceAmount: number,
  transactionType: TransactionType,
  description?: string
) {
  // Calculate 5% commission (minimum 1 NP if there's any commission)
  const commission = Math.floor(sourceAmount * REFERRAL_COMMISSION_RATE)

  if (commission <= 0) {
    return // No commission for very small amounts
  }

  try {
    // Get referrer's profile to check their userId
    const referrerProfile = await prisma.playerProfile.findUnique({
      where: { id: referrerProfileId },
      select: { userId: true },
    })

    if (!referrerProfile) {
      return
    }

    // Check how many referrals this referrer has (limit commission to first 5)
    const referralCount = await prisma.playerProfile.count({
      where: {
        referredByUserId: referrerProfile.userId,
      },
    })

    // Only give commission for first 5 referrals
    const MAX_COMMISSION_REFERRALS = 5
    if (referralCount > MAX_COMMISSION_REFERRALS) {
      console.log(`⚠️ Referrer ${referrerProfileId} has ${referralCount} referrals, no commission (limit: ${MAX_COMMISSION_REFERRALS})`)
      return
    }

    // Update referrer's piggy bank balance
    await prisma.playerProfile.update({
      where: { id: referrerProfileId },
      data: {
        referralBalance: {
          increment: commission,
        },
      },
    })

    // Create referral earning record
    await prisma.referralEarning.create({
      data: {
        referrerProfileId,
        referredUserId,
        sourceAmount,
        earnedAmount: commission,
        transactionType,
        description: description || `${transactionType} commission`,
      },
    })

    console.log(`💰 Added ${commission} NP referral commission to profile ${referrerProfileId} (${referralCount}/${MAX_COMMISSION_REFERRALS} referrals)`)
  } catch (error) {
    console.error("Error adding referral commission:", error)
    // Don't throw - referral commission failure shouldn't affect the main transaction
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

  // Base reward from score (çok düşük tutuldu, zor kazanılmalı)
  if (score >= 400) {
    nPoints += 10 // Excellent (çok zor)
  } else if (score >= 300) {
    nPoints += 7 // Very Good
  } else if (score >= 200) {
    nPoints += 5 // Good
  } else if (score >= 100) {
    nPoints += 2 // Okay
  } else if (score >= 50) {
    nPoints += 1 // Başlangıç
  }

  // Accuracy bonus (çok düşük)
  if (accuracy >= 95) {
    nPoints += 5 // 95%+ accuracy (neredeyse imkansız)
  } else if (accuracy >= 90) {
    nPoints += 3 // 90%+ accuracy
  } else if (accuracy >= 85) {
    nPoints += 2 // 85%+ accuracy
  } else if (accuracy >= 80) {
    nPoints += 1 // 80%+ accuracy
  }

  return nPoints
}

/**
 * Get leaderboard rewards for top 10 players
 * @returns Reward amounts for each rank position
 */
export function getLeaderboardRewards(): Record<number, number> {
  return {
    1: 100,  // 1st place: 100 N-Points
    2: 50,   // 2nd place: 50 N-Points
    3: 25,   // 3rd place: 25 N-Points
    4: 10,   // 4th place: 10 N-Points
    5: 10,   // 5th place: 10 N-Points
    6: 10,   // 6th place: 10 N-Points
    7: 10,   // 7th place: 10 N-Points
    8: 10,   // 8th place: 10 N-Points
    9: 10,   // 9th place: 10 N-Points
    10: 10,  // 10th place: 10 N-Points
  }
}
