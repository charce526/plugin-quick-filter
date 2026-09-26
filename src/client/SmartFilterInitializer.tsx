import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import {
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaInitializerItem,
  useCollection,
  useGlobalTheme,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import React, { useContext } from 'react';
import type { CollectionFieldLike } from '../shared/types';
import {
  createSmartFilterConfig,
  defaultSmartOperator,
  getFieldTitle,
  isTextField,
  normalizeFieldNames,
  smartOperatorOptions,
} from '../shared/utils';
import { useQuickFilterTranslation } from './locale';

/**
 * V1 counterpart of the V2 "Smart filter" menu entry: one search box that
 * scans several text fields at once. The target field picker is multiple.
 */
export function SmartFilterInitializer() {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const collection = useCollection() as any;
  const { theme } = useGlobalTheme();
  const schemaOptions = useContext(SchemaOptionsContext);
  const { t } = useQuickFilterTranslation();
  const fields = ((collection?.fields || []) as CollectionFieldLike[]).filter(isTextField);
  const fieldOptions = fields.map((field) => ({
    label: getFieldTitle(field),
    value: field.name,
  }));

  const handleClick = async () => {
    if (!fields.length) return;

    const values = await FormDialog(
      t('Smart filter'),
      () => (
        <SchemaComponentOptions
          scope={schemaOptions?.scope}
          components={{ ...(schemaOptions?.components || {}) }}
        >
          <FormLayout layout="vertical">
            <SchemaComponent
              schema={{
                type: 'object',
                properties: {
                  fieldNames: {
                    type: 'array',
                    title: t('Target field'),
                    enum: fieldOptions,
                    required: true,
                    'x-decorator': 'FormItem',
                    'x-component': 'Select',
                    'x-component-props': { mode: 'multiple', allowClear: true },
                  },
                  fieldTitle: {
                    title: t('Field title'),
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                  },
                  showTitle: {
                    title: t('Show title'),
                    default: true,
                    'x-decorator': 'FormItem',
                    'x-component': 'Checkbox',
                  },
                  fullRow: {
                    title: t('Exclusive row'),
                    default: false,
                    'x-decorator': 'FormItem',
                    'x-component': 'Checkbox',
                  },
                  operator: {
                    title: t('Operator'),
                    default: '$includes',
                    enum: smartOperatorOptions().map((item) => ({
                      value: item.value,
                      label: t(item.label),
                    })),
                    'x-decorator': 'FormItem',
                    'x-component': 'Select',
                  },
                },
              }}
            />
          </FormLayout>
        </SchemaComponentOptions>
      ),
      theme,
    ).open({
      initialValues: {
        fieldNames: [fields[0]?.name].filter(Boolean),
        fieldTitle: '',
        showTitle: true,
        fullRow: false,
        operator: '$includes',
      },
    });

    const fieldNames = normalizeFieldNames(values.fieldNames).length
      ? normalizeFieldNames(values.fieldNames)
      : [String(fields[0]?.name || '')].filter(Boolean);
    if (!fieldNames.length) return;

    const config = {
      ...createSmartFilterConfig(fieldNames),
      fieldTitle: values.fieldTitle || '',
      showTitle: values.showTitle !== false,
      fullRow: Boolean(values.fullRow),
      operator: defaultSmartOperator(values.operator),
    };

    insert({
      type: 'void',
      title: config.fieldTitle || t('Smart filter'),
      'x-align': 'left',
      'x-toolbar': 'ActionSchemaToolbar',
      'x-settings': 'actionSettings:quickFilter',
      'x-component': 'QuickFilter',
      'x-component-props': config,
    });
  };

  return (
    <SchemaInitializerItem
      {...itemConfig}
      title={t('Smart filter')}
      disabled={!fields.length}
      onClick={handleClick}
    />
  );
}

export default SmartFilterInitializer;
