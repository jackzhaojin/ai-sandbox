'use client'

import { Phone, Mail, MessageCircle, User, AlertTriangle, Shield } from 'lucide-react'
import { ConfirmationSection, KeyValuePair, SectionGrid, SectionDivider } from './ConfirmationSection'
import type { ContactInformationData } from './types'

interface ContactInformationSectionProps {
  data: ContactInformationData
}

export function ContactInformationSection({ data }: ContactInformationSectionProps) {
  return (
    <ConfirmationSection
      title="Contact Information"
      icon={<Phone className="w-4 h-4 text-blue-600" />}
      defaultExpanded={false}
    >
      {/* 24/7 Support */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-500" />
          24/7 Customer Support
        </h4>
        <SectionGrid columns={2}>
          <KeyValuePair
            label="Phone"
            value={
              <a
                href={`tel:${data.support.phone}`}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Phone className="w-4 h-4" />
                {data.support.phone}
              </a>
            }
          />
          <KeyValuePair
            label="Email"
            value={
              <a
                href={`mailto:${data.support.email}`}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Mail className="w-4 h-4" />
                {data.support.email}
              </a>
            }
          />
          <KeyValuePair
            label="Live Chat"
            value={
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gray-400" />
                <span>
                  {data.support.chatAvailable ? (
                    <span className="text-green-600 font-medium">Available Now</span>
                  ) : (
                    <span className="text-gray-500">Unavailable</span>
                  )}
                </span>
              </div>
            }
          />
          <KeyValuePair
            label="Hours"
            value={<span className="text-gray-600">{data.support.hours}</span>}
          />
        </SectionGrid>
      </div>

      {/* Account Manager */}
      {data.accountManager && (
        <>
          <SectionDivider />
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              Your Account Manager
            </h4>
            <SectionGrid columns={2}>
              <KeyValuePair
                label="Name"
                value={
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{data.accountManager.name}</span>
                  </div>
                }
              />
              <KeyValuePair
                label="Email"
                value={
                  <a
                    href={`mailto:${data.accountManager.email}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Mail className="w-4 h-4" />
                    {data.accountManager.email}
                  </a>
                }
              />
              {data.accountManager.phone && (
                <KeyValuePair
                  label="Phone"
                  value={
                    <a
                      href={`tel:${data.accountManager.phone}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Phone className="w-4 h-4" />
                      {data.accountManager.phone}
                    </a>
                  }
                />
              )}
            </SectionGrid>
          </div>
        </>
      )}

      {/* Claims Department */}
      <SectionDivider />
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Claims Department
        </h4>
        <SectionGrid columns={2}>
          <KeyValuePair
            label="Claims Phone"
            value={
              <a
                href={`tel:${data.claims.phone}`}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Phone className="w-4 h-4" />
                {data.claims.phone}
              </a>
            }
          />
          <KeyValuePair
            label="Claims Email"
            value={
              <a
                href={`mailto:${data.claims.email}`}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Mail className="w-4 h-4" />
                {data.claims.email}
              </a>
            }
          />
        </SectionGrid>
      </div>

      {/* Emergency Contact */}
      {data.emergency && (
        <>
          <SectionDivider />
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-semibold text-red-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Emergency Contact
            </h4>
            <p className="text-sm text-red-700 mb-2">{data.emergency.description}</p>
            <a
              href={`tel:${data.emergency.phone}`}
              className="inline-flex items-center gap-2 text-red-700 font-semibold hover:text-red-800"
            >
              <Phone className="w-4 h-4" />
              {data.emergency.phone}
            </a>
          </div>
        </>
      )}
    </ConfirmationSection>
  )
}
