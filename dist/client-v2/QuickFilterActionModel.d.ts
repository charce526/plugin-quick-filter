import { ActionModel } from '@nocobase/client-v2';
import React from 'react';
import type { QuickFilterConfig, QuickFilterPrimitive } from '../shared/types';
type QuickFilterActionProps = Omit<QuickFilterConfig, 'style' | 'defaultValue'> & {
    style?: any;
    defaultValue?: any;
    type?: 'default';
    position?: 'left' | 'right';
};
export declare class QuickFilterActionModel extends ActionModel {
    static scene: "collection";
    props: QuickFilterActionProps;
    defaultProps: QuickFilterActionProps;
    enableEditTooltip: boolean;
    enableEditTitle: boolean;
    enableEditIcon: boolean;
    enableEditIconOnly: boolean;
    enableEditType: boolean;
    enableEditDanger: boolean;
    private currentValue;
    private hasCurrentValue;
    private defaultValueApplied;
    getQuickFilterConfig(): QuickFilterActionProps;
    getCurrentValue(): any;
    applyDefaultValueOnce(): void;
    applyValue(value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined): void;
    detach(): void;
    destroy(): Promise<boolean>;
    render(): React.JSX.Element;
}
export {};
