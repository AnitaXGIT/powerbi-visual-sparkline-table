"use strict";

import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import ITooltipService = powerbi.extensibility.ITooltipService;

import { BarDataPoint } from "./dataParser";
import { VisualFormattingSettingsModel } from "./settings";

type BarSettings = VisualFormattingSettingsModel["barSparklineSettings"];

export function renderBarSparkline(
    container: d3.Selection<HTMLElement, unknown, null, undefined>,
    data: BarDataPoint[],
    width: number, height: number, settings: BarSettings,
    globalBarMax: number | null, tooltipService: ITooltipService, dateFormat: string
): void {

    if (!data || data.length === 0) return;

    const showXAxis = settings.showXAxis?.value ?? true;
    const axisColor = settings.axisColor?.value?.value ?? "#888888";
    const axisWidth = settings.axisWidth?.value ?? 1;
    const axisHeightPad = showXAxis ? 14 : 4;

    const margin = { top: 4, right: 2, bottom: axisHeightPad, left: 2 };
    const innerWidth  = Math.max(width  - margin.left - margin.right, 10);
    const innerHeight = Math.max(height - margin.top  - margin.bottom, 10);

    const yMax = globalBarMax !== null ? globalBarMax : Math.max(...data.map(d => d.value), 0);
    const yScale = d3.scaleLinear().domain([0, yMax === 0 ? 1 : yMax]).range([innerHeight, 0]);

    const xDomain = data.map((d, i) => `${i}_${d.axisLabel}`);
    const xScale = d3.scaleBand().domain(xDomain).range([0, innerWidth]).padding(0.15);

    const svg = container.append("svg").attr("width", width).attr("height", height)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const barColor      = settings.barColor.value.value || "#4472C4";
    const showLabels    = settings.showLabels.value;
    const labelFontSize = settings.labelFontSize.value || 10;
    const labelDecimals = settings.labelDecimals.value ?? 1;
    const labelColor    = settings.labelFontColor.value.value || "#333333";

    const seriesItems = data.filter(d => d.value !== 0).map(d => ({
        displayName: formatDateLabel(d.axisLabel, dateFormat),
        value: d.value.toFixed(labelDecimals)
    }));

    data.forEach((d, i) => {
        const x = xScale(`${i}_${d.axisLabel}`) ?? 0;
        const barWidth = xScale.bandwidth();

        if (d.value !== 0) {
            const barHeight = innerHeight - yScale(d.value);
            const y = yScale(d.value);
            svg.append("rect").attr("x", x).attr("y", y).attr("width", barWidth).attr("height", Math.max(barHeight, 1)).attr("fill", barColor);
            if (showLabels) {
                svg.append("text").attr("x", x + barWidth / 2).attr("y", Math.max(y - 2, labelFontSize)).attr("text-anchor", "middle")
                   .attr("font-size", `${labelFontSize}px`).attr("fill", labelColor).attr("pointer-events", "none").text(d.value.toFixed(labelDecimals));
            }
        }

        svg.append("rect").attr("x", x).attr("y", 0).attr("width", barWidth).attr("height", innerHeight).attr("fill", "transparent").attr("cursor", "default")
            .on("mouseover", function (event: MouseEvent) { tooltipService.show({ dataItems: seriesItems, identities: [], coordinates: [event.clientX, event.clientY], isTouchEvent: false }); })
            .on("mousemove", function (event: MouseEvent) { tooltipService.move({ dataItems: seriesItems, identities: [], coordinates: [event.clientX, event.clientY], isTouchEvent: false }); })
            .on("mouseout", function () { tooltipService.hide({ immediately: false, isTouchEvent: false }); });
    });

    if (showXAxis) {
        const xAxis = d3.axisBottom(xScale).tickFormat(domainVal => {
            const rawLabel = domainVal.split("_").slice(1).join("_");
            return formatDateLabel(rawLabel, dateFormat);
        }).tickSize(3);

        if (xDomain.length > 4) {
            const first = xDomain[0];
            const mid = xDomain[Math.floor(xDomain.length / 2)];
            const last = xDomain[xDomain.length - 1];
            xAxis.tickValues(Array.from(new Set([first, mid, last]))); 
        }

        const xAxisG = svg.append("g").attr("transform", `translate(0,${innerHeight})`).call(xAxis);
        xAxisG.selectAll("text").style("font-size", "9px").style("fill", axisColor).attr("dy", "0.5em");
        
        // Dynamically style or hide the axis stroke based on formatting pane inputs
        if (axisWidth > 0) {
            xAxisG.select(".domain").style("stroke", axisColor).style("stroke-width", `${axisWidth}px`);
            xAxisG.selectAll(".tick line").style("stroke", axisColor).style("stroke-width", `${axisWidth}px`);
        } else {
            xAxisG.select(".domain").remove();
            xAxisG.selectAll(".tick line").remove();
        }
    }
}

function formatDateLabel(raw: string, format: string): string {
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    const mm   = String(date.getMonth() + 1).padStart(2, "0");
    const dd   = String(date.getDate()).padStart(2, "0");
    const yy   = String(date.getFullYear()).slice(-2);
    const yyyy = String(date.getFullYear());
    const mmm  = date.toLocaleString("default", { month: "short" });
    return format.replace("MMM", mmm).replace("MM", mm).replace("DD", dd).replace("YYYY", yyyy).replace("YY", yy);
}