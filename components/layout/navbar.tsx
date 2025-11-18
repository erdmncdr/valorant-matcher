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
import { LogOut, User, LayoutDashboard, ChevronDown, Languages } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

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
    <nav className={`sticky top-0 z-50 border-b border-white/10 transition-all duration-300 ${
      scrolled
        ? 'bg-valorant-dark/95 backdrop-blur-xl shadow-lg shadow-black/50'
        : 'bg-valorant-dark/50 backdrop-blur-sm'
    }`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/listings" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-valorant-red flex items-center justify-center">
                <span className="text-white font-bold text-xl">N1</span>
              </div>
              <span className="text-white font-bold text-xl">{t.nav.logo}</span>
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/listings">
                <Button
                  variant="ghost"
                  className={currentPage === 'listings' ? 'text-valorant-red' : 'text-white'}
                >
                  {t.nav.findPlayers}
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button
                  variant="ghost"
                  className={currentPage === 'leaderboard' ? 'text-valorant-red' : 'text-white'}
                >
                  {t.nav.leaderboard}
                </Button>
              </Link>
              <Link href="/my-listings">
                <Button
                  variant="ghost"
                  className={currentPage === 'my-listings' ? 'text-valorant-red' : 'text-white'}
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
              className="border-valorant-purple/50 hover:border-valorant-purple hover:bg-valorant-purple/10 text-white hover:text-white flex items-center gap-1.5 px-3"
            >
              <Languages className="h-4 w-4" />
              <span className="font-semibold text-base">{language === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}</span>
            </Button>

            {profile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-white">{profile.nickname}</p>
                      <p className="text-xs text-gray-400">{profile.tagline}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
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
