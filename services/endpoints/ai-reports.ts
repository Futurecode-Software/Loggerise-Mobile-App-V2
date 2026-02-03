/**
 * AI Reports API Endpoints
 *
 * Handles AI-powered report generation with natural language queries.
 * The AI converts questions to SQL and executes them against the database.
 */

import api, { getErrorMessage } from '../api';

/**
 * Message role enum
 */
export type MessageRole = 'user' | 'assistant';

/**
 * AI Report Message entity
 */
export interface AiReportMessage {
  id: number;
  role: MessageRole;
  content: string;
  sql_query?: string;
  sql_result?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * AI Report entity
 */
export interface AiReport {
  id: number;
  title: string;
  is_active: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  messages?: AiReportMessage[];
}

/**
 * Pagination info
 */
export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from?: number;
  to?: number;
}

/**
 * AI Reports list filters
 */
export interface AiReportFilters {
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

/**
 * Reports list response
 */
interface ReportsListResponse {
  success: boolean;
  data: {
    reports: AiReport[];
    pagination: Pagination;
  };
}

/**
 * Single report response
 */
interface ReportResponse {
  success: boolean;
  data: AiReport;
}

/**
 * Create/Update report response
 */
interface ReportMutationResponse {
  success: boolean;
  message: string;
  data: AiReport;
  error?: string;
}

/**
 * Delete response
 */
interface DeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Schema response
 */
interface SchemaResponse {
  success: boolean;
  data: {
    schema: string;
  };
}

/**
 * Create report request
 */
export interface CreateReportRequest {
  title: string;
  message: string;
}

/**
 * Add message request
 */
export interface AddMessageRequest {
  message: string;
}

/**
 * Get AI reports list with optional filters
 */
export async function getReports(
  filters?: AiReportFilters
): Promise<{ reports: AiReport[]; pagination: Pagination }> {
  try {
    const response = await api.get<ReportsListResponse>('/ai-reports', {
      params: filters,
    });
    return {
      reports: response.data.data.reports,
      pagination: response.data.data.pagination,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single AI report by ID with messages
 */
export async function getReport(id: number): Promise<AiReport> {
  try {
    const response = await api.get<ReportResponse>(`/ai-reports/${id}`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new AI report
 * This creates a report, adds the initial user message,
 * and generates AI response with SQL query execution.
 */
export async function createReport(data: CreateReportRequest): Promise<{
  report: AiReport;
  success: boolean;
  error?: string;
}> {
  try {
    const response = await api.post<ReportMutationResponse>('/ai-reports', data);
    return {
      report: response.data.data,
      success: response.data.success,
      error: response.data.error,
    };
  } catch (error: any) {
    // Handle 422 responses which still return report data
    if (error.response?.status === 422 && error.response?.data?.data) {
      return {
        report: error.response.data.data,
        success: false,
        error: error.response.data.error || error.response.data.message,
      };
    }
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Add message to existing report
 * This adds a user message and generates AI response.
 */
export async function addMessage(
  reportId: number,
  data: AddMessageRequest
): Promise<{
  report: AiReport;
  success: boolean;
  error?: string;
}> {
  try {
    const response = await api.post<ReportMutationResponse>(
      `/ai-reports/${reportId}/messages`,
      data
    );
    return {
      report: response.data.data,
      success: response.data.success,
      error: response.data.error,
    };
  } catch (error: any) {
    // Handle 422 responses which still return report data
    if (error.response?.status === 422 && error.response?.data?.data) {
      return {
        report: error.response.data.data,
        success: false,
        error: error.response.data.error || error.response.data.message,
      };
    }
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete AI report
 */
export async function deleteReport(id: number): Promise<void> {
  try {
    await api.delete(`/ai-reports/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get database schema information
 * Returns the schema used by AI for query generation.
 */
export async function getSchema(): Promise<string> {
  try {
    const response = await api.get<SchemaResponse>('/ai-reports/schema');
    return response.data.data.schema;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Format report time
 */
export function formatReportTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today - show time
    return `Bugün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return 'Dün';
  } else if (diffDays < 7) {
    return `${diffDays} gün önce`;
  } else {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }
}

/**
 * Get message preview from report
 * Returns the first user message or title
 */
export function getReportPreview(report: AiReport): string {
  if (report.messages && report.messages.length > 0) {
    const firstUserMessage = report.messages.find((m) => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.length > 100
        ? firstUserMessage.content.substring(0, 100) + '...'
        : firstUserMessage.content;
    }
  }
  return report.title;
}

/**
 * Check if message contains error
 */
export function isErrorMessage(message: AiReportMessage): boolean {
  return message.role === 'assistant' && message.content.includes('❌');
}

/**
 * Parse SQL result from message
 */
export function parseSqlResult(message: AiReportMessage): any[] | null {
  if (!message.sql_result) return null;
  try {
    return JSON.parse(message.sql_result);
  } catch {
    return null;
  }
}

/**
 * Example questions for new users
 */
export const EXAMPLE_QUESTIONS = [
  'Kaç tane aktif araç var?',
  'Bu ayın toplam fatura tutarı ne kadar?',
  'En çok satılan ürünler hangileri?',
  'Son 30 günde eklenen cariler',
  'Depo bazlı stok durumu',
  'Araçlar için yapılan toplam masraf',
];
