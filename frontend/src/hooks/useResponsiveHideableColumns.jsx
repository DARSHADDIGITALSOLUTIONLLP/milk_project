import React, { useState, useEffect } from "react";

/**
 * Hook to make DataTable columns hideable via double tap / double click on header.
 * - Mobile (<= 600px): keeps at least 3 columns visible.
 * - Tablet (<= 1024px): keeps at least 4 columns visible.
 * - Desktop: no hiding applied.
 *
 * Each column in allColumns MUST have a unique `id`.
 * Optionally provide `headerLabel` to control text shown in header; otherwise `name` is used.
 *
 * Optional second argument: { resetKey }.
 * Increment resetKey from the caller to restore all columns.
 */
export default function useResponsiveHideableColumns(allColumns, options = {}) {
  const { resetKey } = options;
  // Initialize from the initial columns only once.
  // We intentionally avoid resetting on every render to prevent infinite update loops.
  const [visibleIds, setVisibleIds] = useState(() =>
    allColumns.map((col) => col.id)
  );
  const [lastTap, setLastTap] = useState({ id: null, time: 0 });

  const hideColumn = (columnId) => {
    const width = window.innerWidth || 0;
    let minVisible;

    if (width <= 600) {
      // Mobile
      minVisible = 3;
    } else if (width <= 1024) {
      // Tablet
      minVisible = 4;
    } else {
      // Desktop: don't hide columns
      return;
    }

    setVisibleIds((prev) => {
      // Already hidden
      if (!prev.includes(columnId)) return prev;

      // Enforce minimum visible columns
      if (prev.length <= minVisible) return prev;

      return prev.filter((id) => id !== columnId);
    });
  };

  // Allow external reset via resetKey (only when it actually changes)
  useEffect(() => {
    if (resetKey === undefined) return;
    setVisibleIds(allColumns.map((col) => col.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const handleHeaderTap = (columnId) => {
    const now = Date.now();
    const TAP_DELAY = 350; // ms

    setLastTap((prev) => {
      if (prev.id === columnId && now - prev.time < TAP_DELAY) {
        // Double tap detected
        hideColumn(columnId);
        return { id: null, time: 0 };
      }
      // First tap
      return { id: columnId, time: now };
    });
  };

  // Wrap column headers with double‑tap handler and filter by visible ids
  const columnsWithHandlers = allColumns.map((col) => ({
    ...col,
    name: (
      <span onClick={() => handleHeaderTap(col.id)}>
        {col.headerLabel || col.name}
      </span>
    ),
  }));

  return columnsWithHandlers.filter((col) => visibleIds.includes(col.id));
}








