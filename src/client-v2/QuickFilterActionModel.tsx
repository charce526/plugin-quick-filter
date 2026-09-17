import { MultiRecordResource, tExpr } from '@nocobase/flow-engine';
import { ActionModel, CollectionActionGroupModel, CollectionBlockModel } from '@nocobase/client-v2';
import React, { useEffect, useState } from 'react';
import { QuickFilterControl, QuickTextFilterControl } from '../shared/QuickFilterControl';
import { NAMESPACE } from '../shared/locale';
import type {
  CollectionFieldLike,
  QuickFilterConfig,
  QuickFilterPrimitive,
} from '../shared/types';
import {
  buildQuickFilter,
  createDefaultConfig,
  defaultOperator,
  getFieldInterface,
  getFieldTitle,
  hasFilterValue,
  isSupportedField,
  isTextInterface,
  normalizeQuickFilterArray,
  normalizeQuickFilterValue,
  normalizeTextFilterValue,
  operatorOptions,
  serializableOptions,
} from '../shared/utils';

type QuickFilterActionProps = Omit<QuickFilterConfig, 'style' | 'defaultValue'> & {
  // ActionModel reserves `style` for CSSProperties and `defaultValue` for
  // string/number values. This model renders its own control, so both are
  // widened to carry the quick-filter presentation mode and value.
  style?: any;
  defaultValue?: any;
  type?: 'default';
  position?: 'left' | 'right';
};

function getCollection(ctx: any) {
  return ctx.collection || ctx.blockModel?.collection;
}

function getFields(ctx: any): CollectionFieldLike[] {
  return (getCollection(ctx)?.getFields?.() || []).filter(isSupportedField);
}

function getField(ctx: any, name?: string): CollectionFieldLike | undefined {
  if (!name) return undefined;
  const collection = getCollection(ctx);
  return collection?.getField?.(name) || getFields(ctx).find((field) => field.name === name);
}

function QuickFilterRuntime({
  model,
  field,
}: {
  model: QuickFilterActionModel;
  field?: CollectionFieldLike;
}) {
  const config = model.props;
  const fieldInterface = getFieldInterface(field) || config.fieldInterface;
  const textFilter = isTextInterface(fieldInterface);
  const configKey = JSON.stringify({
    fieldName: config.fieldName,
    defaultValue: config.defaultValue,
    operator: config.operator,
    candidateValues: config.candidateValues,
    multiple: config.multiple,
    style: config.style,
    fieldInterface,
  });
  const [value, setValue] = useState<QuickFilterConfig['defaultValue']>(() => model.getCurrentValue());

  useEffect(() => {
    setValue(model.getCurrentValue());
  }, [configKey, model]);

  // FlowEngine may temporarily remount an action while the collection block is
  // refreshing. Keep resource mutations out of the React cleanup path and let
  // the model guard the initial default-value application instead.
  useEffect(() => model.applyDefaultValueOnce(), [model]);

  const change = (nextValue: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined) => {
    setValue(nextValue);
    model.applyValue(nextValue);
  };

  const commonProps = {
    title: model.context.t(config.fieldTitle || getFieldTitle(field) || config.fieldName, {
      ns: NAMESPACE,
    }),
    showTitle: config.showTitle !== false,
    tooltip: config.tooltip,
    value,
    fullRow: config.fullRow,
  };

  return textFilter ? (
    <QuickTextFilterControl
      {...commonProps}
      placeholder={config.placeholder || model.context.t('Enter keyword', { ns: NAMESPACE })}
      searchText={model.context.t('Search', { ns: NAMESPACE })}
      onSearch={change}
    />
  ) : (
    <QuickFilterControl
      {...commonProps}
      styleType={config.style || 'select'}
      multiple={config.multiple}
      field={field}
      fallbackOptions={config.options}
      candidateValues={config.candidateValues}
      allText={model.context.t('All', { ns: NAMESPACE })}
      noOptionsText={model.context.t('No options', { ns: NAMESPACE })}
      compileLabel={(label) => model.context.t(label)}
      onChange={change}
    />
  );
}

export class QuickFilterActionModel extends ActionModel {
  static scene = 'collection' as const;

  declare props: QuickFilterActionProps;

  defaultProps: QuickFilterActionProps = {
    type: 'default',
    position: 'left',
    fieldName: '',
    showTitle: true,
    fullRow: false,
    style: 'select',
    multiple: false,
  };

  enableEditTooltip = false;
  enableEditTitle = false;
  enableEditIcon = false;
  enableEditIconOnly = false;
  enableEditType = false;
  enableEditDanger = false;

  private currentValue: QuickFilterConfig['defaultValue'];
  private hasCurrentValue = false;
  private defaultValueApplied = false;

  getCurrentValue() {
    return this.hasCurrentValue ? this.currentValue : this.props.defaultValue;
  }

  applyDefaultValueOnce() {
    if (this.defaultValueApplied) return;
    this.defaultValueApplied = true;

    const field = getField(this.context, this.props.fieldName);
    const fieldInterface = getFieldInterface(field) || this.props.fieldInterface;
    const textFilter = isTextInterface(fieldInterface);
    const multiple = !textFilter && (this.props.style === 'multiButton' || Boolean(this.props.multiple));
    const defaultValue = textFilter
      ? normalizeTextFilterValue(this.props.defaultValue)
      : normalizeQuickFilterValue(this.props.defaultValue, multiple);
    this.currentValue = defaultValue;
    this.hasCurrentValue = true;
    if (hasFilterValue(defaultValue)) this.applyValue(defaultValue);
  }

  applyValue(value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined) {
    const field = getField(this.context, this.props.fieldName);
    const fieldInterface = getFieldInterface(field) || this.props.fieldInterface;
    const textFilter = isTextInterface(fieldInterface);
    const multiple = !textFilter && (this.props.style === 'multiButton' || Boolean(this.props.multiple));
    const normalizedValue = textFilter
      ? normalizeTextFilterValue(value)
      : normalizeQuickFilterValue(value, multiple);
    this.currentValue = normalizedValue;
    this.hasCurrentValue = true;

    const blockModel = this.context.blockModel as CollectionBlockModel;
    const resource = blockModel?.resource as MultiRecordResource;
    if (!blockModel || !resource) return;

    const filter = buildQuickFilter(this.props, normalizedValue, fieldInterface);
    const active = hasFilterValue(normalizedValue) && Boolean(filter);

    blockModel.setFilterActive(this.uid, active);
    if (filter) {
      resource.addFilterGroup(this.uid, filter);
      resource.setPage(1);
    } else {
      resource.removeFilterGroup(this.uid);
    }

    const loadingMode = blockModel.getDataLoadingMode?.();
    if (loadingMode === 'manual' && !active && !blockModel.hasActiveFilters()) {
      resource.setData([]);
      resource.setMeta({ count: 0, hasNext: false });
      resource.setPage?.(1);
      resource.loading = false;
    } else {
      resource.refresh();
    }
  }

  detach() {
    const blockModel = this.context.blockModel as CollectionBlockModel;
    const resource = blockModel?.resource as MultiRecordResource;
    blockModel?.setFilterActive?.(this.uid, false);
    resource?.removeFilterGroup?.(this.uid);
  }

  async destroy() {
    const destroyed = await super.destroy();
    if (destroyed) this.applyValue(undefined);
    return destroyed;
  }

  render() {
    const field = getField(this.context, this.props.fieldName);
    return <QuickFilterRuntime model={this} field={field} />;
  }
}

QuickFilterActionModel.define({
  label: tExpr('Quick filter', { ns: NAMESPACE }),
  sort: 6,
  children: async (ctx) =>
    getFields(ctx).map((field) => ({
      key: 'quick-filter-' + field.name,
      label: getFieldTitle(field),
      useModel: 'QuickFilterActionModel',
      createModelOptions: () => ({
        use: 'QuickFilterActionModel',
        props: {
          ...createDefaultConfig(field),
          position: 'left',
        },
      }),
    })),
});

QuickFilterActionModel.registerFlow({
  key: 'quickFilterSettings',
  title: tExpr('Quick filter settings', { ns: NAMESPACE }),
  steps: {
    basic: {
      title: tExpr('Basic settings', { ns: NAMESPACE }),
      uiSchema(ctx) {
        const fields = getFields(ctx);
        return {
          fieldName: {
            title: tExpr('Target field', { ns: NAMESPACE }),
            required: true,
            enum: fields.map((field) => ({ label: getFieldTitle(field), value: field.name })),
            'x-decorator': 'FormItem',
            'x-component': 'Select',
          },
          fieldTitle: {
            title: tExpr('Field title', { ns: NAMESPACE }),
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          showTitle: {
            title: tExpr('Show title', { ns: NAMESPACE }),
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
          },
          tooltip: {
            title: tExpr('Tooltip', { ns: NAMESPACE }),
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
          },
          fullRow: {
            title: tExpr('Exclusive row', { ns: NAMESPACE }),
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
          },
        };
      },
      defaultParams(ctx) {
        return {
          fieldName: ctx.model.props.fieldName,
          fieldTitle: ctx.model.props.fieldTitle,
          showTitle: ctx.model.props.showTitle !== false,
          tooltip: ctx.model.props.tooltip,
          fullRow: Boolean(ctx.model.props.fullRow),
        };
      },
      handler(ctx, params) {
        const previous = ctx.model.props.fieldName;
        const field = getField(ctx, params.fieldName);
        const changed = previous !== params.fieldName;
        if (changed) ctx.model.applyValue(undefined);
        ctx.model.setProps({
          fieldName: params.fieldName,
          fieldInterface: getFieldInterface(field),
          fieldTitle: changed ? getFieldTitle(field) : params.fieldTitle || getFieldTitle(field),
          showTitle: params.showTitle !== false,
          tooltip: params.tooltip,
          fullRow: Boolean(params.fullRow),
          style: isTextInterface(getFieldInterface(field)) ? undefined : ctx.model.props.style || 'select',
          multiple: isTextInterface(getFieldInterface(field)) ? false : ctx.model.props.multiple,
          options: isTextInterface(getFieldInterface(field)) ? undefined : serializableOptions(field),
          candidateValues:
            changed || isTextInterface(getFieldInterface(field))
              ? undefined
              : ctx.model.props.candidateValues,
          defaultValue: changed ? undefined : ctx.model.props.defaultValue,
          operator: changed
            ? defaultOperator(getFieldInterface(field), Boolean(ctx.model.props.multiple))
            : ctx.model.props.operator,
        });
      },
    },
    display: {
      title: tExpr('Display settings', { ns: NAMESPACE }),
      uiSchema(ctx) {
        const field = getField(ctx, ctx.model.props.fieldName);
        if (isTextInterface(getFieldInterface(field) || ctx.model.props.fieldInterface)) {
          return {
            placeholder: {
              title: tExpr('Placeholder', { ns: NAMESPACE }),
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          };
        }
        return {
          style: {
            title: tExpr('Style', { ns: NAMESPACE }),
            enum: [
              { label: tExpr('Select', { ns: NAMESPACE }), value: 'select' },
              { label: tExpr('Button', { ns: NAMESPACE }), value: 'button' },
              { label: tExpr('Multiple buttons', { ns: NAMESPACE }), value: 'multiButton' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
          multiple: {
            title: tExpr('Multiple selection', { ns: NAMESPACE }),
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
          },
        };
      },
      defaultParams(ctx) {
        const field = getField(ctx, ctx.model.props.fieldName);
        if (isTextInterface(getFieldInterface(field) || ctx.model.props.fieldInterface)) {
          return { placeholder: ctx.model.props.placeholder };
        }
        return {
          style: ctx.model.props.style || 'select',
          multiple: ctx.model.props.style === 'multiButton' || Boolean(ctx.model.props.multiple),
        };
      },
      handler(ctx, params) {
        const field = getField(ctx, ctx.model.props.fieldName);
        const fieldInterface = getFieldInterface(field) || ctx.model.props.fieldInterface;
        if (isTextInterface(fieldInterface)) {
          ctx.model.setProps({ placeholder: params.placeholder });
          return;
        }
        const multiple = params.style === 'multiButton' || Boolean(params.multiple);
        ctx.model.setProps({
          style: params.style || 'select',
          multiple,
          operator: defaultOperator(getFieldInterface(field), multiple),
        });
        ctx.model.applyValue(ctx.model.getCurrentValue());
      },
    },
    values: {
      title: tExpr('Value settings', { ns: NAMESPACE }),
      uiSchema(ctx) {
        const field = getField(ctx, ctx.model.props.fieldName);
        const fieldInterface = getFieldInterface(field) || ctx.model.props.fieldInterface;
        const textFilter = isTextInterface(fieldInterface);
        const options = serializableOptions(field);
        const multiple = ctx.model.props.style === 'multiButton' || Boolean(ctx.model.props.multiple);
        return {
          operator: {
            title: tExpr('Operator', { ns: NAMESPACE }),
            enum: operatorOptions(fieldInterface).map((item) => ({
              value: item.value,
              label: tExpr(item.label, { ns: NAMESPACE }),
            })),
            'x-decorator': 'FormItem',
            'x-component': 'Select',
          },
          ...(textFilter
            ? {}
            : {
                candidateValues: {
                  type: 'array',
                  title: tExpr('Candidate values', { ns: NAMESPACE }),
                  enum: options,
                  'x-decorator': 'FormItem',
                  'x-component': 'Select',
                  'x-component-props': { mode: 'multiple', allowClear: true },
                },
              }),
          defaultValue: {
            title: tExpr('Default value', { ns: NAMESPACE }),
            'x-decorator': 'FormItem',
            'x-component': textFilter ? 'Input' : 'Select',
            ...(textFilter
              ? {}
              : {
                  enum: options,
                  'x-component-props': { mode: multiple ? 'multiple' : undefined, allowClear: true },
                }),
          },
        };
      },
      defaultParams(ctx) {
        const field = getField(ctx, ctx.model.props.fieldName);
        const fieldInterface = getFieldInterface(field) || ctx.model.props.fieldInterface;
        const textFilter = isTextInterface(fieldInterface);
        const multiple = ctx.model.props.style === 'multiButton' || Boolean(ctx.model.props.multiple);
        return {
          operator: ctx.model.props.operator || defaultOperator(fieldInterface, multiple),
          candidateValues: textFilter
            ? undefined
            : normalizeQuickFilterArray(ctx.model.props.candidateValues),
          defaultValue: textFilter
            ? normalizeTextFilterValue(ctx.model.props.defaultValue)
            : normalizeQuickFilterValue(ctx.model.props.defaultValue, multiple),
        };
      },
      handler(ctx, params) {
        const field = getField(ctx, ctx.model.props.fieldName);
        const fieldInterface = getFieldInterface(field) || ctx.model.props.fieldInterface;
        const textFilter = isTextInterface(fieldInterface);
        const multiple = !textFilter && (ctx.model.props.style === 'multiButton' || Boolean(ctx.model.props.multiple));
        const candidateValues = textFilter
          ? undefined
          : normalizeQuickFilterArray(params.candidateValues);
        const defaultValue = textFilter
          ? normalizeTextFilterValue(params.defaultValue)
          : normalizeQuickFilterValue(params.defaultValue, multiple);
        ctx.model.setProps({
          operator: params.operator,
          candidateValues,
          defaultValue,
        });
        ctx.model.applyValue(defaultValue);
      },
    },
  },
});

// NocoBase 2.2.x action groups keep an explicit registry in addition to the
// FlowEngine model registry. Registering in both places makes this action show
// up consistently in the V2 collection block's "Add action" menu.
CollectionActionGroupModel.registerActionModels({
  QuickFilterActionModel,
});
