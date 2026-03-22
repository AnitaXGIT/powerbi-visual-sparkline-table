"use strict";

import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import ITooltipService = powerbi.extensibility.ITooltipService;

import { VisualFormattingSettingsModel } from "./settings";

type BubbleSettings = VisualFormattingSettingsModel["bubbleSettings"];

// ─────────────────────────────────────────────
// Main render function
// ─────────────────────────────────────────────
export function renderBubble(
    container: d3.Selection<HTMLElement, unknown, null, undefined>,
    value: number,
    globalMax: number,
    width: number,
    height: number,
    settings: BubbleSettings,
    tooltipService: ITooltipService,
    measureName: string
): void {

    if (value === null || value === undefined || value === 0) return;

    const minRadius     = settings.minBubbleSize.value ?? 4;
    const maxRadius     = settings.maxBubbleSize.value ?? 20;
    const bubbleColor   = settings.bubbleColor.value.value || "#4472C4";
    const showLabels    = settings.showLabels.value;
    const labelFontSize = settings.labelFontSize.value || 10;
    const labelDecimals = settings.labelDecimals.value ?? 1;
    const labelColor    = settings.labelFontColor.value.value || "#333333";

    const radiusScale = d3.scaleLinear()
        .domain([0, globalMax])
        .range([minRadius, maxRadius]);

    const radius = radiusScale(value);

    const cx = width  / 2;
    const cy = height / 2;

    const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // ── Bubble circle ──
    svg.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", radius)
        .attr("fill", bubbleColor)
        .attr("opacity", 0.85)
        .on("mouseover", function (event: MouseEvent) {
            tooltipService.show({
                dataItems: [
                    {
                        displayName: measureName,
                        value: value.toFixed(labelDecimals)
                    }
                ],
                identities: [],
                coordinates: [event.clientX, event.clientY],
                isTouchEvent: false
            });
        })
        .on("mousemove", function (event: MouseEvent) {
            tooltipService.move({
                dataItems: [
                    {
                        displayName: measureName,
                        value: value.toFixed(labelDecimals)
                    }
                ],
                identities: [],
                coordinates: [event.clientX, event.clientY],
                isTouchEvent: false
            });
        })
        .on("mouseout", function () {
            tooltipService.hide({ immediately: false, isTouchEvent: false });
        });

    // ── Label to the right of the bubble ──
    if (showLabels) {
        const labelText = value.toFixed(labelDecimals);
        const labelX    = cx + radius + 4;

        if (labelX < width - 2) {
            svg.append("text")
                .attr("x", labelX)
                .attr("y", cy + labelFontSize / 3)
                .attr("text-anchor", "start")
                .attr("font-size", `${labelFontSize}px`)
                .attr("fill", labelColor)
                .attr("pointer-events", "none")
                .text(labelText);
        }
    }
}
