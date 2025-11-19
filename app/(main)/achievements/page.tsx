import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AchievementGrid } from "@/components/achievements/achievement-grid"

export default async function AchievementsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🏆 Achievements</h1>
        <p className="text-muted-foreground">
          Complete challenges and unlock achievements to earn reputation points
        </p>
      </div>

      <AchievementGrid />
    </div>
  )
}
