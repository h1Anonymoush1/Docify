"use client";

import React, { useEffect } from 'react';
import { Flex, Heading, Text, IconButton, Button } from '@/once-ui/components';

interface DashboardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content?: string | React.ReactNode;
  children?: React.ReactNode;
  cardType?: 'small' | 'medium' | 'large';
}

export function DashboardOverlay({
  isOpen,
  onClose,
  title,
  content,
  children,
  cardType = 'medium'
}: DashboardOverlayProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-l)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-l)',
          border: '1px solid var(--neutral-weak)',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: cardType === 'large' ? '90vw' : cardType === 'medium' ? '70vw' : '50vw',
          maxHeight: '90vh',
          width: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-m)',
            right: 'var(--space-m)',
            zIndex: 1001
          }}
        >
          <IconButton
            icon="close"
            variant="tertiary"
            size="m"
            onClick={onClose}
            aria-label="Close overlay"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--neutral-weak)',
              borderRadius: '50%',
              boxShadow: 'var(--shadow-m)'
            }}
          />
        </div>

        {/* Content */}
        <Flex
          fillWidth
          direction="column"
          style={{
            maxHeight: '90vh',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          {(title || children) && (
            <Flex
              fillWidth
              padding="xl"
              paddingBottom="m"
              style={{
                borderBottom: '1px solid var(--neutral-weak)'
              }}
            >
              {title && (
                <Heading variant={
                  cardType === 'large' ? 'heading-strong-xl' :
                  cardType === 'medium' ? 'heading-strong-l' :
                  'heading-strong-m'
                }>
                  {title}
                </Heading>
              )}
            </Flex>
          )}

          {/* Scrollable Content Area */}
          <Flex
            fillWidth
            style={{
              flex: 1,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--neutral-weak) transparent',
              maxHeight: title ? 'calc(90vh - 120px)' : '90vh'
            }}
          >
            {children ? (
              <div style={{ padding: 'var(--space-xl)', width: '100%' }}>
                {children}
              </div>
            ) : content ? (
              <Flex
                fillWidth
                padding="xl"
                direction="column"
                gap="m"
              >
                {typeof content === 'string' ? (
                  <Text
                    variant={
                      cardType === 'large' ? 'body-default-xl' :
                      cardType === 'medium' ? 'body-default-l' :
                      'body-default-m'
                    }
                    onBackground="neutral-strong"
                    style={{ lineHeight: '1.6' }}
                  >
                    {content}
                  </Text>
                ) : (
                  content
                )}
              </Flex>
            ) : (
              <Flex
                fillWidth
                fillHeight
                horizontal="center"
                vertical="center"
                padding="xl"
              >
                <Text variant="body-default-l" onBackground="neutral-weak">
                  No content available
                </Text>
              </Flex>
            )}
          </Flex>

          {/* Footer with close button */}
          <Flex
            fillWidth
            padding="xl"
            paddingTop="m"
            style={{
              borderTop: '1px solid var(--neutral-weak)'
            }}
            horizontal="end"
          >
            <Button
              variant="secondary"
              size="m"
              onClick={onClose}
            >
              Close
            </Button>
          </Flex>
        </Flex>
      </div>
    </div>
  );
}
