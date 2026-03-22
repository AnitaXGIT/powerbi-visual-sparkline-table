"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import * as d3 from "d3";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ITooltipService = powerbi.extensibility.ITooltipService;

import { VisualFormattingSettingsModel } from "./settings";
import { parseMatrixData, ParsedData } from "./dataParser";
import { renderTable } from "./tableRenderer";

export class Visual implements IVisual {
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private tooltipService: ITooltipService;
    private formattingSettingsService: FormattingSettingsService;
    private formattingSettings: VisualFormattingSettingsModel;
    private container: d3.Selection<HTMLDivElement, unknown, null, undefined>;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host as IVisualHost;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = options.host.createSelectionManager();
        this.tooltipService   = options.host.tooltipService;

        this.container = d3.select(options.element)
            .append("div")
            .classed("sparkline-table-container", true);
    }

    public update(options: VisualUpdateOptions) {
        try {
            this.container.selectAll("*").remove();

            const dataViews = options.dataViews || [];
            const matrixDataView = dataViews.find(dv => !!dv.matrix);

            if (!matrixDataView) {
                this.container
                    .append("div")
                    .classed("sparkline-table-empty", true)
                    .style("padding", "20px")
                    .style("color", "#666")
                    .text("Please add Category and Metric data to render the table.");
                return;
            }

            this.formattingSettings = this.formattingSettingsService
                .populateFormattingSettingsModel(
                    VisualFormattingSettingsModel,
                    matrixDataView
                );

            const parsedData = parseMatrixData(dataViews, this.host);

            renderTable(
                this.container, parsedData, this.formattingSettings,
                this.selectionManager, this.tooltipService, options.viewport
            );

        } catch (e) {
            this.container.selectAll("*").remove();
            this.container
                .append("div")
                .classed("sparkline-table-empty", true)
                .style("color", "red")
                .style("padding", "20px")
                .text("CRASH ERROR: " + (e as Error).message);
            console.error("Sparkline Table Crash:", e);
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}