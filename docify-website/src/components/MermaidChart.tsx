'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Flex, Text, Heading, Spinner } from '@/once-ui/components';

interface MermaidChartProps {
  chart: string;
  className?: string;
}

declare global {
  interface Window {
    mermaid: any;
  }
}

export default function MermaidChart({ chart, className = '' }: MermaidChartProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mermaidLoaded, setMermaidLoaded] = useState(false);

  useEffect(() => {
    // Load Mermaid library
    if (!window.mermaid && !mermaidLoaded) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
      script.onload = () => {
        if (window.mermaid) {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'var(--font-family)',
            themeVariables: {
              primaryColor: 'var(--brand-medium)',
              primaryTextColor: 'var(--neutral-strong)',
              primaryBorderColor: 'var(--neutral-medium)',
              lineColor: 'var(--neutral-medium)',
              secondaryColor: 'var(--neutral-weak)',
              tertiaryColor: 'var(--surface)',
              background: 'var(--surface)',
              mainBkg: 'var(--surface)',
              secondBkg: 'var(--neutral-weak)',
              border1: 'var(--neutral-medium)',
              border2: 'var(--neutral-weak)'
            }
          });
          setMermaidLoaded(true);
        }
      };
      script.onerror = () => {
        setError('Failed to load Mermaid library');
      };
      document.head.appendChild(script);
    } else {
      setMermaidLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!mermaidLoaded || !window.mermaid || !chart || chart.trim() === '') {
      return;
    }

    const renderChart = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSvgContent(null);

        // Generate unique ID for the chart
        const chartId = `mermaid-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Render the chart
        const { svg } = await window.mermaid.render(chartId, chart);

        setSvgContent(svg);
        setIsLoading(false);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to render chart';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart, mermaidLoaded]);

  if (error) {
    return (
      <Flex
        fillWidth
        direction="column"
        gap="m"
        className={className}
      >
        {/* Error State with Once UI */}
        <Flex
          fillWidth
          padding="m"
          background="danger-weak"
          border="danger-medium"
          radius="m"
          direction="column"
          gap="s"
        >
          <Heading variant="heading-strong-s" onBackground="danger-strong">
            Diagram Error
          </Heading>
          <Text variant="body-default-s" onBackground="danger-strong">
            {error}
          </Text>
        </Flex>

        {/* Raw Content Display */}
        <Flex
          fillWidth
          direction="column"
          gap="s"
          padding="m"
          background="neutral-weak"
          border="neutral-medium"
          radius="m"
        >
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Raw diagram content:
          </Text>
          <Flex
            fillWidth
            padding="s"
            background="surface"
            border="neutral-weak"
            radius="s"
            overflow="auto"
            maxHeight={200}
          >
            <Text
              variant="body-default-xs"
              onBackground="neutral-strong"
              style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
            >
              {chart}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex
      fillWidth
      direction="column"
      className={className}
      minHeight={200}
    >
      {/* Loading State with Once UI */}
      {isLoading && (
        <Flex
          fillWidth
          fillHeight
          horizontal="center"
          vertical="center"
          gap="m"
        >
          <Spinner size="m" ariaLabel="Rendering diagram" />
          <Text variant="body-default-s" onBackground="neutral-weak">
            Rendering diagram...
          </Text>
        </Flex>
      )}

      {/* Success State */}
      {!isLoading && svgContent && (
        <Flex
          fillWidth
          background="surface"
          border="neutral-weak"
          radius="m"
          padding="s"
          overflow="auto"
          style={{
            maxHeight: '500px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--neutral-medium) transparent'
          }}
        >
          <div
            className="mermaid-svg-container"
            style={{
              width: '100%',
              height: 'auto',
              minHeight: '200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </Flex>
      )}

      {/* Empty State */}
      {!isLoading && !svgContent && !error && (
        <Flex
          fillWidth
          fillHeight
          horizontal="center"
          vertical="center"
        >
          <Text variant="body-default-s" onBackground="neutral-weak">
            Preparing diagram...
          </Text>
        </Flex>
      )}
    </Flex>
  );
}
