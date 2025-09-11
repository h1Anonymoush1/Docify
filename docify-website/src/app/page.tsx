import { Heading, Column, Text, Button } from "@/once-ui/components";

import { baseURL } from "@/app/resources";
import { person } from "@/app/resources/content";

export default function Home() {
  return (
    <Column fillWidth fillHeight horizontal="center" vertical="center" padding="l">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Docify - AI-Powered Document Analysis",
            description: "Analyze any website using AI-powered content extraction and visualization",
            url: `https://${baseURL}`,
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

      <Column maxWidth="m" gap="l" horizontal="center">
        {/* Simple Header */}
        <Column horizontal="center" gap="m">
          <Heading variant="display-strong-l" style={{ textAlign: "center" }}>
            Docify
          </Heading>
          <Text variant="body-default-l" onBackground="neutral-weak" style={{ textAlign: "center" }}>
            AI-Powered Document Analysis
          </Text>
        </Column>

        {/* Simple Link to Dashboard */}
        <a href="/dashboard" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="l">
            Go to Dashboard
          </Button>
        </a>
      </Column>
    </Column>
  );
}
