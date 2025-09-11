"use client";

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Flex, Heading, Text, Button, IconButton, Spinner } from '@/once-ui/components';
import MermaidChart from '@/components/MermaidChart';

// Dynamically import the advanced CodeBlock to avoid SSR issues
const AdvancedCodeBlock = dynamic(() => import('@/once-ui/modules').then(mod => ({ default: mod.CodeBlock })), {
  ssr: false,
  loading: () => (
    <Flex
      fillWidth
      fillHeight
      horizontal="center"
      vertical="center"
      style={{
        minHeight: '150px',
        borderRadius: 'var(--radius-s)',
        backgroundColor: 'var(--neutral-weak)'
      }}
    >
      <Text variant="body-default-xs" onBackground="neutral-strong">Loading code...</Text>
    </Flex>
  )
});

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

interface ContentBlockCardProps {
  block: ContentBlock;
  onCopy?: (content: string) => void;
  onZoom?: (blockId: string) => void;
  onUnzoom?: (blockId: string) => void;
  isZoomed?: boolean;
  onClick?: () => void;
}

// Get unified Docify brand styling for all block types
const getBlockStyles = (type: string) => {
  // All blocks now use the same Docify emerald theme
  const docifyTheme = {
    accentColor: 'var(--brand-background-medium)',
    bgColor: 'var(--brand-background-weak)',
    borderColor: 'var(--brand-border-weak)',
    icon: getBlockIcon(type)
  };

  return docifyTheme;
};

// Get appropriate icon based on block type
const getBlockIcon = (type: string) => {
  const icons = {
    summary: '📝',
    code: '💻',
    key_points: '🔑',
    architecture: '🏗️',
    api_reference: '🔗',
    guide: '📋',
    comparison: '⚖️',
    best_practices: '⭐',
    troubleshooting: '🔧'
  };

  return icons[type as keyof typeof icons] || '📄';
};

// Get grid column span based on size
const getGridSpan = (size: string) => {
  switch (size) {
    case 'large': return 'span 3';
    case 'medium': return 'span 2';
    case 'small': return 'span 1';
    default: return 'span 2';
  }
};

// Get fixed height based on size (standardized to 300px for all)
const getFixedHeight = (size: string) => {
  return '300px'; // All blocks now use the same 300px height
};

export function ContentBlockCard({
  block,
  onCopy,
  onZoom,
  onUnzoom,
  isZoomed = false,
  onClick
}: ContentBlockCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const styles = getBlockStyles(block.type);

  // Render different content based on block type
  const renderBlockContent = () => {
    switch (block.type) {
      case 'mermaid':
        return (
          <Flex fillWidth style={{ flex: 1, overflow: 'hidden' }}>
            <Suspense fallback={
              <Flex
                fillWidth
                fillHeight
                horizontal="center"
                vertical="center"
                gap="s"
              >
                <Spinner size="s" ariaLabel="Loading chart" />
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  Loading diagram...
                </Text>
              </Flex>
            }>
              <Flex
                fillWidth
                fillHeight
                overflow="auto"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--neutral-medium) transparent'
                }}
              >
                <MermaidChart chart={block.content} />
              </Flex>
            </Suspense>
          </Flex>
        );

      case 'code':
        // Convert our simple format to advanced format
        const codeInstances = [{
          code: block.content,
          language: block.metadata?.language || 'text',
          label: block.title || 'Code Example'
        }];

        return (
          <Flex fillWidth style={{ flex: 1, overflow: 'hidden' }}>
            <Flex
              fillWidth
              style={{
                overflow: 'hidden',
                borderRadius: 'var(--radius-s)',
                maxHeight: '180px'
              }}
            >
              <AdvancedCodeBlock
                codeInstances={codeInstances}
                copyButton={true}
                highlight={block.metadata?.highlight}
                compact={true}
                fillWidth
                codeHeight={150}
                style={{
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--neutral-medium) transparent'
                }}
              />
            </Flex>
          </Flex>
        );

      case 'key_points':
      case 'best_practices':
      case 'troubleshooting':
      case 'guide':
      case 'architecture':
      case 'api_reference':
        const lines = block.content.split('\n').filter((line: string) => line.trim());

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
          <Flex fillWidth direction="column" gap="s" style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'thin' }}>
            {lines.map((line: string, index: number) => {
              const point = parseKeyPoint(line);

              if (point.title) {
                // Formatted with title and content
                return (
                  <Flex
                    key={index}
                    fillWidth
                    direction="column"
                    padding="s"
                    background="brand-alpha-weak"
                    radius="s"
                    border="brand-weak"
                    borderStyle="solid"
                    borderWidth={1}
                    gap="xs"
                    style={{ borderLeftWidth: '3px' }}
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
                  <Flex key={index} fillWidth gap="xs" vertical="start">
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
        );

      case 'comparison':
        // Parse comparison format: ****Side Heading** ***Point*** ****
        const parseComparisonContent = (content: string) => {
          const sides: Array<{ heading: string; points: string[] }> = [];
          const parts = content.split('****').filter(part => part.trim());

          for (let i = 0; i < parts.length; i++) {
            const sideContent = parts[i].trim();
            const sideLines = sideContent.split('\n').filter(line => line.trim());

            if (sideLines.length > 0) {
              // First line should be the heading with **
              const headingMatch = sideLines[0].match(/\*\*([^*]+)\*\*/);
              const heading = headingMatch ? headingMatch[1].trim() : sideLines[0].replace(/\*\*/g, '').trim();

              // Remaining lines are points with ***
              const points = sideLines.slice(1).map(line => {
                const pointMatch = line.match(/\*\*\*([^*]+)\*\*\*/);
                return pointMatch ? pointMatch[1].trim() : line.replace(/\*\*\*/g, '').trim();
              }).filter(point => point);

              sides.push({ heading, points });
            }
          }

          return sides;
        };

        const comparisonSides = parseComparisonContent(block.content);

        return (
          <Flex fillWidth direction="column" gap="s" style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'thin' }}>
            <Flex fillWidth gap="s" style={{ flexWrap: 'wrap', alignItems: 'stretch' }}>
              {comparisonSides.map((side, sideIndex) => (
                <Flex
                  key={sideIndex}
                  fillWidth
                  direction="column"
                  flex={1}
                  minWidth={180}
                  padding="s"
                  background="neutral-weak"
                  radius="s"
                  gap="xs"
                >
                  {/* Side Heading */}
                  <Text
                    variant="body-default-xs"
                    onBackground="brand-strong"
                    weight="strong"
                    align="center"
                    style={{
                      padding: '3px 6px',
                      backgroundColor: 'var(--brand-alpha-weak)',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}
                  >
                    {side.heading}
                  </Text>

                  {/* Side Points */}
                  <Flex fillWidth direction="column" gap="xs">
                    {side.points.map((point, pointIndex) => (
                      <Flex
                        key={pointIndex}
                        fillWidth
                        padding="xs"
                        background="surface"
                        radius="xs"
                        gap="xs"
                        vertical="center"
                      >
                        <Text
                          variant="body-default-xs"
                          onBackground="brand-strong"
                          style={{ fontSize: '10px', opacity: 0.7 }}
                        >
                          {pointIndex + 1}.
                        </Text>
                        <Text
                          variant="body-default-xs"
                          onBackground="neutral-strong"
                          style={{ flex: 1, lineHeight: '1.3' }}
                        >
                          {point}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </Flex>
              ))}
            </Flex>
          </Flex>
        );

      default:
        return (
          <Flex fillWidth style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'thin' }}>
            <Text
              variant="body-default-m"
              onBackground="neutral-strong"
              style={{
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {block.content}
            </Text>
          </Flex>
        );
    }
  };

  // Get action buttons based on block type
  const getActionButtons = (): JSX.Element[] => {
    const buttons: JSX.Element[] = [];

    // Copy button for all types
    buttons.push(
      <Button
        key="copy"
        variant="tertiary"
        size="s"
        onClick={() => onCopy?.(block.content)}
      >
        Copy
      </Button>
    );

    // Type-specific buttons
    switch (block.type) {
      case 'mermaid':
        if (isZoomed) {
          buttons.push(
            <Button
              key="unzoom"
              variant="tertiary"
              size="s"
              onClick={() => onUnzoom?.(block.id)}
            >
              Unzoom
            </Button>
          );
        } else {
          buttons.push(
            <Button
              key="zoom"
              variant="tertiary"
              size="s"
              onClick={() => onZoom?.(block.id)}
            >
              Zoom
            </Button>
          );
        }
        break;
      // Add more type-specific buttons here as needed
    }

    return buttons;
  };

  return (
    <Flex
      background="surface"
      border="neutral-weak"
      radius="m"
      padding="m"
      direction="column"
      gap="xs"
      style={{
        gridColumn: getGridSpan(block.size),
        boxShadow: 'var(--shadow-s)',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        height: getFixedHeight(block.size),
        backgroundColor: styles.bgColor,
        border: `1px solid ${styles.borderColor}`,
        position: 'relative',
        overflow: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--neutral-weak) transparent'
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with actions and type indicator */}
      <Flex fillWidth horizontal="space-between" vertical="center" paddingBottom="s">
        <Flex flex={1}>
          <Heading variant="heading-strong-s">{block.title}</Heading>
        </Flex>
        <Flex gap="s" vertical="center">
          {getActionButtons()}
          <Flex
            background="brand-weak"
            radius="s"
            paddingX="s"
            paddingY="xs"
          >
            <Text variant="body-default-xs" onBackground="brand-strong">
              {block.type.toUpperCase()}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      {/* Block Content */}
      <Flex fillWidth style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'thin' }}>
        {renderBlockContent()}
      </Flex>

      {/* Hover effect overlay */}
      {isHovered && onClick && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: styles.accentColor,
            opacity: 0.05,
            pointerEvents: 'none',
            borderRadius: 'var(--radius-m)'
          }}
        />
      )}
    </Flex>
  );
}
