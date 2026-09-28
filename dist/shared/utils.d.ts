import type { CollectionFieldLike, QuickFilterConfig, QuickFilterOption, QuickFilterPrimitive } from './types';
/** Search-box width bounds; the control never exceeds its container. */
export declare const MIN_INPUT_WIDTH = 120;
export declare const MAX_INPUT_WIDTH = 800;
export declare const DEFAULT_TEXT_INPUT_WIDTH = 280;
export declare const DEFAULT_SMART_INPUT_WIDTH = 320;
export declare function getFieldInterface(field?: CollectionFieldLike): string;
export declare function getFieldTitle(field?: CollectionFieldLike): any;
export declare function isSupportedField(field?: CollectionFieldLike): boolean;
export declare function isArrayInterface(fieldInterface?: string): boolean;
export declare function isTextInterface(fieldInterface?: string): boolean;
export declare function isTextField(field?: CollectionFieldLike): boolean;
/**
 * Smart filter: one search box that scans several text fields at once.
 * Only text interfaces participate, because the control always submits a
 * keyword and the operators are the text ones (contains / equals).
 */
export declare function isSmartFilter(config?: Pick<QuickFilterConfig, 'mode'>): boolean;
export declare function smartFilterFields(fields?: CollectionFieldLike[]): CollectionFieldLike[];
export declare function normalizeFieldNames(value: unknown): string[];
export declare function defaultSmartOperator(operator?: string): string;
export declare function smartOperatorOptions(): {
    value: string;
    label: string;
}[];
export declare function hasFilterValue(value: unknown): boolean;
export declare function normalizeQuickFilterArray(value: unknown): QuickFilterPrimitive[];
export declare function normalizeQuickFilterValue(value: unknown, multiple: boolean): QuickFilterPrimitive | QuickFilterPrimitive[] | undefined;
export declare function normalizeInputWidth(value: unknown, fallback?: number): number;
export declare function smartInputWidth(config: Pick<QuickFilterConfig, 'mode' | 'inputWidth'>): number;
export declare function normalizeTextFilterValue(value: unknown): string | undefined;
export declare function normalizeQuickFilterValueByOperator(operator: string, value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined): QuickFilterPrimitive | QuickFilterPrimitive[] | undefined;
export declare function normalizeOptions(input: any): QuickFilterOption[];
export declare function resolveFieldOptionsSync(field?: CollectionFieldLike): QuickFilterOption[];
export declare function resolveFieldOptions(field?: CollectionFieldLike): Promise<QuickFilterOption[]>;
export declare function restrictOptions(options: QuickFilterOption[], candidateValues?: QuickFilterPrimitive[]): QuickFilterOption[];
export declare function defaultOperator(fieldInterface?: string, multiple?: boolean): string;
export declare function operatorOptions(fieldInterface?: string): {
    value: string;
    label: string;
}[];
export declare function effectiveOperator(config: QuickFilterConfig, fieldInterface?: string): string;
export declare function buildQuickFilter(config: QuickFilterConfig, value: unknown, fieldInterface?: string): Record<string, any> | undefined;
/**
 * (A contains keyword) OR (B contains keyword) — one condition per selected
 * field, combined with `$or` so any matching field keeps the record.
 */
export declare function buildSmartFilter(config: QuickFilterConfig, value: unknown): Record<string, any> | undefined;
export declare function resolveFilterMode(config: Pick<QuickFilterConfig, 'mode'>, fieldInterface?: string): {
    smart: boolean;
    textFilter: boolean;
};
export declare function buildQuickOrSmartFilter(config: QuickFilterConfig, value: unknown, fieldInterface?: string): Record<string, any> | undefined;
export declare function serializableOptions(field?: CollectionFieldLike): QuickFilterOption[];
export declare function createSmartFilterConfig(fieldNames?: string[]): QuickFilterConfig;
export declare function createDefaultConfig(field: CollectionFieldLike): QuickFilterConfig;
