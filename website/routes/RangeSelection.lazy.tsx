import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { faker } from '@faker-js/faker';
import { css } from '@linaria/core';
import DataGrid, {
  SelectCellFormatter,
  SelectColumn,
  textEditor,
  type Column,
  type SortColumn
} from '../../src';
import { textEditorClassname } from '../../src/editors/textEditor';
import type { Direction, MultiCopyEvent, MultiPasteEvent } from '../../src/types';
import { useDirection } from '../directionContext';
import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/RangeSelection')({
  component: RangeSelection
});

const dialogContainerClassname = css`
  position: absolute;
  inset: 0;
  display: flex;
  place-items: center;
  background: rgba(0, 0, 0, 0.1);
  > dialog {
    width: 300px;
    > input {
      width: 100%;
    }
    > menu {
      text-align: end;
    }
  }
`;
const dateFormatter = new Intl.DateTimeFormat(navigator.language);
const currencyFormatter = new Intl.NumberFormat(navigator.language, {
  style: 'currency',
  currency: 'eur'
});
interface SummaryRow {
  id: string;
  totalCount: number;
  yesCount: number;
}
interface Row {
  id: number;
  title: string;
  client: string;
  area: string;
  country: string;
  contact: string;
  assignee: string;
  progress: number;
  startTimestamp: number;
  endTimestamp: number;
  budget: number;
  transaction: string;
  account: string;
  version: string;
  available: boolean;
}
function getColumns(
  countries: readonly string[],
  direction: Direction
): readonly Column<Row, SummaryRow>[] {
  return [
    SelectColumn,
    {
      key: 'id',
      name: 'ID',
      frozen: true,
      resizable: false,
      renderSummaryCell() {
        return <strong>Total</strong>;
      }
    },
    {
      key: 'title',
      name: 'Task',
      frozen: true,
      renderEditCell: textEditor,
      renderSummaryCell({ row }) {
        return `${row.totalCount} records`;
      }
    },
    {
      key: 'client',
      name: 'Client',
      width: 'max-content',
      draggable: true,
      renderEditCell: textEditor
    },
    {
      key: 'area',
      name: 'Area',
      renderEditCell: textEditor
    },
    {
      key: 'country',
      name: 'Country',
      renderEditCell: (p) => (
        <select
          autoFocus
          className={textEditorClassname}
          value={p.row.country}
          onChange={(e) => p.onRowChange({ ...p.row, country: e.target.value }, true)}
        >
          {countries.map((country) => (
            <option key={country}>{country}</option>
          ))}
        </select>
      )
    },
    {
      key: 'contact',
      name: 'Contact',
      renderEditCell: textEditor
    },
    {
      key: 'assignee',
      name: 'Assignee',
      renderEditCell: textEditor
    },
    {
      key: 'progress',
      name: 'Completion',
      renderCell(props) {
        const value = props.row.progress;
        return (
          <>
            <progress max={100} value={value} style={{ inlineSize: 50 }} /> {Math.round(value)}%
          </>
        );
      },
      renderEditCell({ row, onRowChange, onClose }) {
        return createPortal(
          <div
            dir={direction}
            className={dialogContainerClassname}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                onClose();
              }
            }}
          >
            <dialog open>
              <input
                autoFocus
                type="range"
                min="0"
                max="100"
                value={row.progress}
                onChange={(e) => onRowChange({ ...row, progress: e.target.valueAsNumber })}
              />
              <menu>
                <button type="button" onClick={() => onClose()}>
                  Cancel
                </button>
                <button type="button" onClick={() => onClose(true)}>
                  Save
                </button>
              </menu>
            </dialog>
          </div>,
          document.body
        );
      },
      editorOptions: {
        displayCellContent: true
      }
    },
    {
      key: 'startTimestamp',
      name: 'Start date',
      renderCell(props) {
        return dateFormatter.format(props.row.startTimestamp);
      }
    },
    {
      key: 'endTimestamp',
      name: 'Deadline',
      renderCell(props) {
        return dateFormatter.format(props.row.endTimestamp);
      }
    },
    {
      key: 'budget',
      name: 'Budget',
      renderCell(props) {
        return currencyFormatter.format(props.row.budget);
      }
    },
    {
      key: 'transaction',
      name: 'Transaction type'
    },
    {
      key: 'account',
      name: 'Account'
    },
    {
      key: 'version',
      name: 'Version',
      renderEditCell: textEditor
    },
    {
      key: 'available',
      name: 'Available',
      renderCell({ row, onRowChange, tabIndex }) {
        return (
          <SelectCellFormatter
            value={row.available}
            onChange={() => {
              onRowChange({ ...row, available: !row.available });
            }}
            tabIndex={tabIndex}
          />
        );
      },
      renderSummaryCell({ row: { yesCount, totalCount } }) {
        return `${Math.floor((100 * yesCount) / totalCount)}% ✔️`;
      }
    }
  ];
}
function rowKeyGetter(row: Row) {
  return row.id;
}
function createRows(): readonly Row[] {
  const now = Date.now();
  const rows: Row[] = [];
  for (let i = 0; i < 1000; i++) {
    rows.push({
      id: i,
      title: `Task #${i + 1}`,
      client: faker.company.name(),
      area: faker.person.jobArea(),
      country: faker.location.country(),
      contact: faker.internet.exampleEmail(),
      assignee: faker.person.fullName(),
      progress: Math.random() * 100,
      startTimestamp: now - Math.round(Math.random() * 1e10),
      endTimestamp: now + Math.round(Math.random() * 1e10),
      budget: 500 + Math.random() * 10500,
      transaction: faker.finance.transactionType(),
      account: faker.finance.iban(),
      version: faker.system.semver(),
      available: Math.random() > 0.5
    });
  }
  return rows;
}
type Comparator = (a: Row, b: Row) => number;
function getComparator(sortColumn: string): Comparator {
  switch (sortColumn) {
    case 'assignee':
    case 'title':
    case 'client':
    case 'area':
    case 'country':
    case 'contact':
    case 'transaction':
    case 'account':
    case 'version':
      return (a, b) => {
        return a[sortColumn].localeCompare(b[sortColumn]);
      };
    case 'available':
      return (a, b) => {
        return a[sortColumn] === b[sortColumn] ? 0 : a[sortColumn] ? 1 : -1;
      };
    case 'id':
    case 'progress':
    case 'startTimestamp':
    case 'endTimestamp':
    case 'budget':
      return (a, b) => {
        return a[sortColumn] - b[sortColumn];
      };
    default:
      throw new Error(`unsupported sortColumn: "${sortColumn}"`);
  }
}
export default function RangeSelection() {
  const [rows, setRows] = useState(createRows);
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());
  const countries = useMemo((): readonly string[] => {
    return [...new Set(rows.map((r) => r.country))].sort(new Intl.Collator().compare);
  }, [rows]);
    const direction = useDirection();
  const columns = useMemo(() => getColumns(countries, direction), [countries, direction]);
  const summaryRows = useMemo((): readonly SummaryRow[] => {
    return [
      {
        id: 'total_0',
        totalCount: rows.length,
        yesCount: rows.filter((r) => r.available).length
      }
    ];
  }, [rows]);
  const sortedRows = useMemo((): readonly Row[] => {
    if (sortColumns.length === 0) return rows;
    return [...rows].sort((a, b) => {
      for (const sort of sortColumns) {
        const comparator = getComparator(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === 'ASC' ? compResult : -compResult;
        }
      }
      return 0;
    });
  }, [rows, sortColumns]);
  function getRangeSize(start: number, end: number) {
    return Math.abs(start - end) + 1;
  }
  function handleMultiCopy({ sourceRows, sourceColumnKeys }: MultiCopyEvent<Row>): void {
    if (window.isSecureContext) {
      const rows: string[] = [];
      for (const row of sourceRows) {
        rows.push(sourceColumnKeys.map((c) => row[c as keyof Row]).join('\t'));
      }
      navigator.clipboard.writeText(rows.join('\n'));
    }
  }
  function handleMultiPaste(pasteEvent: MultiPasteEvent) {
    const sourceRange = pasteEvent.copiedRange;
    const destinationRange = pasteEvent.targetRange;

    const newRows = [...rows];
    const sourceStartRow = Math.min(sourceRange.startRowIdx, sourceRange.endRowIdx);
    const sourceStartCol = Math.min(sourceRange.startColumnIdx, sourceRange.endColumnIdx);
    const destinationStartRow = Math.min(destinationRange.startRowIdx, destinationRange.endRowIdx);
    const destinationStartCol = Math.min(
      destinationRange.startColumnIdx,
      destinationRange.endColumnIdx
    );

    const sourceRowCount = getRangeSize(sourceRange.startRowIdx, sourceRange.endRowIdx);
    const sourceColCount = getRangeSize(sourceRange.startColumnIdx, sourceRange.endColumnIdx);
  
    for (let i = 0; i < sourceRowCount; i++) {
      for (let j = 0; j < sourceColCount; j++) {
        const sourceRowIdx = sourceStartRow + i;
        const sourceColIdx = sourceStartCol + j;
        const destinationRowIdx = destinationStartRow + i;
        const destinationColIdx = destinationStartCol + j;
  
        if (destinationRowIdx < newRows.length && destinationColIdx < columns.length) {
          const sourceColumnKey = columns[sourceColIdx]?.key;
          const destinationColumnKey = columns[destinationColIdx]?.key;
  
          if (sourceColumnKey && destinationColumnKey) {
            newRows[destinationRowIdx] = {
              ...newRows[destinationRowIdx], // Ensure immutability
              [destinationColumnKey]: newRows[sourceRowIdx]?.[sourceColumnKey as keyof Row],
            };
          }
        }
      }
    }
  
    setRows(newRows); // Update the rows
  }
  return (
    <DataGrid
      style={{ userSelect: 'none' }}
      rowKeyGetter={rowKeyGetter}
      columns={columns}
      rows={sortedRows}
      defaultColumnOptions={{
        sortable: true,
        resizable: true
      }}
      selectedRows={selectedRows}
      onSelectedRowsChange={setSelectedRows}
      onRowsChange={setRows}
      sortColumns={sortColumns}
      onSortColumnsChange={setSortColumns}
      topSummaryRows={summaryRows}
      bottomSummaryRows={summaryRows}
      className="fill-grid"
      direction={direction}
      enableRangeSelection
      rangeLeftBoundaryColIdx={0}
      onMultiCopy={handleMultiCopy}
      onMultiPaste={handleMultiPaste}
      renderers={{ noRowsFallback: <h1>No rows</h1> }}
    />
  );
}