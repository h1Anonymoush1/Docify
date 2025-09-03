"use client";

import React from "react";

import { Heading, Flex, Text, RevealFx, Column } from "@/once-ui/components";
import { AuthButtons } from "@/components/AuthButtons";
import { baseURL } from "@/app/resources";

function GetStartedContent() {
  return (
    <Column fillWidth fillHeight horizontal="center" vertical="center" gap="xl">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Get Started - Docify",
            description: "Start your journey with Docify",
            url: `${baseURL}/get-started`,
          }),
        }}
      />

      <RevealFx translateY="4" fillWidth horizontal="center" paddingBottom="m">
        <Column maxWidth="s" horizontal="center">
          <Heading wrap="balance" variant="display-strong-l" style={{ textAlign: 'center' }}>
            Welcome to <span className="text-teal">Docify</span>
          </Heading>
        </Column>
      </RevealFx>

      {/* Auth Options */}
      <RevealFx translateY="8" delay={0.2}>
        <Column maxWidth="m" horizontal="center" gap="l">
          <Column
            background="surface"
            border="neutral-medium"
            radius="l"
            padding="32"
            gap="16"
            maxWidth="s"
            horizontal="center"
            style={{ textAlign: "center" }}
          >
            <div style={{
              width: "80px",
              height: "80px",
              backgroundColor: "var(--brand-background-weak)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px"
            }}>
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="48"
                height="48"
                style={{ color: "var(--brand-on-background-strong)" }}
              >
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <Heading as="h3" variant="heading-strong-l">
              Get Started with Email
            </Heading>
            <Text variant="body-default-m" onBackground="neutral-weak">
              Sign in or create an account with your email address using a secure one-time password.
            </Text>
            <AuthButtons />
          </Column>
        </Column>
      </RevealFx>
    </Column>
  );
}

export default function GetStarted() {
  return <GetStartedContent />;
}
