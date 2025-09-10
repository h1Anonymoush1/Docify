"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Fade, Flex, Line, ToggleButton, Text } from "@/once-ui/components";
import styles from "@/components/Header.module.scss";

import { routes, display } from "@/app/resources";
import { person, home } from "@/app/resources/content";
import { useAuth } from "@/lib/auth-context";

type TimeDisplayProps = {
  timeZone: string;
  locale?: string; // Optionally allow locale, defaulting to 'en-GB'
};

const CountdownDisplay: React.FC = () => {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Set target to September 12th of current year
      const currentYear = now.getFullYear();
      const targetDate = new Date(currentYear, 8, 12); // September is month 8 (0-indexed)

      // If September 12th has already passed this year, set to next year
      if (now > targetDate) {
        targetDate.setFullYear(currentYear + 1);
      }

      const timeDifference = targetDate.getTime() - now.getTime();

      if (timeDifference <= 0) {
        setCountdown("Event Started!");
        return;
      }

      const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return <>{countdown}</>;
};

export default CountdownDisplay;

const UserIndicator: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [authData, setAuthData] = useState<{user: any, isAuthenticated: boolean, logout: any} | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        const { user, isAuthenticated, logout } = useAuth();
        setAuthData({ user, isAuthenticated, logout });
      } catch (error) {
        // AuthProvider not available yet, will retry on next render
        console.log('AuthProvider not available yet');
      }
    }
  }, [mounted]);

  const handleLogout = async () => {
    if (authData?.logout) {
      try {
        await authData.logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  // Don't render on server side or if auth data is not available
  if (!mounted || !authData || !authData.isAuthenticated) {
    return null;
  }

  return (
    <Flex vertical="center" gap="8">
      <Flex
        background="surface"
        border="neutral-medium"
        radius="m"
        padding="8"
        gap="8"
        vertical="center"
      >
        <Text variant="body-default-s" onBackground="neutral-strong">
          👋 {authData.user?.name || 'User'}
        </Text>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--neutral-strong)',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--neutral-weak)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Logout
        </button>
      </Flex>
    </Flex>
  );
};

export const Header = () => {
  const pathname = usePathname() ?? "";
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Fade hide="s" fillWidth position="fixed" height="80" zIndex={9} />
      <Fade show="s" fillWidth position="fixed" bottom="0" to="top" height="80" zIndex={9} />
      <Flex
        fitHeight
        className={styles.position}
        as="header"
        zIndex={9}
        fillWidth
        padding="8"
        horizontal="center"
      >
        <Flex paddingLeft="12" fillWidth vertical="center" textVariant="body-default-s">
          {/* Get Started button removed from header */}
        </Flex>
        <Flex fillWidth horizontal="center">
          <Flex
            background="surface"
            border="neutral-medium"
            radius="m-4"
            shadow="l"
            padding="4"
            horizontal="center"
          >
            <Flex gap="4" vertical="center" textVariant="body-default-s">
              {routes["/"] && (
                <ToggleButton prefixIcon="home" href="/" selected={pathname === "/"} />
              )}
              <Line vert maxHeight="24" />
              {routes["/explore"] && (
                <>
                  <ToggleButton
                    className="s-flex-hide"
                    prefixIcon="globe"
                    href="/explore"
                    label="Explore"
                    selected={pathname === "/explore"}
                  />
                  <ToggleButton
                    className="s-flex-show"
                    prefixIcon="globe"
                    href="/explore"
                    selected={pathname === "/explore"}
                  />
                  <Line vert maxHeight="24" />
                </>
              )}
              {isAuthenticated ? (
                <>
                  <ToggleButton
                    className="s-flex-hide"
                    prefixIcon="grid"
                    href="/dashboard"
                    label="Dashboard"
                    selected={pathname === "/dashboard"}
                  />
                  <ToggleButton
                    className="s-flex-show"
                    prefixIcon="grid"
                    href="/dashboard"
                    selected={pathname === "/dashboard"}
                  />
                </>
              ) : (
                <>
                  <ToggleButton
                    className="s-flex-hide"
                    prefixIcon="chevronRight"
                    href="/get-started"
                    label="Get Started"
                    selected={pathname === "/get-started"}
                  />
                  <ToggleButton
                    className="s-flex-show"
                    prefixIcon="chevronRight"
                    href="/get-started"
                    selected={pathname === "/get-started"}
                  />
                </>
              )}
              {routes["/account"] && isAuthenticated && (
                <>
                  <ToggleButton
                    className="s-flex-hide"
                    prefixIcon="person"
                    href="/account"
                    label="Account"
                    selected={pathname.startsWith("/account")}
                  />
                  <ToggleButton
                    className="s-flex-show"
                    prefixIcon="person"
                    href="/account"
                    selected={pathname.startsWith("/account")}
                  />
                </>
              )}
            </Flex>
          </Flex>
        </Flex>
        <Flex fillWidth horizontal="end" vertical="center">
          <Flex
            paddingRight="12"
            horizontal="end"
            vertical="center"
            textVariant="body-default-s"
            gap="20"
          >
            <UserIndicator />
            <Flex hide="s">{display.time && <CountdownDisplay />}</Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
};
