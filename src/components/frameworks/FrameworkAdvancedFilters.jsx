import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, SlidersHorizontal, RotateCcw } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "returned", label: "Returned" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

function ChipToggle({ active, onClick, children, colorClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? colorClass || "bg-slate-800 text-white border-slate-800"
          : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
      }`}
    >
      {children}
    </button>
  );
}

export default function FrameworkAdvancedFilters({
  frameworks,
  filters,
  onChange,
  onClear,
}) {
  const setFilter = (key, value) => onChange({ ...filters, [key]: value });

  const toggleArrayValue = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilter(key, next);
  };

  const families = Array.from(
    new Set(frameworks.map((f) => f.framework_family).filter(Boolean))
  ).sort();
  const issuingBodies = Array.from(
    new Set(frameworks.map((f) => f.issuing_body).filter(Boolean))
  ).sort();
  const allTags = Array.from(
    new Set(frameworks.flatMap((f) => f.tags || []).filter(Boolean))
  ).sort();

  const hasActiveFilters =
    (filters.statuses && filters.statuses.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    !!filters.framework_family ||
    !!filters.issuing_body ||
    filters.is_master !== null;

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <SlidersHorizontal className="w-4 h-4" />
            Advanced Filters
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
              <RotateCcw className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <ChipToggle
                key={s.value}
                active={(filters.statuses || []).includes(s.value)}
                onClick={() => toggleArrayValue("statuses", s.value)}
              >
                {s.label}
              </ChipToggle>
            ))}
          </div>
        </div>

        {/* Framework Family */}
        {families.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Framework Family</p>
            <div className="flex flex-wrap gap-2">
              <ChipToggle
                active={!filters.framework_family}
                onClick={() => setFilter("framework_family", "")}
              >
                All
              </ChipToggle>
              {families.map((fam) => (
                <ChipToggle
                  key={fam}
                  active={filters.framework_family === fam}
                  onClick={() =>
                    setFilter(
                      "framework_family",
                      filters.framework_family === fam ? "" : fam
                    )
                  }
                >
                  {fam}
                </ChipToggle>
              ))}
            </div>
          </div>
        )}

        {/* Issuing Body */}
        {issuingBodies.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Issuing Body</p>
            <div className="flex flex-wrap gap-2">
              <ChipToggle
                active={!filters.issuing_body}
                onClick={() => setFilter("issuing_body", "")}
              >
                All
              </ChipToggle>
              {issuingBodies.map((body) => (
                <ChipToggle
                  key={body}
                  active={filters.issuing_body === body}
                  onClick={() =>
                    setFilter(
                      "issuing_body",
                      filters.issuing_body === body ? "" : body
                    )
                  }
                >
                  {body}
                </ChipToggle>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tags</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <ChipToggle
                  key={tag}
                  active={(filters.tags || []).includes(tag)}
                  onClick={() => toggleArrayValue("tags", tag)}
                  colorClass="bg-blue-600 text-white border-blue-600"
                >
                  {tag}
                </ChipToggle>
              ))}
            </div>
          </div>
        )}

        {/* Master library */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Library Type</p>
          <div className="flex flex-wrap gap-2">
            <ChipToggle
              active={filters.is_master === null}
              onClick={() => setFilter("is_master", null)}
            >
              All
            </ChipToggle>
            <ChipToggle
              active={filters.is_master === true}
              onClick={() => setFilter("is_master", true)}
            >
              Master Library
            </ChipToggle>
            <ChipToggle
              active={filters.is_master === false}
              onClick={() => setFilter("is_master", false)}
            >
              Company-specific
            </ChipToggle>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}