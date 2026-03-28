'use client'

import { AlertTriangle } from 'lucide-react'

interface CustomCodeTabProps {
  customHeadHtml: string
  customCss: string
  onChange: (field: string, value: any) => void
}

export function CustomCodeTab({ customHeadHtml, customCss, onChange }: CustomCodeTabProps) {
  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <h4 className="text-sm font-medium text-amber-900">Security Warning</h4>
            <p className="mt-1 text-xs text-amber-700">
              Custom HTML and CSS can introduce security vulnerabilities or break your site.
              Only add code from trusted sources. Malicious scripts can compromise your site and user data.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Head HTML */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Custom HTML in &lt;head&gt;
        </label>
        <textarea
          value={customHeadHtml}
          onChange={(e) => onChange('customHeadHtml', e.target.value)}
          placeholder={`<!-- Add custom HTML that will be injected into the <head> section -->
<meta name="custom-meta" content="value">
<link rel="preconnect" href="https://example.com">
<script src="https://example.com/script.js"></script>`}
          rows={12}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Custom HTML injected before the closing &lt;/head&gt; tag on all public pages
        </p>
      </div>

      {/* Custom CSS */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Custom CSS
        </label>
        <textarea
          value={customCss}
          onChange={(e) => onChange('customCss', e.target.value)}
          placeholder={`/* Add custom CSS styles for your site */
body {
  /* Your custom styles */
}

.custom-class {
  color: #333;
  font-size: 1rem;
}`}
          rows={15}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Custom CSS injected into all public pages (overrides default styles)
        </p>
      </div>

      {/* Usage Examples */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-3 text-sm font-medium text-gray-900">Common Use Cases</h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div>
            <strong className="text-gray-900">Custom Head HTML:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Meta tags for verification (Google, Facebook, etc.)</li>
              <li>• Third-party scripts (chat widgets, A/B testing)</li>
              <li>• Custom fonts or icon libraries</li>
              <li>• Preconnect/prefetch resource hints</li>
            </ul>
          </div>
          <div className="mt-3">
            <strong className="text-gray-900">Custom CSS:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Override theme colors or spacing</li>
              <li>• Add custom animations or transitions</li>
              <li>• Style specific page elements</li>
              <li>• Add responsive design tweaks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 text-sm font-medium text-blue-900">Best Practices</h4>
        <ul className="space-y-1 text-xs text-blue-700">
          <li>• Test thoroughly before deploying to production</li>
          <li>• Minimize custom code to improve performance</li>
          <li>• Use theme settings for colors/fonts when possible</li>
          <li>• Keep code organized with comments</li>
          <li>• Validate HTML and CSS before saving</li>
        </ul>
      </div>
    </div>
  )
}
