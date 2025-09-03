'use client';

import React, { useEffect, useRef } from 'react';

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
  const elementRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!elementRef.current || !window.mermaid) {
        return;
      }

      try {
        // Clear previous content
        elementRef.current.innerHTML = '';

        // Generate unique ID for the chart
        const chartId = `mermaid-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create a temporary div for rendering
        const tempDiv = document.createElement('div');
        tempDiv.id = chartId;
        tempDiv.textContent = chart;
        elementRef.current.appendChild(tempDiv);

        // Render the chart
        const { svg } = await window.mermaid.render(chartId, chart);

        // Replace the temporary div with the rendered SVG
        tempDiv.outerHTML = svg;

        setIsRendered(true);
        setError(null);

      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render chart');

        // Show the raw chart content if rendering fails
        if (elementRef.current) {
          elementRef.current.innerHTML = `<pre class="text-sm text-gray-600 p-4 bg-gray-50 rounded border">${chart}</pre>`;
        }
      }
    };

    // Load Mermaid if not already loaded
    if (!window.mermaid) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
      script.onload = () => {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        });
        renderChart();
      };
      script.onerror = () => {
        setError('Failed to load Mermaid library');
      };
      document.head.appendChild(script);
    } else {
      renderChart();
    }
  }, [chart]);

  return (
    <div className={`mermaid-chart ${className}`}>
      {error && (
        <div className="text-red-600 text-sm mb-2 p-2 bg-red-50 rounded border border-red-200">
          <strong>Chart Error:</strong> {error}
        </div>
      )}
      <div
        ref={elementRef}
        className="mermaid-container min-h-[200px] flex items-center justify-center"
        style={{
          backgroundColor: error ? '#f9fafb' : 'transparent'
        }}
      >
        {!isRendered && !error && (
          <div className="text-gray-500 text-sm">Rendering chart...</div>
        )}
      </div>
    </div>
  );
}
