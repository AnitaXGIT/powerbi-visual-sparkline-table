# Changelog

All notable changes to the **Sparkline Trend Table** visual will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-22

### Added
- **Initial Release:** Core Sparkline Trend Table visual.
- **Single Matrix Architecture:** Implemented a single matrix DataView mapping with native subtotal support to guarantee accurate grand totals for metrics without calculating "averages of averages."
- **Multi-Element Rendering:** Integrated text metrics, percentage-based composition stacked bars, magnitude bubbles, and time-series bar sparklines into a single row layout.
- **Missing Data Alignment:** Added a master timeline parser that dynamically injects `0` values for missing months, ensuring perfect vertical alignment for sparkline bars across all rows.
- **Role Deduplication:** Built strict `Set` trackers in the data parser to allow a single measure to be safely dropped into multiple field buckets without causing duplicate columns to render.
- **Unified Tooltips:** Added a global bounding box over the stacked bars so that hovering anywhere in the cell displays the absolute values and percentages for all segments simultaneously.
- **Formatting Pane:** Added robust customization for fonts, colors, text wrapping, and conditional X-Axis rendering (including axis color and thickness controls).