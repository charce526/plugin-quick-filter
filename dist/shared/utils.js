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
  buildQuickFilter: () => buildQuickFilter,
  createDefaultConfig: () => createDefaultConfig,
  defaultOperator: () => defaultOperator,
  effectiveOperator: () => effectiveOperator,
  getFieldInterface: () => getFieldInterface,
  getFieldTitle: () => getFieldTitle,
  hasFilterValue: () => hasFilterValue,
  isArrayInterface: () => isArrayInterface,
  isSupportedField: () => isSupportedField,
  normalizeOptions: () => normalizeOptions,
  operatorOptions: () => operatorOptions,
  resolveFieldOptions: () => resolveFieldOptions,
  resolveFieldOptionsSync: () => resolveFieldOptionsSync,
  restrictOptions: () => restrictOptions,
  serializableOptions: () => serializableOptions
});
module.exports = __toCommonJS(utils_exports);
var import_types = require("./types");
const ARRAY_INTERFACES = /* @__PURE__ */ new Set(["checkboxGroup", "multipleSelect"]);
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
  if (!(candidateValues == null ? void 0 : candidateValues.length)) return options;
  return options.filter(
    (option) => candidateValues.some(
      (candidate) => Object.is(candidate, option.value) || String(candidate) === String(option.value)
    )
  );
}
function defaultOperator(fieldInterface, multiple = false) {
  if (isArrayInterface(fieldInterface)) return multiple ? "$anyOf" : "$match";
  return multiple ? "$in" : "$eq";
}
function operatorOptions(fieldInterface) {
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
  const multiple = config.style === "multiButton" || Boolean(config.multiple);
  const requested = config.operator || defaultOperator(fieldInterface, multiple);
  if (!multiple) return requested;
  if (isArrayInterface(fieldInterface)) {
    if (requested === "$match") return "$anyOf";
    if (requested === "$notMatch") return "$noneOf";
  } else {
    if (requested === "$eq") return "$in";
    if (requested === "$ne") return "$notIn";
  }
  return requested;
}
function buildQuickFilter(config, value, fieldInterface) {
  var _a;
  if (!config.fieldName || !hasFilterValue(value)) return void 0;
  const multiple = config.style === "multiButton" || Boolean(config.multiple);
  let normalizedValue = multiple && !Array.isArray(value) ? [value] : value;
  if ((_a = config.candidateValues) == null ? void 0 : _a.length) {
    const allowed = (candidate) => {
      var _a2;
      return (_a2 = config.candidateValues) == null ? void 0 : _a2.some(
        (item) => Object.is(item, candidate) || String(item) === String(candidate)
      );
    };
    normalizedValue = Array.isArray(normalizedValue) ? normalizedValue.filter(allowed) : allowed(normalizedValue) ? normalizedValue : void 0;
  }
  if (!hasFilterValue(normalizedValue)) return void 0;
  return {
    [config.fieldName]: {
      [effectiveOperator(config, fieldInterface)]: normalizedValue
    }
  };
}
function serializableOptions(field) {
  return resolveFieldOptionsSync(field).map(({ label, value, disabled }) => ({
    label: typeof label === "string" || typeof label === "number" ? label : String(value),
    value,
    disabled
  }));
}
function createDefaultConfig(field) {
  const fieldInterface = getFieldInterface(field);
  return {
    fieldName: String(field.name || ""),
    fieldTitle: getFieldTitle(field),
    showTitle: true,
    style: "select",
    multiple: false,
    operator: defaultOperator(fieldInterface, false),
    options: serializableOptions(field)
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildQuickFilter,
  createDefaultConfig,
  defaultOperator,
  effectiveOperator,
  getFieldInterface,
  getFieldTitle,
  hasFilterValue,
  isArrayInterface,
  isSupportedField,
  normalizeOptions,
  operatorOptions,
  resolveFieldOptions,
  resolveFieldOptionsSync,
  restrictOptions,
  serializableOptions
});
