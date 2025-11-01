"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useApp } from "./Provider";
// import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import {
  Home,
  Mic,
  BookOpen,
  Users,
  User,
  Moon,
  Sun,
  Wallet,
  LogOut,
  Coins,
} from "lucide-react";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react"; // FIX: Import useState and useEffect

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Record", href: "/record", icon: Mic },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Social", href: "/social", icon: Users },
  { name: "Profile", href: "/profile", icon: User },
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
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center"
            >
              <BookOpen className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              IStory
            </span>
          </Link>
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* FIX: Wrap client-side content in isClient check */}
            {isClient && user && (
              <div
                className="flex items-center space-x-2 text-sm bg-emerald-100 dark:bg-emerald-900 px-3 py-1 rounded-full"
                suppressHydrationWarning
              >
                {" "}
                {/* Fixed hydration */}
                <Coins className="w-4 h-4 text-emerald-600" />
                {/* <span className="font-medium text-emerald-600">{user.storyTokens} $STORY</span> */}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <ConnectButton showBalance={false} />
          </div>
        </div>
      </div>
      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300"
                    : "text-gray-600 dark:text-gray-300"
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