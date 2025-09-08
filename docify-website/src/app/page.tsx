import React from "react";

import { Heading, Flex, Text, Button, Avatar, RevealFx, Arrow, Column } from "@/once-ui/components";
import { Projects } from "@/components/work/Projects";

import { baseURL, routes } from "@/app/resources";
import { home, about, person, newsletter } from "@/app/resources/content";
import { Mailchimp } from "@/components";

export async function generateMetadata() {
  const title = home.title;
  const description = home.description;
  const ogImage = `https://${baseURL}/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://${baseURL}`,
      images: [
        {
          url: ogImage,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function Home() {
  return (
    <Column maxWidth="m" gap="xl" horizontal="center">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: home.title,
            description: home.description,
            url: `https://${baseURL}`,
            image: `${baseURL}/og?title=${encodeURIComponent(home.title)}`,
            publisher: {
              "@type": "Person",
              name: person.name,
              image: {
                "@type": "ImageObject",
                url: `${baseURL}${person.avatar}`,
              },
            },
          }),
        }}
      />
      <Column fillWidth paddingY="l" gap="m">
        <Column maxWidth="s">
          <RevealFx translateY="4" fillWidth horizontal="start" paddingBottom="m">
            <Flex fillWidth gap="24" mobileDirection="column" align="center">
              <Flex flex={2}>
                <Heading wrap="balance" variant="display-strong-l">
                  {home.headline}
                </Heading>
              </Flex>
              <Flex flex={1} horizontal="end">
                <a href="/get-started" className="get-started-link-card">
                  <div className="get-started-card">
                    <div className="card-content">
                      <Text variant="display-strong-xs" style={{ textAlign: "center" }}>
                        Get Started
                      </Text>
                    </div>
                  </div>
                </a>
              </Flex>
            </Flex>
          </RevealFx>
        </Column>

        {/* Document Creation Section */}
        <RevealFx translateY="8" delay={0.3}>
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
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </div>
              <Heading as="h3" variant="heading-strong-l">
                Analyze Any Document
              </Heading>
              <Text variant="body-default-m" onBackground="neutral-weak">
                Paste any URL and get AI-powered analysis with interactive charts, summaries, and code examples.
              </Text>
              <a href="/documents" style={{ textDecoration: 'none' }}>
                <Button
                  variant="primary"
                  size="l"
                  style={{
                    backgroundColor: 'var(--brand-background-strong)',
                    color: 'var(--brand-on-background-strong)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Create New Document
                </Button>
              </a>
            </Column>
          </Column>
        </RevealFx>
      </Column>
      <RevealFx translateY="16" delay={0.6}>
        <Projects range={[1, 1]} />
      </RevealFx>
      <Projects range={[2]} />
      {newsletter.display && <Mailchimp newsletter={newsletter} />}
    </Column>
  );
}
