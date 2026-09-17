/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var locale_exports = {};
__export(locale_exports, {
  NAMESPACE: () => NAMESPACE,
  localeResources: () => localeResources
});
module.exports = __toCommonJS(locale_exports);
const NAMESPACE = "@xiezuo/plugin-quick-filter";
const localeResources = {
  "zh-CN": {
    "Quick filter": "\u5FEB\u6377\u7B5B\u9009",
    "Quick filter settings": "\u5FEB\u6377\u7B5B\u9009\u8BBE\u7F6E",
    "Target field": "\u76EE\u6807\u5B57\u6BB5",
    "Field title": "\u5B57\u6BB5\u6807\u9898",
    "Show title": "\u663E\u793A\u6807\u9898",
    Tooltip: "\u63D0\u793A\u4FE1\u606F",
    "Exclusive row": "\u72EC\u5360\u4E00\u884C",
    Placeholder: "\u5360\u4F4D\u6587\u5B57",
    "Enter keyword": "\u8BF7\u8F93\u5165\u5173\u952E\u8BCD",
    Search: "\u641C\u7D22",
    Style: "\u6837\u5F0F",
    Select: "\u4E0B\u62C9\u9009\u62E9",
    Button: "\u6309\u94AE",
    "Multiple buttons": "\u591A\u9009\u6309\u94AE",
    "Multiple selection": "\u5141\u8BB8\u591A\u9009",
    Operator: "\u8FD0\u7B97\u7B26",
    "Candidate values": "\u5019\u9009\u503C",
    "Default value": "\u9ED8\u8BA4\u503C",
    All: "\u5168\u90E8",
    "No options": "\u6CA1\u6709\u53EF\u7528\u9009\u9879",
    Equals: "\u7B49\u4E8E",
    "Not equal": "\u4E0D\u7B49\u4E8E",
    "Is any of": "\u5C5E\u4E8E\u4EFB\u610F\u4E00\u4E2A",
    "Is none of": "\u4E0D\u5C5E\u4E8E\u4EFB\u610F\u4E00\u4E2A",
    Matches: "\u5339\u914D",
    "Does not match": "\u4E0D\u5339\u914D",
    "Contains any of": "\u5305\u542B\u4EFB\u610F\u4E00\u4E2A",
    "Contains none of": "\u4E0D\u5305\u542B\u4EFB\u610F\u4E00\u4E2A",
    Contains: "\u5305\u542B",
    "Does not contain": "\u4E0D\u5305\u542B",
    "Basic settings": "\u57FA\u672C\u8BBE\u7F6E",
    "Display settings": "\u663E\u793A\u8BBE\u7F6E",
    "Value settings": "\u503C\u4E0E\u8FD0\u7B97\u7B26"
  },
  "en-US": {
    "Quick filter": "Quick filter",
    "Quick filter settings": "Quick filter settings",
    "Target field": "Target field",
    "Field title": "Field title",
    "Show title": "Show title",
    Tooltip: "Tooltip",
    "Exclusive row": "Exclusive row",
    Placeholder: "Placeholder",
    "Enter keyword": "Enter keyword",
    Search: "Search",
    Style: "Style",
    Select: "Select",
    Button: "Button",
    "Multiple buttons": "Multiple buttons",
    "Multiple selection": "Multiple selection",
    Operator: "Operator",
    "Candidate values": "Candidate values",
    "Default value": "Default value",
    All: "All",
    "No options": "No options",
    Equals: "Equals",
    "Not equal": "Not equal",
    "Is any of": "Is any of",
    "Is none of": "Is none of",
    Matches: "Matches",
    "Does not match": "Does not match",
    "Contains any of": "Contains any of",
    "Contains none of": "Contains none of",
    Contains: "Contains",
    "Does not contain": "Does not contain",
    "Basic settings": "Basic settings",
    "Display settings": "Display settings",
    "Value settings": "Value and operator"
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NAMESPACE,
  localeResources
});
