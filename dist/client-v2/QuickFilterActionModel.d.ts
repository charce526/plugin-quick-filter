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
    private static hasTarget;
    getQuickFilterConfig(): QuickFilterActionProps;
    private normalizeForMode;
    getCurrentValue(): any;
    applyDefaultValueOnce(): void;
    applyValue(value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined): void;
    detach(): void;
    destroy(): Promise<boolean>;
    /**
     * NocoBase only wraps actions rendered on the RIGHT of a collection block's
     * action bar with `Droppable` (see `TableBlockModel#renderComponent`).
     * Quick filters stay on the left, so they register their own drop target
     * here and still take part in the block's native `DndProvider`: dropping one
     * quick filter onto another calls `flowEngine.moveModel(active.uid,
     * over.uid)` and rewrites the shared `sortIndex` of the action group.
     */
    render(): React.JSX.Element;
}
export declare function isQuickFilterActionModel(model: any): boolean;
/**
 * Adds the native drag handle to the quick-filter float toolbar.
 *
 * NocoBase passes `{ key: 'drag-handler', component: DragHandler, sort: 1 }`
 * as an `extraToolbarItem` for every action rendered on the right of a
 * collection block's action bar. Quick filters render on the left
 * (`position: 'left'`) and therefore get no handle from the block, so the
 * official `flowSettings.addToolbarItem` extension point is used instead.
 * The `visible` guard is the exact complement of the block's branch: the
 * handle is added only for quick filters that the block did not handle, which
 * keeps a single handle when a filter is moved to the right group.
 */
export declare function registerQuickFilterDragHandler(flowEngine: any): void;
export {};
