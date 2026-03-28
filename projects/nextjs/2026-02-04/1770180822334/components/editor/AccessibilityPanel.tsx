'use client'

import { useState, useEffect } from 'react'
import axe from 'axe-core'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Heading,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AxeViolation {
  id: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  description: string
  help: string
  helpUrl: string
  nodes: Array<{
    html: string
    target: string[]
    failureSummary: string
  }>
}

interface AxeResult {
  violations: AxeViolation[]
  passes: Array<{ id: string; description: string }>
  incomplete: AxeViolation[]
}

interface HeadingNode {
  level: number
  text: string
  element?: Element
}

interface ImageAudit {
  src: string
  alt: string
  hasAlt: boolean
  element?: Element
}

interface LinkAudit {
  href: string
  text: string
  isGeneric: boolean
  element?: Element
}

export default function AccessibilityPanel() {
  const [isScanning, setIsScanning] = useState(false)
  const [axeResults, setAxeResults] = useState<AxeResult | null>(null)
  const [activeTab, setActiveTab] = useState<'violations' | 'headings' | 'images' | 'links' | 'contrast'>('violations')
  const [expandedViolations, setExpandedViolations] = useState<Set<string>>(new Set())
  const [headings, setHeadings] = useState<HeadingNode[]>([])
  const [images, setImages] = useState<ImageAudit[]>([])
  const [links, setLinks] = useState<LinkAudit[]>([])

  const runAccessibilityAudit = async () => {
    setIsScanning(true)

    try {
      // Run axe-core on the canvas or entire page
      const results = await axe.run(document.body, {
        rules: {
          // Enable all WCAG 2.1 AA rules
          'color-contrast': { enabled: true },
          'image-alt': { enabled: true },
          'label': { enabled: true },
          'link-name': { enabled: true },
          'button-name': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'heading-order': { enabled: true },
          'landmark-one-main': { enabled: true },
          'region': { enabled: true },
        },
      })

      setAxeResults({
        violations: results.violations as AxeViolation[],
        passes: results.passes.map(p => ({ id: p.id, description: p.description })),
        incomplete: results.incomplete as AxeViolation[],
      })

      // Audit headings
      auditHeadings()

      // Audit images
      auditImages()

      // Audit links
      auditLinks()
    } catch (error) {
      console.error('Accessibility audit failed:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const auditHeadings = () => {
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const headingList: HeadingNode[] = []

    headingElements.forEach((el) => {
      const level = parseInt(el.tagName.substring(1))
      const text = el.textContent?.trim() || '(empty heading)'
      headingList.push({ level, text, element: el })
    })

    setHeadings(headingList)
  }

  const auditImages = () => {
    const imgElements = document.querySelectorAll('img')
    const imageList: ImageAudit[] = []

    imgElements.forEach((img) => {
      const src = img.src || img.getAttribute('src') || ''
      const alt = img.alt || ''
      const hasAlt = img.hasAttribute('alt') && alt.trim().length > 0

      imageList.push({
        src: src.substring(0, 50) + (src.length > 50 ? '...' : ''),
        alt: alt || '(missing)',
        hasAlt,
        element: img,
      })
    })

    setImages(imageList)
  }

  const auditLinks = () => {
    const linkElements = document.querySelectorAll('a[href]')
    const linkList: LinkAudit[] = []
    const genericTexts = ['click here', 'read more', 'here', 'more', 'link', 'learn more']

    linkElements.forEach((link) => {
      const href = link.getAttribute('href') || ''
      const text = link.textContent?.trim() || '(empty link)'
      const isGeneric = genericTexts.some(generic =>
        text.toLowerCase().includes(generic)
      )

      linkList.push({
        href: href.substring(0, 50) + (href.length > 50 ? '...' : ''),
        text,
        isGeneric,
        element: link,
      })
    })

    setLinks(linkList)
  }

  const toggleViolation = (id: string) => {
    setExpandedViolations((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'text-red-600 bg-red-50'
      case 'serious':
        return 'text-orange-600 bg-orange-50'
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50'
      case 'minor':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'critical':
      case 'serious':
        return <AlertCircle className="w-4 h-4" />
      case 'moderate':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const calculateScore = () => {
    if (!axeResults) return null

    const total = axeResults.violations.length + axeResults.passes.length
    if (total === 0) return 100

    const passed = axeResults.passes.length
    return Math.round((passed / total) * 100)
  }

  const score = calculateScore()

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Accessibility</h2>
          <Button
            onClick={runAccessibilityAudit}
            disabled={isScanning}
            size="sm"
            variant="outline"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Run Audit
              </>
            )}
          </Button>
        </div>

        {/* Score */}
        {score !== null && (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Accessibility Score</span>
                <span className="text-sm font-bold text-gray-900">{score}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    score >= 90 ? 'bg-green-500' :
                    score >= 70 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                  role="progressbar"
                  aria-valuenow={score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Accessibility score"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4">
        {[
          { id: 'violations', label: 'Issues', icon: AlertCircle, count: axeResults?.violations.length },
          { id: 'headings', label: 'Headings', icon: Heading, count: headings.length },
          { id: 'images', label: 'Images', icon: ImageIcon, count: images.filter(i => !i.hasAlt).length },
          { id: 'links', label: 'Links', icon: LinkIcon, count: links.filter(l => l.isGeneric).length },
          { id: 'contrast', label: 'Contrast', icon: Eye, count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            aria-label={`${tab.label} tab`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <tab.icon className="w-4 h-4" aria-hidden="true" />
            <span className="hidden lg:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <Badge variant="destructive" className="ml-1">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!axeResults && !isScanning && (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" aria-hidden="true" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Run Accessibility Audit
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan your page for WCAG 2.1 AA compliance issues
            </p>
            <Button onClick={runAccessibilityAudit}>
              Start Audit
            </Button>
          </div>
        )}

        {/* Violations Tab */}
        {activeTab === 'violations' && axeResults && (
          <div className="space-y-3">
            {axeResults.violations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">No violations found!</p>
                <p className="text-xs text-gray-600 mt-1">Your page meets WCAG 2.1 AA standards</p>
              </div>
            ) : (
              axeResults.violations.map((violation) => {
                const isExpanded = expandedViolations.has(violation.id)

                return (
                  <div
                    key={violation.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleViolation(violation.id)}
                      className="w-full flex items-start gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                      aria-expanded={isExpanded}
                      aria-controls={`violation-${violation.id}`}
                    >
                      <div className={`flex-shrink-0 p-1 rounded ${getImpactColor(violation.impact)}`}>
                        {getImpactIcon(violation.impact)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {violation.impact}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {violation.nodes.length} instance{violation.nodes.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {violation.help}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                      )}
                    </button>

                    {isExpanded && (
                      <div id={`violation-${violation.id}`} className="px-3 pb-3 bg-gray-50">
                        <p className="text-xs text-gray-700 mb-2">
                          {violation.description}
                        </p>
                        <a
                          href={violation.helpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mb-3 inline-block"
                        >
                          Learn more →
                        </a>
                        <div className="space-y-2">
                          {violation.nodes.slice(0, 3).map((node, idx) => (
                            <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                              <code className="text-xs text-gray-800 block overflow-x-auto">
                                {node.html}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Headings Tab */}
        {activeTab === 'headings' && (
          <div className="space-y-2">
            {headings.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-8">No headings found</p>
            ) : (
              headings.map((heading, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                  style={{ paddingLeft: `${(heading.level - 1) * 16 + 8}px` }}
                >
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    H{heading.level}
                  </Badge>
                  <span className="text-sm text-gray-900">{heading.text}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="space-y-2">
            {images.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-8">No images found</p>
            ) : (
              images.map((image, idx) => (
                <div
                  key={idx}
                  className={`p-3 border rounded-lg ${
                    image.hasAlt ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    {image.hasAlt ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-gray-600 truncate">{image.src}</p>
                      <p className={`text-sm mt-1 ${image.hasAlt ? 'text-gray-900' : 'text-red-900'}`}>
                        {image.alt}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === 'links' && (
          <div className="space-y-2">
            {links.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-8">No links found</p>
            ) : (
              links.map((link, idx) => (
                <div
                  key={idx}
                  className={`p-3 border rounded-lg ${
                    link.isGeneric ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {link.isGeneric ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{link.text}</p>
                      <p className="text-xs font-mono text-gray-600 truncate mt-1">{link.href}</p>
                      {link.isGeneric && (
                        <p className="text-xs text-yellow-700 mt-1">
                          Generic link text - consider making it more descriptive
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Contrast Tab */}
        {activeTab === 'contrast' && (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" aria-hidden="true" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Color Contrast Checker
            </h3>
            <p className="text-sm text-gray-600">
              Contrast checking is included in the main violations audit.
              <br />
              Run the audit to check for contrast issues.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
