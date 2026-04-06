"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationSection, type KeyValuePair } from "./ConfirmationSection";
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  FileWarning,
  Calendar,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type DocumentStatus = "ready" | "pending" | "not_required" | "required";
export type DocumentType = "shipping_label" | "commercial_invoice" | "hazmat_form" | "export_declaration" | "certificate_of_origin";

export interface DocumentItem {
  id: string;
  type: DocumentType;
  name: string;
  status: DocumentStatus;
  description?: string;
  downloadUrl?: string;
}

export interface PackageDocumentationSectionProps {
  /** Shipping label status */
  shippingLabelStatus: DocumentStatus;
  /** Shipping label download URL */
  shippingLabelUrl?: string;
  /** List of required documents */
  documents: DocumentItem[];
  /** Whether calendar event (.ics) is available for download */
  calendarEventAvailable?: boolean;
  /** Calendar event download URL */
  calendarEventUrl?: string;
  /** Pickup date for calendar event */
  pickupDate?: string;
  /** Pickup time window for calendar event */
  pickupTimeWindow?: { start: string; end: string };
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when a document is downloaded */
  onDownloadDocument?: (documentId: string, type: DocumentType) => void;
  /** Callback when calendar event is downloaded */
  onDownloadCalendar?: () => void;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getDocumentStatusBadge(status: DocumentStatus) {
  switch (status) {
    case "ready":
      return (
        <Badge variant="outline" className="bg-success-50 text-success-600 border-success-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="bg-warning-50 text-warning-600 border-warning-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "required":
      return (
        <Badge variant="outline" className="bg-destructive-50 text-destructive-600 border-destructive-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Required
        </Badge>
      );
    case "not_required":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
          Not Required
        </Badge>
      );
    default:
      return null;
  }
}

function getDocumentIcon(type: DocumentType) {
  switch (type) {
    case "shipping_label":
      return <FileText className="h-4 w-4" />;
    case "commercial_invoice":
      return <FileSpreadsheet className="h-4 w-4" />;
    case "hazmat_form":
      return <FileWarning className="h-4 w-4" />;
    case "export_declaration":
      return <FileCode className="h-4 w-4" />;
    case "certificate_of_origin":
      return <FileCheck className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getDocumentTypeLabel(type: DocumentType): string {
  switch (type) {
    case "shipping_label":
      return "Shipping Label";
    case "commercial_invoice":
      return "Commercial Invoice";
    case "hazmat_form":
      return "Hazmat Declaration";
    case "export_declaration":
      return "Export Declaration";
    case "certificate_of_origin":
      return "Certificate of Origin";
    default:
      return "Document";
  }
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface DocumentListItemProps {
  document: DocumentItem;
  onDownload?: (documentId: string, type: DocumentType) => void;
}

function DocumentListItem({ document, onDownload }: DocumentListItemProps) {
  const canDownload = document.status === "ready" && document.downloadUrl;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
        {getDocumentIcon(document.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{document.name}</span>
          {getDocumentStatusBadge(document.status)}
        </div>
        {document.description && (
          <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
        )}
      </div>
      {canDownload && (
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0 gap-1.5"
          onClick={() => onDownload?.(document.id, document.type)}
          asChild
        >
          <a href={document.downloadUrl} download>
            <Download className="h-4 w-4" />
            Download
          </a>
        </Button>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * PackageDocumentationSection - Displays package documentation status and download options
 *
 * Features:
 * - Shipping label status with download button
 * - Required documents checklist with status indicators
 * - Download options for PDF, CSV, and .ics calendar event
 * - Visual indicators for document readiness
 *
 * @example
 * <PackageDocumentationSection
 *   shippingLabelStatus="ready"
 *   shippingLabelUrl="/labels/label-123.pdf"
 *   documents={[...]}
 *   calendarEventAvailable={true}
 *   pickupDate="2024-04-08"
 * />
 */
export function PackageDocumentationSection({
  shippingLabelStatus,
  shippingLabelUrl,
  documents,
  calendarEventAvailable = false,
  calendarEventUrl,
  pickupDate,
  pickupTimeWindow,
  defaultExpanded = true,
  className,
  onDownloadDocument,
  onDownloadCalendar,
}: PackageDocumentationSectionProps) {
  // Build key-value pairs for shipping label status
  const data: KeyValuePair[] = [
    {
      key: "Shipping Label",
      value: (
        <div className="flex items-center gap-2">
          {getDocumentStatusBadge(shippingLabelStatus)}
          {shippingLabelStatus === "ready" && shippingLabelUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-7"
              asChild
            >
              <a href={shippingLabelUrl} download>
                <Download className="h-3.5 w-3.5" />
                PDF
              </a>
            </Button>
          )}
        </div>
      ),
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  // Calculate document summary stats
  const totalRequired = documents.filter(d => d.status !== "not_required").length;
  const readyCount = documents.filter(d => d.status === "ready").length;
  const pendingCount = documents.filter(d => d.status === "pending").length;
  const requiredMissingCount = documents.filter(d => d.status === "required").length;

  return (
    <ConfirmationSection
      id="package-documentation"
      title="Package Documentation"
      icon={<FileText className="h-5 w-5" />}
      status={requiredMissingCount > 0 ? "pending" : readyCount === totalRequired ? "confirmed" : "processing"}
      statusLabel={requiredMissingCount > 0 ? "Action Required" : readyCount === totalRequired ? "Complete" : "Processing"}
      defaultExpanded={defaultExpanded}
      data={data}
      className={className}
    >
      <div className="space-y-6 mt-4">
        {/* Documents Checklist */}
        {documents.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              Required Documents Checklist
              <span className="text-xs text-muted-foreground ml-auto">
                {readyCount}/{totalRequired} Ready
              </span>
            </h4>
            <div className="divide-y divide-border/50">
              {documents.map((doc) => (
                <DocumentListItem
                  key={doc.id}
                  document={doc}
                  onDownload={onDownloadDocument}
                />
              ))}
            </div>
          </div>
        )}

        {/* Document Status Summary */}
        {requiredMissingCount > 0 && (
          <div className="bg-destructive-50 border border-destructive-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive-900 text-sm">
                  Action Required: Missing Documents
                </h4>
                <p className="text-destructive-700 text-sm mt-1">
                  {requiredMissingCount} required document{requiredMissingCount > 1 ? "s" : ""} need{requiredMissingCount === 1 ? "s" : ""} to be uploaded before pickup.
                  Please complete the documentation to avoid delays.
                </p>
              </div>
            </div>
          </div>
        )}

        {pendingCount > 0 && requiredMissingCount === 0 && (
          <div className="bg-info-50 border border-info-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-info-900 text-sm">
                  Documents Processing
                </h4>
                <p className="text-info-700 text-sm mt-1">
                  {pendingCount} document{pendingCount > 1 ? "s" : ""} still processing. 
                  You will be notified when all documents are ready for download.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Download Options */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Download Options
          </h4>
          <div className="flex flex-wrap gap-2">
            {shippingLabelStatus === "ready" && shippingLabelUrl && (
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href={shippingLabelUrl} download>
                  <FileText className="h-4 w-4" />
                  Shipping Label (PDF)
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Shipment Details (CSV)
            </Button>
            {calendarEventAvailable && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onDownloadCalendar}
                asChild
              >
                <a href={calendarEventUrl} download>
                  <Calendar className="h-4 w-4" />
                  Add to Calendar (.ics)
                </a>
              </Button>
            )}
          </div>
          {calendarEventAvailable && pickupDate && (
            <p className="text-xs text-muted-foreground mt-2">
              Calendar event includes pickup scheduled for{" "}
              {new Date(pickupDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
              {pickupTimeWindow && ` between ${pickupTimeWindow.start} - ${pickupTimeWindow.end}`}
            </p>
          )}
        </div>
      </div>
    </ConfirmationSection>
  );
}

export default PackageDocumentationSection;
