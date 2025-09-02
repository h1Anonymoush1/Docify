import React from "react";

import { Heading, Flex, Text, Button, Avatar, RevealFx, Arrow, Column } from "@/once-ui/components";
import { Projects } from "@/components/work/Projects";

import { baseURL, routes } from "@/app/resources";
import { home, about, person, newsletter } from "@/app/resources/content";
import { Mailchimp } from "@/components";
import { Posts } from "@/components/blog/Posts";

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
      </Column>
      <RevealFx translateY="16" delay={0.6}>
        <Projects range={[1, 1]} />
      </RevealFx>
      {routes["/blog"] && (
        <Flex fillWidth gap="24" mobileDirection="column">
          <Flex flex={1} paddingLeft="l">
            <Heading as="h2" variant="display-strong-xs" wrap="balance">
              Latest from the blog
            </Heading>
          </Flex>
          <Flex flex={3} paddingX="20">
            <Posts range={[1, 2]} columns="2" />
          </Flex>
        </Flex>
      )}
      <Projects range={[2]} />
      {newsletter.display && <Mailchimp newsletter={newsletter} />}
    </Column>
  );
}
