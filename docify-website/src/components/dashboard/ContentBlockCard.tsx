"use client";

import React, { useState, Suspense } from 'react';
import { Flex, Heading, Text, Button, IconButton } from '@/once-ui/components';

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
    mermaid: '📊',
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

// Get min height based on size
const getMinHeight = (size: string) => {
  // All cards now have the same uniform height of 220px
  return '220px';
};

export function ContentBlockCard({
  block,
  onCopy,
  onZoom,
  onUnzoom,
  isZoomed = false
}: ContentBlockCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const styles = getBlockStyles(block.type);

  // Render different content based on block type
  const renderBlockContent = () => {
    switch (block.type) {
      case 'mermaid':
        return (
          <Flex fillWidth style={{ flex: 1, minHeight: '300px' }}>
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center w-full h-full space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div className="text-gray-500 text-sm">Loading chart...</div>
              </div>
            }>
              <div className="w-full h-full">
                {/* We'll render the actual MermaidChart component here */}
                <div className="w-full h-full flex items-center justify-center text-2xl opacity-50">
                  {styles.icon} Interactive Chart
                </div>
              </div>
            </Suspense>
          </Flex>
        );

      case 'code':
        return (
          <Flex fillWidth direction="column" gap="s" style={{ flex: 1 }}>
            <Flex fillWidth horizontal="space-between" vertical="center">
              <Text variant="body-default-s" onBackground="neutral-weak">
                Language:
              </Text>
              <Text variant="body-default-s" onBackground="brand-strong">
                {block.metadata?.language || 'text'}
              </Text>
            </Flex>
            <Flex
              fillWidth
              style={{
                backgroundColor: 'var(--neutral-weak)',
                borderRadius: 'var(--radius-s)',
                padding: 'var(--space-m)',
                fontFamily: 'monospace',
                fontSize: '14px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}
            >
              <Text variant="body-default-s" onBackground="neutral-strong">
                {block.content}
              </Text>
            </Flex>
          </Flex>
        );

      case 'key_points':
        const points = block.content.split('\n').filter((point: string) => point.trim());
        return (
          <Flex fillWidth direction="column" gap="s" style={{ flex: 1 }}>
            {points.map((point: string, index: number) => (
              <Flex key={index} fillWidth gap="s" vertical="start">
                <Text variant="body-default-s" onBackground="brand-strong" style={{ minWidth: '20px' }}>
                  {index + 1}.
                </Text>
                <Text variant="body-default-s" onBackground="neutral-strong">
                  {point.replace(/^[-•*]\s*/, '')}
                </Text>
              </Flex>
            ))}
          </Flex>
        );

      default:
        return (
          <Flex fillWidth style={{ flex: 1 }}>
            <Text
              variant="body-default-m"
              onBackground="neutral-strong"
              style={{
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}
            >
              {block.content}
            </Text>
          </Flex>
        );
    }
  };

  // Get action buttons based on block type
  const getActionButtons = () => {
    const buttons = [];

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
      gap="m"
      style={{
        gridColumn: getGridSpan(block.size),
        boxShadow: 'var(--shadow-s)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        minHeight: getMinHeight(block.size),
        maxHeight: getMinHeight(block.size),
        backgroundColor: styles.bgColor,
        border: `1px solid ${styles.borderColor}`,
        position: 'relative',
        overflow: 'hidden'
      }}
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
      <Flex fillWidth style={{ flex: 1, overflow: 'hidden' }}>
        {renderBlockContent()}
      </Flex>

      {/* Hover effect overlay */}
      {isHovered && (
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
