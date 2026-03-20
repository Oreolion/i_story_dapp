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

interface WelcomeEmailProps {
  username: string;
}

export const WelcomeEmail = ({ username }: WelcomeEmailProps) => {
  const previewText = `Welcome to EStories, ${username}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Welcome to <span className="font-bold text-amber-600">EStories</span>
              </Heading>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {username},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              You have successfully set up your profile on the first decentralized voice storytelling platform. Write about anything you&apos;re passionate about — personal reflections, history, geopolitics, culture, or creative non-fiction.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#d4a04a] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href="https://estories.app/record"
              >
                Record Your First Story
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Your stories are now immutable.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;