"use client";

import { useAuth } from '@/lib/auth-context';
import { Heading, Text, Column, Button, Flex, RevealFx, Input } from '@/once-ui/components';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Signup() {
  const {
    sendOTP,
    verifyOTP,
    createAccount,
    isAuthenticated,
    loading,
    authStep,
    setAuthStep,
    email,
    setEmail,
    userId,
    setUserId
  } = useAuth();
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleCreateAccount = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setError('');
      await createAccount(emailInput);
    } catch (error: any) {
      console.error('Create account failed:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setError('');
      await verifyOTP(userId, otp);
      // Redirect will happen automatically due to useEffect
    } catch (error: any) {
      console.error('Verify OTP failed:', error);
      setError(error.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleBackToEmail = () => {
    setAuthStep('email');
    setOtp('');
    setError('');
  };

  if (loading) {
    return (
      <Column
        fillWidth
        fillHeight
        horizontal="center"
        vertical="center"
      >
        <Text variant="body-default-m">Loading...</Text>
      </Column>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <Column
      fillWidth
      fillHeight
      horizontal="center"
      vertical="center"
      gap="xl"
      padding="l"
    >
      <Column maxWidth="m" gap="l" horizontal="center">
        <RevealFx translateY="4" fillWidth horizontal="start" paddingBottom="m">
          <Heading wrap="balance" variant="display-strong-l" style={{ textAlign: 'center' }}>
            Join <span style={{ color: 'var(--brand-on-background-strong)' }}>Docify</span>
          </Heading>
        </RevealFx>

        <RevealFx translateY="8" delay={0.2}>
          <Text
            variant="body-default-l"
            onBackground="neutral-weak"
            style={{ textAlign: 'center', maxWidth: '500px' }}
          >
            {authStep === 'email'
              ? 'Create your account by entering your email address'
              : `Enter the 6-digit code sent to ${email}`
            }
          </Text>
        </RevealFx>

        {error && (
          <RevealFx translateY="8" delay={0.3}>
            <Text
              variant="body-default-s"
              style={{ color: 'var(--error)', textAlign: 'center' }}
            >
              {error}
            </Text>
          </RevealFx>
        )}

        <RevealFx translateY="8" delay={0.4}>
          {authStep === 'email' ? (
            <Flex direction="column" gap="16">
              <Input
                id="email"
                label="Email Address"
                type="email"
                placeholder="Enter your email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{ maxWidth: '400px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateAccount();
                  }
                }}
              />
              <Button
                onClick={handleCreateAccount}
                variant="primary"
                size="m"
                fillWidth
                style={{ maxWidth: '400px' }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
              <Button
                onClick={() => router.push('/auth/login')}
                variant="tertiary"
                size="s"
                style={{ maxWidth: '400px' }}
              >
                Already have an account? Sign in
              </Button>
            </Flex>
          ) : (
            <Flex direction="column" gap="16">
              <Input
                id="otp"
                label="Verification Code"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ maxWidth: '400px', textAlign: 'center', fontSize: '24px', letterSpacing: '4px' }}
                maxLength={6}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyOTP();
                  }
                }}
              />
              <Button
                onClick={handleVerifyOTP}
                variant="primary"
                size="m"
                fillWidth
                style={{ maxWidth: '400px' }}
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>
              <Flex gap="8" horizontal="center">
                <Button
                  onClick={handleBackToEmail}
                  variant="tertiary"
                  size="s"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateAccount}
                  variant="tertiary"
                  size="s"
                  disabled={loading}
                >
                  Resend Code
                </Button>
              </Flex>
            </Flex>
          )}
        </RevealFx>
      </Column>
    </Column>
  );
}
