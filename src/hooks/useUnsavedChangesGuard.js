import { useState, useRef, useEffect } from "react";

/**
 * Tracks dirty state against an initial snapshot and provides
 * a navigation guard that shows a confirmation dialog when
 * the user tries to navigate away with unsaved changes.
 *
 * Usage:
 *   const { isDirty, markDirty, markClean, initSnapshot,
 *           showDialog, pendingUrl, confirmDiscard, confirmSave,
 *           guardedNavigate } = useUnsavedChangesGuard(navigate);
 */
export function useUnsavedChangesGuard(navigate) {
  const [isDirty, setIsDirty] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingUrl, setPendingUrl] = useState(null);
  const initialSnapshotRef = useRef(null);

  const initSnapshot = (data) => {
    initialSnapshotRef.current = JSON.stringify(data);
    setIsDirty(false);
  };

  const checkDirty = (data) => {
    if (initialSnapshotRef.current !== null) {
      setIsDirty(JSON.stringify(data) !== initialSnapshotRef.current);
    }
  };

  const markClean = () => {
    setIsDirty(false);
  };

  /** Call instead of navigate() for links that should respect dirty state */
  const guardedNavigate = (url) => {
    if (isDirty) {
      setPendingUrl(url);
      setShowDialog(true);
    } else {
      navigate(url);
    }
  };

  /** User chose "Discard & Leave" */
  const confirmDiscard = () => {
    setIsDirty(false);
    setShowDialog(false);
    navigate(pendingUrl);
  };

  /** User chose "Save & Leave" — calls onSave and navigates after it resolves (works for sync and async) */
  const confirmSave = async (onSave) => {
    setShowDialog(false);
    if (onSave) await onSave();
    navigate(pendingUrl);
  };

  const cancelDialog = () => {
    setShowDialog(false);
    setPendingUrl(null);
  };

  return {
    isDirty,
    checkDirty,
    initSnapshot,
    markClean,
    guardedNavigate,
    showDialog,
    pendingUrl,
    confirmDiscard,
    confirmSave,
    cancelDialog,
  };
}