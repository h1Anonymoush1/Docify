import { Flex, Text, SmartLink, IconButton } from "@/once-ui/components";

export const Footer = () => {
  return (
    <Flex
      as="footer"
      position="relative"
      fillWidth
      paddingY="16"
      paddingX="24"
      background="neutral-weak"
      horizontal="space-between"
      vertical="center"
    >
      {/* Left side - About Docify */}
      <Flex gap="8" vertical="center">
        <SmartLink href="https://github.com/h1Anonymoush1/Docify">
          <IconButton
            icon="github"
            size="s"
            variant="ghost"
            tooltip="View Docify repository on GitHub"
          />
        </SmartLink>
        <Text variant="body-default-s" onBackground="neutral-strong">
          Docify for Appwrite Hackathon using Once UI
        </Text>
      </Flex>

      {/* Right side - Template link */}
      <Flex gap="4" vertical="center">
        <Text variant="body-default-s" onBackground="neutral-weak">
          Built on top of
        </Text>
        <SmartLink href="https://github.com/appwrite/templates-for-sites/tree/main/nextjs/magic-portfolio">
          <IconButton
            icon="github"
            size="s"
            variant="ghost"
            tooltip="View original template on GitHub"
          />
        </SmartLink>
      </Flex>
    </Flex>
  );
};
