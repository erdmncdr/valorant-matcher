"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface NavbarProps {
  profile?: {
    nickname: string
    tagline: string
  }
  currentPage?: string
}

export function Navbar({ profile, currentPage }: NavbarProps) {
  return (
    <nav className="border-b border-white/10 bg-valorant-dark/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-valorant-red flex items-center justify-center">
                <span className="text-white font-bold text-xl">N1</span>
              </div>
              <span className="text-white font-bold text-xl">NeedOne</span>
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/listings">
                <Button
                  variant="ghost"
                  className={currentPage === 'listings' ? 'text-valorant-red' : 'text-white'}
                >
                  Find Players
                </Button>
              </Link>
              <Link href="/my-listings">
                <Button
                  variant="ghost"
                  className={currentPage === 'my-listings' ? 'text-valorant-red' : 'text-white'}
                >
                  My Listings
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {profile && (
              <>
                <Link href="/profile/edit">
                  <Button variant="outline">Edit Profile</Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-white">{profile.nickname}</p>
                    <p className="text-xs text-gray-400">{profile.tagline}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-gray-400 hover:text-white hover:bg-red-500/10"
                    title="Sign Out"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
