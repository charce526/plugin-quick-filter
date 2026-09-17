/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var QuickFilterControl_exports = {};
__export(QuickFilterControl_exports, {
  QuickFilterControl: () => QuickFilterControl,
  useResolvedOptions: () => useResolvedOptions
});
module.exports = __toCommonJS(QuickFilterControl_exports);
var import_antd = require("antd");
var import_react = __toESM(require("react"));
var import_utils = require("./utils");
const CLEAR_VALUE = "__xiezuo_quick_filter_clear__";
const QUICK_FILTER_ROW_STYLES = `
  .nb-quick-filter-action-row {
    min-width: 0;
  }

  .nb-quick-filter-action-row > .nb-quick-filter-left-group {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    max-width: 100%;
  }

  .nb-quick-filter-action-row > .nb-quick-filter-right-group {
    flex: 0 0 auto !important;
    margin-left: auto !important;
    flex-wrap: nowrap !important;
  }

  .nb-quick-filter-left-group > .nb-quick-filter-row-item {
    flex: 0 0 100% !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100%;
  }

  .nb-quick-filter-row,
  .nb-quick-filter-row > .ant-space {
    min-width: 0;
    max-width: 100%;
  }
`;
function useResolvedOptions(field, fallbackOptions = []) {
  const [options, setOptions] = (0, import_react.useState)(fallbackOptions);
  (0, import_react.useEffect)(() => {
    let active = true;
    setOptions(fallbackOptions);
    (0, import_utils.resolveFieldOptions)(field).then((resolved) => {
      if (active && resolved.length) setOptions(resolved);
    });
    return () => {
      active = false;
    };
  }, [field, JSON.stringify(fallbackOptions)]);
  return options;
}
function QuickFilterControl(props) {
  const {
    title,
    showTitle = true,
    tooltip,
    styleType = "select",
    value,
    field,
    fallbackOptions = [],
    candidateValues,
    disabled,
    allText,
    noOptionsText,
    onChange,
    compileLabel = (label) => label
  } = props;
  const multiple = styleType === "multiButton" || Boolean(props.multiple);
  const normalizedValue = (0, import_utils.normalizeQuickFilterValue)(value, multiple);
  const rowRef = (0, import_react.useRef)(null);
  const resolved = useResolvedOptions(field, fallbackOptions);
  const options = (0, import_react.useMemo)(
    () => (0, import_utils.restrictOptions)(resolved, candidateValues).map((option) => ({
      ...option,
      label: compileLabel(option.label)
    })),
    [resolved, candidateValues, compileLabel]
  );
  const isDisabled = disabled || options.length === 0;
  (0, import_react.useEffect)(() => {
    var _a;
    const rowItem = (_a = rowRef.current) == null ? void 0 : _a.closest(".ant-space-item");
    if (!rowItem) return;
    const leftGroup = rowItem.parentElement;
    const actionRow = leftGroup == null ? void 0 : leftGroup.parentElement;
    const rightGroup = Array.from((actionRow == null ? void 0 : actionRow.children) || []).find(
      (child) => child !== leftGroup && child.classList.contains("ant-space")
    );
    rowItem.classList.add("nb-quick-filter-row-item");
    leftGroup == null ? void 0 : leftGroup.classList.add("nb-quick-filter-left-group");
    if (rightGroup) {
      actionRow == null ? void 0 : actionRow.classList.add("nb-quick-filter-action-row");
      rightGroup.classList.add("nb-quick-filter-right-group");
    }
    return () => {
      rowItem.classList.remove("nb-quick-filter-row-item");
      if (!(leftGroup == null ? void 0 : leftGroup.querySelector(".nb-quick-filter-row-item"))) {
        leftGroup == null ? void 0 : leftGroup.classList.remove("nb-quick-filter-left-group");
        actionRow == null ? void 0 : actionRow.classList.remove("nb-quick-filter-action-row");
        rightGroup == null ? void 0 : rightGroup.classList.remove("nb-quick-filter-right-group");
      }
    };
  }, []);
  let control;
  if (styleType === "select") {
    control = /* @__PURE__ */ import_react.default.createElement(
      import_antd.Select,
      {
        allowClear: true,
        disabled: isDisabled,
        mode: multiple ? "multiple" : void 0,
        options,
        placeholder: options.length ? allText : noOptionsText,
        size: "middle",
        style: { minWidth: 180 },
        value: normalizedValue,
        onChange: (next) => onChange((0, import_utils.normalizeQuickFilterValue)(next, multiple))
      }
    );
  } else if (multiple) {
    const selected = normalizedValue;
    control = /* @__PURE__ */ import_react.default.createElement(import_antd.Space, { size: 8, wrap: true }, /* @__PURE__ */ import_react.default.createElement(import_antd.Button, { size: "middle", type: selected.length ? "default" : "primary", onClick: () => onChange(void 0) }, allText), /* @__PURE__ */ import_react.default.createElement(
      import_antd.Checkbox.Group,
      {
        disabled: isDisabled,
        options,
        style: { display: "inline-flex", alignItems: "center", gap: 8 },
        value: selected,
        onChange: (next) => onChange(next)
      }
    ));
  } else {
    control = /* @__PURE__ */ import_react.default.createElement(
      import_antd.Radio.Group,
      {
        disabled: isDisabled,
        optionType: "button",
        buttonStyle: "solid",
        size: "middle",
        value: normalizedValue === void 0 ? CLEAR_VALUE : normalizedValue,
        onChange: (event) => onChange(event.target.value === CLEAR_VALUE ? void 0 : event.target.value)
      },
      /* @__PURE__ */ import_react.default.createElement(import_antd.Radio.Button, { value: CLEAR_VALUE }, allText),
      options.map((option) => /* @__PURE__ */ import_react.default.createElement(import_antd.Radio.Button, { key: String(option.value), value: option.value, disabled: option.disabled }, option.label))
    );
  }
  const content = /* @__PURE__ */ import_react.default.createElement("div", { ref: rowRef, className: "nb-quick-filter-row", style: { display: "flex", width: "100%" } }, /* @__PURE__ */ import_react.default.createElement("style", null, QUICK_FILTER_ROW_STYLES), /* @__PURE__ */ import_react.default.createElement(import_antd.Space, { size: 10, align: "center", wrap: true }, showTitle && title ? /* @__PURE__ */ import_react.default.createElement(import_antd.Typography.Text, null, title) : null, control));
  return tooltip ? /* @__PURE__ */ import_react.default.createElement(import_antd.Tooltip, { title: tooltip }, content) : content;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  QuickFilterControl,
  useResolvedOptions
});
