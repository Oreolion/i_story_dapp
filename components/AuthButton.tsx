"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AuthModal } from "./AuthModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Link as LinkIcon } from "lucide-react";

export function AuthButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, needsOnboarding, signOut } = useAuth();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    disconnect();
  };

  // Redirect to onboarding page when needed (unless already there)
  useEffect(() => {
    if (needsOnboarding && profile && pathname !== "/onboarding") {
      router.push("/onboarding");
    }
  }, [needsOnboarding, profile, pathname, router]);

  // Not authenticated at all
  if (!profile && !isConnected) {
    return (
      <>
        <Button
          onClick={() => setShowAuthModal(true)}
          size="sm"
          className="bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] text-white"
        >
          Connect
        </Button>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Wallet connected but no profile yet (loading or first-time)
  if (isConnected && !profile) {
    return <ConnectButton showBalance={false} chainStatus="none" />;
  }

  // Needs onboarding — show a minimal button while redirect happens
  if (needsOnboarding && profile) {
    return (
      <Button variant="outline" size="sm" disabled>
        {profile.auth_provider === "google"
          ? (profile.name ?? "Setting up...")
          : "Setting up..."}
      </Button>
    );
  }

  // Authenticated via wallet — use RainbowKit's custom button
  if (profile?.auth_provider !== "google") {
    return <ConnectButton showBalance={false} chainStatus="none" />;
  }

  // Authenticated via Google only — custom dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={profile.avatar ?? undefined} />
            <AvatarFallback>
              {profile.name?.[0]?.toUpperCase() ?? "G"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm">
            {profile.name ?? "User"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href="/profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </a>
        </DropdownMenuItem>
        {!profile.wallet_address && (
          <DropdownMenuItem onClick={() => setShowAuthModal(true)}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Link Wallet
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </DropdownMenu>
  );
}
