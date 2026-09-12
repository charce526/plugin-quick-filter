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
    allText: React.ReactNode;
    noOptionsText: React.ReactNode;
    onChange: (value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined) => void;
    compileLabel?: (label: any) => React.ReactNode;
}
export declare function useResolvedOptions(field?: CollectionFieldLike, fallbackOptions?: QuickFilterOption[]): QuickFilterOption[];
export declare function QuickFilterControl(props: QuickFilterControlProps): React.JSX.Element;
