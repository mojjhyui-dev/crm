"use client";

import {useEffect} from "react";
import {Check, X} from "lucide-react";

export function Toast({
  message,
  open,
  onClose,
  dismissLabel,
}: {
  message: string;
  open: boolean;
  onClose: () => void;
  dismissLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timeout);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div aria-live="polite" className="ds-toast" role="status">
      <Check aria-hidden="true" size={17} />
      <span>{message}</span>
      <button aria-label={dismissLabel} className="ds-icon-button" onClick={onClose} type="button">
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  );
}