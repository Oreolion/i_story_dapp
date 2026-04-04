import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ReEngagementEmailProps {
  username: string;
  daysSinceLastStory: number;
}

export const ReEngagementEmail = ({
  username,
  daysSinceLastStory,
}: ReEngagementEmailProps) => {
  const previewText = `We miss your stories, ${username}!`;

  const getMessage = () => {
    if (daysSinceLastStory >= 30) {
      return "It's been a while since your last story. The world is moving fast — your perspective matters. Come back and capture what's on your mind.";
    }
    if (daysSinceLastStory >= 14) {
      return "Two weeks without a story? Your future self will thank you for writing today. Even a quick reflection counts.";
    }
    return "It's been a few days since your last story. A 2-minute voice note can capture what you're thinking right now before it fades.";
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                We miss your stories,{" "}
                <span className="font-bold text-amber-600">{username}</span>
              </Heading>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              {getMessage()}
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#d4a04a] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href="https://estories.app/record"
              >
                Write a Story
              </Button>
            </Section>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              You can turn off these reminders in your{" "}
              <a href="https://estories.app/profile" className="text-amber-600">
                profile settings
              </a>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ReEngagementEmail;
