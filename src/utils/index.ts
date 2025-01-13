import type { CalculatedColumn, CalculatedColumnOrColumnGroup, CellsRange, Maybe } from '../types';

export * from './colSpanUtils';
export * from './domUtils';
export * from './eventUtils';
export * from './keyboardUtils';
export * from './renderMeasuringCells';
export * from './selectedCellUtils';
export * from './styleUtils';

export const { min, max, floor, sign, abs } = Math;

export function assertIsValidKeyGetter<R, K extends React.Key>(
  keyGetter: Maybe<(row: NoInfer<R>) => K>
): asserts keyGetter is (row: R) => K {
  if (typeof keyGetter !== 'function') {
    throw new Error('Please specify the rowKeyGetter prop to use selection');
  }
}

export function clampColumnWidth<R, SR>(
  width: number,
  { minWidth, maxWidth }: CalculatedColumn<R, SR>
): number {
  width = max(width, minWidth);

  // ignore maxWidth if it less than minWidth
  if (typeof maxWidth === 'number' && maxWidth >= minWidth) {
    return min(width, maxWidth);
  }

  return width;
}

export function getHeaderCellRowSpan<R, SR>(
  column: CalculatedColumnOrColumnGroup<R, SR>,
  rowIdx: number
) {
  return column.parent === undefined ? rowIdx : column.level - column.parent.level;
}

export function isValueInBetween(value: number, num1: number, num2: number): boolean {
  const min = Math.min(num1, num2);
  const max = Math.max(num1, num2);
  return value >= min && value <= max;
}

export function getBorderObject(rowIdx: number, colIdx: number, range: CellsRange) {
  const { startRowIdx, startColumnIdx, endRowIdx, endColumnIdx } = range;

  const topRowIdx = Math.min(startRowIdx, endRowIdx);
  const bottomRowIdx = Math.max(startRowIdx, endRowIdx);
  const leftColIdx = Math.min(startColumnIdx, endColumnIdx);
  const rightColIdx = Math.max(startColumnIdx, endColumnIdx);

  const isRowInRange = isValueInBetween(rowIdx, startRowIdx, endRowIdx);
  const isColumnInRange = isValueInBetween(colIdx, startColumnIdx, endColumnIdx);

  return {
    top: rowIdx === topRowIdx && isColumnInRange,
    bottom: rowIdx === bottomRowIdx && isColumnInRange,
    left: colIdx === leftColIdx && isRowInRange,
    right: colIdx === rightColIdx && isRowInRange
  };
}
