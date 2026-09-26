export const OPTION_INTERFACES = [
  'select',
  'dictDataSingle',
  'radioGroup',
  'checkboxGroup',
  'multipleSelect',
  'approvalStatus',
] as const;

export const TEXT_INTERFACES = ['input', 'textarea', 'email', 'phone', 'url'] as const;

export const SUPPORTED_INTERFACES = [...OPTION_INTERFACES, ...TEXT_INTERFACES] as const;

export type SupportedInterface = (typeof SUPPORTED_INTERFACES)[number];
export type QuickFilterStyle = 'select' | 'button' | 'multiButton';
export type QuickFilterMode = 'field' | 'smart';
export type QuickFilterPrimitive = string | number | boolean;

/**
 * Multi-field search mode. `fieldNames` carries every target at once, so a
 * single search box can look into several text fields with an OR condition.
 */
export const SMART_FILTER_MODE = 'smart' as const;

export interface QuickFilterOption {
  label: any;
  value: QuickFilterPrimitive;
  disabled?: boolean;
}

export interface QuickFilterConfig {
  fieldName: string;
  mode?: QuickFilterMode;
  /** Smart-filter targets; used only when `mode` is `smart`. */
  fieldNames?: string[];
  fieldInterface?: string;
  fieldTitle?: string;
  showTitle?: boolean;
  tooltip?: string;
  fullRow?: boolean;
  placeholder?: string;
  defaultValue?: QuickFilterPrimitive | QuickFilterPrimitive[];
  multiple?: boolean;
  style?: QuickFilterStyle;
  operator?: string;
  candidateValues?: QuickFilterPrimitive[];
  options?: QuickFilterOption[];
}

export interface CollectionFieldLike {
  name?: string;
  title?: any;
  interface?: string;
  filterable?: boolean;
  uiSchema?: Record<string, any>;
  options?: Record<string, any>;
  enum?: any[];
  getOptions?: () => any[] | Promise<any[]>;
  getEnum?: () => any[] | Promise<any[]>;
}
