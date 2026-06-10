import React, { useState } from 'react';
import { Download, ShieldAlert, Trash2, CheckSquare, Square, FileSpreadsheet, FileJson, AlertTriangle } from 'lucide-react';
import { SunsetButton } from './SunsetButton';

// ==========================================
// 1. CONSENT PREFERENCES CARD
// ==========================================
interface ConsentCardProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description: string;
  required?: boolean;
}

export const ConsentCard: React.FC<ConsentCardProps> = ({
  label,
  checked,
  onChange,
  description,
  required = false
}) => {
  return (
    <div 
      onClick={() => !required && onChange(!checked)}
      className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 select-none
        ${required 
          ? 'border-peach bg-peach-light bg-opacity-25' 
          : 'border-theme-border hover:border-peach hover:border-opacity-60 bg-theme-card cursor-pointer'
        }`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${required ? 'text-orange' : 'text-coral'}`}>
        {required ? (
          <CheckSquare size={18} className="opacity-70" />
        ) : checked ? (
          <CheckSquare size={18} />
        ) : (
          <Square size={18} className="text-theme-muted" />
        )}
      </div>
      <div>
        <h5 className="text-xs font-bold text-theme-text flex items-center gap-1.5">
          {label} {required && <span className="text-[9px] font-bold text-orange bg-peach px-2 py-0.5 rounded-full">Required</span>}
        </h5>
        <p className="text-[11px] text-theme-muted mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

// ==========================================
// 2. PRIVACY ACTION / PURGE CARD
// ==========================================
interface PrivacyActionCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  loading?: boolean;
}

export const PrivacyActionCard: React.FC<PrivacyActionCardProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  loading = false
}) => {
  return (
    <div className="p-4 rounded-2xl border border-theme-border bg-theme-card flex flex-col justify-between hover:border-rose hover:border-opacity-35 transition-all shadow-premium">
      <div>
        <h5 className="text-xs font-bold text-theme-text">{title}</h5>
        <p className="text-[11px] text-theme-muted mt-1 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={onAction}
        disabled={loading}
        className="w-full mt-4 py-2 px-3 border border-rose border-opacity-35 text-rose hover:bg-rose hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
      >
        <Trash2 size={13} /> {loading ? "Clearing..." : actionLabel}
      </button>
    </div>
  );
};

// ==========================================
// 3. DATA EXPORT BUTTONS CONTAINER
// ==========================================
interface DataExportButtonProps {
  onExport: (format: 'json' | 'csv') => void;
  loading?: boolean;
}

export const DataExportButton: React.FC<DataExportButtonProps> = ({ onExport, loading = false }) => {
  return (
    <div className="p-4 rounded-2xl border border-theme-border bg-theme-card hover:border-peach transition-all shadow-premium space-y-3">
      <div>
        <h5 className="text-xs font-bold text-theme-text">Export my personal data</h5>
        <p className="text-[11px] text-theme-muted mt-0.5 leading-relaxed">
          Download your profile, habits, timeline history, and coach suggestions instantly.
        </p>
      </div>
      <div className="flex gap-3 pt-1">
        <button
          onClick={() => onExport('csv')}
          disabled={loading}
          className="flex-1 py-2 px-3 bg-peach bg-opacity-30 hover:bg-peach text-warm-brown text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
        >
          <FileSpreadsheet size={14} /> {loading ? "Exporting..." : "Export CSV"}
        </button>
        <button
          onClick={() => onExport('json')}
          disabled={loading}
          className="flex-1 py-2 px-3 bg-peach bg-opacity-30 hover:bg-peach text-warm-brown text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
        >
          <FileJson size={14} /> {loading ? "Exporting..." : "Export JSON"}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 4. DELETE ACCOUNT / PURGE WARNING MODAL
// ==========================================
interface DeleteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteDataModal: React.FC<DeleteDataModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum bg-opacity-40 backdrop-blur-sm fade-in">
      <div className="bg-theme-card border border-theme-border rounded-3xl w-full max-w-sm p-6 shadow-premium relative">
        <div className="w-12 h-12 bg-rose bg-opacity-15 rounded-xl flex items-center justify-center text-rose mx-auto mb-4 animate-bounce">
          <AlertTriangle size={24} />
        </div>

        <h3 className="text-sm font-extrabold text-theme-text text-center">Are you absolutely sure?</h3>
        <p className="text-xs text-theme-muted text-center mt-1.5 leading-relaxed">
          This will permanently delete your account, habits, completed logs, streak history, and coach reflection data. This action cannot be undone.
        </p>

        <div className="flex gap-3 mt-6">
          <SunsetButton 
            variant="outline" 
            onClick={onClose}
            className="flex-1 text-xs"
            disabled={loading}
          >
            Cancel
          </SunsetButton>
          <SunsetButton 
            variant="danger" 
            onClick={onConfirm}
            loading={loading}
            className="flex-1 text-xs"
          >
            Delete Account
          </SunsetButton>
        </div>
      </div>
    </div>
  );
};
