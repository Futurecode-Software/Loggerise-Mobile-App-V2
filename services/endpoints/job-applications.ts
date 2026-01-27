/**
 * Job Applications API Endpoints
 *
 * Handles job application (işe alım başvuruları) management operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Application status enum
 */
export type ApplicationStatus =
  | 'başvuru_alındı'
  | 'değerlendiriliyor'
  | 'mülakat_planlandı'
  | 'onaylandı'
  | 'reddedildi'
  | 'iptal_edildi';

/**
 * Interview type enum
 */
export type InterviewType = 'telefon' | 'whatsapp' | 'mail' | 'yüz_yüze' | 'video_konferans';

/**
 * Interview result enum
 */
export type InterviewResult = 'olumlu' | 'olumsuz' | 'kararsız' | 'beklemede';

/**
 * Job Application Interview entity
 */
export interface JobApplicationInterview {
  id: number;
  job_application_id: number;
  user_id: number;
  title: string;
  interview_date: string;
  interview_time: string;
  interview_type: InterviewType;
  interview_result?: InterviewResult;
  notes?: string;
  file_path?: string;
  next_interview_date?: string;
  created_at: string;
  updated_at: string;
  // Relations
  user?: {
    id: number;
    name: string;
  };
}

/**
 * Job Application entity
 */
export interface JobApplication {
  id: number;
  job_posting_id?: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  cv_file_path?: string;
  application_date: string;
  status: ApplicationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  job_posting?: {
    id: number;
    title: string;
    position: string;
  };
  interviews?: JobApplicationInterview[];
}

/**
 * Job Application list filters
 */
export interface JobApplicationFilters {
  search?: string;
  status?: ApplicationStatus;
  job_posting_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

/**
 * Pagination info
 */
export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/**
 * Job Applications list response
 */
interface JobApplicationsListResponse {
  data: JobApplication[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Single job application response
 */
interface JobApplicationResponse {
  data: JobApplication;
  message?: string;
}

/**
 * Create/Update job application data
 */
export interface JobApplicationFormData {
  job_posting_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  cv_file?: File | any; // File object for upload
  application_date: string;
  status?: ApplicationStatus;
  notes?: string;
}

/**
 * Interview form data
 */
export interface InterviewFormData {
  title: string;
  interview_date: string;
  interview_time: string;
  interview_type: InterviewType;
  interview_result?: InterviewResult;
  notes?: string;
  file?: File | any;
  next_interview_date?: string;
}

/**
 * Interviews list response
 */
interface InterviewsListResponse {
  data: JobApplicationInterview[];
}

/**
 * Single interview response
 */
interface InterviewResponse {
  data: JobApplicationInterview;
  message?: string;
}

/**
 * Options response
 */
interface OptionsResponse {
  data: Record<string, string>;
}

/**
 * File download response
 */
interface FileDownloadResponse {
  data: {
    url: string;
    expires_at: string;
  };
}

/**
 * Get job applications list with optional filters
 */
export async function getJobApplications(
  filters?: JobApplicationFilters
): Promise<{ jobApplications: JobApplication[]; pagination: Pagination }> {
  try {
    const response = await api.get<JobApplicationsListResponse>('/job-applications', {
      params: filters,
    });
    return {
      jobApplications: response.data.data,
      pagination: {
        current_page: response.data.meta.current_page,
        last_page: response.data.meta.last_page,
        per_page: response.data.meta.per_page,
        total: response.data.meta.total,
      },
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single job application by ID
 */
export async function getJobApplication(id: number): Promise<JobApplication> {
  try {
    const response = await api.get<JobApplicationResponse>(`/job-applications/${id}`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new job application
 */
export async function createJobApplication(data: JobApplicationFormData): Promise<JobApplication> {
  try {
    const formData = new FormData();

    // Append text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'cv_file' && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Append file if exists
    if (data.cv_file) {
      formData.append('cv_file', data.cv_file);
    }

    const response = await api.post<JobApplicationResponse>('/job-applications', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing job application
 */
export async function updateJobApplication(
  id: number,
  data: Partial<JobApplicationFormData>
): Promise<JobApplication> {
  try {
    const formData = new FormData();

    // Append text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'cv_file' && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Append file if exists
    if (data.cv_file) {
      formData.append('cv_file', data.cv_file);
    }

    const response = await api.put<JobApplicationResponse>(`/job-applications/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete job application
 */
export async function deleteJobApplication(id: number): Promise<void> {
  try {
    await api.delete(`/job-applications/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Approve application and create employee record
 */
export async function approveJobApplication(id: number): Promise<JobApplication> {
  try {
    const response = await api.patch<JobApplicationResponse>(`/job-applications/${id}/approve`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Download CV file
 */
export async function downloadCV(id: number): Promise<string> {
  try {
    const response = await api.get<FileDownloadResponse>(`/job-applications/${id}/download-cv`);
    return response.data.data.url;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get application status options from backend
 */
export async function getApplicationStatusOptions(): Promise<Record<string, string>> {
  try {
    const response = await api.get<OptionsResponse>('/job-applications/statuses');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

// ==================== INTERVIEWS ====================

/**
 * Get interviews for a job application
 */
export async function getInterviews(applicationId: number): Promise<JobApplicationInterview[]> {
  try {
    const response = await api.get<InterviewsListResponse>(
      `/job-applications/${applicationId}/interviews`
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single interview
 */
export async function getInterview(
  applicationId: number,
  interviewId: number
): Promise<JobApplicationInterview> {
  try {
    const response = await api.get<InterviewResponse>(
      `/job-applications/${applicationId}/interviews/${interviewId}`
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new interview
 */
export async function createInterview(
  applicationId: number,
  data: InterviewFormData
): Promise<JobApplicationInterview> {
  try {
    const formData = new FormData();

    // Append text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'file' && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Append file if exists
    if (data.file) {
      formData.append('file', data.file);
    }

    const response = await api.post<InterviewResponse>(
      `/job-applications/${applicationId}/interviews`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update interview
 */
export async function updateInterview(
  applicationId: number,
  interviewId: number,
  data: Partial<InterviewFormData>
): Promise<JobApplicationInterview> {
  try {
    const formData = new FormData();

    // Append text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'file' && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Append file if exists
    if (data.file) {
      formData.append('file', data.file);
    }

    const response = await api.put<InterviewResponse>(
      `/job-applications/${applicationId}/interviews/${interviewId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete interview
 */
export async function deleteInterview(applicationId: number, interviewId: number): Promise<void> {
  try {
    await api.delete(`/job-applications/${applicationId}/interviews/${interviewId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Download interview file
 */
export async function downloadInterviewFile(
  applicationId: number,
  interviewId: number
): Promise<string> {
  try {
    const response = await api.get<FileDownloadResponse>(
      `/job-applications/${applicationId}/interviews/${interviewId}/download`
    );
    return response.data.data.url;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get interview type options from backend
 */
export async function getInterviewTypeOptions(): Promise<Record<string, string>> {
  try {
    const response = await api.get<OptionsResponse>('/job-applications/1/interviews/types');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get interview result options from backend
 */
export async function getInterviewResultOptions(): Promise<Record<string, string>> {
  try {
    const response = await api.get<OptionsResponse>('/job-applications/1/interviews/results');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get application status label in Turkish
 */
export function getApplicationStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    başvuru_alındı: 'Başvuru Alındı',
    değerlendiriliyor: 'Değerlendiriliyor',
    mülakat_planlandı: 'Mülakat Planlandı',
    onaylandı: 'Onaylandı',
    reddedildi: 'Reddedildi',
    iptal_edildi: 'İptal Edildi',
  };
  return labels[status] || status;
}

/**
 * Get application status color (for badges)
 */
export function getApplicationStatusColor(
  status: ApplicationStatus
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const colors: Record<ApplicationStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    başvuru_alındı: 'info',
    değerlendiriliyor: 'warning',
    mülakat_planlandı: 'info',
    onaylandı: 'success',
    reddedildi: 'error',
    iptal_edildi: 'default',
  };
  return colors[status] || 'default';
}

/**
 * Get interview type label in Turkish
 */
export function getInterviewTypeLabel(type: InterviewType): string {
  const labels: Record<InterviewType, string> = {
    telefon: 'Telefon 📞',
    whatsapp: 'WhatsApp 💬',
    mail: 'E-posta ✉️',
    yüz_yüze: 'Yüz Yüze 👥',
    video_konferans: 'Video Konferans 🎥',
  };
  return labels[type] || type;
}

/**
 * Get interview result label in Turkish
 */
export function getInterviewResultLabel(result: InterviewResult): string {
  const labels: Record<InterviewResult, string> = {
    olumlu: 'Olumlu',
    olumsuz: 'Olumsuz',
    kararsız: 'Kararsız',
    beklemede: 'Beklemede',
  };
  return labels[result] || result;
}

/**
 * Get interview result color (for badges)
 */
export function getInterviewResultColor(
  result: InterviewResult
): 'success' | 'warning' | 'error' | 'default' {
  const colors: Record<InterviewResult, 'success' | 'warning' | 'error' | 'default'> = {
    olumlu: 'success',
    olumsuz: 'error',
    kararsız: 'warning',
    beklemede: 'default',
  };
  return colors[result] || 'default';
}

/**
 * Get full name
 */
export function getFullName(
  application: JobApplication | { first_name: string; last_name: string }
): string {
  return `${application.first_name} ${application.last_name}`;
}

/**
 * Format date in Turkish locale
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format time in HH:mm format
 */
export function formatTime(timeString: string): string {
  return timeString.substring(0, 5); // Extract HH:mm from HH:mm:ss
}
