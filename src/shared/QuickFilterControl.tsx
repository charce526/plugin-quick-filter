import { Button, Checkbox, Input, Radio, Select, Space, Tooltip, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CollectionFieldLike,
  QuickFilterOption,
  QuickFilterPrimitive,
  QuickFilterStyle,
} from './types';
import { normalizeQuickFilterValue, resolveFieldOptions, restrictOptions } from './utils';

const CLEAR_VALUE = '__xiezuo_quick_filter_clear__';
const QUICK_FILTER_ROW_STYLES = `
  .nb-quick-filter-action-row {
    min-width: 0;
  }

  .nb-quick-filter-action-row > .nb-quick-filter-left-group {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    max-width: 100%;
  }

  .nb-quick-filter-action-row > .nb-quick-filter-right-group {
    flex: 0 0 auto !important;
    margin-left: auto !important;
    flex-wrap: nowrap !important;
  }

  .nb-quick-filter-left-group > .nb-quick-filter-row-item {
    flex: 0 0 100% !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100%;
  }

  .nb-quick-filter-row,
  .nb-quick-filter-row > .ant-space {
    min-width: 0;
    max-width: 100%;
  }
`;

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
  fullRow?: boolean;
  allText: React.ReactNode;
  noOptionsText: React.ReactNode;
  onChange: (value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined) => void;
  compileLabel?: (label: any) => React.ReactNode;
}

export interface QuickTextFilterControlProps {
  title?: React.ReactNode;
  showTitle?: boolean;
  tooltip?: React.ReactNode;
  value?: QuickFilterPrimitive | QuickFilterPrimitive[];
  placeholder?: string;
  searchText: React.ReactNode;
  fullRow?: boolean;
  disabled?: boolean;
  onSearch: (value: QuickFilterPrimitive | undefined) => void;
}

interface QuickFilterContainerProps {
  title?: React.ReactNode;
  showTitle?: boolean;
  tooltip?: React.ReactNode;
  fullRow?: boolean;
  children: React.ReactNode;
}

export function useResolvedOptions(
  field?: CollectionFieldLike,
  fallbackOptions: QuickFilterOption[] = [],
): QuickFilterOption[] {
  const [options, setOptions] = useState<QuickFilterOption[]>(fallbackOptions);

  useEffect(() => {
    let active = true;
    setOptions(fallbackOptions);
    resolveFieldOptions(field).then((resolved) => {
      if (active && resolved.length) setOptions(resolved);
    });
    return () => {
      active = false;
    };
  }, [field, JSON.stringify(fallbackOptions)]);

  return options;
}

function QuickFilterContainer(props: QuickFilterContainerProps) {
  const { title, showTitle = true, tooltip, fullRow = false, children } = props;
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rowItem = rowRef.current?.closest('.ant-space-item') as HTMLElement | null;
    if (!rowItem) return;

    const leftGroup = rowItem.parentElement;
    const actionRow = leftGroup?.parentElement;
    const rightGroup = Array.from(actionRow?.children || []).find(
      (child) => child !== leftGroup && child.classList.contains('ant-space'),
    ) as HTMLElement | undefined;

    rowItem.classList.add('nb-quick-filter-layout-item');
    rowItem.classList.toggle('nb-quick-filter-row-item', fullRow);
    leftGroup?.classList.add('nb-quick-filter-left-group');
    if (rightGroup) {
      actionRow?.classList.add('nb-quick-filter-action-row');
      rightGroup.classList.add('nb-quick-filter-right-group');
    }

    return () => {
      rowItem.classList.remove('nb-quick-filter-layout-item', 'nb-quick-filter-row-item');
      if (!leftGroup?.querySelector('.nb-quick-filter-layout-item')) {
        leftGroup?.classList.remove('nb-quick-filter-left-group');
        actionRow?.classList.remove('nb-quick-filter-action-row');
        rightGroup?.classList.remove('nb-quick-filter-right-group');
      }
    };
  }, [fullRow]);

  const content = (
    <div
      ref={rowRef}
      className="nb-quick-filter-row"
      style={{ display: 'flex', width: fullRow ? '100%' : undefined, maxWidth: '100%' }}
    >
      <style>{QUICK_FILTER_ROW_STYLES}</style>
      <Space size={10} align="center" wrap>
        {showTitle && title ? <Typography.Text>{title}</Typography.Text> : null}
        {children}
      </Space>
    </div>
  );

  return tooltip ? <Tooltip title={tooltip}>{content}</Tooltip> : content;
}

export function QuickFilterControl(props: QuickFilterControlProps) {
  const {
    title,
    showTitle = true,
    tooltip,
    styleType = 'select',
    value,
    field,
    fallbackOptions = [],
    candidateValues,
    disabled,
    fullRow,
    allText,
    noOptionsText,
    onChange,
    compileLabel = (label) => label,
  } = props;

  const multiple = styleType === 'multiButton' || Boolean(props.multiple);
  const normalizedValue = normalizeQuickFilterValue(value, multiple);
  const resolved = useResolvedOptions(field, fallbackOptions);
  const options = useMemo(
    () =>
      restrictOptions(resolved, candidateValues).map((option) => ({
        ...option,
        label: compileLabel(option.label),
      })),
    [resolved, candidateValues, compileLabel],
  );
  const isDisabled = disabled || options.length === 0;

  let control: React.ReactNode;
  if (styleType === 'select') {
    control = (
      <Select
        allowClear
        disabled={isDisabled}
        mode={multiple ? 'multiple' : undefined}
        options={options}
        placeholder={options.length ? allText : noOptionsText}
        size="middle"
        style={{ minWidth: 180 }}
        value={normalizedValue as any}
        onChange={(next) => onChange(normalizeQuickFilterValue(next, multiple))}
      />
    );
  } else if (multiple) {
    const selected = normalizedValue as QuickFilterPrimitive[];
    control = (
      <Space size={8} wrap>
        <Button size="middle" type={selected.length ? 'default' : 'primary'} onClick={() => onChange(undefined)}>
          {allText}
        </Button>
        <Checkbox.Group
          disabled={isDisabled}
          options={options as any}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          value={selected as any}
          onChange={(next) => onChange(next as QuickFilterPrimitive[])}
        />
      </Space>
    );
  } else {
    control = (
      <Radio.Group
        disabled={isDisabled}
        optionType="button"
        buttonStyle="solid"
        size="middle"
        value={normalizedValue === undefined ? CLEAR_VALUE : normalizedValue}
        onChange={(event) => onChange(event.target.value === CLEAR_VALUE ? undefined : event.target.value)}
      >
        <Radio.Button value={CLEAR_VALUE}>{allText}</Radio.Button>
        {options.map((option) => (
          <Radio.Button key={String(option.value)} value={option.value} disabled={option.disabled}>
            {option.label}
          </Radio.Button>
        ))}
      </Radio.Group>
    );
  }

  return (
    <QuickFilterContainer title={title} showTitle={showTitle} tooltip={tooltip} fullRow={fullRow}>
      {control}
    </QuickFilterContainer>
  );
}

export function QuickTextFilterControl(props: QuickTextFilterControlProps) {
  const {
    title,
    showTitle = true,
    tooltip,
    value,
    placeholder,
    searchText,
    fullRow,
    disabled,
    onSearch,
  } = props;
  const appliedValue = typeof value === 'string' ? value : '';
  const [draftValue, setDraftValue] = useState(appliedValue);

  useEffect(() => {
    setDraftValue(appliedValue);
  }, [appliedValue]);

  return (
    <QuickFilterContainer title={title} showTitle={showTitle} tooltip={tooltip} fullRow={fullRow}>
      <Input.Search
        allowClear
        disabled={disabled}
        enterButton={searchText}
        placeholder={placeholder}
        size="middle"
        style={{ width: 280, maxWidth: '100%' }}
        value={draftValue}
        onChange={(event) => setDraftValue(event.target.value)}
        onSearch={(nextValue) => onSearch(nextValue.trim() || undefined)}
      />
    </QuickFilterContainer>
  );
}
