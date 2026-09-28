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
var utils_exports = {};
__export(utils_exports, {
  DEFAULT_SMART_INPUT_WIDTH: () => DEFAULT_SMART_INPUT_WIDTH,
  DEFAULT_TEXT_INPUT_WIDTH: () => DEFAULT_TEXT_INPUT_WIDTH,
  MAX_INPUT_WIDTH: () => MAX_INPUT_WIDTH,
  MIN_INPUT_WIDTH: () => MIN_INPUT_WIDTH,
  buildQuickFilter: () => buildQuickFilter,
  buildQuickOrSmartFilter: () => buildQuickOrSmartFilter,
  buildSmartFilter: () => buildSmartFilter,
  createDefaultConfig: () => createDefaultConfig,
  createSmartFilterConfig: () => createSmartFilterConfig,
  defaultOperator: () => defaultOperator,
  defaultSmartOperator: () => defaultSmartOperator,
  effectiveOperator: () => effectiveOperator,
  getFieldInterface: () => getFieldInterface,
  getFieldTitle: () => getFieldTitle,
  hasFilterValue: () => hasFilterValue,
  isArrayInterface: () => isArrayInterface,
  isSmartFilter: () => isSmartFilter,
  isSupportedField: () => isSupportedField,
  isTextField: () => isTextField,
  isTextInterface: () => isTextInterface,
  normalizeFieldNames: () => normalizeFieldNames,
  normalizeInputWidth: () => normalizeInputWidth,
  normalizeOptions: () => normalizeOptions,
  normalizeQuickFilterArray: () => normalizeQuickFilterArray,
  normalizeQuickFilterValue: () => normalizeQuickFilterValue,
  normalizeQuickFilterValueByOperator: () => normalizeQuickFilterValueByOperator,
  normalizeTextFilterValue: () => normalizeTextFilterValue,
  operatorOptions: () => operatorOptions,
  resolveFieldOptions: () => resolveFieldOptions,
  resolveFieldOptionsSync: () => resolveFieldOptionsSync,
  resolveFilterMode: () => resolveFilterMode,
  restrictOptions: () => restrictOptions,
  serializableOptions: () => serializableOptions,
  smartFilterFields: () => smartFilterFields,
  smartInputWidth: () => smartInputWidth,
  smartOperatorOptions: () => smartOperatorOptions
});
module.exports = __toCommonJS(utils_exports);
var import_types = require("./types");
const ARRAY_INTERFACES = /* @__PURE__ */ new Set(["checkboxGroup", "multipleSelect"]);
const MIN_INPUT_WIDTH = 120;
const MAX_INPUT_WIDTH = 800;
const DEFAULT_TEXT_INPUT_WIDTH = 280;
const DEFAULT_SMART_INPUT_WIDTH = 320;
const ARRAY_VALUE_OPERATORS = /* @__PURE__ */ new Set([
  "$match",
  "$notMatch",
  "$anyOf",
  "$noneOf",
  "$in",
  "$notIn"
]);
function getFieldInterface(field) {
  var _a;
  return String((field == null ? void 0 : field.interface) || ((_a = field == null ? void 0 : field.options) == null ? void 0 : _a.interface) || "");
}
function getFieldTitle(field) {
  var _a;
  return (field == null ? void 0 : field.title) || ((_a = field == null ? void 0 : field.uiSchema) == null ? void 0 : _a.title) || (field == null ? void 0 : field.name) || "";
}
function isSupportedField(field) {
  var _a;
  return import_types.SUPPORTED_INTERFACES.includes(getFieldInterface(field)) && (field == null ? void 0 : field.filterable) !== false && ((_a = field == null ? void 0 : field.options) == null ? void 0 : _a.filterable) !== false;
}
function isArrayInterface(fieldInterface) {
  return ARRAY_INTERFACES.has(String(fieldInterface || ""));
}
function isTextInterface(fieldInterface) {
  return import_types.TEXT_INTERFACES.includes(String(fieldInterface || ""));
}
function isTextField(field) {
  return isTextInterface(getFieldInterface(field));
}
function isSmartFilter(config) {
  return (config == null ? void 0 : config.mode) === import_types.SMART_FILTER_MODE;
}
function smartFilterFields(fields = []) {
  return (fields || []).filter(isTextField);
}
function normalizeFieldNames(value) {
  const raw = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
  const names = [];
  for (const item of raw) {
    const name = String(item ?? "").trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}
function defaultSmartOperator(operator) {
  return String(operator || "") === "$eq" ? "$eq" : "$includes";
}
function smartOperatorOptions() {
  return [
    { value: "$includes", label: "Contains" },
    { value: "$eq", label: "Equals" }
  ];
}
function hasFilterValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== void 0 && value !== null && value !== "";
}
function optionSource(field) {
  var _a, _b, _c, _d;
  const uiSchema = (field == null ? void 0 : field.uiSchema) || ((_a = field == null ? void 0 : field.options) == null ? void 0 : _a.uiSchema) || {};
  return uiSchema.enum || ((_b = uiSchema["x-component-props"]) == null ? void 0 : _b.options) || (field == null ? void 0 : field.enum) || ((_c = field == null ? void 0 : field.options) == null ? void 0 : _c.enum) || ((_d = field == null ? void 0 : field.options) == null ? void 0 : _d.options);
}
function primitive(value) {
  return ["string", "number", "boolean"].includes(typeof value);
}
function normalizeQuickFilterArray(value) {
  const values = Array.isArray(value) ? value : primitive(value) ? [value] : [];
  return values.filter(primitive);
}
function normalizeQuickFilterValue(value, multiple) {
  const values = normalizeQuickFilterArray(value);
  return multiple ? values : values[0];
}
function normalizeInputWidth(value, fallback = DEFAULT_TEXT_INPUT_WIDTH) {
  const raw = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return Math.min(MAX_INPUT_WIDTH, Math.max(MIN_INPUT_WIDTH, Math.round(raw)));
}
function smartInputWidth(config) {
  return normalizeInputWidth(
    config.inputWidth,
    isSmartFilter(config) ? DEFAULT_SMART_INPUT_WIDTH : DEFAULT_TEXT_INPUT_WIDTH
  );
}
function normalizeTextFilterValue(value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || void 0;
}
function normalizeQuickFilterValueByOperator(operator, value) {
  return ARRAY_VALUE_OPERATORS.has(operator) ? normalizeQuickFilterArray(value) : value;
}
function normalizeOptions(input) {
  const source = Array.isArray(input) ? input : [];
  const result = [];
  const visit = (items) => {
    for (const item of items) {
      if (item && Array.isArray(item.options)) {
        visit(item.options);
        continue;
      }
      if (primitive(item)) {
        result.push({ label: String(item), value: item });
        continue;
      }
      if (!item || !primitive(item.value)) continue;
      result.push({
        label: item.label ?? item.title ?? String(item.value),
        value: item.value,
        disabled: Boolean(item.disabled)
      });
    }
  };
  visit(source);
  return result;
}
function resolveFieldOptionsSync(field) {
  return normalizeOptions(optionSource(field));
}
async function resolveFieldOptions(field) {
  const direct = resolveFieldOptionsSync(field);
  if (direct.length) return direct;
  for (const resolver of [field == null ? void 0 : field.getOptions, field == null ? void 0 : field.getEnum]) {
    if (typeof resolver !== "function") continue;
    try {
      const value = await resolver.call(field);
      const options = normalizeOptions(value);
      if (options.length) return options;
    } catch {
    }
  }
  return [];
}
function restrictOptions(options, candidateValues) {
  const candidates = normalizeQuickFilterArray(candidateValues);
  if (!candidates.length) return options;
  return options.filter(
    (option) => candidates.some(
      (candidate) => Object.is(candidate, option.value) || String(candidate) === String(option.value)
    )
  );
}
function defaultOperator(fieldInterface, multiple = false) {
  if (isTextInterface(fieldInterface)) return "$includes";
  if (isArrayInterface(fieldInterface)) return multiple ? "$anyOf" : "$match";
  return multiple ? "$in" : "$eq";
}
function operatorOptions(fieldInterface) {
  if (isTextInterface(fieldInterface)) {
    return [
      { value: "$includes", label: "Contains" },
      { value: "$notIncludes", label: "Does not contain" },
      { value: "$eq", label: "Equals" },
      { value: "$ne", label: "Not equal" }
    ];
  }
  if (isArrayInterface(fieldInterface)) {
    return [
      { value: "$match", label: "Matches" },
      { value: "$notMatch", label: "Does not match" },
      { value: "$anyOf", label: "Contains any of" },
      { value: "$noneOf", label: "Contains none of" }
    ];
  }
  return [
    { value: "$eq", label: "Equals" },
    { value: "$ne", label: "Not equal" },
    { value: "$in", label: "Is any of" },
    { value: "$notIn", label: "Is none of" }
  ];
}
function effectiveOperator(config, fieldInterface) {
  if (isTextInterface(fieldInterface || config.fieldInterface)) {
    return config.operator || defaultOperator(fieldInterface || config.fieldInterface);
  }
  const multiple = config.style === "multiButton" || Boolean(config.multiple);
  const requested = config.operator || defaultOperator(fieldInterface, multiple);
  if (!multiple || isArrayInterface(fieldInterface)) return requested;
  if (requested === "$eq") return "$in";
  if (requested === "$ne") return "$notIn";
  return requested;
}
function buildQuickFilter(config, value, fieldInterface) {
  const resolvedInterface = fieldInterface || config.fieldInterface;
  const textFilter = isTextInterface(resolvedInterface);
  const multiple = config.style === "multiButton" || Boolean(config.multiple);
  const operator = effectiveOperator(config, resolvedInterface);
  let normalizedValue = textFilter ? normalizeTextFilterValue(value) : normalizeQuickFilterValue(value, multiple);
  if (!config.fieldName || !hasFilterValue(normalizedValue)) return void 0;
  const candidateValues = textFilter ? [] : normalizeQuickFilterArray(config.candidateValues);
  if (candidateValues.length) {
    const allowed = (candidate) => candidateValues.some(
      (item) => Object.is(item, candidate) || String(item) === String(candidate)
    );
    normalizedValue = Array.isArray(normalizedValue) ? normalizedValue.filter(allowed) : allowed(normalizedValue) ? normalizedValue : void 0;
  }
  normalizedValue = normalizeQuickFilterValueByOperator(operator, normalizedValue);
  if (!hasFilterValue(normalizedValue)) return void 0;
  return {
    [config.fieldName]: {
      [operator]: normalizedValue
    }
  };
}
function buildSmartFilter(config, value) {
  const keyword = normalizeTextFilterValue(value);
  const fieldNames = normalizeFieldNames(config.fieldNames);
  if (!keyword || !fieldNames.length) return void 0;
  const operator = defaultSmartOperator(config.operator);
  return {
    $or: fieldNames.map((fieldName) => ({
      [fieldName]: { [operator]: keyword }
    }))
  };
}
function resolveFilterMode(config, fieldInterface) {
  const smart = isSmartFilter(config);
  return { smart, textFilter: smart || isTextInterface(fieldInterface) };
}
function buildQuickOrSmartFilter(config, value, fieldInterface) {
  return isSmartFilter(config) ? buildSmartFilter(config, value) : buildQuickFilter(config, value, fieldInterface);
}
function serializableOptions(field) {
  return resolveFieldOptionsSync(field).map(({ label, value, disabled }) => ({
    label: typeof label === "string" || typeof label === "number" ? label : String(value),
    value,
    disabled
  }));
}
function createSmartFilterConfig(fieldNames = []) {
  return {
    mode: import_types.SMART_FILTER_MODE,
    fieldName: "",
    fieldNames: normalizeFieldNames(fieldNames),
    fieldInterface: void 0,
    fieldTitle: "",
    showTitle: true,
    fullRow: false,
    defaultValue: void 0,
    multiple: false,
    style: void 0,
    operator: "$includes",
    candidateValues: void 0,
    options: void 0
  };
}
function createDefaultConfig(field) {
  const fieldInterface = getFieldInterface(field);
  const textFilter = isTextInterface(fieldInterface);
  return {
    fieldName: String(field.name || ""),
    fieldInterface,
    fieldTitle: getFieldTitle(field),
    showTitle: true,
    fullRow: false,
    style: textFilter ? void 0 : "select",
    multiple: false,
    operator: defaultOperator(fieldInterface, false),
    options: textFilter ? void 0 : serializableOptions(field)
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_SMART_INPUT_WIDTH,
  DEFAULT_TEXT_INPUT_WIDTH,
  MAX_INPUT_WIDTH,
  MIN_INPUT_WIDTH,
  buildQuickFilter,
  buildQuickOrSmartFilter,
  buildSmartFilter,
  createDefaultConfig,
  createSmartFilterConfig,
  defaultOperator,
  defaultSmartOperator,
  effectiveOperator,
  getFieldInterface,
  getFieldTitle,
  hasFilterValue,
  isArrayInterface,
  isSmartFilter,
  isSupportedField,
  isTextField,
  isTextInterface,
  normalizeFieldNames,
  normalizeInputWidth,
  normalizeOptions,
  normalizeQuickFilterArray,
  normalizeQuickFilterValue,
  normalizeQuickFilterValueByOperator,
  normalizeTextFilterValue,
  operatorOptions,
  resolveFieldOptions,
  resolveFieldOptionsSync,
  resolveFilterMode,
  restrictOptions,
  serializableOptions,
  smartFilterFields,
  smartInputWidth,
  smartOperatorOptions
});
