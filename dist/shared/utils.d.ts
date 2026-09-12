import type { CollectionFieldLike, QuickFilterConfig, QuickFilterOption, QuickFilterPrimitive } from './types';
export declare function getFieldInterface(field?: CollectionFieldLike): string;
export declare function getFieldTitle(field?: CollectionFieldLike): any;
export declare function isSupportedField(field?: CollectionFieldLike): boolean;
export declare function isArrayInterface(fieldInterface?: string): boolean;
export declare function hasFilterValue(value: unknown): boolean;
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
export declare function serializableOptions(field?: CollectionFieldLike): QuickFilterOption[];
export declare function createDefaultConfig(field: CollectionFieldLike): QuickFilterConfig;
