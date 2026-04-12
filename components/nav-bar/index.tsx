/**
 * @file index.tsx
 * @description Main navigation bar for the Edify-AI platform.
 * Supports responsive layouts (Sheet for mobile, horizontal nav for desktop),
 * Kinde authentication status, and neobrutalism design system integration.
 */

"use client"
import React, { useState, useEffect, useRef } from "react";
import {
  LoginLink,
  RegisterLink,
  LogoutLink,
  useKindeBrowserClient,
} from "@kinde-oss/kinde-auth-nextjs";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDown, Menu } from "lucide-react";

/**
 * Reusable navigation link component with neobrutalism hover effects.
 */
const NavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Link 
    prefetch={true}
    href={href}
    className="px-4 py-2 text-base font-medium rounded-lg transition-colors duration-200 hover:opacity-80 focus:outline-none"
    style={{ color: "#E4E4E7" }}
  >
    {children}
  </Link>
);

/**
 * Main Navbar component.
 * Features:
 * - Dynamic route highlighting
 * - Mobile-first responsive drawer (Sheet)
 * - Authentication state integration via Kinde
 * - Global backdrop blur and Z-index management
 */
const Navbar = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user, isAuthenticated } = useKindeBrowserClient();
  const pathname = usePathname();

  // Hide navbar on specialized route segments
  const hideNavbarRoutes = ['/agents', '/meetings'];
  if (pathname && hideNavbarRoutes.some(route => pathname.startsWith(route))) {
    return null;
  }

  const navLinks = [
    { href: "/dashboard", text: "AI Resume" },
    { href: "/mock/dashboard", text: "AI Interview" },
    { href: "/chat", text: "Chat" },
    { href: "https://framevr.io/edifyai", text: "AR Learning" },
    { href: "/path", text: "AI Path" },
    { href: "/career-advisior", text: "AI Advisor" },
  ];

  return (
    <main 
      className="w-full backdrop-blur-sm border-b shadow-xl sticky top-0"
      style={{ 
        backgroundColor: "#0A0A0A",
        borderColor: "#27272A",
        zIndex: 100
      }}
    >
      <div className="flex flex-col max-w-9xl px-4 mx-auto md:items-center md:justify-between md:flex-row md:px-6 lg:px-8">
        <div className="p-4 flex flex-row justify-between items-center h-[70px]">
          <Link href="/main-dashboard" className="flex items-center">
            <p className="text-2xl font-bold tracking-wider" style={{ color: "#E4E4E7" }}>Edify AI</p>
          </Link>
          
          {/* Mobile Drawer (Tablet/Mobile Only) */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button
                className="rounded-lg focus:outline-none p-2 transition-colors hover:opacity-80"
                style={{ color: "#E4E4E7" }}
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[300px] sm:w-[400px] overflow-y-auto"
              style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}
            >
              <SheetHeader>
                <SheetTitle className="text-left mb-6" style={{ color: "#E4E4E7" }}>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-bold tracking-wider">Edify AI</p>
                  </div>
                </SheetTitle>
              </SheetHeader>
              
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={true}
                    className="px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 hover:opacity-80 focus:outline-none"
                    style={{ color: "#E4E4E7" }}
                    onClick={() => setIsSheetOpen(false)}
                  >
                    {link.text}
                  </Link>
                ))}

                <div className="flex flex-col gap-4 mt-6 pt-6 border-t" style={{ borderColor: "#27272A" }}>
                  {isAuthenticated ? (
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer px-4 py-2"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <img
                        src={user?.picture || "/default-avatar.png"}
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full border"
                        style={{ borderColor: "#27272A" }}
                      />
                      <span className="text-base font-medium" style={{ color: "#E4E4E7" }}>
                        {user?.given_name || "User"}
                      </span>
                    </Link>
                  ) : (
                    <>
                      <LoginLink>
                        <Button 
                          variant="outline"
                          className="w-full rounded-lg font-medium text-base transition-all duration-200 hover:opacity-90"
                          style={{ 
                            borderColor: "#27272A",
                            backgroundColor: "#27272A",
                            color: "#E4E4E7"
                          }}
                        >
                          Sign In
                        </Button>
                      </LoginLink>
                      <RegisterLink>
                        <Button 
                          className="w-full rounded-lg font-medium text-base transition-all duration-200 hover:opacity-90"
                          style={{ 
                            backgroundColor: "#3B82F6",
                            color: "#FFFFFF"
                          }}
                        >
                          Get Started
                        </Button>
                      </RegisterLink>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex md:relative md:flex-row md:items-center md:justify-end gap-4">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.text}
            </NavLink>
          ))}

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                <img
                  src={user?.picture || "/default-avatar.png"}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full border"
                  style={{ borderColor: "#27272A" }}
                />
                <span className="text-base font-medium" style={{ color: "#E4E4E7" }}>
                  {user?.given_name || "User"}
                </span>
              </Link>
            ) : (
              <>
                <LoginLink>
                  <Button 
                    variant="outline"
                    className="rounded-lg font-medium text-base transition-all duration-200 hover:opacity-90"
                    style={{ 
                      borderColor: "#27272A",
                      backgroundColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  >
                    Sign In
                  </Button>
                </LoginLink>
                <RegisterLink>
                  <Button 
                    className="rounded-lg font-medium text-base transition-all duration-200 hover:opacity-90"
                    style={{ 
                      backgroundColor: "#3B82F6",
                      color: "#FFFFFF"
                    }}
                  >
                    Get Started
                  </Button>
                </RegisterLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </main>
  );
};

export default Navbar;