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
  buildQuickOrSmartFilter,
  createDefaultConfig,
  createSmartFilterConfig,
  defaultOperator,
  defaultSmartOperator,
  getFieldInterface,
  getFieldTitle,
  hasFilterValue,
  isSmartFilter,
  isSupportedField,
  isTextInterface,
  normalizeFieldNames,
  normalizeQuickFilterArray,
  normalizeQuickFilterValue,
  normalizeTextFilterValue,
  operatorOptions,
  serializableOptions,
  smartFilterFields,
  smartOperatorOptions,
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

/** Smart filters search a keyword, so only text interfaces are offered. */
function getTextFields(ctx: any): CollectionFieldLike[] {
  return smartFilterFields(getFields(ctx));
}

function getField(ctx: any, name?: string): CollectionFieldLike | undefined {
  if (!name) return undefined;
  const collection = getCollection(ctx);
  return collection?.getField?.(name) || getFields(ctx).find((field) => field.name === name);
}

interface QuickFilterTarget {
  smart: boolean;
  textFilter: boolean;
  field?: CollectionFieldLike;
  fieldInterface?: string;
}

/**
 * `CollectionBlockModel#resource` is declared as the base resource type, while
 * quick filters need the multi-record APIs (filter groups, paging, refresh).
 * Cast through `unknown` so the narrower type is accepted on every 2.2.x build
 * instead of failing TS2352 where the two declarations do not overlap.
 */
function getBlockResource(blockModel?: CollectionBlockModel): MultiRecordResource | undefined {
  return blockModel?.resource as unknown as MultiRecordResource | undefined;
}

function resolveTarget(ctx: any, config: QuickFilterActionProps): QuickFilterTarget {
  const smart = isSmartFilter(config);
  const field = smart ? undefined : getField(ctx, config.fieldName);
  const fieldInterface = smart ? undefined : getFieldInterface(field) || config.fieldInterface;
  return { smart, textFilter: smart || isTextInterface(fieldInterface), field, fieldInterface };
}

function QuickFilterRuntime({ model }: { model: QuickFilterActionModel }) {
  const config = model.getQuickFilterConfig();
  const { smart, textFilter, field, fieldInterface } = resolveTarget(model.context, config);
  const configKey = JSON.stringify({
    mode: config.mode,
    fieldName: smart ? undefined : config.fieldName,
    fieldNames: smart ? config.fieldNames : undefined,
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

  const title = smart
    ? model.context.t(config.fieldTitle || 'Smart filter', { ns: NAMESPACE })
    : model.context.t(config.fieldTitle || getFieldTitle(field) || config.fieldName, {
        ns: NAMESPACE,
      });

  const commonProps = {
    title,
    showTitle: config.showTitle !== false,
    tooltip: config.tooltip,
    value,
    fullRow: config.fullRow,
  };

  return textFilter ? (
    <QuickTextFilterControl
      {...commonProps}
      placeholder={
        config.placeholder ||
        model.context.t(smart ? 'Search selected fields' : 'Enter keyword', { ns: NAMESPACE })
      }
      searchText={model.context.t('Search', { ns: NAMESPACE })}
      inputWidth={smart ? 320 : undefined}
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

  private static hasTarget(config?: QuickFilterActionProps): boolean {
    return Boolean(config?.fieldName) || Boolean(config?.fieldNames?.length);
  }

  getQuickFilterConfig(): QuickFilterActionProps {
    const initialConfig = this.getStepParams('quickFilterInit', 'field') as
      | QuickFilterActionProps
      | undefined;
    // Once the model carries its own target (single field or smart-filter field
    // list) the persisted props win; the initialization parameters are only a
    // fallback for models whose props were not kept by the page shell.
    if (QuickFilterActionModel.hasTarget(this.props)) return this.props;
    if (!QuickFilterActionModel.hasTarget(initialConfig)) return this.props;
    return {
      ...this.props,
      ...initialConfig,
    };
  }

  private normalizeForMode(
    config: QuickFilterActionProps,
    value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined,
    textFilter: boolean,
  ) {
    const multiple = !textFilter && (config.style === 'multiButton' || Boolean(config.multiple));
    return textFilter
      ? normalizeTextFilterValue(value)
      : normalizeQuickFilterValue(value, multiple);
  }

  getCurrentValue() {
    const config = this.getQuickFilterConfig();
    return this.hasCurrentValue ? this.currentValue : config.defaultValue;
  }

  applyDefaultValueOnce() {
    if (this.defaultValueApplied) return;
    this.defaultValueApplied = true;

    const config = this.getQuickFilterConfig();
    const { textFilter } = resolveTarget(this.context, config);
    const defaultValue = this.normalizeForMode(config, config.defaultValue, textFilter);
    this.currentValue = defaultValue;
    this.hasCurrentValue = true;
    if (hasFilterValue(defaultValue)) this.applyValue(defaultValue);
  }

  applyValue(value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined) {
    const config = this.getQuickFilterConfig();
    const { textFilter, fieldInterface } = resolveTarget(this.context, config);
    const normalizedValue = this.normalizeForMode(config, value, textFilter);
    this.currentValue = normalizedValue;
    this.hasCurrentValue = true;

    const blockModel = this.context.blockModel as CollectionBlockModel;
    const resource = getBlockResource(blockModel);
    if (!blockModel || !resource) return;

    const filter = buildQuickOrSmartFilter(config, normalizedValue, fieldInterface);
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
    const resource = getBlockResource(blockModel);
    blockModel?.setFilterActive?.(this.uid, false);
    resource?.removeFilterGroup?.(this.uid);
  }

  async destroy() {
    const destroyed = await super.destroy();
    if (destroyed) this.applyValue(undefined);
    return destroyed;
  }

  render() {
    return <QuickFilterRuntime model={this} />;
  }
}

function smartFilterMenuItems(ctx: any) {
  const textFields = getTextFields(ctx);
  if (!textFields.length) return [];
  const initialConfig: QuickFilterActionProps = {
    ...(createSmartFilterConfig([String(textFields[0].name || '')]) as QuickFilterActionProps),
    type: 'default',
    position: 'left',
  };
  return [
    {
      key: 'quick-filter-smart',
      label: tExpr('Smart filter', { ns: NAMESPACE }),
      useModel: 'QuickFilterActionModel',
      createModelOptions: () => ({
        use: 'QuickFilterActionModel',
        props: { ...initialConfig },
        stepParams: {
          quickFilterInit: {
            field: { ...initialConfig },
          },
        },
      }),
    },
  ];
}

QuickFilterActionModel.define({
  label: tExpr('Quick filter', { ns: NAMESPACE }),
  sort: 6,
  children: async (ctx) => [
    ...smartFilterMenuItems(ctx),
    ...getFields(ctx).map((field) => {
      const initialConfig: QuickFilterActionProps = {
        ...createDefaultConfig(field),
        position: 'left',
      };
      return {
        key: 'quick-filter-' + field.name,
        label: getFieldTitle(field),
        useModel: 'QuickFilterActionModel',
        createModelOptions: () => ({
          use: 'QuickFilterActionModel',
          props: { ...initialConfig },
          stepParams: {
            quickFilterInit: {
              field: { ...initialConfig },
            },
          },
        }),
      };
    }),
  ],
});

QuickFilterActionModel.registerFlow({
  key: 'quickFilterSettings',
  title: tExpr('Quick filter settings', { ns: NAMESPACE }),
  steps: {
    basic: {
      title: tExpr('Basic settings', { ns: NAMESPACE }),
      uiSchema(ctx) {
        const config = ctx.model.getQuickFilterConfig();
        // Smart filters target several fields at once, so the single-field
        // picker is replaced by a multiple text-field picker.
        if (isSmartFilter(config)) {
          return {
            fieldNames: {
              type: 'array',
              title: tExpr('Target field', { ns: NAMESPACE }),
              required: true,
              enum: getTextFields(ctx).map((field) => ({
                label: getFieldTitle(field),
                value: field.name,
              })),
              'x-decorator': 'FormItem',
              'x-component': 'Select',
              'x-component-props': { mode: 'multiple', allowClear: true },
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
        }
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
        const config = ctx.model.getQuickFilterConfig();
        return {
          fieldName: config.fieldName,
          fieldNames: normalizeFieldNames(config.fieldNames),
          fieldTitle: config.fieldTitle,
          showTitle: config.showTitle !== false,
          tooltip: config.tooltip,
          fullRow: Boolean(config.fullRow),
        };
      },
      handler(ctx, params) {
        const config = ctx.model.getQuickFilterConfig();
        if (isSmartFilter(config)) {
          const previous = normalizeFieldNames(config.fieldNames).join(',');
          const nextFieldNames = normalizeFieldNames(params.fieldNames);
          const changed = previous !== nextFieldNames.join(',');
          ctx.model.setProps({
            mode: 'smart',
            fieldName: '',
            fieldNames: nextFieldNames,
            fieldInterface: undefined,
            fieldTitle: params.fieldTitle || '',
            showTitle: params.showTitle !== false,
            tooltip: params.tooltip,
            fullRow: Boolean(params.fullRow),
          });
          // Re-run the current keyword against the new field set when nothing
          // was typed yet; otherwise wait for the next submitted search.
          if (changed) ctx.model.applyValue(ctx.model.getCurrentValue());
          return;
        }
        const previous = config.fieldName;
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
          style: isTextInterface(getFieldInterface(field)) ? undefined : config.style || 'select',
          multiple: isTextInterface(getFieldInterface(field)) ? false : config.multiple,
          options: isTextInterface(getFieldInterface(field)) ? undefined : serializableOptions(field),
          candidateValues:
            changed || isTextInterface(getFieldInterface(field))
              ? undefined
              : config.candidateValues,
          defaultValue: changed ? undefined : config.defaultValue,
          operator: changed
            ? defaultOperator(getFieldInterface(field), Boolean(config.multiple))
            : config.operator,
        });
      },
    },
    display: {
      title: tExpr('Display settings', { ns: NAMESPACE }),
      uiSchema(ctx) {
        const config = ctx.model.getQuickFilterConfig();
        const { textFilter } = resolveTarget(ctx, config);
        if (textFilter) {
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
        const config = ctx.model.getQuickFilterConfig();
        const { textFilter } = resolveTarget(ctx, config);
        if (textFilter) {
          return { placeholder: config.placeholder };
        }
        return {
          style: config.style || 'select',
          multiple: config.style === 'multiButton' || Boolean(config.multiple),
        };
      },
      handler(ctx, params) {
        const config = ctx.model.getQuickFilterConfig();
        // Smart filters have no `fieldInterface`, so the branch must follow the
        // resolved mode (`resolveTarget`) exactly like the schema above,
        // otherwise the placeholder is written to the style/multiple branch and
        // the search box keeps its default hint.
        const { textFilter } = resolveTarget(ctx, config);
        if (textFilter) {
          ctx.model.setProps({ placeholder: params.placeholder });
          return;
        }
        const field = getField(ctx, config.fieldName);
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
        const config = ctx.model.getQuickFilterConfig();
        if (isSmartFilter(config)) {
          return {
            operator: {
              title: tExpr('Operator', { ns: NAMESPACE }),
              enum: smartOperatorOptions().map((item) => ({
                value: item.value,
                label: tExpr(item.label, { ns: NAMESPACE }),
              })),
              'x-decorator': 'FormItem',
              'x-component': 'Select',
            },
            defaultValue: {
              title: tExpr('Default value', { ns: NAMESPACE }),
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          };
        }
        const field = getField(ctx, config.fieldName);
        const fieldInterface = getFieldInterface(field) || config.fieldInterface;
        const textFilter = isTextInterface(fieldInterface);
        const options = serializableOptions(field);
        const multiple = config.style === 'multiButton' || Boolean(config.multiple);
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
        const config = ctx.model.getQuickFilterConfig();
        if (isSmartFilter(config)) {
          return {
            operator: defaultSmartOperator(config.operator),
            candidateValues: undefined,
            defaultValue: normalizeTextFilterValue(config.defaultValue),
          };
        }
        const field = getField(ctx, config.fieldName);
        const fieldInterface = getFieldInterface(field) || config.fieldInterface;
        const textFilter = isTextInterface(fieldInterface);
        const multiple = config.style === 'multiButton' || Boolean(config.multiple);
        return {
          operator: config.operator || defaultOperator(fieldInterface, multiple),
          candidateValues: textFilter
            ? undefined
            : normalizeQuickFilterArray(config.candidateValues),
          defaultValue: textFilter
            ? normalizeTextFilterValue(config.defaultValue)
            : normalizeQuickFilterValue(config.defaultValue, multiple),
        };
      },
      handler(ctx, params) {
        const config = ctx.model.getQuickFilterConfig();
        if (isSmartFilter(config)) {
          const defaultValue = normalizeTextFilterValue(params.defaultValue);
          ctx.model.setProps({
            operator: defaultSmartOperator(params.operator),
            candidateValues: undefined,
            defaultValue,
          });
          ctx.model.applyValue(defaultValue);
          return;
        }
        const field = getField(ctx, config.fieldName);
        const fieldInterface = getFieldInterface(field) || config.fieldInterface;
        const textFilter = isTextInterface(fieldInterface);
        const multiple = !textFilter && (config.style === 'multiButton' || Boolean(config.multiple));
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
