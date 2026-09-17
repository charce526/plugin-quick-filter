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
import { createDefaultConfig, getFieldTitle, isSupportedField, isTextField } from '../shared/utils';
import { useQuickFilterTranslation } from './locale';

export function QuickFilterInitializer() {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const collection = useCollection() as any;
  const { theme } = useGlobalTheme();
  const schemaOptions = useContext(SchemaOptionsContext);
  const { t } = useQuickFilterTranslation();
  const fields = ((collection?.fields || []) as CollectionFieldLike[]).filter(isSupportedField);
  const fieldOptions = fields.map((field) => ({
    label: getFieldTitle(field),
    value: field.name,
  }));
  const textFieldNames = fields.filter(isTextField).map((field) => field.name);
  const hideForTextField = () => ({
    dependencies: ['fieldName'],
    when: `{{${JSON.stringify(textFieldNames)}.includes($deps[0])}}`,
    fulfill: { state: { hidden: true } },
    otherwise: { state: { hidden: false } },
  });

  const handleClick = async () => {
    if (!fields.length) return;

    const values = await FormDialog(
      t('Quick filter'),
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
                  fieldName: {
                    title: t('Target field'),
                    enum: fieldOptions,
                    required: true,
                    'x-decorator': 'FormItem',
                    'x-component': 'Select',
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
                  style: {
                    title: t('Style'),
                    default: 'select',
                    enum: [
                      { label: t('Select'), value: 'select' },
                      { label: t('Button'), value: 'button' },
                      { label: t('Multiple buttons'), value: 'multiButton' },
                    ],
                    'x-decorator': 'FormItem',
                    'x-component': 'Radio.Group',
                    'x-reactions': hideForTextField(),
                  },
                  multiple: {
                    title: t('Multiple selection'),
                    default: false,
                    'x-decorator': 'FormItem',
                    'x-component': 'Checkbox',
                    'x-reactions': hideForTextField(),
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
        fieldName: fields[0]?.name,
        showTitle: true,
        fullRow: false,
        style: 'select',
        multiple: false,
      },
    });

    const field = fields.find((item) => item.name === values.fieldName);
    if (!field) return;
    const textFilter = isTextField(field);
    const config = {
      ...createDefaultConfig(field),
      showTitle: values.showTitle !== false,
      fullRow: Boolean(values.fullRow),
      style: textFilter ? undefined : values.style || 'select',
      multiple: textFilter ? false : values.style === 'multiButton' || Boolean(values.multiple),
    };

    insert({
      type: 'void',
      title: config.fieldTitle,
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
      title={t('Quick filter')}
      disabled={!fields.length}
      onClick={handleClick}
    />
  );
}

export default QuickFilterInitializer;
