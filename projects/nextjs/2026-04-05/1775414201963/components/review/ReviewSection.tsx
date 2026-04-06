"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Package,
  DollarSign,
  CreditCard,
  Truck,
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  Scale,
  Ruler,
  Box,
  Shield,
  Clock,
  Calendar,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type ReviewSectionStatus = "complete" | "incomplete" | "warning";

export interface KeyValuePair {
  key: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: string;
}

export interface ReviewSectionProps {
  /** Unique section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section icon */
  icon?: React.ReactNode;
  /** Completion status */
  status: ReviewSectionStatus;
  /** Whether section is expanded by default */
  defaultExpanded?: boolean;
  /** Edit button href */
  editHref: string;
  /** Edit button click handler (alternative to href) */
  onEdit?: () => void;
  /** Key-value pairs to display */
  data: KeyValuePair[];
  /** Additional CSS classes */
  className?: string;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getStatusBadge(status: ReviewSectionStatus) {
  switch (status) {
    case "complete":
      return (
        <Badge
          variant="outline"
          className="bg-success-50 text-success-600 border-success-200"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      );
    case "incomplete":
      return (
        <Badge
          variant="outline"
          className="bg-warning-50 text-warning-600 border-warning-200"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Incomplete
        </Badge>
      );
    case "warning":
      return (
        <Badge
          variant="outline"
          className="bg-destructive/10 text-destructive border-destructive/20"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Action Needed
        </Badge>
      );
    default:
      return null;
  }
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface DataRowProps {
  item: KeyValuePair;
  isLast?: boolean;
}

function DataRow({ item, isLast }: DataRowProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3",
        !isLast && "border-b border-border/50"
      )}
    >
      {item.icon && (
        <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
          {item.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{item.key}</p>
        <div className="font-medium mt-0.5 break-words">{item.value}</div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * ReviewSection - Collapsible review section component
 *
 * Features:
 * - Chevron expand/collapse toggle
 * - Section title with status badge
 * - Edit button linking to relevant step
 * - Content area with key-value pairs
 */
export function ReviewSection({
  id,
  title,
  icon,
  status,
  defaultExpanded = false,
  editHref,
  onEdit,
  data,
  className,
  onExpandedChange,
}: ReviewSectionProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const handleExpandedChange = (newExpanded: boolean) => {
    setExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Collapsible
        open={expanded}
        onOpenChange={handleExpandedChange}
      >
        <CardHeader className="p-0">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                  </div>
                )}
                <div className="text-left">
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <div className="ml-2">{getStatusBadge(status)}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick();
                  }}
                  asChild={!!editHref}
                >
                  {editHref ? (
                    <a href={editHref}>
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </a>
                  ) : (
                    <>
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </>
                  )}
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-6 px-6">
            <div className="pt-4 border-t border-border/50">
              {data.map((item, index) => (
                <DataRow
                  key={index}
                  item={item}
                  isLast={index === data.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================
// PRE-BUILT SECTION COMPONENTS
// ============================================

import type { Address } from "@/types/database";

// ----- Origin Details Section -----

export interface OriginDetailsSectionProps {
  address: Address;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  editHref: string;
  onEdit?: () => void;
  defaultExpanded?: boolean;
  className?: string;
}

export function OriginDetailsSection({
  address,
  contactName,
  contactPhone,
  contactEmail,
  editHref,
  onEdit,
  defaultExpanded = false,
  className,
}: OriginDetailsSectionProps) {
  const fullAddress = [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    [address.postal_code, address.country].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join("\n");

  const data: KeyValuePair[] = [
    {
      key: "Company / Name",
      value: address.recipient_name || "Not provided",
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      key: "Address",
      value: fullAddress.split("\n").map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < fullAddress.split("\n").length - 1 && <br />}
        </React.Fragment>
      )),
      icon: <MapPin className="h-4 w-4" />,
    },
  ];

  if (contactName) {
    data.push({
      key: "Contact Name",
      value: contactName,
      icon: <User className="h-4 w-4" />,
    });
  }

  if (contactPhone) {
    data.push({
      key: "Phone",
      value: contactPhone,
      icon: <Phone className="h-4 w-4" />,
    });
  }

  if (contactEmail) {
    data.push({
      key: "Email",
      value: contactEmail,
      icon: <Mail className="h-4 w-4" />,
    });
  }

  const isComplete =
    address.line1 && address.city && address.state && address.postal_code;

  return (
    <ReviewSection
      id="origin-details"
      title="Origin Details"
      icon={<MapPin className="h-5 w-5" />}
      status={isComplete ? "complete" : "incomplete"}
      defaultExpanded={defaultExpanded}
      editHref={editHref}
      onEdit={onEdit}
      data={data}
      className={className}
    />
  );
}

// ----- Destination Details Section -----

export interface DestinationDetailsSectionProps {
  address: Address;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  editHref: string;
  onEdit?: () => void;
  defaultExpanded?: boolean;
  className?: string;
}

export function DestinationDetailsSection({
  address,
  contactName,
  contactPhone,
  contactEmail,
  editHref,
  onEdit,
  defaultExpanded = false,
  className,
}: DestinationDetailsSectionProps) {
  const fullAddress = [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    [address.postal_code, address.country].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join("\n");

  const data: KeyValuePair[] = [
    {
      key: "Company / Name",
      value: address.recipient_name || "Not provided",
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      key: "Address",
      value: fullAddress.split("\n").map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < fullAddress.split("\n").length - 1 && <br />}
        </React.Fragment>
      )),
      icon: <MapPin className="h-4 w-4" />,
    },
  ];

  if (contactName) {
    data.push({
      key: "Contact Name",
      value: contactName,
      icon: <User className="h-4 w-4" />,
    });
  }

  if (contactPhone) {
    data.push({
      key: "Phone",
      value: contactPhone,
      icon: <Phone className="h-4 w-4" />,
    });
  }

  if (contactEmail) {
    data.push({
      key: "Email",
      value: contactEmail,
      icon: <Mail className="h-4 w-4" />,
    });
  }

  const isComplete =
    address.line1 && address.city && address.state && address.postal_code;

  return (
    <ReviewSection
      id="destination-details"
      title="Destination Details"
      icon={<MapPin className="h-5 w-5" />}
      status={isComplete ? "complete" : "incomplete"}
      defaultExpanded={defaultExpanded}
      editHref={editHref}
      onEdit={onEdit}
      data={data}
      className={className}
    />
  );
}

// ----- Package Details Section -----

export interface PackageDetailsSectionProps {
  packageType: string;
  weight: number;
  weightUnit?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  declaredValue?: number;
  currency?: string;
  contentsDescription?: string;
  specialHandling?: string[];
  editHref: string;
  onEdit?: () => void;
  defaultExpanded?: boolean;
  className?: string;
}

export function PackageDetailsSection({
  packageType,
  weight,
  weightUnit = "lb",
  dimensions,
  declaredValue,
  currency = "USD",
  contentsDescription,
  specialHandling,
  editHref,
  onEdit,
  defaultExpanded = false,
  className,
}: PackageDetailsSectionProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const data: KeyValuePair[] = [
    {
      key: "Package Type",
      value: packageType,
      icon: <Box className="h-4 w-4" />,
    },
    {
      key: "Weight",
      value: `${weight} ${weightUnit}`,
      icon: <Scale className="h-4 w-4" />,
    },
  ];

  if (dimensions) {
    data.push({
      key: "Dimensions",
      value: `${dimensions.length} × ${dimensions.width} × ${dimensions.height} ${dimensions.unit}`,
      icon: <Ruler className="h-4 w-4" />,
    });
  }

  if (declaredValue && declaredValue > 0) {
    data.push({
      key: "Declared Value",
      value: formatCurrency(declaredValue),
      icon: <Shield className="h-4 w-4" />,
    });
  }

  if (contentsDescription) {
    data.push({
      key: "Contents",
      value: contentsDescription,
      icon: <FileText className="h-4 w-4" />,
    });
  }

  if (specialHandling && specialHandling.length > 0) {
    data.push({
      key: "Special Handling",
      value: specialHandling.join(", "),
      icon: <Box className="h-4 w-4" />,
    });
  }

  const isComplete = packageType && weight > 0;

  return (
    <ReviewSection
      id="package-details"
      title="Package Details"
      icon={<Package className="h-5 w-5" />}
      status={isComplete ? "complete" : "incomplete"}
      defaultExpanded={defaultExpanded}
      editHref={editHref}
      onEdit={onEdit}
      data={data}
      className={className}
    />
  );
}

// ----- Pricing Breakdown Section -----

export interface PricingBreakdownSectionProps {
  baseRate: number;
  fuelSurcharge: number;
  fuelSurchargePercent?: number;
  insurance?: number;
  specialHandling?: number;
  deliveryPreferences?: number;
  taxes: number;
  taxPercent?: number;
  total: number;
  currency?: string;
  editHref: string;
  onEdit?: () => void;
  defaultExpanded?: boolean;
  className?: string;
}

export function PricingBreakdownSection({
  baseRate,
  fuelSurcharge,
  fuelSurchargePercent,
  insurance,
  specialHandling,
  deliveryPreferences,
  taxes,
  taxPercent,
  total,
  currency = "USD",
  editHref,
  onEdit,
  defaultExpanded = false,
  className,
}: PricingBreakdownSectionProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const formatPercent = (percent?: number) =>
    percent ? `(${percent.toFixed(1)}%)` : "";

  const data: KeyValuePair[] = [
    {
      key: "Base Rate",
      value: formatCurrency(baseRate),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      key: `Fuel Surcharge ${formatPercent(fuelSurchargePercent)}`,
      value: formatCurrency(fuelSurcharge),
      icon: <DollarSign className="h-4 w-4" />,
    },
  ];

  if (insurance && insurance > 0) {
    data.push({
      key: "Insurance",
      value: formatCurrency(insurance),
      icon: <Shield className="h-4 w-4" />,
    });
  }

  if (specialHandling && specialHandling > 0) {
    data.push({
      key: "Special Handling",
      value: formatCurrency(specialHandling),
      icon: <Box className="h-4 w-4" />,
    });
  }

  if (deliveryPreferences && deliveryPreferences > 0) {
    data.push({
      key: "Delivery Preferences",
      value: formatCurrency(deliveryPreferences),
      icon: <Clock className="h-4 w-4" />,
    });
  }

  data.push({
    key: `Taxes ${formatPercent(taxPercent)}`,
    value: formatCurrency(taxes),
    icon: <DollarSign className="h-4 w-4" />,
  });

  data.push({
    key: "Total",
    value: (
      <span className="text-lg font-bold text-primary">
        {formatCurrency(total)}
      </span>
    ),
    icon: <DollarSign className="h-4 w-4" />,
  });

  const isComplete = baseRate > 0 && total > 0;

  return (
    <ReviewSection
      id="pricing-breakdown"
      title="Pricing Breakdown"
      icon={<DollarSign className="h-5 w-5" />}
      status={isComplete ? "complete" : "incomplete"}
      defaultExpanded={defaultExpanded}
      editHref={editHref}
      onEdit={onEdit}
      data={data}
      className={className}
    />
  );
}

// ----- Payment Information Section -----

export type PaymentMethodType =
  | "purchase_order"
  | "bill_of_lading"
  | "third_party"
  | "net_terms"
  | "corporate_account";

export interface PaymentInformationSectionProps {
  paymentMethod: PaymentMethodType;
  paymentMethodLabel: string;
  // Purchase Order fields
  poNumber?: string;
  poExpiryDate?: string;
  authorizedAmount?: number;
  // Bill of Lading fields
  bolNumber?: string;
  carrierAccount?: string;
  // Third Party fields
  thirdPartyCompany?: string;
  thirdPartyAccount?: string;
  // Net Terms fields
  termsDays?: number;
  creditLimit?: number;
  // Corporate Account fields
  corporateAccountNumber?: string;
  departmentCode?: string;
  costCenter?: string;
  currency?: string;
  editHref: string;
  onEdit?: () => void;
  defaultExpanded?: boolean;
  className?: string;
}

export function PaymentInformationSection({
  paymentMethod,
  paymentMethodLabel,
  poNumber,
  poExpiryDate,
  authorizedAmount,
  bolNumber,
  carrierAccount,
  thirdPartyCompany,
  thirdPartyAccount,
  termsDays,
  creditLimit,
  corporateAccountNumber,
  departmentCode,
  costCenter,
  currency = "USD",
  editHref,
  onEdit,
  defaultExpanded = false,
  className,
}: PaymentInformationSectionProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const data: KeyValuePair[] = [
    {
      key: "Payment Method",
      value: paymentMethodLabel,
      icon: <CreditCard className="h-4 w-4" />,
    },
  ];

  // Add payment method specific fields
  if (paymentMethod === "purchase_order" && poNumber) {
    data.push({
      key: "PO Number",
      value: poNumber,
      icon: <FileText className="h-4 w-4" />,
    });
    if (poExpiryDate) {
      data.push({
        key: "PO Expiry",
        value: new Date(poExpiryDate).toLocaleDateString("en-US"),
        icon: <Calendar className="h-4 w-4" />,
      });
    }
    if (authorizedAmount) {
      data.push({
        key: "Authorized Amount",
        value: formatCurrency(authorizedAmount),
        icon: <DollarSign className="h-4 w-4" />,
      });
    }
  }

  if (paymentMethod === "bill_of_lading" && bolNumber) {
    data.push({
      key: "BOL Number",
      value: bolNumber,
      icon: <FileText className="h-4 w-4" />,
    });
    if (carrierAccount) {
      data.push({
        key: "Carrier Account",
        value: carrierAccount,
        icon: <Truck className="h-4 w-4" />,
      });
    }
  }

  if (paymentMethod === "third_party") {
    if (thirdPartyCompany) {
      data.push({
        key: "Billing Company",
        value: thirdPartyCompany,
        icon: <Building2 className="h-4 w-4" />,
      });
    }
    if (thirdPartyAccount) {
      data.push({
        key: "Account Number",
        value: thirdPartyAccount,
        icon: <FileText className="h-4 w-4" />,
      });
    }
  }

  if (paymentMethod === "net_terms" && termsDays) {
    data.push({
      key: "Terms",
      value: `Net ${termsDays}`,
      icon: <Clock className="h-4 w-4" />,
    });
    if (creditLimit) {
      data.push({
        key: "Credit Limit",
        value: formatCurrency(creditLimit),
        icon: <DollarSign className="h-4 w-4" />,
      });
    }
  }

  if (paymentMethod === "corporate_account" && corporateAccountNumber) {
    data.push({
      key: "Account Number",
      value: corporateAccountNumber,
      icon: <Building2 className="h-4 w-4" />,
    });
    if (departmentCode) {
      data.push({
        key: "Department Code",
        value: departmentCode,
        icon: <FileText className="h-4 w-4" />,
      });
    }
    if (costCenter) {
      data.push({
        key: "Cost Center",
        value: costCenter,
        icon: <FileText className="h-4 w-4" />,
      });
    }
  }

  const isComplete = paymentMethod &&
    ((paymentMethod === "purchase_order" && poNumber) ||
      (paymentMethod === "bill_of_lading" && bolNumber) ||
      (paymentMethod === "third_party" && thirdPartyAccount) ||
      (paymentMethod === "net_terms" && termsDays) ||
      (paymentMethod === "corporate_account" && corporateAccountNumber));

  return (
    <ReviewSection
      id="payment-information"
      title="Payment Information"
      icon={<CreditCard className="h-5 w-5" />}
      status={isComplete ? "complete" : "incomplete"}
      defaultExpanded={defaultExpanded}
      editHref={editHref}
      onEdit={onEdit}
      data={data}
      className={className}
    />
  );
}

// ----- Pickup Schedule Section -----

export interface PickupScheduleSectionProps {
  pickupDate: string;
  timeWindow: {
    label: string;
    start: string;
    end: string;
  };
  locationType?: string;
  dockNumber?: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail?: string;
  specialInstructions?: string;
  editHref: string;
  onEdit?: () => void;
  defaultExpanded?: boolean;
  className?: string;
}

export function PickupScheduleSection({
  pickupDate,
  timeWindow,
  locationType,
  dockNumber,
  primaryContactName,
  primaryContactPhone,
  primaryContactEmail,
  specialInstructions,
  editHref,
  onEdit,
  defaultExpanded = false,
  className,
}: PickupScheduleSectionProps) {
  const data: KeyValuePair[] = [
    {
      key: "Pickup Date",
      value: new Date(pickupDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      key: "Time Window",
      value: `${timeWindow.label} (${timeWindow.start} - ${timeWindow.end})`,
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  if (locationType) {
    data.push({
      key: "Location Type",
      value: locationType,
      icon: <Building2 className="h-4 w-4" />,
    });
  }

  if (dockNumber) {
    data.push({
      key: "Dock Number",
      value: dockNumber,
      icon: <MapPin className="h-4 w-4" />,
    });
  }

  data.push({
    key: "Primary Contact",
    value: primaryContactName,
    icon: <User className="h-4 w-4" />,
  });

  data.push({
    key: "Contact Phone",
    value: primaryContactPhone,
    icon: <Phone className="h-4 w-4" />,
  });

  if (primaryContactEmail) {
    data.push({
      key: "Contact Email",
      value: primaryContactEmail,
      icon: <Mail className="h-4 w-4" />,
    });
  }

  if (specialInstructions) {
    data.push({
      key: "Special Instructions",
      value: specialInstructions,
      icon: <FileText className="h-4 w-4" />,
    });
  }

  const isComplete = pickupDate && timeWindow && primaryContactName && primaryContactPhone;

  return (
    <ReviewSection
      id="pickup-schedule"
      title="Pickup Schedule"
      icon={<Truck className="h-5 w-5" />}
      status={isComplete ? "complete" : "incomplete"}
      defaultExpanded={defaultExpanded}
      editHref={editHref}
      onEdit={onEdit}
      data={data}
      className={className}
    />
  );
}

export default ReviewSection;
