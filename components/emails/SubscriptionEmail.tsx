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

interface SubscriptionEmailProps {
  username: string;
  plan: string;
  expiresAt: string;
}

export const SubscriptionEmail = ({
  username,
  plan,
  expiresAt,
}: SubscriptionEmailProps) => {
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const previewText = `Your ${planName} subscription is now active!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Your{" "}
                <span className="font-bold text-amber-600">{planName}</span>{" "}
                plan is active
              </Heading>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {username},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Your payment has been confirmed and your {planName} subscription
              is now active. Thank you for supporting eStories!
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>Plan:</strong> {planName}
              <br />
              <strong>Valid until:</strong> {expiresAt}
            </Text>
            {plan === "storyteller" && (
              <Text className="text-black text-[14px] leading-[24px]">
                You now have access to unlimited AI story analyses, actionable
                craft advice, story collections, weekly reflections, and
                advanced theme tracking.
              </Text>
            )}
            {plan === "creator" && (
              <Text className="text-black text-[14px] leading-[24px]">
                You now have access to everything in Storyteller plus unlimited
                public publishing, creator analytics, custom author profile,
                priority support, and early access to new features.
              </Text>
            )}
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#d4a04a] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href="https://estories.app/record"
              >
                Start Writing
              </Button>
            </Section>
            <Text className="text-gray-500 text-[12px] leading-[20px]">
              If you have questions about your subscription, reply to this
              email or visit your profile settings.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SubscriptionEmail;
