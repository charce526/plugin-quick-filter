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
var types_exports = {};
__export(types_exports, {
  OPTION_INTERFACES: () => OPTION_INTERFACES,
  SUPPORTED_INTERFACES: () => SUPPORTED_INTERFACES,
  TEXT_INTERFACES: () => TEXT_INTERFACES
});
module.exports = __toCommonJS(types_exports);
const OPTION_INTERFACES = [
  "select",
  "dictDataSingle",
  "radioGroup",
  "checkboxGroup",
  "multipleSelect",
  "approvalStatus"
];
const TEXT_INTERFACES = ["input", "textarea", "email", "phone", "url"];
const SUPPORTED_INTERFACES = [...OPTION_INTERFACES, ...TEXT_INTERFACES];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OPTION_INTERFACES,
  SUPPORTED_INTERFACES,
  TEXT_INTERFACES
});
