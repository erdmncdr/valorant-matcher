"use client"

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

  return (
    <nav className="border-b border-white/10 bg-valorant-dark/50 backdrop-blur-sm">
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
          <div className="flex items-center space-x-4">
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
                    className="cursor-pointer"
                    onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                  >
                    <Languages className="mr-2 h-4 w-4" />
                    {language === 'tr' ? 'English' : 'Türkçe'}
                  </DropdownMenuItem>
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
