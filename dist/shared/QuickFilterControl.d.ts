import React from 'react';
import type { CollectionFieldLike, QuickFilterOption, QuickFilterPrimitive, QuickFilterStyle } from './types';
export interface QuickFilterControlProps {
    title?: React.ReactNode;
    showTitle?: boolean;
    tooltip?: React.ReactNode;
    styleType?: QuickFilterStyle;
    multiple?: boolean;
    value?: QuickFilterPrimitive | QuickFilterPrimitive[];
    field?: CollectionFieldLike;
    fallbackOptions?: QuickFilterOption[];
    candidateValues?: QuickFilterPrimitive[];
    disabled?: boolean;
    fullRow?: boolean;
    allText: React.ReactNode;
    noOptionsText: React.ReactNode;
    onChange: (value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined) => void;
    compileLabel?: (label: any) => React.ReactNode;
}
export interface QuickTextFilterControlProps {
    title?: React.ReactNode;
    showTitle?: boolean;
    tooltip?: React.ReactNode;
    value?: QuickFilterPrimitive | QuickFilterPrimitive[];
    placeholder?: string;
    searchText: React.ReactNode;
    fullRow?: boolean;
    disabled?: boolean;
    onSearch: (value: QuickFilterPrimitive | undefined) => void;
}
export declare function useResolvedOptions(field?: CollectionFieldLike, fallbackOptions?: QuickFilterOption[]): QuickFilterOption[];
export declare function QuickFilterControl(props: QuickFilterControlProps): React.JSX.Element;
export declare function QuickTextFilterControl(props: QuickTextFilterControlProps): React.JSX.Element;
