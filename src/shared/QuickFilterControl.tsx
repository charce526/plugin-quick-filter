import { Button, Checkbox, Radio, Select, Space, Tooltip, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import type {
  CollectionFieldLike,
  QuickFilterOption,
  QuickFilterPrimitive,
  QuickFilterStyle,
} from './types';
import { resolveFieldOptions, restrictOptions } from './utils';

const CLEAR_VALUE = '__xiezuo_quick_filter_clear__';

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
  allText: React.ReactNode;
  noOptionsText: React.ReactNode;
  onChange: (value: QuickFilterPrimitive | QuickFilterPrimitive[] | undefined) => void;
  compileLabel?: (label: any) => React.ReactNode;
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
    allText,
    noOptionsText,
    onChange,
    compileLabel = (label) => label,
  } = props;

  const multiple = styleType === 'multiButton' || Boolean(props.multiple);
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
        style={{ minWidth: 160 }}
        value={value as any}
        onChange={(next) => onChange(next as any)}
      />
    );
  } else if (multiple) {
    const selected = Array.isArray(value) ? value : value === undefined ? [] : [value];
    control = (
      <Space size={4} wrap>
        <Button size="small" type={selected.length ? 'default' : 'primary'} onClick={() => onChange(undefined)}>
          {allText}
        </Button>
        <Checkbox.Group
          disabled={isDisabled}
          options={options as any}
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
        size="small"
        value={value === undefined || value === null || value === '' ? CLEAR_VALUE : value}
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

  const content = (
    <Space size={8} align="center" wrap>
      {showTitle && title ? <Typography.Text>{title}</Typography.Text> : null}
      {control}
    </Space>
  );

  return tooltip ? <Tooltip title={tooltip}>{content}</Tooltip> : content;
}
