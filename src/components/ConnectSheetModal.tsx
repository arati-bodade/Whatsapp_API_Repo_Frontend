import React, { useState } from 'react';
import { googleSheetService } from '@/services/googleSheetService';

interface ConnectSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSheetConnected: () => void;
}

const ConnectSheetModal: React.FC<ConnectSheetModalProps> = ({
  isOpen,
  onClose,
  onSheetConnected,
}) => {
  const [formData, setFormData] = useState({
    sheet_name: '',
    spreadsheet_id: '',
    worksheet_name: '', // Optional
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sheet_name || !formData.spreadsheet_id) {
      setError('Please fill in required fields (Sheet Name & Spreadsheet ID)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await googleSheetService.connectSheet(formData);

      // Reset form
      setFormData({ sheet_name: '', spreadsheet_id: '', worksheet_name: '' });

      // Notify parent
      onSheetConnected();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to connect sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground rounded-2xl p-8 w-full max-w-md border border-border shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Connect Google Sheet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="sheet_name" className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-tight">
              Sheet Name
            </label>
            <input
              type="text"
              id="sheet_name"
              name="sheet_name"
              value={formData.sheet_name}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="e.g., Customer Contacts"
              required
            />
          </div>

          <div>
            <label htmlFor="spreadsheet_id" className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-tight">
              Spreadsheet ID
            </label>
            <input
              type="text"
              id="spreadsheet_id"
              name="spreadsheet_id"
              value={formData.spreadsheet_id}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              required
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed px-1">
              Found in your Google Sheets URL:
              https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
            </p>
          </div>

          <div>
            <label htmlFor="worksheet_name" className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-tight">
              Worksheet Name
            </label>
            <input
              type="text"
              id="worksheet_name"
              name="worksheet_name"
              value={formData.worksheet_name}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="e.g., Sheet1 (Optional)"
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed px-1">
              Leave blank to automatically connect to the first available worksheet in your spreadsheet.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-all font-semibold"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Sheet'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="text-blue-600 dark:text-blue-400 text-[11px] leading-relaxed">
            <strong className="block mb-1">Note:</strong> Make sure your Google Sheet is publicly accessible or
            shared with the service account email. You can find detailed steps in our documentation.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectSheetModal;
