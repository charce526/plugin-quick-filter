export const SUPPORTED_INTERFACES = [
  'select',
  'dictDataSingle',
  'radioGroup',
  'checkboxGroup',
  'multipleSelect',
  'approvalStatus',
] as const;

export type SupportedInterface = (typeof SUPPORTED_INTERFACES)[number];
export type QuickFilterStyle = 'select' | 'button' | 'multiButton';
export type QuickFilterPrimitive = string | number | boolean;

export interface QuickFilterOption {
  label: any;
  value: QuickFilterPrimitive;
  disabled?: boolean;
}

export interface QuickFilterConfig {
  fieldName: string;
  fieldTitle?: string;
  showTitle?: boolean;
  tooltip?: string;
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
