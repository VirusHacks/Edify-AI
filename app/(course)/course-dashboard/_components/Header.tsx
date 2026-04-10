"use client"
import Image from "next/image";
import React from "react";
import { useKindeBrowserClient, LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, isAuthenticated } = useKindeBrowserClient();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Image 
              src="/logo.png" 
              alt="Gen-Ed" 
              width={120} 
              height={40} 
              priority 
              className="object-contain" 
            />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/course-dashboard" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Dashboard
            </a>
            <a href="/create-course" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Create Course
            </a>
            <a href="/events" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Events
            </a>
          </nav>

          {/* User Menu */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.picture || ""} alt={user?.given_name || ""} />
                    <AvatarFallback className="bg-slate-100 text-slate-600">
                      {user?.given_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{user?.given_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/dashboard">Profile</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/pricing">Billing</a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LogoutLink className="w-full">Sign out</LogoutLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
