"use client";

import { Flex, Skeleton } from '@/once-ui/components';

interface SmallDashboardCardProps {
  delay?: number;
  className?: string;
}

export function SmallDashboardCard({ delay = 1, className }: SmallDashboardCardProps) {
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
      <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Skeleton shape="line" width="m" height="xs" delay={delay.toString() as "1" | "2" | "3" | "4" | "5" | "6"} />
      </Flex>
    </Flex>
  );
}
