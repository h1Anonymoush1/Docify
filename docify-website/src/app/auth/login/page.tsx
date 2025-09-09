"use client";

import { useAuth } from '@/lib/auth-context';
import { Heading, Text, Column, Button, Flex, RevealFx, Input } from '@/once-ui/components';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Login() {
  const {
    sendOTP,
    verifyOTP,
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
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSendOTP = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setError('');
      setSendingOtp(true);
      await sendOTP(emailInput, false);
      setEmail(emailInput);
      setAuthStep('otp');
    } catch (error: any) {
      console.error('Send OTP failed:', error);
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
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
        <RevealFx translateY="8" delay={0.1}>
          <Flex gap="32" horizontal="center">
            <Button
              variant="tertiary"
              size="s"
              onClick={() => router.push('/auth/login')}
              style={{
                borderBottom: '3px solid white',
                borderRadius: '0',
                paddingBottom: '11px',
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: 'var(--neutral-on-background-strong)',
                fontWeight: '600',
                position: 'relative',
                transition: 'all 0.3s ease',
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Login
            </Button>
            <Button
              variant="tertiary"
              size="s"
              onClick={() => router.push('/auth/signup')}
              style={{
                borderBottom: '3px solid transparent',
                borderRadius: '0',
                paddingBottom: '11px',
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: 'var(--neutral-on-background-medium)',
                fontWeight: '500',
                position: 'relative',
                transition: 'color 0.3s ease, font-weight 0.3s ease',
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement;
                const underline = target.querySelector('.animated-underline') as HTMLElement;
                target.style.color = 'var(--neutral-on-background-strong)';
                target.style.fontWeight = '600';
                if (underline) {
                  underline.style.width = '100%';
                }
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                const underline = target.querySelector('.animated-underline') as HTMLElement;
                target.style.color = 'var(--neutral-on-background-medium)';
                target.style.fontWeight = '500';
                if (underline) {
                  underline.style.width = '0%';
                }
              }}
            >
              Sign up
              <div
                className="animated-underline"
                style={{
                  position: 'absolute',
                  bottom: '-3px',
                  left: '0',
                  width: '0%',
                  height: '3px',
                  backgroundColor: 'white',
                  transform: 'translateX(0%)',
                  opacity: 1,
                  transition: 'width 0.4s ease-in-out'
                }}
              />
            </Button>
          </Flex>
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
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{ maxWidth: '400px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendOTP();
                  }
                }}
              />
              <Button
                onClick={handleSendOTP}
                variant="primary"
                size="m"
                fillWidth
                style={{ maxWidth: '400px' }}
                disabled={sendingOtp}
              >
                {sendingOtp ? 'Sending...' : 'Send OTP'}
              </Button>
            </Flex>
          ) : (
            <Flex direction="column" gap="16">
              <Flex gap="8" horizontal="center" style={{ maxWidth: '400px', margin: '0 auto' }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    label=""
                    type="text"
                    value={otp[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const newOtp = otp.split('');
                      if (value) {
                        newOtp[index] = value;
                        setOtp(newOtp.join('').slice(0, 6));

                        // Auto-focus next field
                        if (index < 5) {
                          const nextField = document.getElementById(`otp-${index + 1}`);
                          nextField?.focus();
                        }
                      } else {
                        // Handle deletion
                        newOtp[index] = '';
                        setOtp(newOtp.join('').slice(0, 6));
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      if (pastedData) {
                        const newOtp = pastedData.split('');
                        // Fill remaining fields with empty strings if paste is shorter than 6 digits
                        while (newOtp.length < 6) {
                          newOtp.push('');
                        }
                        setOtp(newOtp.join(''));

                        // Focus the next empty field or the last field
                        const nextEmptyIndex = newOtp.findIndex((digit, i) => !digit && i >= index);
                        const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
                        const focusField = document.getElementById(`otp-${focusIndex}`);
                        focusField?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[index] && index > 0) {
                        // Move to previous field on backspace
                        const prevField = document.getElementById(`otp-${index - 1}`);
                        prevField?.focus();
                      } else if (e.key === 'Enter' && otp.length === 6) {
                        handleVerifyOTP();
                      }
                    }}
                    style={{
                      width: '50px',
                      height: '50px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      borderRadius: '8px'
                    }}
                    maxLength={1}
                  />
                ))}
              </Flex>
              <Button
                onClick={handleVerifyOTP}
                variant="primary"
                size="m"
                fillWidth
                style={{ maxWidth: '400px' }}
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
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
                  onClick={handleSendOTP}
                  variant="tertiary"
                  size="s"
                  disabled={loading}
                >
                  Resend OTP
                </Button>
              </Flex>
            </Flex>
          )}
        </RevealFx>
      </Column>
    </Column>
  );
}


