'use client';

import React, { useEffect, useRef, useState } from 'react';

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
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
      <div className={`mermaid-chart ${className}`}>
        <div className="text-red-600 text-sm mb-2 p-2 bg-red-50 rounded border border-red-200">
          <strong>Chart Error:</strong> {error}
        </div>
        <div className="text-center p-4 bg-gray-50 rounded border">
          <div className="text-gray-500 text-sm mb-2">Chart could not be rendered</div>
          <div className="text-xs text-gray-400 bg-white p-2 rounded border overflow-auto max-w-full whitespace-pre-wrap">
            {chart}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Raw chart content shown above
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mermaid-chart ${className}`}>
      <div className="mermaid-container min-h-[200px] flex items-center justify-center">
        {isLoading && (
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div className="text-gray-500 text-sm">Rendering chart...</div>
          </div>
        )}
        {!isLoading && svgContent && (
          <div
            className="mermaid-svg-container"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
        {!isLoading && !svgContent && !error && (
          <div className="text-gray-500 text-sm">Preparing chart...</div>
        )}
      </div>
    </div>
  );
}
