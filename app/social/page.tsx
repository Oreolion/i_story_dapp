import type { Metadata } from "next";
import SocialPage from "./SocialPageClient";

export const metadata: Metadata = {
  title: "Community Stories",
  description:
    "Discover inspiring stories from writers around the world. Read, like, tip creators, and join the eStory community.",
  openGraph: {
    title: "Community Stories | eStory",
    description:
      "Discover inspiring stories from writers around the world on eStory.",
  },
};

export default function Page() {
  return <SocialPage />;
}
