'use client'

import { AlertCircle } from 'lucide-react'

interface AnalyticsConfig {
  ga4Id?: string
  gtmId?: string
  plausibleDomain?: string
  customScripts?: string
}

interface AnalyticsTabProps {
  analyticsConfig: AnalyticsConfig
  onChange: (field: string, value: any) => void
}

export function AnalyticsTab({ analyticsConfig, onChange }: AnalyticsTabProps) {
  const config = {
    ga4Id: analyticsConfig.ga4Id || '',
    gtmId: analyticsConfig.gtmId || '',
    plausibleDomain: analyticsConfig.plausibleDomain || '',
    customScripts: analyticsConfig.customScripts || '',
  }

  const updateAnalyticsConfig = (field: string, value: any) => {
    onChange('analyticsConfig', {
      ...analyticsConfig,
      [field]: value,
    })
  }

  const validateGA4 = (value: string) => {
    if (value && !value.startsWith('G-')) {
      return 'GA4 ID must start with "G-"'
    }
    return null
  }

  const validateGTM = (value: string) => {
    if (value && !value.startsWith('GTM-')) {
      return 'GTM ID must start with "GTM-"'
    }
    return null
  }

  const ga4Error = validateGA4(config.ga4Id)
  const gtmError = validateGTM(config.gtmId)

  return (
    <div className="space-y-6">
      {/* Google Analytics 4 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Google Analytics 4 (GA4) ID
        </label>
        <input
          type="text"
          value={config.ga4Id}
          onChange={(e) => updateAnalyticsConfig('ga4Id', e.target.value)}
          placeholder="G-XXXXXXXXXX"
          className={`w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none ${
            ga4Error
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {ga4Error && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{ga4Error}</span>
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Your Google Analytics 4 measurement ID (starts with "G-")
        </p>
      </div>

      {/* Google Tag Manager */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Google Tag Manager (GTM) ID
        </label>
        <input
          type="text"
          value={config.gtmId}
          onChange={(e) => updateAnalyticsConfig('gtmId', e.target.value)}
          placeholder="GTM-XXXXXXX"
          className={`w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none ${
            gtmError
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {gtmError && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{gtmError}</span>
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Your Google Tag Manager container ID (starts with "GTM-")
        </p>
      </div>

      {/* Plausible Analytics */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Plausible Analytics Domain
        </label>
        <input
          type="text"
          value={config.plausibleDomain}
          onChange={(e) => updateAnalyticsConfig('plausibleDomain', e.target.value)}
          placeholder="example.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Your website domain for Plausible Analytics (e.g., "example.com")
        </p>
      </div>

      {/* Custom Scripts */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Custom Analytics Scripts
        </label>
        <textarea
          value={config.customScripts}
          onChange={(e) => updateAnalyticsConfig('customScripts', e.target.value)}
          placeholder={`<!-- Add custom analytics scripts here -->
<script>
  // Your custom analytics code
</script>`}
          rows={10}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Additional analytics scripts (e.g., Hotjar, Mixpanel, custom tracking code)
        </p>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Analytics Privacy</h4>
            <p className="mt-1 text-xs text-blue-700">
              Make sure to comply with privacy regulations (GDPR, CCPA) when using analytics.
              Consider adding a cookie consent banner if required in your jurisdiction.
            </p>
          </div>
        </div>
      </div>

      {/* Testing Info */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-2 text-sm font-medium text-gray-900">Testing Your Analytics</h4>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• GA4: Check Real-Time reports in Google Analytics</li>
          <li>• GTM: Use GTM Preview mode to debug your implementation</li>
          <li>• Plausible: Visit your site and check your Plausible dashboard</li>
          <li>• Custom Scripts: Use browser DevTools Console to check for errors</li>
        </ul>
      </div>
    </div>
  )
}
