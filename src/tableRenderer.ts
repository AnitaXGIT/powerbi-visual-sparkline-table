"use strict";

import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ITooltipService = powerbi.extensibility.ITooltipService;

import { ParsedData, SparklineTableRow } from "./dataParser";
import { VisualFormattingSettingsModel } from "./settings";
import { renderStackedBar } from "./stackedBar";
import { renderBubble } from "./bubble";
import { renderBarSparkline } from "./barSparkline";

type D3DivSelection = d3.Selection<HTMLDivElement, unknown, null, undefined>;

interface ColumnDef {
    key: string; label: string; width: number; sortable: boolean;
    type: "category" | "metric" | "stacked" | "bubble" | "sparkline";
    metricIndex?: number;
}

export function renderTable(
    container: d3.Selection<HTMLDivElement, unknown, null, undefined>,
    data: ParsedData, settings: VisualFormattingSettingsModel,
    selectionManager: ISelectionManager, tooltipService: ITooltipService,
    viewport: powerbi.IViewport
): void {
    const { rows, columnMeta } = data;
    const general = settings.generalSettings;
    const header  = settings.headerSettings;

    const categoryLabel = (general.categoryTitle.value || "").trim() ? general.categoryTitle.value.trim() : columnMeta.categoryFieldName;
    const stackedLabel = (settings.stackedBarSettings.columnTitle.value || "").trim() ? settings.stackedBarSettings.columnTitle.value.trim() : "Composition";

    const columns: ColumnDef[] = [];

    columns.push({ key: "category", label: categoryLabel, width: 120, sortable: true, type: "category" });

    // Renders ONLY the distinct measures added to the Metric Values bucket
    columnMeta.metricNames.forEach((name, i) => {
        columns.push({ key: `metric_${i}`, label: name, width: 90, sortable: true, type: "metric", metricIndex: i });
    });

    if (columnMeta.stackedNames.length > 0) {
        columns.push({ key: "stacked", label: stackedLabel, width: 200, sortable: false, type: "stacked" });
    }

    if (columnMeta.bubbleName) {
        columns.push({ key: "bubble", label: columnMeta.bubbleName, width: 80, sortable: false, type: "bubble" });
    }

    // Only render the sparkline column if data exists in the Sparkline Values bucket
    const hasSparkline = rows.some(r => r.sparklineData && r.sparklineData.length > 0);
    if (hasSparkline) {
        columns.push({ key: "sparkline", label: "Trend", width: 150, sortable: false, type: "sparkline" });
    }

    let sortKey: string = "category";
    let sortAsc: boolean = true;
    let selectedRowCategory: string | null = null;

    const globalStackedMax = Math.max(...rows.map(r => d3.sum(r.stackedData, d => d.value)), 1);
    const globalBubbleMax = Math.max(...rows.map(r => r.bubbleValue ?? 0).filter(v => v > 0), 1);
    const globalSparklineMax = Math.max(...rows.flatMap(r => r.sparklineData ? r.sparklineData.map(d => d.value) : []), 1);

    const wrapper = container.append("div").classed("sparkline-table-wrapper", true)
        .style("width", `${viewport.width}px`).style("height", `${viewport.height}px`).style("overflow", "auto");

    const table = wrapper.append("table").classed("sparkline-table", true)
        .style("border-collapse", "collapse").style("font-family", general.fontFamily.value)
        .style("font-size", `${general.fontSize.value}px`).style("color", general.fontColor.value.value).style("width", "100%");

    const thead = table.append("thead");
    const tbody = table.append("tbody");

    function render() {
        thead.selectAll("*").remove(); tbody.selectAll("*").remove();

        const sorted = [...rows].sort((a, b) => {
            let aVal: string | number = a.category;
            let bVal: string | number = b.category;
            const col = columns.find(c => c.key === sortKey);
            if (col?.type === "metric" && col.metricIndex !== undefined) {
                aVal = a.metrics[col.metricIndex]?.value ?? 0;
                bVal = b.metrics[col.metricIndex]?.value ?? 0;
            }
            if (typeof aVal === "number" && typeof bVal === "number") return sortAsc ? aVal - bVal : bVal - aVal;
            return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
        });

        renderHeaders(thead, columns, header, sortKey, sortAsc, columnMeta, settings, (key) => {
            if (sortKey === key) sortAsc = !sortAsc; else { sortKey = key; sortAsc = true; }
            render();
        });

        renderRows(tbody, sorted, columns, settings, selectionManager, tooltipService, selectedRowCategory,
            globalStackedMax, globalBubbleMax, globalSparklineMax, columnMeta.bubbleName ?? "Value", (category) => {
                selectedRowCategory = selectedRowCategory === category ? null : category;
                render();
            }
        );
    }
    render();
}

function renderHeaders(
    thead: d3.Selection<HTMLTableSectionElement, unknown, null, undefined>, columns: ColumnDef[],
    headerSettings: VisualFormattingSettingsModel["headerSettings"], sortKey: string, sortAsc: boolean,
    columnMeta: ParsedData["columnMeta"], settings: VisualFormattingSettingsModel, onSort: (key: string) => void
): void {
    const headerWrap = headerSettings.wrapText.value;
    const headerAlign = (headerSettings.textAlign?.value as any)?.value ?? "left";
    const legendFontSize = settings.stackedBarSettings.legendFontSize.value || 9;
    const headerRow = thead.append("tr");

    columns.forEach((col) => {
        const th = headerRow.append("th")
            .style("position", "relative").style("min-width", `${col.width}px`).style("width", `${col.width}px`)
            .style("background-color", headerSettings.backgroundColor.value.value).style("color", headerSettings.fontColor.value.value)
            .style("font-family", headerSettings.fontFamily.value).style("font-size", `${headerSettings.fontSize.value}px`)
            .style("padding", "4px 8px").style("border", "1px solid #ddd").style("text-align", headerAlign)
            .style("white-space", headerWrap ? "normal" : "nowrap").style("user-select", "none").style("vertical-align", "top");

        if (col.type === "stacked") {
            const seriesColorProps = [settings.stackedBarSettings.series1Color, settings.stackedBarSettings.series2Color, settings.stackedBarSettings.series3Color, settings.stackedBarSettings.series4Color, settings.stackedBarSettings.series5Color, settings.stackedBarSettings.series6Color];
            th.append("div").style("font-weight", "bold").style("margin-bottom", "4px").style("white-space", "nowrap").text(col.label);
            const legendDiv = th.append("div").style("display", "flex").style("flex-wrap", "wrap").style("gap", "4px 10px").style("align-items", "center");
            columnMeta.stackedNames.forEach((name, i) => {
                const color = seriesColorProps[i]?.value?.value || columnMeta.stackedColors[i] || "#ccc";
                const item = legendDiv.append("div").style("display", "flex").style("align-items", "center").style("gap", "3px");
                item.append("div").style("width", "10px").style("height", "10px").style("background-color", color).style("border-radius", "2px").style("flex-shrink", "0");
                item.append("span").style("font-size", `${legendFontSize}px`).style("color", headerSettings.fontColor.value.value).style("white-space", "nowrap").text(name);
            });
        } else {
            const labelSpan = th.append("span").style("white-space", headerWrap ? "normal" : "nowrap").text(col.label);
            if (col.sortable) {
                th.style("cursor", "pointer");
                if (sortKey === col.key) labelSpan.append("span").style("margin-left", "4px").text(sortAsc ? "↑" : "↓");
                th.on("click", () => onSort(col.key));
            }
        }

        const handle = th.append("div").classed("resize-handle", true)
            .style("position", "absolute").style("right", "0").style("top", "0")
            .style("width", "5px").style("height", "100%").style("cursor", "col-resize").style("user-select", "none");

        let startX = 0; let startWidth = 0;
        handle.call(
            d3.drag<HTMLDivElement, unknown>()
                .on("start", (event) => { startX = event.x; startWidth = col.width; })
                .on("drag", (event) => {
                    const newWidth = Math.max(40, startWidth + (event.x - startX));
                    col.width = newWidth;
                    (th.node() as HTMLElement).style.width = `${newWidth}px`;
                    (th.node() as HTMLElement).style.minWidth = `${newWidth}px`;
                })
        );
    });
}

function renderRows(
    tbody: d3.Selection<HTMLTableSectionElement, unknown, null, undefined>, rows: SparklineTableRow[], columns: ColumnDef[],
    settings: VisualFormattingSettingsModel, selectionManager: ISelectionManager, tooltipService: ITooltipService,
    selectedRowCategory: string | null, globalStackedMax: number, globalBubbleMax: number, globalSparklineMax: number,
    bubbleName: string, onRowClick: (category: string) => void
): void {
    const general = settings.generalSettings;
    const rowHeight = general.rowHeight.value;
    const valueAlign = (general.valueTextAlign?.value as any)?.value ?? "left";

    rows.forEach((row) => {
        const isSelected = selectedRowCategory === row.category;
        const tr = tbody.append("tr").style("background-color", isSelected ? "#D6E8FF" : "transparent")
            .style("cursor", "pointer").style("height", `${rowHeight}px`)
            .on("click", () => { selectionManager.select(row.selectionId, false); onRowClick(row.category); })
            .on("mouseover", function () { if (!isSelected) d3.select(this).style("background-color", "#F5F5F5"); })
            .on("mouseout", function () { if (!isSelected) d3.select(this).style("background-color", "transparent"); });

        columns.forEach((col) => {
            const td = tr.append("td").style("padding", "2px 8px").style("border", "1px solid #ddd")
                .style("width", `${col.width}px`).style("max-width", `${col.width}px`).style("overflow", "hidden")
                .style("white-space", general.wrapText.value ? "normal" : "nowrap").style("vertical-align", "middle");

            switch (col.type) {
                case "category":
                    td.text(row.category)
                      .on("mouseover", function (event: MouseEvent) { tooltipService.show({ dataItems: [{ displayName: col.label, value: row.category }], identities: [], coordinates: [event.clientX, event.clientY], isTouchEvent: false }); })
                      .on("mousemove", function (event: MouseEvent) { tooltipService.move({ dataItems: [{ displayName: col.label, value: row.category }], identities: [], coordinates: [event.clientX, event.clientY], isTouchEvent: false }); })
                      .on("mouseout", function () { tooltipService.hide({ immediately: false, isTouchEvent: false }); });
                    break;
                case "metric":
                    if (col.metricIndex !== undefined) {
                        const metricText = row.metrics[col.metricIndex] ? row.metrics[col.metricIndex].value.toFixed(1) : "";
                        td.style("text-align", valueAlign).text(metricText)
                          .on("mouseover", function (event: MouseEvent) { tooltipService.show({ dataItems: [{ displayName: col.label, value: metricText }], identities: [], coordinates: [event.clientX, event.clientY], isTouchEvent: false }); })
                          .on("mousemove", function (event: MouseEvent) { tooltipService.move({ dataItems: [{ displayName: col.label, value: metricText }], identities: [], coordinates: [event.clientX, event.clientY], isTouchEvent: false }); })
                          .on("mouseout", function () { tooltipService.hide({ immediately: false, isTouchEvent: false }); });
                    }
                    break;
                case "stacked":
                    if (row.stackedData.length > 0) renderStackedBar(td as unknown as D3DivSelection, row.stackedData, col.width, rowHeight - 4, settings.stackedBarSettings, globalStackedMax, tooltipService);
                    break;
                case "bubble":
                    if (row.bubbleValue !== null) renderBubble(td as unknown as D3DivSelection, row.bubbleValue, globalBubbleMax, col.width, rowHeight - 4, settings.bubbleSettings, tooltipService, bubbleName ?? "Value");
                    break;
                case "sparkline":
                    if (row.sparklineData && row.sparklineData.length > 0) {
                        renderBarSparkline(td as unknown as D3DivSelection, row.sparklineData, col.width, rowHeight - 4, settings.barSparklineSettings, globalSparklineMax, tooltipService, "MMM YY");
                    }
                    break;
            }
        });
    });
}