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

const NavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Link 
    prefetch={true}
    href={href}
    className="px-4 py-2 text-base font-medium rounded-lg transition-colors duration-200 hover:opacity-80 focus:outline-none"
    style={{ color: "#E4E4E7" }}
    onMouseEnter={(e) => e.currentTarget.style.color = "#3B82F6"}
    onMouseLeave={(e) => e.currentTarget.style.color = "#E4E4E7"}
  >
    {children}
  </Link>
);


const Navbar = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const { user, isAuthenticated } = useKindeBrowserClient();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDesktopDropdownOpen(false);
      }
    };

    if (desktopDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [desktopDropdownOpen]);

  // Hide navbar on certain routes that have their own specialized navbars
  // Keep the main navbar on profile page, but hide on other routes with their own navbars
  const hideNavbarRoutes = ['/agents', '/meetings'];
  if (pathname && hideNavbarRoutes.some(route => pathname.startsWith(route))) {
    return null;
  }

  const navLinks = [
    { href: "/course-dashboard", text: "AI Course" },
    { href: "/dashboard", text: "AI Resume" },
    { href: "/mock/dashboard", text: "AI Interview" },
    // { href: "/meeting-home", text: "AI Meeting" },
    { href: "/chat", text: "Chat" },
    { href: "https://framevr.io/edifyai", text: "AR Learning" },
    { href: "/path", text: "AI Path" },
    // { href: "/career-advisior", text: "AI Advisor" },
  ];

  const dropdownItems = [
    { href: "/events", text: "Latest Hackathons" },
    { href: "/events", text: "Latest Meetups" },
    { href: "/internship", text: "Latest Internships" },
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
          
          {/* Mobile Hamburger Menu */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button
                className="rounded-lg focus:outline-none p-2 transition-colors hover:opacity-80"
                style={{ color: "#E4E4E7" }}
                aria-label="Open menu"
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

                {/* <div className="relative mt-2">
                  <DropdownMenu open={mobileDropdownOpen} onOpenChange={setMobileDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex flex-row items-center w-full px-4 py-3 text-base font-medium rounded-lg transition-colors focus:outline-none"
                        style={{ color: "#E4E4E7" }}
                      >
                        <span>Upcoming Events</span>
                        <ChevronDown 
                          className={`inline w-4 h-4 ml-1 transition-transform duration-200 ${
                            mobileDropdownOpen ? "rotate-180" : "rotate-0"
                          }`}
                          style={{ color: "#A1A1AA" }}
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      className="rounded-xl border min-w-[200px]"
                      align="start"
                      style={{ 
                        backgroundColor: "#0A0A0A",
                        borderColor: "#27272A",
                        zIndex: 9999
                      }}
                    >
                      {dropdownItems.map((item) => (
                        <DropdownMenuItem
                          key={item.href}
                          asChild
                          className="rounded-lg focus:bg-[#27272A] focus:text-[#E4E4E7] cursor-pointer"
                          style={{ color: "#E4E4E7" }}
                        >
                          <Link prefetch={true} href={item.href} className="block" onClick={() => setIsSheetOpen(false)}>
                            <span className="text-base font-medium">{item.text}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div> */}

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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:relative md:flex-row md:items-center md:justify-end gap-4">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.text}
            </NavLink>
          ))}

          {/* <div className="relative" ref={dropdownRef}>
            <DropdownMenu open={desktopDropdownOpen} onOpenChange={setDesktopDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex flex-row items-center px-4 py-2 text-base font-medium rounded-lg transition-colors focus:outline-none"
                  style={{ color: "#E4E4E7" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#3B82F6"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#E4E4E7"}
                >
                  <span>Upcoming Events</span>
                  <ChevronDown 
                    className={`inline w-4 h-4 ml-1 transition-transform duration-200 ${
                      desktopDropdownOpen ? "rotate-180" : "rotate-0"
                    }`}
                    style={{ color: "#A1A1AA" }}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="rounded-xl border min-w-[200px]"
                align="end"
                style={{ 
                  backgroundColor: "#0A0A0A",
                  borderColor: "#27272A",
                  zIndex: 9999
                }}
              >
                {dropdownItems.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    className="rounded-lg focus:bg-[#27272A] focus:text-[#E4E4E7] cursor-pointer"
                    style={{ color: "#E4E4E7" }}
                  >
                    <Link prefetch={true} href={item.href} className="block">
                      <span className="text-base font-medium">{item.text}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div> */}

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