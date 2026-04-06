"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationSection, type KeyValuePair } from "./ConfirmationSection";
import {
  Phone,
  Mail,
  MessageSquare,
  User,
  Building2,
  AlertTriangle,
  Clock,
  Headphones,
  FileQuestion,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface ContactMethod {
  type: "phone" | "email" | "chat";
  value: string;
  label?: string;
  available?: string;
  href?: string;
}

export interface CustomerServiceContact {
  /** 24/7 support phone number */
  phone: string;
  /** Support email address */
  email: string;
  /** Chat availability */
  chatAvailable: boolean;
  /** Chat URL */
  chatUrl?: string;
  /** Average response time */
  averageResponseTime?: string;
}

export interface AccountManagerInfo {
  /** Account manager name */
  name: string;
  /** Account manager title/role */
  title?: string;
  /** Direct phone number */
  phone?: string;
  /** Email address */
  email: string;
  /** Avatar URL (optional) */
  avatarUrl?: string;
  /** Business hours */
  businessHours?: string;
  /** Timezone */
  timezone?: string;
}

export interface ClaimsDepartmentInfo {
  /** Claims phone number */
  phone: string;
  /** Claims email */
  email: string;
  /** Claims portal URL */
  portalUrl?: string;
  /** Business hours */
  businessHours?: string;
}

export interface EmergencyContactInfo {
  /** Emergency phone (24/7) */
  phone: string;
  /** Emergency email */
  email?: string;
  /** What constitutes an emergency */
  emergencyDescription?: string;
}

export interface ContactInformationSectionProps {
  /** 24/7 Customer Service information */
  customerService: CustomerServiceContact;
  /** Account Manager information */
  accountManager?: AccountManagerInfo;
  /** Claims Department information */
  claimsDepartment?: ClaimsDepartmentInfo;
  /** Emergency contact information */
  emergencyContact?: EmergencyContactInfo;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when chat is clicked */
  onStartChat?: () => void;
  /** Callback when account manager is contacted */
  onContactAccountManager?: () => void;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatPhoneForHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function formatEmailForHref(email: string): string {
  return `mailto:${email}`;
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ContactCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

function ContactCard({ title, icon, children, badge, className }: ContactCardProps) {
  return (
    <div className={cn("bg-muted/50 rounded-lg p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <h4 className="font-medium">{title}</h4>
        {badge && <div className="ml-auto">{badge}</div>}
      </div>
      {children}
    </div>
  );
}

interface ContactRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  action?: React.ReactNode;
}

function ContactRow({ icon, label, value, href, action }: ContactRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-shrink-0 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            className="font-medium text-sm hover:text-primary hover:underline transition-colors"
          >
            {value}
          </a>
        ) : (
          <p className="font-medium text-sm">{value}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * ContactInformationSection - Displays contact information for support and services
 *
 * Features:
 * - 24/7 Customer Service with phone/email/chat
 * - Account Manager information
 * - Claims Department contact
 * - Emergency contact
 * - Quick action buttons for common contact methods
 *
 * @example
 * <ContactInformationSection
 *   customerService={{
 *     phone: "1-800-B2B-SHIP",
 *     email: "support@b2bshipping.com",
 *     chatAvailable: true,
 *   }}
 *   accountManager={{ name: "John Doe", email: "john@company.com" }}
 * />
 */
export function ContactInformationSection({
  customerService,
  accountManager,
  claimsDepartment,
  emergencyContact,
  defaultExpanded = true,
  className,
  onStartChat,
  onContactAccountManager,
}: ContactInformationSectionProps) {
  // Build key-value pairs for main contact info
  const data: KeyValuePair[] = [
    {
      key: "24/7 Customer Service",
      value: (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-success-50 text-success-600 border-success-200">
            <Clock className="h-3 w-3 mr-1" />
            Available Now
          </Badge>
        </div>
      ),
      icon: <Headphones className="h-4 w-4" />,
    },
    {
      key: "Support Phone",
      value: (
        <a
          href={formatPhoneForHref(customerService.phone)}
          className="font-medium hover:text-primary hover:underline transition-colors"
        >
          {customerService.phone}
        </a>
      ),
      icon: <Phone className="h-4 w-4" />,
    },
    {
      key: "Support Email",
      value: (
        <a
          href={formatEmailForHref(customerService.email)}
          className="font-medium hover:text-primary hover:underline transition-colors"
        >
          {customerService.email}
        </a>
      ),
      icon: <Mail className="h-4 w-4" />,
    },
  ];

  if (customerService.chatAvailable) {
    data.push({
      key: "Live Chat",
      value: (
        <div className="flex items-center gap-2">
          <span className="text-success-600 font-medium">Available</span>
          {customerService.averageResponseTime && (
            <span className="text-xs text-muted-foreground">
              (Avg. response: {customerService.averageResponseTime})
            </span>
          )}
        </div>
      ),
      icon: <MessageSquare className="h-4 w-4" />,
    });
  }

  return (
    <ConfirmationSection
      id="contact-information"
      title="Contact Information"
      icon={<Headphones className="h-5 w-5" />}
      status="confirmed"
      defaultExpanded={defaultExpanded}
      data={data}
      className={className}
    >
      <div className="space-y-4 mt-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={formatPhoneForHref(customerService.phone)}>
              <Phone className="h-4 w-4" />
              Call Support
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={formatEmailForHref(customerService.email)}>
              <Mail className="h-4 w-4" />
              Email Support
            </a>
          </Button>
          {customerService.chatAvailable && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onStartChat}
            >
              <MessageSquare className="h-4 w-4" />
              Start Chat
            </Button>
          )}
        </div>

        {/* Account Manager */}
        {accountManager && (
          <ContactCard
            title="Your Account Manager"
            icon={<User className="h-4 w-4" />}
            badge={
              <Badge variant="outline" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                Dedicated
              </Badge>
            }
          >
            <div className="flex items-start gap-3 mb-3">
              {accountManager.avatarUrl ? (
                <img
                  src={accountManager.avatarUrl}
                  alt={accountManager.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                  {accountManager.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold">{accountManager.name}</p>
                {accountManager.title && (
                  <p className="text-sm text-muted-foreground">{accountManager.title}</p>
                )}
                {(accountManager.businessHours || accountManager.timezone) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {accountManager.businessHours}
                    {accountManager.timezone && ` (${accountManager.timezone})`}
                  </p>
                )}
              </div>
            </div>
            <div className="border-t border-border/50 pt-2 space-y-1">
              {accountManager.phone && (
                <ContactRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Direct Phone"
                  value={accountManager.phone}
                  href={formatPhoneForHref(accountManager.phone)}
                />
              )}
              <ContactRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={accountManager.email}
                href={formatEmailForHref(accountManager.email)}
              />
            </div>
            {onContactAccountManager && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 gap-2"
                onClick={onContactAccountManager}
              >
                <Mail className="h-4 w-4" />
                Contact Account Manager
              </Button>
            )}
          </ContactCard>
        )}

        {/* Claims Department */}
        {claimsDepartment && (
          <ContactCard
            title="Claims Department"
            icon={<FileQuestion className="h-4 w-4" />}
          >
            <p className="text-sm text-muted-foreground mb-3">
              For damaged, lost, or delayed shipments. Please have your confirmation number ready.
            </p>
            <div className="space-y-1">
              <ContactRow
                icon={<Phone className="h-4 w-4" />}
                label="Claims Phone"
                value={claimsDepartment.phone}
                href={formatPhoneForHref(claimsDepartment.phone)}
              />
              <ContactRow
                icon={<Mail className="h-4 w-4" />}
                label="Claims Email"
                value={claimsDepartment.email}
                href={formatEmailForHref(claimsDepartment.email)}
              />
            </div>
            {claimsDepartment.portalUrl && (
              <Button variant="outline" size="sm" className="w-full mt-3 gap-2" asChild>
                <a
                  href={claimsDepartment.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  File Claim Online
                </a>
              </Button>
            )}
          </ContactCard>
        )}

        {/* Emergency Contact */}
        {emergencyContact && (
          <ContactCard
            title="Emergency Contact"
            icon={<ShieldAlert className="h-4 w-4" />}
            badge={
              <Badge variant="outline" className="bg-success-50 text-success-600 border-success-200 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                24/7
              </Badge>
            }
            className="border-l-4 border-l-warning-500"
          >
            {emergencyContact.emergencyDescription && (
              <p className="text-sm text-muted-foreground mb-3">
                {emergencyContact.emergencyDescription}
              </p>
            )}
            <div className="flex items-center gap-3 p-3 bg-warning-50 rounded-lg border border-warning-200">
              <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-warning-900">Emergency Hotline</p>
                <a
                  href={formatPhoneForHref(emergencyContact.phone)}
                  className="text-lg font-bold text-warning-700 hover:underline"
                >
                  {emergencyContact.phone}
                </a>
              </div>
            </div>
            {emergencyContact.email && (
              <div className="mt-2 text-center">
                <a
                  href={formatEmailForHref(emergencyContact.email)}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  {emergencyContact.email}
                </a>
              </div>
            )}
          </ContactCard>
        )}
      </div>
    </ConfirmationSection>
  );
}

export default ContactInformationSection;
