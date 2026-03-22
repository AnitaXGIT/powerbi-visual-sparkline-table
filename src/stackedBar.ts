"use strict";

import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import ITooltipService = powerbi.extensibility.ITooltipService;

import { StackedDataPoint } from "./dataParser";
import { VisualFormattingSettingsModel } from "./settings";

export function renderStackedBar(
    container: d3.Selection<HTMLDivElement, unknown, null, undefined>,
    data: StackedDataPoint[],
    width: number, height: number,
    settings: VisualFormattingSettingsModel["stackedBarSettings"],
    globalMax: number,
    tooltipService: ITooltipService
): void {

    if (!data || data.length === 0) return;

    const totalValue = d3.sum(data, d => Math.max(0, d.value));
    if (totalValue === 0) return;

    const fillMode = (settings.fillMode.value as any)?.value || "percentage";
    const isAbsolute = fillMode === "absolute";
    const maxDomain = isAbsolute ? Math.max(globalMax, 1) : Math.max(totalValue, 1);

    const xScale = d3.scaleLinear()
        .domain([0, maxDomain])
        .range([0, width - 4]); // Leaves 4px of padding on the right

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    let currentX = 0;

    // Create the global tooltip mapping for the entire Stacked Bar
    const tooltipDataItems = data.filter(d => d.value > 0).map(d => {
        const pct = totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) + "%" : "0%";
        return {
            displayName: d.seriesName,
            value: `${d.value.toFixed(1)} (${pct})`,
            color: d.color
        };
    });

    const showLabels = settings.showLabels.value;
    const labelFontSize = settings.labelFontSize.value || 10;
    const labelDecimals = settings.labelDecimals.value ?? 1;
    const labelColor = settings.labelFontColor.value.value || "#ffffff";

    data.forEach(d => {
        if (d.value <= 0) return;
        const barW = xScale(d.value);
        
        svg.append("rect")
            .attr("x", currentX)
            .attr("y", 2)
            .attr("width", Math.max(0, barW))
            .attr("height", height - 4)
            .attr("fill", d.color);

        if (showLabels && barW > 20) {
            svg.append("text")
                .attr("x", currentX + barW / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("font-size", `${labelFontSize}px`)
                .attr("fill", labelColor)
                .attr("pointer-events", "none")
                .text(d.value.toFixed(labelDecimals));
        }

        currentX += barW;
    });

    // We cover the entire width with an invisible rect so the user can hover ANYWHERE in the cell
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .style("cursor", "default")
        .on("mouseover", (event: MouseEvent) => {
            tooltipService.show({ dataItems: tooltipDataItems, identities: [], coordinates: [event.clientX, event.clientY], isTouchEvent: false });
        })
        .on("mousemove", (event: MouseEvent) => {
            tooltipService.move({ dataItems: tooltipDataItems, identities: [], coordinates: [event.clientX, event.clientY], isTouchEvent: false });
        })
        .on("mouseout", () => {
            tooltipService.hide({ immediately: false, isTouchEvent: false });
        });
}