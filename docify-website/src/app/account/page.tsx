"use client";

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Heading, Text, Column, Button, Flex, Input, SmartImage } from '@/once-ui/components';
import { AuthGuard } from '@/components/AuthGuard';

export default function Account() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <Column
        fillWidth
        padding="l"
        gap="xl"
        maxWidth="m"
      >

        {/* Profile Information Section */}
        <Flex fillWidth gap="xl" mobileDirection="column">
          <Column flex={1} gap="l">

            <Flex
              background="surface"
              border="neutral-medium"
              radius="l"
              padding="xl"
              direction="column"
              gap="l"
            >
              {/* User Details */}
              <Column gap="m">
                <Column gap="4">
                  <Text variant="label-strong-s">Email</Text>
                  <Input
                    value={user?.email || ''}
                    placeholder="Enter your email"
                    readOnly
                  />
                </Column>

                <Column gap="4">
                  <Text variant="label-strong-s">Handle</Text>
                  <Input
                    value={user?.name?.toLowerCase().replace(/\s+/g, '') || ''}
                    placeholder="Your handle"
                    readOnly
                  />
                </Column>
              </Column>
            </Flex>
          </Column>

          {/* Account Actions Section */}
          <Column flex={1} gap="l">

            <Flex
              background="surface"
              border="neutral-medium"
              radius="l"
              padding="xl"
              direction="column"
              gap="m"
            >
              <Button
                variant="secondary"
                size="m"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>

              <Button
                variant="secondary"
                size="m"
                onClick={() => router.push('/documents')}
              >
                Manage Documents
              </Button>

              <Button
                variant="tertiary"
                size="m"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Flex>

            {/* Quick Stats */}
            <Flex
              background="surface"
              border="neutral-medium"
              radius="l"
              padding="xl"
              direction="column"
              gap="m"
            >
              <Heading variant="heading-strong-s">
                Account Status
              </Heading>

              <Flex direction="column" gap="s">
                <Flex horizontal="space-between">
                  <Text variant="body-default-s">Authentication</Text>
                  <Text variant="body-default-s" onBackground="brand-weak">
                    Active
                  </Text>
                </Flex>

                <Flex horizontal="space-between">
                  <Text variant="body-default-s">Email Verification</Text>
                  <Text variant="body-default-s" onBackground={user?.emailVerification ? "brand-weak" : "warning-weak"}>
                    {user?.emailVerification ? 'Verified' : 'Pending'}
                  </Text>
                </Flex>

                <Flex horizontal="space-between">
                  <Text variant="body-default-s">Last Login</Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">
                    Recent
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Column>
        </Flex>
      </Column>
    </AuthGuard>
  );
}
