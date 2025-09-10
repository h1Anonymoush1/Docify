'use client';

import React, { useState } from 'react';
import { databases, account, ID } from '../lib/appwrite';
import { APPWRITE_CONFIG } from '../lib/appwrite';
import { Flex, Heading, Button, Input, Textarea, Text } from '@/once-ui/components';

interface DocumentFormProps {
  onSuccess?: (documentId: string) => void;
  onError?: (error: string) => void;
}

export default function DocumentForm({ onSuccess, onError }: DocumentFormProps) {
  const [url, setUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{url?: string; instructions?: string}>({});

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {url?: string; instructions?: string} = {};

    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!validateUrl(url)) {
      newErrors.url = 'Please enter a valid URL';
    }

    if (!instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    } else if (instructions.length < 10) {
      newErrors.instructions = 'Instructions must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🟢 DocumentForm: Form submission started');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Get current user
      const user = await account.get();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create document record
      const documentData = {
        url: url.trim(),
        instructions: instructions.trim(),
        status: 'pending',
        user_id: user.$id
      };

      const document = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.documentsCollectionId,
        ID.unique(),
        documentData
      );

      console.log('Document created:', document);

      // The scraper function will be automatically triggered by the document creation event
      // No need to manually call the API - this is handled by Appwrite's event system
      console.log('Scraping will be automatically triggered by document creation event');

      // Call success callback
      console.log('🟢 DocumentForm: Calling onSuccess with document ID:', document.$id);
      if (onSuccess) {
        onSuccess(document.$id);
      } else {
        console.log('🟡 DocumentForm: onSuccess callback is not provided');
      }

      // Reset form
      setUrl('');
      setInstructions('');

    } catch (error) {
      console.error('Error creating document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create document';

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex
      background="surface"
      border="neutral-weak"
      radius="l"
      padding="xl"
      direction="column"
      gap="l"
      style={{ maxWidth: '900px', margin: '0 auto' }}
    >
      <Flex fillWidth horizontal="center">
        <Heading variant="heading-strong-l">Create New Document</Heading>
      </Flex>

      <form onSubmit={handleSubmit}>
        {/* URL Input */}
        <Flex direction="column" gap="s">
          <Input
            id="url"
            label="Document URL"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={!!errors.url}
            errorMessage={errors.url}
            disabled={isSubmitting}
          />
        </Flex>

        {/* Spacer */}
        <div style={{ height: 'var(--space-l)' }} />

        {/* Instructions Textarea */}
        <Flex direction="column" gap="s">
          <Textarea
            id="instructions"
            label="Analysis Instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            lines={6}
            error={!!errors.instructions}
            errorMessage={errors.instructions}
            disabled={isSubmitting}
          />
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Provide clear instructions for how the AI should analyze and present this document.
          </Text>
        </Flex>


        {/* Submit Button */}
        <Flex fillWidth horizontal="center" paddingTop="m">
          <Button
            type="submit"
            variant="primary"
            size="l"
            disabled={isSubmitting}
            style={{
              minWidth: '200px',
              backgroundColor: isSubmitting ? 'var(--neutral-medium)' : 'var(--brand-background-strong)',
              color: 'var(--brand-on-background-strong)',
              border: 'none',
              borderRadius: 'var(--radius-m)',
              padding: 'var(--space-m) var(--space-xl)',
              fontSize: 'var(--font-size-m)',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            {isSubmitting ? 'Creating Document...' : 'Create Document'}
          </Button>
        </Flex>
      </form>

    </Flex>
  );
}
