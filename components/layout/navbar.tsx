"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User, LayoutDashboard, ChevronDown, Languages } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface NavbarProps {
  profile?: {
    nickname: string
    tagline: string
  }
  currentPage?: string
}

export function Navbar({ profile, currentPage }: NavbarProps) {
  const { t, language, setLanguage } = useLanguage()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`sticky top-0 z-50 border-b border-border transition-all duration-300 ${
      scrolled
        ? 'bg-background/95 backdrop-blur-xl shadow-lg'
        : 'bg-background/50 backdrop-blur-sm'
    }`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/listings" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">N1</span>
              </div>
              <span className="text-foreground font-bold text-xl">{t.nav.logo}</span>
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/listings">
                <Button
                  variant="ghost"
                  className={currentPage === 'listings' ? 'text-primary' : 'text-foreground'}
                >
                  {t.nav.findPlayers}
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button
                  variant="ghost"
                  className={currentPage === 'leaderboard' ? 'text-primary' : 'text-foreground'}
                >
                  {t.nav.leaderboard}
                </Button>
              </Link>
              <Link href="/my-listings">
                <Button
                  variant="ghost"
                  className={currentPage === 'my-listings' ? 'text-primary' : 'text-foreground'}
                >
                  {t.nav.myListings}
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Language Switcher - More Visible */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
              className="border-accent/50 hover:border-accent hover:bg-accent/10 flex items-center gap-1.5 px-3"
            >
              <Languages className="h-4 w-4" />
              <span className="font-semibold text-base">{language === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}</span>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {profile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8 ring-1 ring-border">
                      <AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">
                        {profile.nickname.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-foreground">{profile.nickname}</p>
                      <p className="text-xs text-muted-foreground">{profile.tagline}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {t.nav.dashboard}
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/profile/edit">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      {t.nav.editProfile}
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-500 focus:text-red-500"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.nav.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
