"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class GeneralSettingsCard extends FormattingSettingsCard {
    fontFamily = new formattingSettings.FontPicker({ name: "fontFamily", displayName: "Font Family", value: "Segoe UI" });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Font Size", value: 12 });
    fontColor = new formattingSettings.ColorPicker({ name: "fontColor", displayName: "Font Color", value: { value: "#000000" } });
    wrapText = new formattingSettings.ToggleSwitch({ name: "wrapText", displayName: "Wrap Text", value: false });
    rowHeight = new formattingSettings.NumUpDown({ name: "rowHeight", displayName: "Row Height (px)", value: 40 });
    categoryTitle = new formattingSettings.TextInput({ name: "categoryTitle", displayName: "Category Column Title", value: "", placeholder: "" }); 
    valueTextAlign = new formattingSettings.ItemDropdown({
        name: "valueTextAlign", displayName: "Value Text Alignment",
        items: [{ value: "left", displayName: "Left" }, { value: "center", displayName: "Center" }, { value: "right", displayName: "Right" }],
        value: { value: "left", displayName: "Left" }
    });
    name: string = "generalSettings"; displayName: string = "General";
    slices: Array<FormattingSettingsSlice> = [this.fontFamily, this.fontSize, this.fontColor, this.wrapText, this.rowHeight, this.categoryTitle, this.valueTextAlign];
}

class HeaderSettingsCard extends FormattingSettingsCard {
    fontFamily = new formattingSettings.FontPicker({ name: "fontFamily", displayName: "Font Family", value: "Segoe UI" });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Font Size", value: 12 });
    fontColor = new formattingSettings.ColorPicker({ name: "fontColor", displayName: "Font Color", value: { value: "#000000" } });
    backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background Color", value: { value: "#F0F0F0" } });
    wrapText = new formattingSettings.ToggleSwitch({ name: "wrapText", displayName: "Wrap Text", value: false });
    textAlign = new formattingSettings.ItemDropdown({
        name: "textAlign", displayName: "Text Alignment",
        items: [{ value: "left", displayName: "Left" }, { value: "center", displayName: "Center" }, { value: "right", displayName: "Right" }],
        value: { value: "left", displayName: "Left" }
    });
    name: string = "headerSettings"; displayName: string = "Column Headers";
    slices: Array<FormattingSettingsSlice> = [this.fontFamily, this.fontSize, this.fontColor, this.backgroundColor, this.wrapText, this.textAlign];
}

class StackedBarSettingsCard extends FormattingSettingsCard {
    columnTitle = new formattingSettings.TextInput({ name: "columnTitle", displayName: "Column Title", value: "Composition", placeholder: "" }); 
    fillMode = new formattingSettings.ItemDropdown({
        name: "fillMode", displayName: "Fill Mode",
        items: [{ value: "percentage", displayName: "Percentage" }, { value: "absolute", displayName: "Absolute" }],
        value: { value: "percentage", displayName: "Percentage" }
    });
    showLabels = new formattingSettings.ToggleSwitch({ name: "showLabels", displayName: "Show Labels", value: false });
    labelFontSize = new formattingSettings.NumUpDown({ name: "labelFontSize", displayName: "Label Font Size", value: 10 });
    labelDecimals = new formattingSettings.NumUpDown({ name: "labelDecimals", displayName: "Label Decimal Places", value: 1 });
    labelFontColor = new formattingSettings.ColorPicker({ name: "labelFontColor", displayName: "Label Font Color", value: { value: "#ffffff" } });
    legendFontSize = new formattingSettings.NumUpDown({ name: "legendFontSize", displayName: "Legend Font Size", value: 9 });
    series1Color = new formattingSettings.ColorPicker({ name: "series1Color", displayName: "Series 1 Color", value: { value: "#E8604C" } });
    series2Color = new formattingSettings.ColorPicker({ name: "series2Color", displayName: "Series 2 Color", value: { value: "#F4B942" } });
    series3Color = new formattingSettings.ColorPicker({ name: "series3Color", displayName: "Series 3 Color", value: { value: "#6DBF67" } });
    series4Color = new formattingSettings.ColorPicker({ name: "series4Color", displayName: "Series 4 Color", value: { value: "#4472C4" } });
    series5Color = new formattingSettings.ColorPicker({ name: "series5Color", displayName: "Series 5 Color", value: { value: "#9B59B6" } });
    series6Color = new formattingSettings.ColorPicker({ name: "series6Color", displayName: "Series 6 Color", value: { value: "#1ABC9C" } });
    name: string = "stackedBarSettings"; displayName: string = "Stacked Bar";
    slices: Array<FormattingSettingsSlice> = [this.columnTitle, this.fillMode, this.showLabels, this.labelFontSize, this.labelDecimals, this.labelFontColor, this.legendFontSize, this.series1Color, this.series2Color, this.series3Color, this.series4Color, this.series5Color, this.series6Color];
}

class BubbleSettingsCard extends FormattingSettingsCard {
    bubbleColor = new formattingSettings.ColorPicker({ name: "bubbleColor", displayName: "Bubble Color", value: { value: "#4472C4" } });
    minBubbleSize = new formattingSettings.NumUpDown({ name: "minBubbleSize", displayName: "Min Bubble Size (px)", value: 4 });
    maxBubbleSize = new formattingSettings.NumUpDown({ name: "maxBubbleSize", displayName: "Max Bubble Size (px)", value: 20 });
    showLabels = new formattingSettings.ToggleSwitch({ name: "showLabels", displayName: "Show Labels", value: false });
    labelFontSize = new formattingSettings.NumUpDown({ name: "labelFontSize", displayName: "Label Font Size", value: 10 });
    labelDecimals = new formattingSettings.NumUpDown({ name: "labelDecimals", displayName: "Label Decimal Places", value: 1 });
    labelFontColor = new formattingSettings.ColorPicker({ name: "labelFontColor", displayName: "Label Font Color", value: { value: "#ffffff" } });
    name: string = "bubbleSettings"; displayName: string = "Bubble";
    slices: Array<FormattingSettingsSlice> = [this.bubbleColor, this.minBubbleSize, this.maxBubbleSize, this.showLabels, this.labelFontSize, this.labelDecimals, this.labelFontColor];
}

class BarSparklineSettingsCard extends FormattingSettingsCard {
    barColor = new formattingSettings.ColorPicker({ name: "barColor", displayName: "Bar Color", value: { value: "#4472C4" } });
    showLabels = new formattingSettings.ToggleSwitch({ name: "showLabels", displayName: "Show Labels", value: false });
    showXAxis = new formattingSettings.ToggleSwitch({ name: "showXAxis", displayName: "Show X-Axis", value: true });
    axisColor = new formattingSettings.ColorPicker({ name: "axisColor", displayName: "Axis Color", value: { value: "#888888" } });
    axisWidth = new formattingSettings.NumUpDown({ name: "axisWidth", displayName: "Axis Thickness (px)", value: 1 });
    labelFontSize = new formattingSettings.NumUpDown({ name: "labelFontSize", displayName: "Label Font Size", value: 10 });
    labelDecimals = new formattingSettings.NumUpDown({ name: "labelDecimals", displayName: "Label Decimal Places", value: 1 });
    labelFontColor = new formattingSettings.ColorPicker({ name: "labelFontColor", displayName: "Label Font Color", value: { value: "#333333" } });
    name: string = "barSparklineSettings"; displayName: string = "Bar Sparkline";
    slices: Array<FormattingSettingsSlice> = [this.barColor, this.showLabels, this.showXAxis, this.axisColor, this.axisWidth, this.labelFontSize, this.labelDecimals, this.labelFontColor];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    generalSettings      = new GeneralSettingsCard();
    headerSettings       = new HeaderSettingsCard();
    stackedBarSettings   = new StackedBarSettingsCard();
    bubbleSettings       = new BubbleSettingsCard();
    barSparklineSettings = new BarSparklineSettingsCard();

    cards = [this.generalSettings, this.headerSettings, this.stackedBarSettings, this.bubbleSettings, this.barSparklineSettings];
}