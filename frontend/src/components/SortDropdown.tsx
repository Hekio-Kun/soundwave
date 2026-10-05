import React, { useState, useRef, useEffect } from "react";
import { ClockIcon, TrendingUpIcon, CheckIcon } from "../icons";

export type SortOptionValue = "newest" | "trending" | "title";

export interface SortOption {
  value: SortOptionValue;
  label: string;
  hint: string;
  icon: React.ReactNode;
  badgeBg: string;
  badgeColor: string;
}

const DEFAULT_OPTIONS: SortOption[] = [
  {
    value: "newest",
    label: "Newest",
    hint: "Recently published tracks",
    icon: <ClockIcon width={15} height={15} />,
    badgeBg: "#EFF6FF",
    badgeColor: "#2563EB",
  },
  {
    value: "trending",
    label: "Most played",
    hint: "Top plays & trending",
    icon: <TrendingUpIcon width={15} height={15} />,
    badgeBg: "#FFF1F2",
    badgeColor: "#E11D48",
  },
  {
    value: "title",
    label: "Title (A-Z)",
    hint: "Alphabetical from A to Z",
    icon: (
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 8 4-4 4 4" />
        <path d="M7 4v16" />
        <path d="M15 5h5l-5 5h5" />
        <path d="M15 19v-3a2 2 0 0 1 4 0v3" />
        <path d="M15 17h4" />
      </svg>
    ),
    badgeBg: "#F0FDF4",
    badgeColor: "#16A34A",
  },
];

interface SortDropdownProps {
  value: SortOptionValue;
  onChange: (value: SortOptionValue) => void;
  options?: SortOption[];
  showLabel?: boolean;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  showLabel = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: SortOptionValue) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        fontFamily: "inherit",
      }}
    >
      {showLabel && (
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--sw-text, #475569)",
            letterSpacing: "0.2px",
            userSelect: "none",
          }}
        >
          Sort by:
        </span>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id="sort-select-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: "38px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "0 12px 0 10px",
          borderRadius: "11px",
          border: isOpen ? "1.5px solid #0284c7" : "1px solid var(--sw-border, #E2E8F0)",
          background: isOpen ? "#FFFFFF" : "#F8FAFC",
          color: "var(--sw-text-h, #0F172A)",
          fontSize: "12.5px",
          fontWeight: 600,
          cursor: "pointer",
          outline: "none",
          boxShadow: isOpen
            ? "0 0 0 3px rgba(2, 132, 199, 0.12), 0 2px 6px rgba(0,0,0,0.04)"
            : "0 1px 2px rgba(0,0,0,0.03)",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "#FFFFFF";
            e.currentTarget.style.borderColor = "#CBD5E1";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "#F8FAFC";
            e.currentTarget.style.borderColor = "var(--sw-border, #E2E8F0)";
          }
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "22px",
            height: "22px",
            borderRadius: "7px",
            background: selectedOption.badgeBg,
            color: selectedOption.badgeColor,
            flexShrink: 0,
          }}
        >
          {selectedOption.icon}
        </span>
        <span style={{ fontWeight: 700 }}>{selectedOption.label}</span>
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            marginLeft: "2px",
            color: "#64748B",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Floating Menu Card */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Sort options"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: "220px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            boxShadow:
              "0 14px 34px -4px rgba(15, 23, 42, 0.14), 0 4px 12px -2px rgba(15, 23, 42, 0.06)",
            padding: "6px",
            zIndex: 100,
            animation: "swSortFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            style={{
              padding: "6px 10px 4px 10px",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              color: "#94A3B8",
            }}
          >
            Order By
          </div>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  padding: "9px 10px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: isSelected ? "rgba(2, 132, 199, 0.07)" : "transparent",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "#F8FAFC";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "26px",
                      height: "26px",
                      borderRadius: "8px",
                      background: opt.badgeBg,
                      color: opt.badgeColor,
                      flexShrink: 0,
                    }}
                  >
                    {opt.icon}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? "#0284c7" : "#1E293B",
                        lineHeight: 1.25,
                      }}
                    >
                      {opt.label}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#64748B",
                        lineHeight: 1.2,
                        marginTop: "2px",
                      }}
                    >
                      {opt.hint}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span
                    style={{
                      color: "#0284c7",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: "4px",
                    }}
                  >
                    <CheckIcon width={16} height={16} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
