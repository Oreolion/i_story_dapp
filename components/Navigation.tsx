"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useApp } from "./Provider";
import { Button } from "@/components/ui/button";
import {
  Home,
  Mic,
  Archive,
  Users,
  User,
  Moon,
  Sun,
  Coins,
  TrainTrack,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { AuthButton } from "./AuthButton";
import { useState, useEffect } from "react";
import { NotificationDropdown } from "./NotificationDropdown";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Record", href: "/record", icon: Mic },
  { name: "Archive", href: "/library", icon: Archive },
  { name: "Community", href: "/social", icon: Users },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Tracker", href: "/tracker", icon: TrainTrack },
];

export function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user } = useApp();
  // const userInfo = useAuth();
  //   console.log("User in Nav:", user);
  //   console.log("UserInfo in Nav:", userInfo);

  // FIX: Add client-side mount state
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 bg-linear-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] rounded-lg flex items-center justify-center"
            >
              <BookOpen className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-gradient-memory">
              IStory
            </span>
          </Link>

          {/* Navigation Links - Center */}
          <div className="hidden lg:flex items-center gap-2 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-[hsl(var(--memory-100))] dark:bg-[hsl(var(--memory-900)/0.3)] text-[hsl(var(--memory-600))] dark:text-[hsl(var(--memory-400))]"
                      : "text-gray-600 dark:text-gray-300 hover:text-[hsl(var(--memory-500))] dark:hover:text-[hsl(var(--memory-400))]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions - Spread out */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            {/* Token Balance */}
            {isClient && user && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(var(--growth-100))] dark:bg-[hsl(var(--growth-900)/0.3)] rounded-full"
                suppressHydrationWarning
              >
                <Coins className="w-4 h-4 text-[hsl(var(--growth-600))] dark:text-[hsl(var(--growth-400))]" />
                <span className="text-xs lg:text-sm font-semibold text-[hsl(var(--growth-600))] dark:text-[hsl(var(--growth-400))]">
                  {user.storyTokens}
                </span>
              </div>
            )}

            {/* Notifications */}
            <NotificationDropdown />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 p-0 hidden sm:flex"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Auth Button */}
            <AuthButton />
          </div>
        </div>
      </div>
      {/* Mobile Navigation */}
      <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[hsl(var(--memory-100))] dark:bg-[hsl(var(--memory-900)/0.3)] text-[hsl(var(--memory-600))] dark:text-[hsl(var(--memory-400))]"
                    : "text-gray-600 dark:text-gray-300 hover:text-[hsl(var(--memory-500))]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
