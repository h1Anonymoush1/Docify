'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Mermaid to avoid SSR issues
const Mermaid = dynamic(() => import('./MermaidChart'), { ssr: false });

interface ContentBlock {
  id: string;
  type: string;
  size: 'small' | 'medium' | 'large';
  title: string;
  content: string;
  metadata?: {
    language?: string;
    priority?: string;
    [key: string]: any;
  };
}

interface ContentBlockRendererProps {
  block: ContentBlock;
}

function getSizeClasses(size: string): string {
  switch (size) {
    case 'small':
      return 'col-span-1';
    case 'medium':
      return 'col-span-2';
    case 'large':
      return 'col-span-3';
    default:
      return 'col-span-1';
  }
}

function TextBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{block.title}</h3>
      <div className="prose prose-sm max-w-none">
        <div className="whitespace-pre-wrap text-gray-700">{block.content}</div>
      </div>
    </div>
  );
}

function CodeBlock({ block }: { block: ContentBlock }) {
  const language = block.metadata?.language || 'text';

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{block.title}</h3>
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
          {language}
        </span>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
        <code className={`language-${language}`}>{block.content}</code>
      </pre>
    </div>
  );
}

function MermaidBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{block.title}</h3>
      <div className="bg-gray-50 p-4 rounded-md">
        <Mermaid chart={block.content} />
      </div>
    </div>
  );
}

function KeyPointsBlock({ block }: { block: ContentBlock }) {
  const points = block.content.split('\n').filter(point => point.trim());

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{block.title}</h3>
      <ul className="space-y-2">
        {points.map((point, index) => (
          <li key={index} className="flex items-start">
            <span className="text-blue-500 mr-2 mt-1">•</span>
            <span className="text-gray-700">{point.replace(/^[-•*]\s*/, '')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GuideBlock({ block }: { block: ContentBlock }) {
  const steps = block.content.split('\n').filter(step => step.trim());

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{block.title}</h3>
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-sm rounded-full flex items-center justify-center mr-3 mt-0.5">
              {index + 1}
            </span>
            <span className="text-gray-700">{step.replace(/^\d+\.\s*/, '')}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ApiReferenceBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{block.title}</h3>
      <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
        <pre className="whitespace-pre-wrap text-gray-800">{block.content}</pre>
      </div>
    </div>
  );
}

function ComparisonBlock({ block }: { block: ContentBlock }) {
  // Try to parse as table format
  const lines = block.content.split('\n').filter(line => line.trim());

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{block.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {lines.map((line, index) => {
              const [label, value] = line.split(':').map(s => s.trim());
              return (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {label}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {value}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ContentBlockRenderer({ block }: ContentBlockRendererProps) {
  const sizeClasses = getSizeClasses(block.size);

  const renderBlock = () => {
    switch (block.type) {
      case 'summary':
      case 'architecture':
      case 'best_practices':
      case 'troubleshooting':
        return <TextBlock block={block} />;

      case 'code':
        return <CodeBlock block={block} />;

      case 'mermaid':
        return <MermaidBlock block={block} />;

      case 'key_points':
        return <KeyPointsBlock block={block} />;

      case 'guide':
        return <GuideBlock block={block} />;

      case 'api_reference':
        return <ApiReferenceBlock block={block} />;

      case 'comparison':
        return <ComparisonBlock block={block} />;

      default:
        return <TextBlock block={block} />;
    }
  };

  return (
    <div className={`${sizeClasses} mb-6`}>
      {renderBlock()}
    </div>
  );
}
