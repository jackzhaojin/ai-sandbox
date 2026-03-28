import React from 'react'

export interface TextBlockProps {
  content: string
  textAlign?: 'left' | 'center' | 'right'
}

export default function TextBlock({
  content,
  textAlign = 'left'
}: TextBlockProps) {
  // Text alignment classes
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <div
      className={`prose prose-lg max-w-none ${alignmentClasses[textAlign]}`}
      role="article"
    >
      {/*
        Render HTML content from Tiptap editor
        Using dangerouslySetInnerHTML for rich text rendering
        In production, ensure content is sanitized on the server
      */}
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        className="text-block-content"
      />

      <style jsx>{`
        .text-block-content :global(h1) {
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1.2;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #1a202c;
        }

        .text-block-content :global(h2) {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 1.75rem;
          margin-bottom: 0.875rem;
          color: #2d3748;
        }

        .text-block-content :global(h3) {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #2d3748;
        }

        .text-block-content :global(h4) {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.5;
          margin-top: 1.25rem;
          margin-bottom: 0.625rem;
          color: #4a5568;
        }

        .text-block-content :global(p) {
          font-size: 1rem;
          line-height: 1.75;
          margin-bottom: 1rem;
          color: #4a5568;
        }

        .text-block-content :global(ul),
        .text-block-content :global(ol) {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
          padding-left: 0.5rem;
        }

        .text-block-content :global(ul) {
          list-style-type: disc;
        }

        .text-block-content :global(ol) {
          list-style-type: decimal;
        }

        .text-block-content :global(li) {
          font-size: 1rem;
          line-height: 1.75;
          margin-bottom: 0.5rem;
          color: #4a5568;
        }

        .text-block-content :global(blockquote) {
          border-left: 4px solid #4299e1;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #2d3748;
        }

        .text-block-content :global(a) {
          color: #4299e1;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .text-block-content :global(a:hover) {
          color: #2b6cb0;
        }

        .text-block-content :global(strong) {
          font-weight: 700;
        }

        .text-block-content :global(em) {
          font-style: italic;
        }

        .text-block-content :global(code) {
          background-color: #f7fafc;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.875rem;
          color: #2d3748;
        }

        .text-block-content :global(pre) {
          background-color: #1a202c;
          color: #f7fafc;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }

        .text-block-content :global(pre code) {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }

        .text-block-content :global(hr) {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 2rem 0;
        }

        .text-block-content :global(table) {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }

        .text-block-content :global(th),
        .text-block-content :global(td) {
          border: 1px solid #e2e8f0;
          padding: 0.75rem;
          text-align: left;
        }

        .text-block-content :global(th) {
          background-color: #f7fafc;
          font-weight: 600;
          color: #2d3748;
        }

        @media (prefers-color-scheme: dark) {
          .text-block-content :global(h1),
          .text-block-content :global(h2),
          .text-block-content :global(h3) {
            color: #f7fafc;
          }

          .text-block-content :global(h4),
          .text-block-content :global(p),
          .text-block-content :global(li) {
            color: #e2e8f0;
          }

          .text-block-content :global(blockquote) {
            color: #f7fafc;
          }

          .text-block-content :global(code) {
            background-color: #2d3748;
            color: #f7fafc;
          }
        }
      `}</style>
    </div>
  )
}
