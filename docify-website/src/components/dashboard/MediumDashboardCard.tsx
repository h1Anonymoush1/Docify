"use client";

import { Flex, Skeleton } from '@/once-ui/components';

interface MediumDashboardCardProps {
  delay?: number;
  className?: string;
}

export function MediumDashboardCard({ delay = 1, className }: MediumDashboardCardProps) {
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
        cursor: 'pointer'
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
      <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Skeleton shape="line" width="l" height="xs" delay={delay} />
        <Skeleton shape="line" width="m" height="xs" delay={delay + 1} />
      </Flex>
    </Flex>
  );
}
