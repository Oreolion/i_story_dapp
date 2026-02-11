import type { Metadata } from "next";
import SocialPage from "./SocialPageClient";

export const metadata: Metadata = {
  title: "Community Stories",
  description:
    "Discover inspiring stories from writers around the world. Read, like, tip creators, and join the iStory community.",
  openGraph: {
    title: "Community Stories | iStory",
    description:
      "Discover inspiring stories from writers around the world on iStory.",
  },
};

export default function Page() {
  return <SocialPage />;
}
