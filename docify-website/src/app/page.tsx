"use client";

import React, { useState } from "react";

import { Heading, Flex, Text, Button, Avatar, RevealFx, Arrow, Column, Card, Grid, Background, Icon, Tag } from "@/once-ui/components";
import MermaidChart from "@/components/MermaidChart";

import { baseURL, routes } from "@/app/resources";
import { home, about, person } from "@/app/resources/content";

// Interactive Process Steps Component
function ProcessSteps({ activeStep, setActiveStep }: { activeStep: number; setActiveStep: (step: number) => void }) {
  const steps = [
    { id: 1, title: "Extract Data", description: "Parse document ID, URL, and instructions from request", icon: "search" },
    { id: 2, title: "Validate Environment", description: "Check API keys and required environment variables", icon: "check" },
    { id: 3, title: "Scrape Content", description: "Fetch raw HTML content using browserless approach", icon: "download" },
    { id: 4, title: "Save Raw Content", description: "Store original content in database without modification", icon: "database" },
    { id: 5, title: "Generate AI Title", description: "Create 2-4 word title using Gemini AI", icon: "sparkles" },
    { id: 6, title: "Analyze Content", description: "Generate structured analysis with summaries and blocks", icon: "brain" },
    { id: 7, title: "Create Blocks", description: "Format analysis into compatible content blocks", icon: "grid" },
    { id: 8, title: "Complete & Save", description: "Final save and mark document as completed", icon: "check-circle" }
  ];

  return (
    <Grid columns="2" gap="16" tabletColumns="1" mobileColumns="1">
      {steps.map((step) => (
        <Card
          key={step.id}
          padding="20"
          background={activeStep === step.id ? "brand-background-weak" : "surface"}
          border={activeStep === step.id ? "brand-strong" : "neutral-medium"}
          radius="m"
          style={{
            cursor: "pointer",
            transition: "all 0.3s ease",
            transform: activeStep === step.id ? "scale(1.02)" : "scale(1)"
          }}
          onClick={() => setActiveStep(step.id)}
        >
          <Flex gap="12" align="start">
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: activeStep === step.id ? "var(--brand-background-strong)" : "var(--neutral-background-medium)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Icon
                name={step.icon}
                size="s"
                onBackground={activeStep === step.id ? "brand-background-weak" : "neutral-strong"}
              />
            </div>
            <div>
              <Text variant="body-strong-s" style={{ marginBottom: "4px" }}>
                Step {step.id}: {step.title}
              </Text>
              <Text variant="body-default-xs" onBackground="neutral-weak">
                {step.description}
              </Text>
            </div>
          </Flex>
        </Card>
      ))}
    </Grid>
  );
}

// Flow Diagram Component
function FlowDiagram({ activeStep }: { activeStep: number }) {
  const flowChart = `
    graph TD
        A[📋 Extract Data] --> B[✅ Validate Environment]
        B --> C[🌐 Scrape Content]
        C --> D[💾 Save Raw Content]
        D --> E[🏷️ Generate AI Title]
        E --> F[📈 Analyze Content]
        F --> G[🧩 Create Blocks]
        G --> H[🎉 Complete & Save]

        style A fill:#e1f5fe,stroke:#01579b,stroke-width:2px
        style B fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
        style C fill:#fff3e0,stroke:#e65100,stroke-width:2px
        style D fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
        style E fill:#fce4ec,stroke:#880e4f,stroke-width:2px
        style F fill:#e0f2f1,stroke:#004d40,stroke-width:2px
        style G fill:#f9fbe7,stroke:#827717,stroke-width:2px
        style H fill:#e8eaf6,stroke:#1a237e,stroke-width:2px
  `;

  return (
    <Card padding="24" background="surface" border="neutral-medium" radius="l">
      <Flex vertical="center" gap="16">
        <Heading as="h3" variant="heading-strong-m">
          Docify Unified Orchestrator Flow
        </Heading>
        <Text variant="body-default-s" onBackground="neutral-weak" style={{ textAlign: "center" }}>
          Hover over steps below to see details of each processing phase
        </Text>
        <MermaidChart chart={flowChart} className="w-full" />
        <Tag variant="brand" size="s">
          Active Step: {activeStep}
        </Tag>
      </Flex>
    </Card>
  );
}

export default function Home() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <Column fillWidth>
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

      {/* Hero Section with Background */}
      <Background
        position="relative"
        gradient={{
          display: true,
          opacity: 30,
          x: 50,
          y: 50,
          width: 80,
          height: 80,
          tilt: 135,
          colorStart: "var(--brand-background-weak)",
          colorEnd: "var(--accent-background-weak)"
        }}
        dots={{
          display: true,
          opacity: 20,
          color: "var(--neutral-on-background-weak)",
          size: "4"
        }}
      >
        <Column fillWidth paddingY="xl" gap="xl" horizontal="center">
          {/* Main Headline */}
          <RevealFx translateY="8" fillWidth horizontal="center">
            <Column maxWidth="m" horizontal="center" gap="m">
              <Heading wrap="balance" variant="display-strong-l" style={{ textAlign: "center" }}>
                {home.headline}
              </Heading>
              <Text variant="heading-default-l" onBackground="neutral-weak" style={{ textAlign: "center" }}>
                Modern Documentation Platform with AI-Powered Analysis
              </Text>
            </Column>
          </RevealFx>

          {/* CTA Buttons */}
          <RevealFx translateY="8" delay={0.2} horizontal="center">
            <Flex gap="16" mobileDirection="column" horizontal="center">
              <a href="/dashboard" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="l">
                  Start Analyzing Documents
                </Button>
              </a>
              <a href="/explore" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="l">
                  Explore Public Docs
                </Button>
              </a>
            </Flex>
          </RevealFx>
        </Column>
      </Background>

      {/* Interactive Flow Section */}
      <Column fillWidth paddingY="xl" gap="xl" horizontal="center" background="neutral-background-weak">
        <Column maxWidth="l" gap="xl">
          {/* Section Header */}
          <RevealFx translateY="8" horizontal="center">
            <Column horizontal="center" gap="m" maxWidth="m">
              <Heading as="h2" variant="heading-strong-xl" style={{ textAlign: "center" }}>
                How Docify Processes Your Documents
              </Heading>
              <Text variant="body-default-l" onBackground="neutral-weak" style={{ textAlign: "center" }}>
                Our unified orchestrator follows an 8-step process to transform any URL into structured,
                AI-analyzed documentation with interactive visualizations.
              </Text>
            </Column>
          </RevealFx>

          {/* Flow Diagram */}
          <RevealFx translateY="8" delay={0.3}>
            <FlowDiagram activeStep={activeStep} />
          </RevealFx>

          {/* Interactive Steps */}
          <RevealFx translateY="8" delay={0.5}>
            <Column gap="l">
              <Heading as="h3" variant="heading-strong-l" style={{ textAlign: "center" }}>
                Process Details
              </Heading>
              <Text variant="body-default-m" onBackground="neutral-weak" style={{ textAlign: "center" }}>
                Click on any step to highlight it in the flow diagram above
              </Text>
              <ProcessSteps activeStep={activeStep} setActiveStep={setActiveStep} />
            </Column>
          </RevealFx>
        </Column>
      </Column>

      {/* Features Section */}
      <Column fillWidth paddingY="xl" gap="xl" horizontal="center">
        <Column maxWidth="l" gap="xl">
          <RevealFx translateY="8" horizontal="center">
            <Column horizontal="center" gap="m" maxWidth="m">
              <Heading as="h2" variant="heading-strong-xl" style={{ textAlign: "center" }}>
                Key Features
              </Heading>
            </Column>
          </RevealFx>

          <RevealFx translateY="8" delay={0.2}>
            <Grid columns="3" gap="24" tabletColumns="2" mobileColumns="1">
              <Card padding="24" background="surface" border="neutral-medium" radius="l">
                <Flex vertical="center" gap="12">
                  <Icon name="sparkles" size="l" />
                  <Heading as="h4" variant="heading-strong-m">
                    AI-Powered Analysis
                  </Heading>
                  <Text variant="body-default-s" onBackground="neutral-weak">
                    Advanced Gemini AI generates comprehensive summaries and structured content blocks
                  </Text>
                </Flex>
              </Card>

              <Card padding="24" background="surface" border="neutral-medium" radius="l">
                <Flex vertical="center" gap="12">
                  <Icon name="grid" size="l" />
                  <Heading as="h4" variant="heading-strong-m">
                    Interactive Blocks
                  </Heading>
                  <Text variant="body-default-s" onBackground="neutral-weak">
                    Multiple content types: code examples, mermaid diagrams, API references, and more
                  </Text>
                </Flex>
              </Card>

              <Card padding="24" background="surface" border="neutral-medium" radius="l">
                <Flex vertical="center" gap="12">
                  <Icon name="share" size="l" />
                  <Heading as="h4" variant="heading-strong-m">
                    Public Sharing
                  </Heading>
                  <Text variant="body-default-s" onBackground="neutral-weak">
                    Share your analyzed documents publicly or keep them private in your dashboard
                  </Text>
                </Flex>
              </Card>
            </Grid>
          </RevealFx>
        </Column>
      </Column>

      {/* Call to Action */}
      <Column fillWidth paddingY="xl" gap="xl" horizontal="center" background="brand-background-weak">
        <RevealFx translateY="8" horizontal="center">
          <Column horizontal="center" gap="l" maxWidth="m">
            <Heading as="h2" variant="heading-strong-xl" style={{ textAlign: "center", color: "var(--brand-on-background-strong)" }}>
              Ready to Transform Your Documentation?
            </Heading>
            <Text variant="body-default-l" style={{ textAlign: "center", color: "var(--brand-on-background-medium)" }}>
              Join thousands of developers who use Docify to create beautiful, interactive documentation from any URL.
            </Text>
            <Flex gap="16" mobileDirection="column" horizontal="center">
              <a href="/get-started" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="l">
                  Get Started Now
                </Button>
              </a>
              <a href="/about" style={{ textDecoration: 'none' }}>
                <Button variant="tertiary" size="l">
                  Learn More
                </Button>
              </a>
            </Flex>
          </Column>
        </RevealFx>
      </Column>
    </Column>
  );
}
