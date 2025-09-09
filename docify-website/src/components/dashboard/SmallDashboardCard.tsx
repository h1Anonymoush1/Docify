"use client";

import { Flex, Skeleton, Heading, Text } from '@/once-ui/components';

interface SmallDashboardCardProps {
  delay?: number;
  className?: string;
  title?: string;
  content?: string | React.ReactNode;
  type?: 'skeleton' | 'content';
  children?: React.ReactNode;
}

export function SmallDashboardCard({ delay = 1, className, title, content, type = 'skeleton', children }: SmallDashboardCardProps) {
  return (
    <Flex
      background="surface"
      border="neutral-weak"
      radius="m"
      padding="m"
      direction="column"
      gap="m"
      className={className}
      style={{
        gridColumn: 'span 1',
        boxShadow: 'var(--shadow-s)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        minHeight: '220px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-m)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-s)';
      }}
    >
      {children ? (
        children
      ) : type === 'content' ? (
        <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start' }}>
          {title && <Heading variant="heading-strong-s">{title}</Heading>}
          {content && typeof content === 'string' ? (
            <Text variant="body-default-s" onBackground="neutral-strong">{content}</Text>
          ) : (
            content
          )}
        </Flex>
      ) : (
        <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Skeleton shape="line" width="m" height="xs" delay={delay.toString() as "1" | "2" | "3" | "4" | "5" | "6"} />
        </Flex>
      )}
    </Flex>
  );
}
