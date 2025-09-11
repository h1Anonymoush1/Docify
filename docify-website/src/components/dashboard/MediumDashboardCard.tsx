"use client";

import { Flex, Skeleton, Heading, Text } from '@/once-ui/components';

interface MediumDashboardCardProps {
  delay?: number;
  className?: string;
  title?: string;
  content?: string | React.ReactNode;
  type?: 'skeleton' | 'content';
  children?: React.ReactNode;
  onClick?: () => void;
}

export function MediumDashboardCard({ delay = 1, className, title, content, type = 'skeleton', children, onClick }: MediumDashboardCardProps) {
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
        gridColumn: 'span 2',
        boxShadow: 'var(--shadow-s)',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        height: '300px'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-m)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-s)';
        }
      }}
    >
      {children ? (
        <div style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'thin' }}>
          {children}
        </div>
      ) : type === 'content' ? (
        <Flex direction="column" gap="m" style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start', overflow: 'auto', scrollbarWidth: 'thin' }}>
          {title && <Heading variant="heading-strong-m">{title}</Heading>}
          {content && typeof content === 'string' ? (
            <Text variant="body-default-m" onBackground="neutral-strong">{content}</Text>
          ) : (
            content
          )}
        </Flex>
      ) : (
        <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Skeleton shape="line" width="l" height="xs" delay={delay.toString() as "1" | "2" | "3" | "4" | "5" | "6"} />
          <Skeleton shape="line" width="m" height="xs" delay={(delay + 1).toString() as "1" | "2" | "3" | "4" | "5" | "6"} />
        </Flex>
      )}
    </Flex>
  );
}
