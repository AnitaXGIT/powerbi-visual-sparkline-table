"use strict";

import powerbi from "powerbi-visuals-api";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

export interface StackedDataPoint { seriesName: string; value: number; color: string; }
export interface BarDataPoint { axisLabel: string; value: number; }

export interface SparklineTableRow {
    category: string;
    metrics: { name: string; value: number }[];
    stackedData: StackedDataPoint[];
    bubbleValue: number | null;
    sparklineData: BarDataPoint[];
    selectionId: powerbi.visuals.ISelectionId;
}

export interface ColumnMeta {
    categoryFieldName: string;
    metricNames: string[];
    metricFormats: string[];
    stackedNames: string[];
    stackedColors: string[];
    bubbleName: string | null;
}

export interface ParsedData {
    rows: SparklineTableRow[];
    columnMeta: ColumnMeta;
}

const DEFAULT_COLORS = ["#E8604C", "#F4B942", "#6DBF67", "#4472C4", "#9B59B6", "#1ABC9C"];

function hasRole(source: powerbi.DataViewMetadataColumn, roleName: string): boolean {
    if (source.roles && source.roles[roleName]) return true;
    const rolesIndex = (source as any).rolesIndex;
    if (rolesIndex && rolesIndex[roleName] !== undefined) return true;
    return false;
}

export function parseMatrixData(dataViews: powerbi.DataView[], host: IVisualHost): ParsedData {
    const columnMeta: ColumnMeta = {
        categoryFieldName: "Category", metricNames: [], metricFormats: [],
        stackedNames: [], stackedColors: [], bubbleName: null
    };

    const dataView = dataViews && dataViews[0];
    if (!dataView || !dataView.matrix) return { rows: [], columnMeta };

    const matrix = dataView.matrix;
    const valueSources = matrix.valueSources || [];

    let sparklineIdx = -1;
    let bubbleIdx = -1;
    const metricIdxs: number[] = [];
    const stackedIdxs: number[] = [];

    const seenMetrics = new Set<string>();
    const seenStacked = new Set<string>();

    valueSources.forEach((vs, idx) => {
        const uniqueId = vs.queryName || vs.displayName;
        if (hasRole(vs, "sparklineValues") && sparklineIdx === -1) {
            sparklineIdx = idx;
        }
        if (hasRole(vs, "bubbleValues") && bubbleIdx === -1) {
            bubbleIdx = idx;
            columnMeta.bubbleName = vs.displayName;
        }
        if (hasRole(vs, "stackedValues")) {
            if (!seenStacked.has(uniqueId)) {
                seenStacked.add(uniqueId);
                stackedIdxs.push(idx);
                columnMeta.stackedNames.push(vs.displayName);
            }
        }
        if (hasRole(vs, "metricValues")) {
            if (!seenMetrics.has(uniqueId)) {
                seenMetrics.add(uniqueId);
                metricIdxs.push(idx);
                columnMeta.metricNames.push(vs.displayName);
                columnMeta.metricFormats.push(vs.format || "");
            }
        }
    });

    if (matrix.rows.levels && matrix.rows.levels.length > 0) {
        columnMeta.categoryFieldName = matrix.rows.levels[0].sources[0].displayName;
    }
    
    columnMeta.stackedColors = columnMeta.stackedNames.map((_, i) => DEFAULT_COLORS[i % DEFAULT_COLORS.length]);

    const parsedRows: SparklineTableRow[] = [];
    const colLeaves: { index: number, label: string, isSubtotal: boolean }[] = [];
    let leafIdx = 0;

    function traverseCols(node: powerbi.DataViewMatrixNode, currentLabels: string[], isSub: boolean) {
        const isCurrentlySub = isSub || !!node.isSubtotal;
        const labels = [...currentLabels];
        
        if (node.value !== null && node.value !== undefined && String(node.value).trim() !== "") {
            labels.push(node.value instanceof Date ? node.value.toISOString() : String(node.value));
        } else if (node.name !== null && node.name !== undefined && String(node.name).trim() !== "") {
            labels.push(String(node.name));
        }

        if (node.children && node.children.length > 0) {
            node.children.forEach(c => traverseCols(c, labels, isCurrentlySub));
        } else {
            colLeaves.push({ index: leafIdx++, label: labels.length > 0 ? labels[0] : "Total", isSubtotal: isCurrentlySub });
        }
    }

    if (matrix.columns && matrix.columns.root.children) {
        matrix.columns.root.children.forEach(c => traverseCols(c, [], false));
    } else {
        colLeaves.push({ index: 0, label: "Total", isSubtotal: true });
    }

    function traverseRows(node: powerbi.DataViewMatrixNode) {
        if (node.children && node.children.length > 0) {
            node.children.forEach(traverseRows);
        } else if (node.value !== null && node.value !== undefined) {
            const category = String(node.value);
            const selectionId = host.createSelectionIdBuilder().withMatrixNode(node, matrix.rows.levels).createSelectionId();

            const metricsMap = new Map<number, number>();
            const fallbackSums = new Map<number, number>();
            const fallbackCounts = new Map<number, number>();
            
            const sparklineDataMap = new Map<string, number>();
            // ONLY pre-fill the missing timelines if a sparkline measure is mapped!
            if (sparklineIdx >= 0) {
                colLeaves.forEach(col => {
                    if (!col.isSubtotal) sparklineDataMap.set(col.label, 0);
                });
            }

            if (node.values) {
                colLeaves.forEach(col => {
                    const cell = node.values![col.index];
                    if (cell && cell.value !== undefined && cell.value !== null) {
                        const vsIdx = cell.valueSourceIndex !== undefined ? cell.valueSourceIndex : 0;
                        const val = cell.value as number;

                        if (col.isSubtotal || colLeaves.length === 1) {
                            metricsMap.set(vsIdx, val);
                        } 
                        
                        if (!col.isSubtotal || colLeaves.length === 1) {
                            fallbackSums.set(vsIdx, (fallbackSums.get(vsIdx) || 0) + val);
                            fallbackCounts.set(vsIdx, (fallbackCounts.get(vsIdx) || 0) + 1);

                            if (vsIdx === sparklineIdx) {
                                sparklineDataMap.set(col.label, val);
                            }
                        }
                    }
                });
            }

            const getFinalVal = (vsIdx: number) => {
                if (metricsMap.has(vsIdx)) return metricsMap.get(vsIdx);
                return fallbackCounts.has(vsIdx) ? (fallbackSums.get(vsIdx) || 0) / (fallbackCounts.get(vsIdx) || 1) : 0;
            };

            const metrics = metricIdxs.map((idx, i) => ({ name: columnMeta.metricNames[i], value: getFinalVal(idx) }));
            const stackedData = stackedIdxs.map((idx, i) => ({ seriesName: columnMeta.stackedNames[i], value: getFinalVal(idx), color: columnMeta.stackedColors[i] }));
            const bubbleValue = bubbleIdx >= 0 ? getFinalVal(bubbleIdx) : null;
            
            const sparklineData = sparklineIdx >= 0 ? Array.from(sparklineDataMap.entries()).map(([axisLabel, value]) => ({ axisLabel, value })) : [];

            parsedRows.push({ category, metrics, stackedData, bubbleValue, sparklineData, selectionId });
        }
    }

    if (matrix.rows && matrix.rows.root.children) {
        matrix.rows.root.children.forEach(traverseRows);
    }

    return { rows: parsedRows, columnMeta };
}