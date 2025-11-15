import { forwardRef, memo, type RefAttributes } from 'react';
import { css } from '@linaria/core';

import { useRovingTabIndex } from './hooks';
import { createCellEvent, getCellClassname, getCellStyle, isCellEditableUtil } from './utils';
import type { CellMouseEventHandler, CellRendererProps } from './types';

const cellCopied = css`
  @layer rdg.Cell {
    background-color: #ccccff;
  }
`;

const cellDraggedOver = css`
  @layer rdg.Cell {
    background-color: #ccccff;

    &.${cellCopied} {
      background-color: #9999ff;
    }
  }
`;

const cellDraggedOverClassname = `rdg-cell-dragged-over ${cellDraggedOver}`;

function Cell<R, SR>(
  {
    column,
    colSpan,
    isCellSelected,
    selectedBorder,
    isDraggedOver,
    row,
    rowIdx,
    className,
    onMouseDown,
    onCellMouseDown,
    onMouseDownCapture,
    onCellMouseDownCapture,
    onMouseUpCapture,
    onCellMouseUpCapture,
    onMouseEnter,
    onCellMouseEnter,
    onClick,
    onCellClick,
    onDoubleClick,
    onCellDoubleClick,
    onContextMenu,
    onCellContextMenu,
    onRowChange,
    selectCell,
    style,
    ...props
  }: CellRendererProps<R, SR>,
  ref: React.Ref<HTMLDivElement>
) {
  const { tabIndex, childTabIndex, onFocus } = useRovingTabIndex(isCellSelected);

  const { cellClass } = column;
  className = getCellClassname(
    column,
    {
      [cellDraggedOverClassname]: isDraggedOver
    },
    typeof cellClass === 'function' ? cellClass(row) : cellClass,
    className
  );
  const isEditable = isCellEditableUtil(column, row);

  function selectCellWrapper(
    enableEditor?: boolean,
    options: { shiftKey: boolean } = { shiftKey: false }
  ) {
    selectCell({ rowIdx, idx: column.idx }, { enableEditor, ...options });
  }

  function handleMouseEvent(
    event: React.MouseEvent<HTMLDivElement>,
    eventHandler?: CellMouseEventHandler<R, SR>
  ) {
    let eventHandled = false;
    if (eventHandler) {
      const cellEvent = createCellEvent(event);
      eventHandler({ rowIdx, row, column, selectCell: selectCellWrapper }, cellEvent);
      eventHandled = cellEvent.isGridDefaultPrevented();
    }
    return eventHandled;
  }

  function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    onMouseDown?.(event);
    if (!handleMouseEvent(event, onCellMouseDown)) {
      // select cell if the event is not prevented
      selectCellWrapper(false, { shiftKey: event.shiftKey });
    }
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    onClick?.(event);
    handleMouseEvent(event, onCellClick);
  }

  function handleDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    onDoubleClick?.(event);
    if (!handleMouseEvent(event, onCellDoubleClick)) {
      // go into edit mode if the event is not prevented
      selectCellWrapper(true);
    }
  }

  function handleMouseDownCapture(event: React.MouseEvent<HTMLDivElement>) {
    onMouseDownCapture?.(event);
    handleMouseEvent(event, onCellMouseDownCapture);
  }

  function handleMouseUpCapture(event: React.MouseEvent<HTMLDivElement>) {
    onMouseUpCapture?.(event);
    handleMouseEvent(event, onCellMouseUpCapture);
  }

  function handleMouseEnter(event: React.MouseEvent<HTMLDivElement>) {
    onMouseEnter?.(event);
    handleMouseEvent(event, onCellMouseEnter);
  }

  function handleContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    onContextMenu?.(event);
    handleMouseEvent(event, onCellContextMenu);
  }

  function handleRowChange(newRow: R) {
    onRowChange(column, newRow);
  }

  return (
    <div
      role="gridcell"
      aria-colindex={column.idx + 1} // aria-colindex is 1-based
      aria-colspan={colSpan}
      aria-selected={isCellSelected}
      selected-top-border={selectedBorder?.top ? 'true' : undefined}
      selected-left-border={selectedBorder?.left ? 'true' : undefined}
      selected-bottom-border={selectedBorder?.bottom ? 'true' : undefined}
      selected-right-border={selectedBorder?.right ? 'true' : undefined}
      aria-readonly={!isEditable || undefined}
      ref={ref}
      tabIndex={tabIndex}
      className={className}
      style={{
        ...getCellStyle(column, colSpan),
        ...style
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseDownCapture={handleMouseDownCapture}
      onMouseUpCapture={handleMouseUpCapture}
      onMouseEnter={handleMouseEnter}
      onFocus={onFocus}
      {...props}
    >
      {column.renderCell({
        column,
        row,
        rowIdx,
        isCellEditable: isEditable,
        tabIndex: childTabIndex,
        onRowChange: handleRowChange,
        selectCell
      })}
    </div>
  );
}

const CellComponent = memo(forwardRef(Cell)) as <R, SR>(
  props: CellRendererProps<R, SR> & RefAttributes<HTMLDivElement>
) => React.JSX.Element;

export default CellComponent;

export function defaultRenderCell<R, SR>(key: React.Key, props: CellRendererProps<R, SR>) {
  return <CellComponent key={key} {...props} />;
}
