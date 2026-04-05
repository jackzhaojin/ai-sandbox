"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/FormField";
import { PackageTypeSelector } from "./PackageTypeSelector";
import { DimensionsInput } from "./DimensionsInput";
import { WeightInput } from "./WeightInput";
import { DeclaredValueInput } from "./DeclaredValueInput";
import type { PackagePieceFormData, DimensionsUnit, WeightUnit } from "@/lib/validation/shipment-details-schema";
import { defaultPackagePiece } from "@/lib/validation/shipment-details-schema";
import { Plus, Trash2, Package, ChevronDown, ChevronUp } from "lucide-react";

export interface MultiPieceFormProps {
  /** Array of package pieces */
  packages: PackagePieceFormData[];
  /** Callback when packages change */
  onChange: (packages: PackagePieceFormData[]) => void;
  /** Currency for declared value */
  currency: "USD" | "CAD" | "MXN";
  /** Additional CSS classes */
  className?: string;
  /** Disable all inputs */
  disabled?: boolean;
  /** Maximum number of packages allowed */
  maxPackages?: number;
  /** Errors for each package */
  errors?: Record<string, {
    packageType?: string;
    length?: string;
    width?: string;
    height?: string;
    weight?: string;
    declaredValue?: string;
  }>;
}

/**
 * MultiPieceForm - Add/remove multiple packages
 *
 * Allows users to add up to 20 packages with individual
 * dimensions, weight, and declared value.
 */
export function MultiPieceForm({
  packages,
  onChange,
  currency,
  className,
  disabled = false,
  maxPackages = 20,
  errors,
}: MultiPieceFormProps) {
  // Track expanded state for each package
  const [expandedPackages, setExpandedPackages] = React.useState<Set<string>>(
    () => new Set(packages.map((p) => p.id))
  );

  // Add a new package
  const handleAddPackage = React.useCallback(() => {
    if (packages.length >= maxPackages) return;

    const newId = String(packages.length + 1);
    const newPackage = defaultPackagePiece(newId);
    onChange([...packages, newPackage]);
    setExpandedPackages((prev) => new Set([...prev, newId]));
  }, [packages, onChange, maxPackages]);

  // Remove a package
  const handleRemovePackage = React.useCallback(
    (id: string) => {
      if (packages.length <= 1) return;
      onChange(packages.filter((p) => p.id !== id));
      setExpandedPackages((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [packages, onChange]
  );

  // Update a package
  const handleUpdatePackage = React.useCallback(
    (id: string, updates: Partial<PackagePieceFormData>) => {
      onChange(
        packages.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    [packages, onChange]
  );

  // Toggle expanded state
  const toggleExpanded = React.useCallback((id: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Calculate totals
  const totals = React.useMemo(() => {
    return packages.reduce(
      (acc, pkg) => ({
        count: acc.count + 1,
        totalWeight: acc.totalWeight + (pkg.weight || 0),
        totalValue: acc.totalValue + (pkg.declaredValue || 0),
      }),
      { count: 0, totalWeight: 0, totalValue: 0 }
    );
  }, [packages]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <label className="text-sm font-medium">Packages</label>
          <p className="text-xs text-muted-foreground">
            Add up to {maxPackages} packages for this shipment
          </p>
        </div>
        <div className="text-right text-sm">
          <span className="font-medium">{totals.count}</span>
          <span className="text-muted-foreground"> packages</span>
        </div>
      </div>

      <div className="space-y-3">
        {packages.map((pkg, index) => {
          const isExpanded = expandedPackages.has(pkg.id);
          const pkgErrors = errors?.[pkg.id];

          return (
            <Card key={pkg.id} className="overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        Package {index + 1}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {pkg.weight || 0} {pkg.weightUnit} • {pkg.length || 0}×
                        {pkg.width || 0}×{pkg.height || 0} {pkg.dimensionsUnit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(pkg.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    {packages.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePackage(pkg.id)}
                        disabled={disabled}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="border-t p-4">
                  <div className="space-y-4">
                    <PackageTypeSelector
                      selectedType={pkg.packageType}
                      onSelect={(type) =>
                        handleUpdatePackage(pkg.id, { packageType: type })
                      }
                      disabled={disabled}
                    />

                    <DimensionsInput
                      length={pkg.length}
                      width={pkg.width}
                      height={pkg.height}
                      unit={pkg.dimensionsUnit as DimensionsUnit}
                      onChange={(dims) =>
                        handleUpdatePackage(pkg.id, {
                          length: dims.length,
                          width: dims.width,
                          height: dims.height,
                          dimensionsUnit: dims.unit,
                        })
                      }
                      disabled={disabled}
                      errors={{
                        length: pkgErrors?.length,
                        width: pkgErrors?.width,
                        height: pkgErrors?.height,
                      }}
                    />

                    <WeightInput
                      weight={pkg.weight}
                      unit={pkg.weightUnit as WeightUnit}
                      onChange={(weight) =>
                        handleUpdatePackage(pkg.id, {
                          weight: weight.weight,
                          weightUnit: weight.unit,
                        })
                      }
                      disabled={disabled}
                      error={pkgErrors?.weight}
                    />

                    <DeclaredValueInput
                      value={pkg.declaredValue}
                      currency={currency}
                      onChange={(value) =>
                        handleUpdatePackage(pkg.id, {
                          declaredValue: value.declaredValue,
                        })
                      }
                      disabled={disabled}
                      error={pkgErrors?.declaredValue}
                    />

                    <FormField label="Contents Description">
                      <Input
                        placeholder="Describe the contents of this package"
                        value={pkg.contentsDescription || ""}
                        onChange={(e) =>
                          handleUpdatePackage(pkg.id, {
                            contentsDescription: e.target.value,
                          })
                        }
                        disabled={disabled}
                      />
                    </FormField>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {packages.length < maxPackages && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddPackage}
          disabled={disabled || packages.length >= maxPackages}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Package ({packages.length}/{maxPackages})
        </Button>
      )}

      {packages.length >= maxPackages && (
        <p className="text-center text-xs text-muted-foreground">
          Maximum {maxPackages} packages allowed
        </p>
      )}
    </div>
  );
}

export default MultiPieceForm;
