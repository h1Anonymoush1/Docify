'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Flex, Heading, Text, Icon } from '@/once-ui/components';

// Dynamically import Mermaid to avoid SSR issues
const Mermaid = dynamic(() => import('./MermaidChart'), { ssr: false });

interface ContentBlock {
  id: string;
  type: string;
  size: 'small' | 'medium' | 'large';
  title: string;
  content: string;
  metadata?: {
    language?: string;
    priority?: string;
    [key: string]: any;
  };
}

interface ContentBlockRendererProps {
  block: ContentBlock;
}

function getSizeClasses(size: string): string {
  switch (size) {
    case 'small':
      return 'col-span-1';
    case 'medium':
      return 'col-span-2';
    case 'large':
      return 'col-span-3';
    default:
      return 'col-span-1';
  }
}

function TextBlock({ block }: { block: ContentBlock }) {
  return (
    <Flex
      fillWidth
      direction="column"
      padding="l"
      background="surface"
      border="neutral-weak"
      radius="l"
      gap="m"
    >
      <Heading as="h3" variant="heading-strong-s" onBackground="neutral-strong">
        {block.title}
      </Heading>
      <Flex fillWidth direction="column" gap="s">
        <Text variant="body-default-m" onBackground="neutral-strong" style={{ whiteSpace: 'pre-wrap' }}>
          {block.content}
        </Text>
      </Flex>
    </Flex>
  );
}

function CodeBlock({ block }: { block: ContentBlock }) {
  const language = block.metadata?.language || 'text';

  return (
    <Flex
      fillWidth
      direction="column"
      padding="l"
      background="surface"
      border="neutral-weak"
      radius="l"
      gap="m"
    >
      <Flex fillWidth horizontal="space-between" vertical="center">
        <Heading as="h3" variant="heading-strong-s" onBackground="neutral-strong">
          {block.title}
        </Heading>
        <Flex
          padding="xs"
          background="neutral-weak"
          radius="s"
        >
          <Text variant="body-default-xs" onBackground="neutral-strong">
            {language}
          </Text>
        </Flex>
      </Flex>

      <Flex
        fillWidth
        padding="m"
        background="neutral-strong"
        radius="m"
        style={{ overflow: 'auto', fontFamily: 'monospace', fontSize: '14px' }}
      >
        <Text
          variant="body-default-s"
          onBackground="neutral-weak"
          style={{ whiteSpace: 'pre', wordBreak: 'break-all' }}
        >
          {block.content}
        </Text>
      </Flex>
    </Flex>
  );
}

function MermaidBlock({ block }: { block: ContentBlock }) {
  return (
    <Flex
      fillWidth
      direction="column"
      padding="l"
      background="surface"
      border="neutral-weak"
      radius="l"
      gap="m"
    >
      <Heading as="h3" variant="heading-strong-s" onBackground="neutral-strong">
        {block.title}
      </Heading>

      <Flex
        fillWidth
        padding="m"
        background="neutral-weak"
        radius="m"
      >
        <Mermaid chart={block.content} />
      </Flex>
    </Flex>
  );
}

function KeyPointsBlock({ block }: { block: ContentBlock }) {
  const lines = block.content.split('\n').filter(line => line.trim());

  const parseKeyPoint = (line: string) => {
    // Look for the pattern: **Title** ***Content***
    const titleMatch = line.match(/\*\*([^*]+)\*\*/);
    const contentMatch = line.match(/\*\*\*([^*]+)\*\*\*/);

    if (titleMatch && contentMatch) {
      return {
        title: titleMatch[1].trim(),
        content: contentMatch[1].trim()
      };
    }

    // Fallback for lines that don't match the pattern
    return {
      title: null,
      content: line.replace(/^[-•*]\s*/, '').trim()
    };
  };

  return (
    <Flex
      fillWidth
      direction="column"
      padding="l"
      background="surface"
      border="neutral-weak"
      radius="l"
      gap="m"
    >
      <Heading as="h3" variant="heading-strong-s" onBackground="neutral-strong">
        {block.title}
      </Heading>

      <Flex direction="column" gap="s">
        {lines.map((line, index) => {
          const point = parseKeyPoint(line);

          if (point.title) {
            // Formatted with title and content
            return (
              <Flex
                key={index}
                fillWidth
                direction="column"
                padding="m"
                background="brand-alpha-weak"
                radius="m"
                border="brand-weak"
                borderStyle="solid"
                borderWidth={1}
                gap="xs"
                style={{ borderLeftWidth: '4px' }}
              >
                <Text variant="body-default-s" onBackground="brand-strong" weight="strong">
                  {point.title}
                </Text>
                <Text
                  variant="body-default-s"
                  onBackground="brand-strong"
                  style={{ fontStyle: 'italic' }}
                >
                  {point.content}
                </Text>
              </Flex>
            );
          } else {
            // Fallback for unformatted content
            return (
              <Flex key={index} fillWidth gap="s" vertical="start">
                <Text variant="body-default-s" onBackground="brand-strong">
                  •
                </Text>
                <Text variant="body-default-s" onBackground="neutral-strong">
                  {point.content}
                </Text>
              </Flex>
            );
          }
        })}
      </Flex>
    </Flex>
  );
}

function GuideBlock({ block }: { block: ContentBlock }) {
  const steps = block.content.split('\n').filter(step => step.trim());

  return (
    <Flex
      fillWidth
      direction="column"
      padding="l"
      background="surface"
      border="neutral-weak"
      radius="l"
      gap="m"
    >
      <Heading as="h3" variant="heading-strong-s" onBackground="neutral-strong">
        {block.title}
      </Heading>

      <Flex direction="column" gap="s">
        {steps.map((step, index) => (
          <Flex key={index} fillWidth gap="s" vertical="start">
            <Flex
              width="24"
              height="24"
              background="brand-strong"
              radius="full"
              horizontal="center"
              vertical="center"
              style={{ flexShrink: 0, marginTop: '2px' }}
            >
              <Text variant="body-default-xs" onBackground="brand-weak" weight="strong">
                {index + 1}
              </Text>
            </Flex>
            <Text variant="body-default-m" onBackground="neutral-strong">
              {step.replace(/^\d+\.\s*/, '')}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}

function ApiReferenceBlock({ block }: { block: ContentBlock }) {
  return (
    <Flex
      fillWidth
      direction="column"
      padding="l"
      background="surface"
      border="neutral-weak"
      radius="l"
      gap="m"
    >
      <Heading as="h3" variant="heading-strong-s" onBackground="neutral-strong">
        {block.title}
      </Heading>

      <Flex
        fillWidth
        padding="m"
        background="neutral-weak"
        radius="m"
        style={{ fontFamily: 'monospace', fontSize: '14px', overflow: 'auto' }}
      >
        <Text
          variant="body-default-s"
          onBackground="neutral-strong"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {block.content}
        </Text>
      </Flex>
    </Flex>
  );
}

function ComparisonBlock({ block }: { block: ContentBlock }) {
  // Try to parse as table format
  const lines = block.content.split('\n').filter(line => line.trim());

  return (
    <Flex
      fillWidth
      direction="column"
      padding="l"
      background="surface"
      border="neutral-weak"
      radius="l"
      gap="m"
    >
      <Heading as="h3" variant="heading-strong-s" onBackground="neutral-strong">
        {block.title}
      </Heading>

      <Flex fillWidth direction="column" gap="xs" style={{ overflow: 'auto' }}>
        {lines.map((line, index) => {
          const [label, value] = line.split(':').map(s => s.trim());
          return (
            <Flex
              key={index}
              fillWidth
              padding="s"
              background={index % 2 === 0 ? "neutral-weak" : "surface"}
              radius="s"
              gap="m"
            >
              <Flex flex={1}>
                <Text variant="body-default-s" onBackground="neutral-strong" weight="strong">
                  {label}
                </Text>
              </Flex>
              <Flex flex={2}>
                <Text variant="body-default-s" onBackground="neutral-strong">
                  {value || line}
                </Text>
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </Flex>
  );
}

export default function ContentBlockRenderer({ block }: ContentBlockRendererProps) {
  const sizeClasses = getSizeClasses(block.size);

  const renderBlock = () => {
    switch (block.type) {
      case 'summary':
      case 'architecture':
      case 'troubleshooting':
        return <TextBlock block={block} />;

      case 'code':
        return <CodeBlock block={block} />;

      case 'mermaid':
        return <MermaidBlock block={block} />;

      case 'key_points':
      case 'best_practices':
        return <KeyPointsBlock block={block} />;

      case 'guide':
        return <GuideBlock block={block} />;

      case 'api_reference':
        return <ApiReferenceBlock block={block} />;

      case 'comparison':
        return <ComparisonBlock block={block} />;

      default:
        return <TextBlock block={block} />;
    }
  };

  return (
    <div className={`${sizeClasses} mb-6`}>
      {renderBlock()}
    </div>
  );
}
