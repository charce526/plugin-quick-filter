import { MultiRecordResource, tExpr } from '@nocobase/flow-engine';
import { ActionModel, CollectionBlockModel } from '@nocobase/client-v2';
import React, { useEffect, useState } from 'react';
import { QuickFilterControl } from '../shared/QuickFilterControl';
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
  operatorOptions,
  serializableOptions,
} from '../shared/utils';

type QuickFilterActionProps = QuickFilterConfig & {
  type?: 'default';
  position?: 'left' | 'right';
  runtimeRevision?: number;
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
  const revision = config.runtimeRevision || 0;
  const configKey = JSON.stringify({
    fieldName: config.fieldName,
    defaultValue: config.defaultValue,
    operator: config.operator,
    multiple: config.multiple,
    style: config.style,
    revision,
  });
  const [value, setValue] = useState<QuickFilterConfig['defaultValue']>(config.defaultValue);

  useEffect(() => {
    setValue(config.defaultValue);
    model.applyValue(config.defaultValue);
    return () => model.detach();
  }, [configKey, model]);

  const change = (nextValue: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined) => {
    setValue(nextValue);
    model.applyValue(nextValue);
  };

  return (
    <QuickFilterControl
      title={model.context.t(config.fieldTitle || getFieldTitle(field) || config.fieldName, { ns: NAMESPACE })}
      showTitle={config.showTitle !== false}
      tooltip={config.tooltip}
      styleType={config.style || 'select'}
      multiple={config.multiple}
      value={value}
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
    style: 'select',
    multiple: false,
  };

  enableEditTooltip = false;
  enableEditTitle = false;
  enableEditIcon = false;
  enableEditIconOnly = false;
  enableEditType = false;
  enableEditDanger = false;

  applyValue(value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined) {
    const blockModel = this.context.blockModel as CollectionBlockModel;
    const resource = blockModel?.resource as MultiRecordResource;
    if (!blockModel || !resource) return;

    const field = getField(this.context, this.props.fieldName);
    const filter = buildQuickFilter(this.props, value, getFieldInterface(field));
    const active = hasFilterValue(value) && Boolean(filter);

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
        };
      },
      defaultParams(ctx) {
        return {
          fieldName: ctx.model.props.fieldName,
          fieldTitle: ctx.model.props.fieldTitle,
          showTitle: ctx.model.props.showTitle !== false,
          tooltip: ctx.model.props.tooltip,
        };
      },
      handler(ctx, params) {
        const previous = ctx.model.props.fieldName;
        const field = getField(ctx, params.fieldName);
        const changed = previous !== params.fieldName;
        ctx.model.setProps({
          fieldName: params.fieldName,
          fieldTitle: changed ? getFieldTitle(field) : params.fieldTitle || getFieldTitle(field),
          showTitle: params.showTitle !== false,
          tooltip: params.tooltip,
          options: serializableOptions(field),
          candidateValues: changed ? undefined : ctx.model.props.candidateValues,
          defaultValue: changed ? undefined : ctx.model.props.defaultValue,
          operator: changed
            ? defaultOperator(getFieldInterface(field), Boolean(ctx.model.props.multiple))
            : ctx.model.props.operator,
          runtimeRevision: Date.now(),
        });
      },
    },
    display: {
      title: tExpr('Display settings', { ns: NAMESPACE }),
      uiSchema: {
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
      },
      defaultParams(ctx) {
        return {
          style: ctx.model.props.style || 'select',
          multiple: ctx.model.props.style === 'multiButton' || Boolean(ctx.model.props.multiple),
        };
      },
      handler(ctx, params) {
        const multiple = params.style === 'multiButton' || Boolean(params.multiple);
        const field = getField(ctx, ctx.model.props.fieldName);
        ctx.model.setProps({
          style: params.style || 'select',
          multiple,
          operator: defaultOperator(getFieldInterface(field), multiple),
          runtimeRevision: Date.now(),
        });
      },
    },
    values: {
      title: tExpr('Value settings', { ns: NAMESPACE }),
      uiSchema(ctx) {
        const field = getField(ctx, ctx.model.props.fieldName);
        const options = serializableOptions(field);
        const multiple = ctx.model.props.style === 'multiButton' || Boolean(ctx.model.props.multiple);
        return {
          operator: {
            title: tExpr('Operator', { ns: NAMESPACE }),
            enum: operatorOptions(getFieldInterface(field)).map((item) => ({
              value: item.value,
              label: tExpr(item.label, { ns: NAMESPACE }),
            })),
            'x-decorator': 'FormItem',
            'x-component': 'Select',
          },
          candidateValues: {
            type: 'array',
            title: tExpr('Candidate values', { ns: NAMESPACE }),
            enum: options,
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            'x-component-props': { mode: 'multiple', allowClear: true },
          },
          defaultValue: {
            title: tExpr('Default value', { ns: NAMESPACE }),
            enum: options,
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            'x-component-props': { mode: multiple ? 'multiple' : undefined, allowClear: true },
          },
        };
      },
      defaultParams(ctx) {
        const field = getField(ctx, ctx.model.props.fieldName);
        const multiple = ctx.model.props.style === 'multiButton' || Boolean(ctx.model.props.multiple);
        return {
          operator: ctx.model.props.operator || defaultOperator(getFieldInterface(field), multiple),
          candidateValues: ctx.model.props.candidateValues,
          defaultValue: ctx.model.props.defaultValue,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          operator: params.operator,
          candidateValues: params.candidateValues,
          defaultValue: params.defaultValue,
          runtimeRevision: Date.now(),
        });
      },
    },
  },
});
