import type { ISchema } from '@formily/react';
import { useField, useFieldSchema } from '@formily/react';
import { SchemaSettings, useCollection, useCompile, useDesignable } from '@nocobase/client';
import type { CollectionFieldLike, QuickFilterConfig } from '../shared/types';
import {
  defaultOperator,
  getFieldInterface,
  getFieldTitle,
  isSupportedField,
  isTextInterface,
  normalizeQuickFilterArray,
  normalizeQuickFilterValue,
  normalizeTextFilterValue,
  operatorOptions,
  serializableOptions,
} from '../shared/utils';
import { useQuickFilterTranslation } from './locale';

export const quickFilterSettings = new SchemaSettings({
  name: 'actionSettings:quickFilter',
  items: [
    {
      name: 'configuration',
      type: 'modal',
      useComponentProps() {
        const formilyField = useField();
        const fieldSchema = useFieldSchema();
        const collection = useCollection() as any;
        const compile = useCompile();
        const { dn } = useDesignable();
        const { t } = useQuickFilterTranslation();
        const config = (fieldSchema['x-component-props'] || {}) as QuickFilterConfig;
        const fields = ((collection?.fields || []) as CollectionFieldLike[]).filter(isSupportedField);
        const selectedField = fields.find((item) => item.name === config.fieldName) || fields[0];
        const options = serializableOptions(selectedField);
        const fieldInterface = getFieldInterface(selectedField);
        const textFilter = isTextInterface(fieldInterface || config.fieldInterface);
        const multiple = config.style === 'multiButton' || Boolean(config.multiple);

        return {
          title: t('Quick filter settings'),
          schema: {
            type: 'object',
            properties: {
              fieldName: {
                title: t('Target field'),
                default: config.fieldName,
                enum: fields.map((item) => ({
                  label: compile(getFieldTitle(item)),
                  value: item.name,
                })),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Select',
              },
              fieldTitle: {
                title: t('Field title'),
                default: config.fieldTitle,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
              showTitle: {
                title: t('Show title'),
                default: config.showTitle !== false,
                'x-decorator': 'FormItem',
                'x-component': 'Checkbox',
              },
              tooltip: {
                title: t('Tooltip'),
                default: config.tooltip,
                'x-decorator': 'FormItem',
                'x-component': 'Input.TextArea',
              },
              fullRow: {
                title: t('Exclusive row'),
                default: Boolean(config.fullRow),
                'x-decorator': 'FormItem',
                'x-component': 'Checkbox',
              },
              ...(textFilter
                ? {
                    placeholder: {
                      title: t('Placeholder'),
                      default: config.placeholder,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  }
                : {
                    style: {
                      title: t('Style'),
                      default: config.style || 'select',
                      enum: [
                        { label: t('Select'), value: 'select' },
                        { label: t('Button'), value: 'button' },
                        { label: t('Multiple buttons'), value: 'multiButton' },
                      ],
                      'x-decorator': 'FormItem',
                      'x-component': 'Radio.Group',
                    },
                    multiple: {
                      title: t('Multiple selection'),
                      default: multiple,
                      'x-decorator': 'FormItem',
                      'x-component': 'Checkbox',
                    },
                  }),
              operator: {
                title: t('Operator'),
                default: config.operator || defaultOperator(fieldInterface, multiple),
                enum: operatorOptions(fieldInterface).map((item) => ({
                  value: item.value,
                  label: t(item.label),
                })),
                'x-decorator': 'FormItem',
                'x-component': 'Select',
              },
              ...(textFilter
                ? {
                    defaultValue: {
                      title: t('Default value'),
                      default: normalizeTextFilterValue(config.defaultValue),
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  }
                : {
                    candidateValues: {
                      type: 'array',
                      title: t('Candidate values'),
                      default: normalizeQuickFilterArray(config.candidateValues),
                      enum: options,
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      'x-component-props': { mode: 'multiple', allowClear: true },
                    },
                    defaultValue: {
                      title: t('Default value'),
                      default: normalizeQuickFilterValue(config.defaultValue, multiple),
                      enum: options,
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      'x-component-props': { mode: multiple ? 'multiple' : undefined, allowClear: true },
                    },
                  }),
            },
          } as ISchema,
          onSubmit: (values: QuickFilterConfig) => {
            const nextField = fields.find((item) => item.name === values.fieldName) || selectedField;
            const nextInterface = getFieldInterface(nextField);
            const nextTextFilter = isTextInterface(nextInterface);
            const nextMultiple = nextTextFilter
              ? false
              : values.style === 'multiButton' || Boolean(values.multiple);
            const fieldChanged = values.fieldName !== config.fieldName;
            const nextProps: QuickFilterConfig = {
              ...config,
              ...values,
              fieldName: String(nextField?.name || values.fieldName),
              fieldInterface: nextInterface,
              fieldTitle: fieldChanged ? getFieldTitle(nextField) : values.fieldTitle || getFieldTitle(nextField),
              showTitle: values.showTitle !== false,
              fullRow: Boolean(values.fullRow),
              placeholder: nextTextFilter ? values.placeholder : undefined,
              style: nextTextFilter ? undefined : values.style || 'select',
              multiple: nextMultiple,
              operator: fieldChanged
                ? defaultOperator(nextInterface, nextMultiple)
                : values.operator || defaultOperator(nextInterface, nextMultiple),
              candidateValues:
                nextTextFilter || fieldChanged
                  ? undefined
                  : normalizeQuickFilterArray(values.candidateValues),
              defaultValue: fieldChanged
                ? undefined
                : nextTextFilter
                  ? normalizeTextFilterValue(values.defaultValue)
                  : normalizeQuickFilterValue(values.defaultValue, nextMultiple),
              options: nextTextFilter ? undefined : serializableOptions(nextField),
            };

            fieldSchema.title = nextProps.fieldTitle;
            fieldSchema['x-component-props'] = nextProps;
            Object.assign((formilyField as any).componentProps || {}, nextProps);
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                title: nextProps.fieldTitle,
                'x-component-props': nextProps,
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: (schema: any) =>
          schema['x-component'] === 'Space' || schema['x-component'] === 'ActionBar',
      },
    },
  ],
});
