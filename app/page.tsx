"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Star, MessageCircle, Loader2, Languages } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "authenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">N1</span>
              </div>
              <span className="text-foreground font-bold text-xl">{t.nav.logo}</span>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                className="border-accent/50 hover:border-accent hover:bg-accent/10 flex items-center gap-1.5 px-3"
              >
                <Languages className="h-4 w-4" />
                <span className="font-semibold text-base">{language === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}</span>
              </Button>
              <Link href="/login">
                <Button variant="ghost">{t.auth.signIn}</Button>
              </Link>
              <Link href="/register">
                <Button variant="valorant">{t.auth.signUp}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
              {t.home.title}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.home.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="valorant" className="text-lg px-8 glow-red">
                {t.home.findNow}
              </Button>
            </Link>
            <Link href="/listings">
              <Button size="lg" variant="outline" className="text-lg px-8 border-secondary text-secondary hover:bg-secondary/10">
                {t.home.browsePlayers}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-primary/20 bg-card/50 backdrop-blur hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t.home.teamAndSoloListings}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t.home.teamAndSoloListingsDesc}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-card/50 backdrop-blur hover:border-secondary/40 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>{t.home.safeAndModerated}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t.home.safeAndModeratedDesc}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/50 backdrop-blur hover:border-accent/40 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>{t.home.reputationSystem}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t.home.reputationSystemDesc}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-card/50 backdrop-blur hover:border-yellow-500/40 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-yellow-500" />
              </div>
              <CardTitle>{t.home.builtInChat}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t.home.builtInChatDesc}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">{t.home.howItWorks}</h2>
          <p className="text-muted-foreground text-lg">{t.home.howItWorksSubtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border-2 border-primary">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t.home.step1Title}</h3>
            <p className="text-muted-foreground">{t.home.step1Desc}</p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4 border-2 border-secondary">
              <span className="text-2xl font-bold text-secondary">2</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t.home.step2Title}</h3>
            <p className="text-muted-foreground">{t.home.step2Desc}</p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 border-2 border-accent">
              <span className="text-2xl font-bold text-accent">3</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t.home.step3Title}</h3>
            <p className="text-muted-foreground">{t.home.step3Desc}</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur">
          <CardHeader className="text-center pb-8 pt-12">
            <CardTitle className="text-4xl mb-4">{t.home.readyToFindTeam}</CardTitle>
            <CardDescription className="text-lg">
              {t.home.joinCommunity}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-12">
            <Link href="/register">
              <Button size="lg" variant="valorant" className="text-lg px-12 glow-red">
                {t.home.getStartedFree}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground text-sm">
            <p>{t.home.footerDisclaimer}</p>
            <p className="mt-2">{t.home.footerTrademark}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
