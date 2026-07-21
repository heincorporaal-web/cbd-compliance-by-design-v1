import React from "react";

/**
 * Renders raw inline SVG markup.
 * - `white`: forces the icon to render solid white regardless of its authored
 *   colors, by applying a CSS filter (brightness(0) invert(1)). Works for both
 *   `currentColor` SVGs and SVGs with hardcoded fills/strokes.
 * - `className`: sizing / layout classes (e.g. "w-4 h-4").
 */
export default function SvgIcon({ svg, white = false, className = "" }) {
  if (!svg) return null;
  return (
    <span
      className={`inline-flex items-center justify-center leading-none ${className}`}
      style={white ? { filter: "brightness(0) invert(1)" } : undefined}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}