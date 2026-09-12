import type {
  CollectionFieldLike,
  QuickFilterConfig,
  QuickFilterOption,
  QuickFilterPrimitive,
} from './types';
import { SUPPORTED_INTERFACES } from './types';

const ARRAY_INTERFACES = new Set(['checkboxGroup', 'multipleSelect']);

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
  if (!candidateValues?.length) return options;
  return options.filter((option) =>
    candidateValues.some(
      (candidate) => Object.is(candidate, option.value) || String(candidate) === String(option.value),
    ),
  );
}

export function defaultOperator(fieldInterface?: string, multiple = false): string {
  if (isArrayInterface(fieldInterface)) return multiple ? '$anyOf' : '$match';
  return multiple ? '$in' : '$eq';
}

export function operatorOptions(fieldInterface?: string) {
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
  const multiple = config.style === 'multiButton' || Boolean(config.multiple);
  const requested = config.operator || defaultOperator(fieldInterface, multiple);
  if (!multiple) return requested;

  if (isArrayInterface(fieldInterface)) {
    if (requested === '$match') return '$anyOf';
    if (requested === '$notMatch') return '$noneOf';
  } else {
    if (requested === '$eq') return '$in';
    if (requested === '$ne') return '$notIn';
  }
  return requested;
}

export function buildQuickFilter(
  config: QuickFilterConfig,
  value: unknown,
  fieldInterface?: string,
): Record<string, any> | undefined {
  if (!config.fieldName || !hasFilterValue(value)) return undefined;
  const multiple = config.style === 'multiButton' || Boolean(config.multiple);
  let normalizedValue: any = multiple && !Array.isArray(value) ? [value] : value;

  if (config.candidateValues?.length) {
    const allowed = (candidate: unknown) =>
      config.candidateValues?.some(
        (item) => Object.is(item, candidate) || String(item) === String(candidate),
      );
    normalizedValue = Array.isArray(normalizedValue)
      ? normalizedValue.filter(allowed)
      : allowed(normalizedValue)
        ? normalizedValue
        : undefined;
  }

  if (!hasFilterValue(normalizedValue)) return undefined;
  return {
    [config.fieldName]: {
      [effectiveOperator(config, fieldInterface)]: normalizedValue,
    },
  };
}

export function serializableOptions(field?: CollectionFieldLike): QuickFilterOption[] {
  return resolveFieldOptionsSync(field).map(({ label, value, disabled }) => ({
    label: typeof label === 'string' || typeof label === 'number' ? label : String(value),
    value,
    disabled,
  }));
}

export function createDefaultConfig(field: CollectionFieldLike): QuickFilterConfig {
  const fieldInterface = getFieldInterface(field);
  return {
    fieldName: String(field.name || ''),
    fieldTitle: getFieldTitle(field),
    showTitle: true,
    style: 'select',
    multiple: false,
    operator: defaultOperator(fieldInterface, false),
    options: serializableOptions(field),
  };
}
