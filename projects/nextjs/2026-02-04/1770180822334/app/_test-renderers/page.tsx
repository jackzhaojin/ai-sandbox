'use client'

import React from 'react'
import Hero from '@/components/renderers/Hero'
import TextBlock from '@/components/renderers/TextBlock'
import ImageComponent from '@/components/renderers/ImageComponent'
import TwoColumn from '@/components/renderers/TwoColumn'
import CTA from '@/components/renderers/CTA'
import Testimonial from '@/components/renderers/Testimonial'
import Spacer from '@/components/renderers/Spacer'

export default function TestRenderersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Component Renderers Test Page</h1>
          <p className="mt-2 text-gray-600">
            Testing all 7 core component renderers with sample data
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Hero Component Test */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">1. Hero Component</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Hero
              heading="Welcome to PageForge CMS"
              subheading="Build amazing experiences with our visual page builder"
              primaryButtonText="Get Started"
              primaryButtonLink="#"
              secondaryButtonText="Learn More"
              secondaryButtonLink="#"
              height="medium"
              alignment="center"
            />
          </div>
        </section>

        <Spacer height="medium" />

        {/* Text Block Component Test */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">2. Text Block Component</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <TextBlock
              content={`
                <h2>About Our Platform</h2>
                <p>PageForge is a modern, AEM-inspired visual page builder that makes it easy to create beautiful, responsive web pages without writing code.</p>
                <h3>Key Features</h3>
                <ul>
                  <li>Drag-and-drop interface</li>
                  <li>Component-based architecture</li>
                  <li>Real-time preview</li>
                  <li>Responsive design</li>
                </ul>
                <p><strong>Get started today</strong> and see how easy it is to build professional websites.</p>
              `}
              textAlign="left"
            />
          </div>
        </section>

        <Spacer height="large" />

        {/* Image Component Test */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">3. Image Component</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <ImageComponent
              src="/placeholder.jpg"
              alt="Placeholder image"
              caption="This is a sample image with a caption"
              width="medium"
            />
          </div>
        </section>

        <Spacer height="medium" />

        {/* Two Column Component Test */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">4. Two Column Component</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <TwoColumn
              leftContent={`
                <h3>Left Column</h3>
                <p>This is the left column content. It can contain any HTML content including headings, paragraphs, lists, and more.</p>
                <ul>
                  <li>Feature one</li>
                  <li>Feature two</li>
                  <li>Feature three</li>
                </ul>
              `}
              rightContent={`
                <h3>Right Column</h3>
                <p>This is the right column content. The columns stack on mobile devices for better readability.</p>
                <p>You can adjust the column ratio to 50-50, 60-40, 40-60, 70-30, or 30-70.</p>
              `}
              columnRatio="50-50"
            />
          </div>
        </section>

        <Spacer height="large" />

        {/* CTA Component Test - Primary */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">5. CTA Component (Primary Background)</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <CTA
              heading="Ready to Get Started?"
              description="Join thousands of users building amazing websites with PageForge"
              buttonText="Start Building"
              buttonLink="#"
              backgroundColor="primary"
            />
          </div>
        </section>

        {/* CTA Component Test - Gray */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">5b. CTA Component (Gray Background)</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <CTA
              heading="Need Help?"
              description="Our team is here to support you every step of the way"
              buttonText="Contact Us"
              buttonLink="#"
              backgroundColor="gray"
            />
          </div>
        </section>

        <Spacer height="medium" />

        {/* Testimonial Component Test */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">6. Testimonial Component</h2>
          <div className="bg-gray-100 p-8 rounded-lg">
            <Testimonial
              quote="PageForge has completely transformed how we build and manage our website. The visual editor is intuitive and powerful!"
              author="Sarah Johnson"
              role="Marketing Director, TechCorp"
              rating={5}
            />
          </div>
        </section>

        <Spacer height="xl" />

        {/* Spacer Component Test */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">7. Spacer Component</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 mb-2">Content before small spacer</p>
            <div className="bg-blue-100 border-l-4 border-blue-500">
              <Spacer height="small" />
            </div>
            <p className="text-gray-600 mb-2">Content after small spacer / before medium spacer</p>
            <div className="bg-green-100 border-l-4 border-green-500">
              <Spacer height="medium" />
            </div>
            <p className="text-gray-600 mb-2">Content after medium spacer / before large spacer</p>
            <div className="bg-yellow-100 border-l-4 border-yellow-500">
              <Spacer height="large" />
            </div>
            <p className="text-gray-600">Content after large spacer</p>
          </div>
        </section>

        {/* Responsive Test Info */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-900">Responsive Testing</h2>
          <p className="text-blue-800 mb-4">
            All components are responsive and should adapt to different screen sizes.
            Try resizing your browser window to test:
          </p>
          <ul className="list-disc list-inside text-blue-800 space-y-2">
            <li>Hero: Adjusts text sizes and button layout</li>
            <li>Text Block: Maintains readability across devices</li>
            <li>Image: Scales proportionally</li>
            <li>Two Column: Stacks on mobile, side-by-side on desktop</li>
            <li>CTA: Centers content and adjusts padding</li>
            <li>Testimonial: Maintains card layout with adjusted sizes</li>
            <li>Spacer: Responsive height adjustments</li>
          </ul>
        </section>

        {/* Accessibility Info */}
        <section className="bg-green-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-green-900">Accessibility Features</h2>
          <p className="text-green-800 mb-4">
            All components follow accessibility best practices:
          </p>
          <ul className="list-disc list-inside text-green-800 space-y-2">
            <li>Semantic HTML elements (section, article, figure, blockquote)</li>
            <li>ARIA labels where needed</li>
            <li>Proper heading hierarchy</li>
            <li>Keyboard navigable buttons and links</li>
            <li>Focus states for interactive elements</li>
            <li>Alt text support for images</li>
            <li>Color contrast compliance</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
