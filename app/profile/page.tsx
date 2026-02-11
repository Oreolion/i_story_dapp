import type { Metadata } from "next";
import ProfilePage from "./ProfilePageClient";

export const metadata: Metadata = {
  title: "Profile & Settings",
  description:
    "Manage your iStory account, track writing progress, view achievements, and configure your preferences.",
  openGraph: {
    title: "Profile & Settings | iStory",
    description:
      "Manage your iStory account and track your writing progress.",
  },
};

export default function Page() {
  return <ProfilePage />;
}
