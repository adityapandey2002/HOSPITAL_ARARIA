'use client';

import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';
import { forwardRef } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  className?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort?: (key: string) => void;
  selection?: {
    selectedKeys: string[];
    onSelectionChange: (keys: string[]) => void;
  };
}

function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  striped = true,
  hoverable = true,
  bordered = true,
  compact = false,
  className,
  pagination,
  sortConfig,
  onSort,
  selection,
}: TableProps<T>) {
  const [sortState, setSortState] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(sortConfig || null);

  const handleSort = (key: string) => {
    if (onSort) {
      const direction = sortState?.key === key && sortState.direction === 'asc' ? 'desc' : 'asc';
      setSortState({ key, direction });
      onSort(key);
    }
  };

  const handleSelectAll = () => {
    if (selection) {
      const allKeys = data.map(keyExtractor);
      const newSelection = selection.selectedKeys.length === allKeys.length ? [] : allKeys;
      selection.onSelectionChange(newSelection);
    }
  };

  const handleSelectRow = (key: string) => {
    if (selection) {
      const newSelection = selection.selectedKeys.includes(key)
        ? selection.selectedKeys.filter((k) => k !== key)
        : [...selection.selectedKeys, key];
      selection.onSelectionChange(newSelection);
    }
  };

  if (loading) {
    return (
      <div className={cn('overflow-x-auto rounded-lg border border-gray-200', className)}>
        <table className="w-full" role="grid">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded" style={{ width: column.width || '100px' }} />
                    {column.sortable && <div className="w-4 h-4 bg-gray-200 rounded" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: '80px' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-gray-200', className)}>
      <table className="w-full" role="grid">
        <thead className="bg-gray-50">
          <tr>
            {selection && (
              <th
                className={cn(
                  'px-4 py-3 text-left',
                  compact && 'py-2'
                )}
              >
                <input
                  type="checkbox"
                  checked={selection.selectedKeys.length === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.headerClassName,
                  column.sortable && 'cursor-pointer select-none hover:bg-gray-100',
                  compact && 'py-2'
                )}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
                style={{ width: column.width }}
                scope="col"
              >
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  {column.sortable && sortState?.key === column.key && (
                    <span className="text-primary-600">
                      {sortState.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selection ? 1 : 0)} className="px-4 py-12 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowKey = keyExtractor(row);
              const isSelected = selection?.selectedKeys.includes(rowKey);
              
              return (
                <tr
                  key={rowKey}
                  className={cn(
                    'transition-colors',
                    striped && rowIndex % 2 === 0 && 'bg-gray-50',
                    hoverable && 'hover:bg-gray-50',
                    isSelected && 'bg-primary-50',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  aria-selected={isSelected}
                >
                  {selection && (
                    <td className={cn('px-4 py-3', compact && 'py-2')}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(rowKey)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-900',
                        column.cellClassName,
                        compact && 'py-2',
                        bordered && 'border-t border-gray-100'
                      )}
                    >
                      {column.render ? column.render(row, rowIndex) : String((row as Record<string, unknown>)[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      
      {pagination && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Rows per page"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              aria-label="Previous page"
            >
              ←
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              aria-label="Next page"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Table.displayName = 'Table';

export { Table };
export type { Column, TableProps };