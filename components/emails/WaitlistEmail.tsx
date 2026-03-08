import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface WaitlistEmailProps {
  email: string;
}

export const WaitlistEmail = ({ email }: WaitlistEmailProps) => {
  const previewText =
    "You're on the EStory waitlist — we'll let you know when the mobile app launches.";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                You&apos;re on the list{" "}
                <span className="font-bold text-amber-600">EStory</span>
              </Heading>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Thanks for signing up! We&apos;ve added{" "}
              <strong>{email}</strong> to the EStory mobile app waitlist.
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              EStory is the first decentralized voice journaling platform —
              capture your stories with your voice, get AI-powered insights,
              and own your memories on-chain.
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              We&apos;ll notify you as soon as the mobile app is ready for
              download. In the meantime, you can try the web app:
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Link
                href="https://estory.vercel.app"
                className="bg-[#d4a04a] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
              >
                Try EStory Web App
              </Link>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              You received this email because {email} was signed up for the
              EStory waitlist. If this wasn&apos;t you, you can safely ignore
              this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WaitlistEmail;
