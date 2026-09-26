import type {
  CollectionFieldLike,
  QuickFilterConfig,
  QuickFilterOption,
  QuickFilterPrimitive,
} from './types';
import { SMART_FILTER_MODE, SUPPORTED_INTERFACES, TEXT_INTERFACES } from './types';

const ARRAY_INTERFACES = new Set(['checkboxGroup', 'multipleSelect']);
const ARRAY_VALUE_OPERATORS = new Set([
  '$match',
  '$notMatch',
  '$anyOf',
  '$noneOf',
  '$in',
  '$notIn',
]);

export function getFieldInterface(field?: CollectionFieldLike): string {
  return String(field?.interface || field?.options?.interface || '');
}

export function getFieldTitle(field?: CollectionFieldLike): any {
  return field?.title || field?.uiSchema?.title || field?.name || '';
}

export function isSupportedField(field?: CollectionFieldLike): boolean {
  return (
    SUPPORTED_INTERFACES.includes(getFieldInterface(field) as any) &&
    field?.filterable !== false &&
    field?.options?.filterable !== false
  );
}

export function isArrayInterface(fieldInterface?: string): boolean {
  return ARRAY_INTERFACES.has(String(fieldInterface || ''));
}

export function isTextInterface(fieldInterface?: string): boolean {
  return TEXT_INTERFACES.includes(String(fieldInterface || '') as any);
}

export function isTextField(field?: CollectionFieldLike): boolean {
  return isTextInterface(getFieldInterface(field));
}

/**
 * Smart filter: one search box that scans several text fields at once.
 * Only text interfaces participate, because the control always submits a
 * keyword and the operators are the text ones (contains / equals).
 */
export function isSmartFilter(config?: Pick<QuickFilterConfig, 'mode'>): boolean {
  return config?.mode === SMART_FILTER_MODE;
}

export function smartFilterFields(fields: CollectionFieldLike[] = []): CollectionFieldLike[] {
  return (fields || []).filter(isTextField);
}

export function normalizeFieldNames(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];
  const names: string[] = [];
  for (const item of raw) {
    const name = String(item ?? '').trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

export function defaultSmartOperator(operator?: string): string {
  return String(operator || '') === '$eq' ? '$eq' : '$includes';
}

export function smartOperatorOptions() {
  return [
    { value: '$includes', label: 'Contains' },
    { value: '$eq', label: 'Equals' },
  ];
}

export function hasFilterValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

function optionSource(field?: CollectionFieldLike): any {
  const uiSchema = field?.uiSchema || field?.options?.uiSchema || {};
  return (
    uiSchema.enum ||
    uiSchema['x-component-props']?.options ||
    field?.enum ||
    field?.options?.enum ||
    field?.options?.options
  );
}

function primitive(value: unknown): value is QuickFilterPrimitive {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

export function normalizeQuickFilterArray(value: unknown): QuickFilterPrimitive[] {
  const values = Array.isArray(value) ? value : primitive(value) ? [value] : [];
  return values.filter(primitive);
}

export function normalizeQuickFilterValue(
  value: unknown,
  multiple: boolean,
): QuickFilterPrimitive | QuickFilterPrimitive[] | undefined {
  const values = normalizeQuickFilterArray(value);
  return multiple ? values : values[0];
}

export function normalizeTextFilterValue(value: unknown): string | undefined {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized || undefined;
}

export function normalizeQuickFilterValueByOperator(
  operator: string,
  value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined,
): QuickFilterPrimitive | QuickFilterPrimitive[] | undefined {
  return ARRAY_VALUE_OPERATORS.has(operator) ? normalizeQuickFilterArray(value) : value;
}

export function normalizeOptions(input: any): QuickFilterOption[] {
  const source = Array.isArray(input) ? input : [];
  const result: QuickFilterOption[] = [];

  const visit = (items: any[]) => {
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
        disabled: Boolean(item.disabled),
      });
    }
  };

  visit(source);
  return result;
}

export function resolveFieldOptionsSync(field?: CollectionFieldLike): QuickFilterOption[] {
  return normalizeOptions(optionSource(field));
}

export async function resolveFieldOptions(field?: CollectionFieldLike): Promise<QuickFilterOption[]> {
  const direct = resolveFieldOptionsSync(field);
  if (direct.length) return direct;

  for (const resolver of [field?.getOptions, field?.getEnum]) {
    if (typeof resolver !== 'function') continue;
    try {
      const value = await resolver.call(field);
      const options = normalizeOptions(value);
      if (options.length) return options;
    } catch {
      // A field provider may require runtime context; the persisted fallback is used instead.
    }
  }
  return [];
}

export function restrictOptions(
  options: QuickFilterOption[],
  candidateValues?: QuickFilterPrimitive[],
): QuickFilterOption[] {
  const candidates = normalizeQuickFilterArray(candidateValues);
  if (!candidates.length) return options;
  return options.filter((option) =>
    candidates.some(
      (candidate) => Object.is(candidate, option.value) || String(candidate) === String(option.value),
    ),
  );
}

export function defaultOperator(fieldInterface?: string, multiple = false): string {
  if (isTextInterface(fieldInterface)) return '$includes';
  if (isArrayInterface(fieldInterface)) return multiple ? '$anyOf' : '$match';
  return multiple ? '$in' : '$eq';
}

export function operatorOptions(fieldInterface?: string) {
  if (isTextInterface(fieldInterface)) {
    return [
      { value: '$includes', label: 'Contains' },
      { value: '$notIncludes', label: 'Does not contain' },
      { value: '$eq', label: 'Equals' },
      { value: '$ne', label: 'Not equal' },
    ];
  }
  if (isArrayInterface(fieldInterface)) {
    return [
      { value: '$match', label: 'Matches' },
      { value: '$notMatch', label: 'Does not match' },
      { value: '$anyOf', label: 'Contains any of' },
      { value: '$noneOf', label: 'Contains none of' },
    ];
  }
  return [
    { value: '$eq', label: 'Equals' },
    { value: '$ne', label: 'Not equal' },
    { value: '$in', label: 'Is any of' },
    { value: '$notIn', label: 'Is none of' },
  ];
}

export function effectiveOperator(config: QuickFilterConfig, fieldInterface?: string): string {
  if (isTextInterface(fieldInterface || config.fieldInterface)) {
    return config.operator || defaultOperator(fieldInterface || config.fieldInterface);
  }
  const multiple = config.style === 'multiButton' || Boolean(config.multiple);
  const requested = config.operator || defaultOperator(fieldInterface, multiple);
  if (!multiple || isArrayInterface(fieldInterface)) return requested;

  if (requested === '$eq') return '$in';
  if (requested === '$ne') return '$notIn';
  return requested;
}

export function buildQuickFilter(
  config: QuickFilterConfig,
  value: unknown,
  fieldInterface?: string,
): Record<string, any> | undefined {
  const resolvedInterface = fieldInterface || config.fieldInterface;
  const textFilter = isTextInterface(resolvedInterface);
  const multiple = config.style === 'multiButton' || Boolean(config.multiple);
  const operator = effectiveOperator(config, resolvedInterface);
  let normalizedValue: any = textFilter
    ? normalizeTextFilterValue(value)
    : normalizeQuickFilterValue(value, multiple);
  if (!config.fieldName || !hasFilterValue(normalizedValue)) return undefined;

  const candidateValues = textFilter ? [] : normalizeQuickFilterArray(config.candidateValues);
  if (candidateValues.length) {
    const allowed = (candidate: unknown) =>
      candidateValues.some(
        (item) => Object.is(item, candidate) || String(item) === String(candidate),
      );
    normalizedValue = Array.isArray(normalizedValue)
      ? normalizedValue.filter(allowed)
      : allowed(normalizedValue)
        ? normalizedValue
        : undefined;
  }

  // NocoBase's array operators call array methods internally even when the
  // control only selected one option. Match the core filter normalization:
  // scalar -> [scalar], empty -> [].
  normalizedValue = normalizeQuickFilterValueByOperator(operator, normalizedValue);
  if (!hasFilterValue(normalizedValue)) return undefined;
  return {
    [config.fieldName]: {
      [operator]: normalizedValue,
    },
  };
}

/**
 * (A contains keyword) OR (B contains keyword) — one condition per selected
 * field, combined with `$or` so any matching field keeps the record.
 */
export function buildSmartFilter(
  config: QuickFilterConfig,
  value: unknown,
): Record<string, any> | undefined {
  const keyword = normalizeTextFilterValue(value);
  const fieldNames = normalizeFieldNames(config.fieldNames);
  if (!keyword || !fieldNames.length) return undefined;

  const operator = defaultSmartOperator(config.operator);
  return {
    $or: fieldNames.map((fieldName) => ({
      [fieldName]: { [operator]: keyword },
    })),
  };
}

export function resolveFilterMode(
  config: Pick<QuickFilterConfig, 'mode'>,
  fieldInterface?: string,
): { smart: boolean; textFilter: boolean } {
  const smart = isSmartFilter(config);
  return { smart, textFilter: smart || isTextInterface(fieldInterface) };
}

export function buildQuickOrSmartFilter(
  config: QuickFilterConfig,
  value: unknown,
  fieldInterface?: string,
): Record<string, any> | undefined {
  return isSmartFilter(config)
    ? buildSmartFilter(config, value)
    : buildQuickFilter(config, value, fieldInterface);
}

export function serializableOptions(field?: CollectionFieldLike): QuickFilterOption[] {
  return resolveFieldOptionsSync(field).map(({ label, value, disabled }) => ({
    label: typeof label === 'string' || typeof label === 'number' ? label : String(value),
    value,
    disabled,
  }));
}

export function createSmartFilterConfig(fieldNames: string[] = []): QuickFilterConfig {
  return {
    mode: SMART_FILTER_MODE,
    fieldName: '',
    fieldNames: normalizeFieldNames(fieldNames),
    fieldInterface: undefined,
    fieldTitle: '',
    showTitle: true,
    fullRow: false,
    defaultValue: undefined,
    multiple: false,
    style: undefined,
    operator: '$includes',
    candidateValues: undefined,
    options: undefined,
  };
}

export function createDefaultConfig(field: CollectionFieldLike): QuickFilterConfig {
  const fieldInterface = getFieldInterface(field);
  const textFilter = isTextInterface(fieldInterface);
  return {
    fieldName: String(field.name || ''),
    fieldInterface,
    fieldTitle: getFieldTitle(field),
    showTitle: true,
    fullRow: false,
    style: textFilter ? undefined : 'select',
    multiple: false,
    operator: defaultOperator(fieldInterface, false),
    options: textFilter ? undefined : serializableOptions(field),
  };
}
