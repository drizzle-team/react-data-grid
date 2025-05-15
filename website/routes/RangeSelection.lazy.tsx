import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { faker } from '@faker-js/faker';
import { createLazyFileRoute } from '@tanstack/react-router';
import { css } from '@linaria/core';

import DataGrid, {
  SelectCellFormatter,
  SelectColumn,
  textEditor,
  type Column,
  type SortColumn
} from '../../src';
import { textEditorClassname } from '../../src/editors/textEditor';
import type {
  CalculatedColumn,
  CellCopyArgs,
  CellPasteArgs,
  Direction,
  MultiCellCopyArgs,
  MultiCellPasteArgs
} from '../../src/types';
import { useDirection } from '../directionContext';

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

  const [copiedCell, setCopiedCell] = useState<{
    readonly row: Row;
    readonly column: CalculatedColumn<Row, SummaryRow>;
  } | null>(null);

  function handleCellPaste(
    { row, column }: CellCopyArgs<Row, SummaryRow>,
    event: React.ClipboardEvent<HTMLDivElement>
  ): Row {
    const targetColumnKey = column.key;

    if (copiedCell !== null) {
      const sourceColumnKey = copiedCell.column.key;
      const sourceRow = copiedCell.row;
      return { ...row, [targetColumnKey]: sourceRow[sourceColumnKey as keyof Row] };
    }

    const copiedText = event.clipboardData.getData('text/plain');
    if (copiedText !== '') {
      return { ...row, [targetColumnKey]: copiedText };
    }

    return row;
  }

  function handleCellCopy(
    { row, column }: CellPasteArgs<Row, SummaryRow>,
    event: React.ClipboardEvent<HTMLDivElement>
  ): void {
    // copy highlighted text only
    if (window.getSelection()?.isCollapsed === false) {
      setCopiedCell(null);
      return;
    }

    setCopiedCell({ row, column });
    event.clipboardData.setData('text/plain', String(row[column.key as keyof Row]));
    event.preventDefault();
  }

  function handleMultiCellCopy(
    { rows, columns }: MultiCellCopyArgs<Row, SummaryRow>,
    event: React.ClipboardEvent<HTMLDivElement>
  ) {
    // copy highlighted text only
    if (window.getSelection()?.isCollapsed === false) {
      setCopiedCell(null);
      return;
    }

    const copiedText = rows
      .map((row) => {
        return columns.map((column) => String(row[column.key as keyof Row])).join('\t');
      })
      .join('\n');

      console.log('copiedText', copiedText);

    setCopiedCell({ row: rows[0], column: columns[0] });
    event.clipboardData.setData('text/plain', copiedText);
    event.preventDefault();
  }

  function handleMultiCellPaste(
    { rows, columns }: MultiCellPasteArgs<Row, SummaryRow>,
    event: React.ClipboardEvent<HTMLDivElement>
  ): Row[] {
    console.log('pastedRows');
    const copiedText = event.clipboardData.getData('text/plain').trim();
    if (!copiedText) return [];

    // biome-ignore lint/performance/useTopLevelRegex: <explanation>
    const pastedRows = copiedText.split(/\r?\n/).map((line) => line.split('\t'));


    const updatedRows: Row[] = [];

    rows.forEach((row, rowIndex) => {
      if (rowIndex >= pastedRows.length) return;

      const pastedRow = pastedRows[rowIndex];
      const updatedRow = { ...row };

      columns.forEach((column, colIndex) => {
        if (colIndex < pastedRow.length) {
          const key = column.key as keyof Row;
          const newValue = pastedRow[colIndex];
          // @ts-expect-error - Type 'string' is not assignable to type 'number | string | boolean'
          updatedRow[key] = newValue;
        }
      });

      updatedRows.push(updatedRow);
    });

    return updatedRows;
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
      selectionLeftBoundaryColIdx={0}
      selectionTopBoundaryRowIdx={-1}
      onMultiCellCopy={handleMultiCellCopy}
      onMultiCellPaste={handleMultiCellPaste}
      renderers={{ noRowsFallback: <h1>No rows</h1> }}
    />
  );
}
