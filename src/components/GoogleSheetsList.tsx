import React, { useState, useEffect } from 'react';
import { googleSheetService, GoogleSheet } from '@/services/googleSheetService';

interface GoogleSheetsListProps {
  onSheetSelect: (sheet: GoogleSheet) => void;
  onConnectNew: () => void;
}

const GoogleSheetsList: React.FC<GoogleSheetsListProps> = ({ onSheetSelect, onConnectNew }) => {
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      setLoading(true);
      const data = await googleSheetService.listSheets();
      setSheets(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch Google Sheets');
      console.error('Error fetching sheets:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
        <button
          onClick={fetchSheets}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Google Sheets</h2>
        <button
          onClick={onConnectNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Connect New Sheet
        </button>
      </div>

      {sheets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No Google Sheets connected yet</div>
          <button
            onClick={onConnectNew}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Connect Your First Sheet
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSheetSelect(sheet)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {sheet.sheet_name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sheet.status)}`}>
                    {sheet.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Rows:</span>
                    <span className="font-medium">{sheet.total_rows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connected:</span>
                    <span className="font-medium">{formatDate(sheet.connected_at)}</span>
                  </div>
                  {sheet.last_synced_at && (
                    <div className="flex justify-between">
                      <span>Last Sync:</span>
                      <span className="font-medium">{formatDate(sheet.last_synced_at)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500 truncate">
                    ID: {sheet.spreadsheet_id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsList;
