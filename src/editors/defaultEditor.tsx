import { useCallback, useEffect, useRef, useState } from 'react';

import type { RenderEditCellProps } from '../types';

export const defaultEditor = <TRow, TSummaryRow>({
  column,
  row,
  onRowChange
}: RenderEditCellProps<TRow, TSummaryRow>) => {
  const [value, setValue] = useState<string>(
    String(
      typeof row[column.key as keyof TRow] === 'number'
        ? row[column.key as keyof TRow]
        : row[column.key as keyof TRow] || ''
    )
  );

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChangeValue = useCallback(
    (
      changedValue:
        | string
        | null
        | {
            _type: 'DEFAULT';
          },
      commitChanges?: boolean
    ) => {
      onRowChange({ ...row, [column.key]: changedValue }, commitChanges);
    },
    [onRowChange, row]
  );

  const onChangeValue = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue]
  );

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function cn(arg0: string) {
    throw new Error('Function not implemented.');
  }

  return (
    <input
      value={value}
      aria-label="Edit cell value"
      ref={inputRef}
      onChange={onChangeValue}
      onBlur={() => {
        console.log('onBlur - committing value:', value);
        handleChangeValue(value, true);
      }}
      onPaste={(e) => {
        const pastedValue = e.clipboardData.getData('text');
        // if the pasted value includes '\n' or '\t' - handle it to open multiline editor
        if (pastedValue.includes('\n') || pastedValue.includes('\t')) {
          handleChangeValue(pastedValue, false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            // put '\n' to the end of the input
            const newValue = value + '\n';
            handleChangeValue(newValue, false);
          } else {
            handleChangeValue(value, true);
          }
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          e.stopPropagation();
          // put '\t' to the end of the input
          const newValue = value + '\t';
          handleChangeValue(newValue, false);
        }
      }}
    />
  );
};
