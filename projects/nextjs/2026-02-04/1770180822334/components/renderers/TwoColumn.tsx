import React from 'react'

export interface TwoColumnProps {
  leftContent: string
  rightContent: string
  columnRatio?: '50-50' | '60-40' | '40-60' | '70-30' | '30-70'
}

export default function TwoColumn({
  leftContent,
  rightContent,
  columnRatio = '50-50'
}: TwoColumnProps) {
  // Column ratio classes using CSS Grid
  const ratioClasses = {
    '50-50': 'grid-cols-1 lg:grid-cols-2',
    '60-40': 'grid-cols-1 lg:grid-cols-[3fr_2fr]',
    '40-60': 'grid-cols-1 lg:grid-cols-[2fr_3fr]',
    '70-30': 'grid-cols-1 lg:grid-cols-[7fr_3fr]',
    '30-70': 'grid-cols-1 lg:grid-cols-[3fr_7fr]'
  }

  return (
    <div
      className={`grid ${ratioClasses[columnRatio]} gap-8 lg:gap-12 items-start`}
      role="region"
      aria-label="Two column layout"
    >
      {/* Left Column */}
      <div className="prose prose-lg max-w-none">
        <div
          dangerouslySetInnerHTML={{ __html: leftContent }}
          className="two-column-content"
        />
      </div>

      {/* Right Column */}
      <div className="prose prose-lg max-w-none">
        <div
          dangerouslySetInnerHTML={{ __html: rightContent }}
          className="two-column-content"
        />
      </div>

      <style jsx>{`
        .two-column-content :global(h1) {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 1.5rem;
          margin-bottom: 0.875rem;
          color: #1a202c;
        }

        .two-column-content :global(h2) {
          font-size: 1.75rem;
          font-weight: 600;
          line-height: 1.3;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          color: #2d3748;
        }

        .two-column-content :global(h3) {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1rem;
          margin-bottom: 0.625rem;
          color: #2d3748;
        }

        .two-column-content :global(p) {
          font-size: 1rem;
          line-height: 1.75;
          margin-bottom: 1rem;
          color: #4a5568;
        }

        .two-column-content :global(ul),
        .two-column-content :global(ol) {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
          padding-left: 0.5rem;
        }

        .two-column-content :global(ul) {
          list-style-type: disc;
        }

        .two-column-content :global(ol) {
          list-style-type: decimal;
        }

        .two-column-content :global(li) {
          font-size: 1rem;
          line-height: 1.75;
          margin-bottom: 0.5rem;
          color: #4a5568;
        }

        .two-column-content :global(a) {
          color: #4299e1;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .two-column-content :global(a:hover) {
          color: #2b6cb0;
        }

        .two-column-content :global(strong) {
          font-weight: 700;
        }

        .two-column-content :global(em) {
          font-style: italic;
        }

        .two-column-content :global(img) {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }

        @media (prefers-color-scheme: dark) {
          .two-column-content :global(h1),
          .two-column-content :global(h2),
          .two-column-content :global(h3) {
            color: #f7fafc;
          }

          .two-column-content :global(p),
          .two-column-content :global(li) {
            color: #e2e8f0;
          }
        }
      `}</style>
    </div>
  )
}
