import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_BASE_URL_CONFIG = API_BASE_URL;

// Google Sheets API service
export const googleSheetsService = {
  // Sheet Management
  async getSheets() {
    const response = await axios.get(`${API_BASE_URL_CONFIG}/google-sheets/`);
    return response.data;
  },

  async getSheet(sheetId: string) {
    const response = await axios.get(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}`);
    return response.data;
  },

  async connectSheet(sheetData: {
    sheet_name: string;
    spreadsheet_id: string;
  }) {
    const response = await axios.post(`${API_BASE_URL_CONFIG}/google-sheets/connect`, sheetData);
    return response.data;
  },

  async updateSheet(sheetId: string, sheetData: {
    sheet_name: string;
    spreadsheet_id: string;
  }) {
    const response = await axios.put(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}`, sheetData);
    return response.data;
  },

  async deleteSheet(sheetId: string) {
    const response = await axios.delete(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}`);
    return response.data;
  },

  async getSheetRows(sheetId: string, params?: {
    worksheet_name?: string;
    start_row?: number;
    end_row?: number;
  }) {
    const response = await axios.get(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}/rows`, { params });
    return response.data;
  },

  async syncSheet(sheetId: string) {
    const response = await axios.post(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}/sync`);
    return response.data;
  },

  // Manual Send - Official WhatsApp API only
  async sendManualMessages(sheetId: string, sendData: {
    template_name?: string;
    language_code?: string;
    phone_column: string;
    header_param_columns?: string[];
    body_param_columns?: string[];
    button_param_columns?: Record<string, string>;
    selected_rows?: any[];
    send_all?: boolean;
  }) {
    console.log('🔍 OFFICIAL MANUAL SEND PAYLOAD:');
    console.log('   Sheet ID:', sheetId);
    console.log('   Send Data:', JSON.stringify(sendData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}/manual-send`, sendData, {
      timeout: 30000  // 30 seconds timeout
    });
    return response.data;
  },

  // Unified Messaging - supports both text and template
  async sendSheetMessages(sheetId: string, sendData: {
    mode: 'text' | 'template';
    phone_column: string;
    text_message?: string;
    template_name?: string;
    language_code?: string;
    header_param_columns?: string[];
    body_param_columns?: string[];
    button_param_columns?: Record<string, string>;
    selected_rows?: any[];
    send_all?: boolean;
  }) {
    console.log('🔍 UNIFIED MESSAGING PAYLOAD:');
    console.log('   Sheet ID:', sheetId);
    console.log('   Mode:', sendData.mode);
    console.log('   Send Data:', JSON.stringify(sendData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}/messaging`, sendData, {
      timeout: 30000
    });
    return response.data;
  },

  // Official Template Send
  async sendOfficialTemplateMessages(sheetId: string, sendData: {
    template_name: string;
    language_code: string;
    phone_column: string;
    header_param_columns?: string[];
    body_param_columns?: string[];
    button_param_columns?: Record<string, string>;
    selected_rows?: any[];
    send_all?: boolean;
  }) {
    console.log('🔍 OFFICIAL TEMPLATE SEND PAYLOAD:');
    console.log('   Sheet ID:', sheetId);
    console.log('   Template:', sendData.template_name);
    
    const response = await axios.post(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}/official-template-send`, sendData, {
      timeout: 30000
    });
    return response.data;
  },

  // Trigger Management - Official WhatsApp API only
  async getTriggers(sheetId: string) {
    const response = await axios.get(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}/triggers`);
    return response.data;
  },

  async createTrigger(sheetId: string, triggerData: {
    trigger_type: string;
    is_enabled?: boolean;
    message_template?: string;
    phone_column?: string;
    trigger_column?: string;
    status_column?: string;
    trigger_value?: string;
    webhook_url?: string;
    execution_interval?: number;
    schedule_column?: string;
  }) {
    const response = await axios.post(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}/triggers`, triggerData);
    return response.data;
  },

  async createOfficialTemplateTrigger(sheetId: string, triggerData: {
    trigger_type: string;
    is_enabled?: boolean;
    template_name: string;
    language_code: string;
    phone_column: string;
    header_param_columns?: string[];
    body_param_columns?: string[];
    button_param_columns?: Record<string, string>;
    trigger_column?: string;
    status_column?: string;
    trigger_value?: string;
    webhook_url?: string;
    schedule_column?: string;
    execution_interval?: number;
  }) {
    const response = await axios.post(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}/official-template-triggers`, triggerData);
    return response.data;
  },

  async updateTrigger(triggerId: string, triggerData: {
    trigger_type?: string;
    is_enabled?: boolean;
  }) {
    const response = await axios.put(`${API_BASE_URL_CONFIG}/google-sheets/triggers/${triggerId}`, triggerData);
    return response.data;
  },

  async deleteTrigger(triggerId: string) {
    const response = await axios.delete(`${API_BASE_URL_CONFIG}/google-sheets/triggers/${triggerId}`);
    return response.data;
  },

  // History & Analytics
  async getSheetHistory(sheetId: string, params?: {
    page?: number;
    per_page?: number;
  }) {
    const response = await axios.get(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}/history`, { params });
    return response.data;
  },

  async getTriggerHistory(triggerId: string, params?: {
    page?: number;
    per_page?: number;
  }) {
    const response = await axios.get(`${API_BASE_URL_CONFIG}/google-sheets/triggers/${triggerId}/history`, { params });
    return response.data;
  },

  async getAllTriggerHistory(params?: {
    page?: number;
    per_page?: number;
  }) {
    const response = await axios.get(`${API_BASE_URL_CONFIG}/google-sheets/triggers/history`, { params });
    return response.data;
  },

  async getAllTriggers() {
    const response = await axios.get(`${API_BASE_URL_CONFIG}/google-sheets/all/triggers`);
    return response.data;
  },

  async getSheetStats(sheetId: string) {
    const response = await axios.get(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}/stats`);
    return response.data;
  },

  // Official WhatsApp Config
  async getOfficialConfigStatus() {
    const response = await axios.get(`${API_BASE_URL_CONFIG}/google-sheets/official-config/status`);
    return response.data;
  },

  // Templates
  async getSheetTemplates(sheetId: string) {
    const response = await axios.get(`${API_BASE_URL_CONFIG}/google-sheets/${sheetId}/templates`);
    return response.data;
  },
};

// Types for Google Sheets integration - Official WhatsApp API only
export interface GoogleSheet {
  id: string;
  user_id?: string;
  sheet_name: string;
  spreadsheet_id: string;
  worksheet_name?: string;
  status: string;
  total_rows: number;
  trigger_enabled: boolean;
  message_template?: string;
  trigger_config?: any;
  connected_at: string;
  created_at?: string;
  updated_at: string;
  last_synced_at?: string;
}

export interface GoogleSheetTrigger {
  trigger_id: string;
  sheet_id: string;
  device_id?: string | null;  // Optional for backward compatibility
  trigger_type: string;
  is_enabled: boolean;
  last_triggered_at?: string;
  created_at: string;
  device_name?: string;  // Will show "Official API" for new triggers
  sheet_name?: string;
  message_template?: string;
  phone_column?: string;
  trigger_column?: string;
  status_column?: string;
  trigger_value?: string;
  webhook_url?: string;
  trigger_config?: any;
}

export interface TriggerHistory {
  id: string;
  trigger_id?: string;
  sheet_id: string;
  sheet_name?: string;
  spreadsheet_id?: string;
  phone_number: string;
  message_content: string;
  status: string;
  error_message?: string;
  triggered_at: string;
  row_number?: number;
  row_data?: any;
  official_message_id?: string;
}

export interface ManualSendResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
  message_ids: string[];
}

export interface SheetStats {
  sheet_id: string;
  sheet_name: string;
  status: string;
  rows_count: number;
  trigger_count: number;
  total_sent: number;
  total_failed: number;
  last_synced_at?: string;
  connected_at: string;
}

export interface OfficialConfigStatus {
  has_config: boolean;
  is_active: boolean;
  business_number?: string;
  waba_id?: string;
  phone_number_id?: string;
  template_status?: string;
  message: string;
}

export interface WhatsAppTemplate {
  id: number;
  template_name: string;
  category: string;
  language: string;
  status: string;
  content: string;
}
