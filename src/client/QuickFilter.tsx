import {
  mergeFilter,
  SortableItem,
  useCollection,
  useCompile,
  useDataBlockProps,
  useDataBlockRequestGetter,
  useDataLoadingMode,
  useSchemaToolbarRender,
} from '@nocobase/client';
import { useFieldSchema } from '@formily/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { QuickFilterControl, QuickTextFilterControl } from '../shared/QuickFilterControl';
import type { CollectionFieldLike, QuickFilterConfig, QuickFilterPrimitive } from '../shared/types';
import {
  buildQuickFilter,
  getFieldInterface,
  getFieldTitle,
  hasFilterValue,
  isTextInterface,
} from '../shared/utils';
import { useQuickFilterTranslation } from './locale';

export function QuickFilter() {
  const fieldSchema = useFieldSchema();
  const { render: renderToolbar } = useSchemaToolbarRender(fieldSchema);
  const collection = useCollection() as any;
  const compile = useCompile();
  const { t } = useQuickFilterTranslation();
  const { getDataBlockRequest } = useDataBlockRequestGetter();
  const dataLoadingMode = useDataLoadingMode();
  const blockProps = useDataBlockProps() as any;
  const config = (fieldSchema['x-component-props'] || {}) as QuickFilterConfig;
  const configKey = JSON.stringify(config);
  const sourceKey = 'quickFilter:' + (fieldSchema['x-uid'] || config.fieldName);
  const currentField = useMemo(
    () => (collection?.fields || []).find((item: CollectionFieldLike) => item.name === config.fieldName),
    [collection?.fields, config.fieldName],
  );
  const [value, setValue] = useState<QuickFilterConfig['defaultValue']>(config.defaultValue);
  const fieldInterface = getFieldInterface(currentField) || config.fieldInterface;
  const textFilter = isTextInterface(fieldInterface);

  const apply = useCallback(
    (nextValue: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined) => {
      const service = getDataBlockRequest?.();
      if (!service) return;

      const firstParams = service.params?.[0] || {};
      const secondParams = service.params?.[1] || {};
      const filters = { ...(secondParams.filters || {}) };
      const filter = buildQuickFilter(config, nextValue, fieldInterface);

      if (filter) filters[sourceKey] = filter;
      else delete filters[sourceKey];

      const baseFilter = blockProps?.params?.filter ?? firstParams.filter;
      const nextParams = [
        {
          ...firstParams,
          page: 1,
          filter: mergeFilter([...Object.values(filters), baseFilter].filter(Boolean)),
        },
        {
          ...secondParams,
          filters,
        },
      ];

      if (dataLoadingMode === 'manual' && !filter) {
        service.params = nextParams;
        service.mutate(undefined);
      } else {
        service.run(...nextParams);
      }
    },
    [blockProps?.params?.filter, configKey, dataLoadingMode, fieldInterface, getDataBlockRequest, sourceKey],
  );

  useEffect(() => {
    setValue(config.defaultValue);
    const service = getDataBlockRequest?.();
    const alreadyApplied = Boolean(service?.params?.[1]?.filters?.[sourceKey]);
    if (hasFilterValue(config.defaultValue) || alreadyApplied) {
      apply(config.defaultValue);
    }

    return () => {
      const currentService = getDataBlockRequest?.();
      const filters = currentService?.params?.[1]?.filters;
      if (filters) delete filters[sourceKey];
    };
  }, [apply, config.defaultValue, getDataBlockRequest, sourceKey]);

  const handleChange = (nextValue: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined) => {
    setValue(nextValue);
    apply(nextValue);
  };

  return (
    <SortableItem
      component="div"
      className="nb-quick-filter"
      style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        width: config.fullRow ? '100%' : undefined,
        maxWidth: '100%',
      }}
    >
      {renderToolbar({ draggable: true })}
      {textFilter ? (
        <QuickTextFilterControl
          title={compile(config.fieldTitle || getFieldTitle(currentField) || config.fieldName)}
          showTitle={config.showTitle !== false}
          tooltip={compile(config.tooltip)}
          value={value}
          placeholder={compile(config.placeholder || t('Enter keyword')) as string}
          searchText={t('Search')}
          fullRow={config.fullRow}
          onSearch={handleChange}
        />
      ) : (
        <QuickFilterControl
          title={compile(config.fieldTitle || getFieldTitle(currentField) || config.fieldName)}
          showTitle={config.showTitle !== false}
          tooltip={compile(config.tooltip)}
          styleType={config.style || 'select'}
          multiple={config.multiple}
          value={value}
          field={currentField}
          fallbackOptions={config.options}
          candidateValues={config.candidateValues}
          fullRow={config.fullRow}
          allText={t('All')}
          noOptionsText={t('No options')}
          compileLabel={compile}
          onChange={handleChange}
        />
      )}
    </SortableItem>
  );
}

export default QuickFilter;
