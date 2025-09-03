"use client";

import { useRouter } from 'next/navigation';
import { Heading, Text, Column, Button, Flex } from '@/once-ui/components';

export default function AuthError() {
  const router = useRouter();

  const handleTryAgain = () => {
    router.push('/get-started');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <Column
      fillWidth
      fillHeight
      horizontal="center"
      vertical="center"
      gap="l"
      padding="l"
    >
      <Column horizontal="center" gap="m">
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: 'var(--static-error-background)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          color: 'var(--static-error-on-background)'
        }}>
          ✕
        </div>

        <Heading variant="heading-strong-l">
          Authentication Failed
        </Heading>

        <Text
          variant="body-default-m"
          onBackground="neutral-weak"
          style={{ textAlign: 'center', maxWidth: '400px' }}
        >
          We couldn't authenticate you. This might be due to an invalid code,
          network issues, or the authentication process was cancelled.
        </Text>

        <Flex gap="m" horizontal="center" mobileDirection="column">
          <Button
            onClick={handleTryAgain}
            variant="primary"
            size="m"
          >
            Try Again
          </Button>

          <Button
            onClick={handleGoHome}
            variant="secondary"
            size="m"
          >
            Go Home
          </Button>
        </Flex>
      </Column>
    </Column>
  );
}


