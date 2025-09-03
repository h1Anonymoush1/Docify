"use client";

import React from "react";
import { Flex, Button } from "@/once-ui/components";
import Link from "next/link";

export function AuthButtons() {
  return (
    <Flex direction="column" gap="12">
      <Link href="/auth/login" style={{ width: '100%' }}>
        <Button
          variant="primary"
          size="m"
          fillWidth
        >
          <Flex gap="12" vertical="center" horizontal="center">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              width="20"
              height="20"
            >
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Sign In
          </Flex>
        </Button>
      </Link>

      <Link href="/auth/signup" style={{ width: '100%' }}>
        <Button
          variant="secondary"
          size="m"
          fillWidth
        >
          <Flex gap="12" vertical="center" horizontal="center">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              width="20"
              height="20"
            >
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z"/>
            </svg>
            Sign Up
          </Flex>
        </Button>
      </Link>
    </Flex>
  );
}
