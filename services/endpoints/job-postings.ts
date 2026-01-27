/**
 * Job Postings API Endpoints
 *
 * Handles job posting (iş ilanları) management operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Employment type enum
 */
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote';

/**
 * Experience level enum
 */
export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'expert';

/**
 * Job Posting entity
 */
export interface JobPosting {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  position: string;
  location?: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  application_deadline?: string;
  is_public: boolean;
  is_active: boolean;
  published_at?: string;
  view_count: number;
  application_count: number;
  applications_count?: number; // Laravel withCount
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Additional data from detail endpoint
  application_stats?: Record<string, number>;
  recent_applications_count?: number;
  // Relations
  applications?: any[];
}

/**
 * Job Posting list filters
 */
export interface JobPostingFilters {
  search?: string;
  employment_type?: EmploymentType;
  experience_level?: ExperienceLevel;
  is_active?: boolean;
  is_public?: boolean;
  exclude_expired?: boolean;
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
 * Job Postings list response
 */
interface JobPostingsListResponse {
  data: JobPosting[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Single job posting response
 */
interface JobPostingResponse {
  data: JobPosting;
  message?: string;
}

/**
 * Create/Update job posting data
 */
export interface JobPostingFormData {
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  position: string;
  location?: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  application_deadline?: string;
  is_public?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * Options response
 */
interface OptionsResponse {
  data: Record<string, string>;
}

/**
 * Get job postings list with optional filters
 */
export async function getJobPostings(
  filters?: JobPostingFilters
): Promise<{ jobPostings: JobPosting[]; pagination: Pagination }> {
  try {
    const response = await api.get<JobPostingsListResponse>('/job-postings', {
      params: filters,
    });
    return {
      jobPostings: response.data.data,
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
 * Get single job posting by ID
 */
export async function getJobPosting(id: number): Promise<JobPosting> {
  try {
    const response = await api.get<JobPostingResponse>(`/job-postings/${id}`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new job posting
 */
export async function createJobPosting(data: JobPostingFormData): Promise<JobPosting> {
  try {
    const response = await api.post<JobPostingResponse>('/job-postings', data);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing job posting
 */
export async function updateJobPosting(
  id: number,
  data: Partial<JobPostingFormData>
): Promise<JobPosting> {
  try {
    const response = await api.put<JobPostingResponse>(`/job-postings/${id}`, data);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete job posting
 */
export async function deleteJobPosting(id: number): Promise<void> {
  try {
    await api.delete(`/job-postings/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Toggle publish status
 */
export async function togglePublishJobPosting(id: number): Promise<JobPosting> {
  try {
    const response = await api.patch<JobPostingResponse>(`/job-postings/${id}/toggle-publish`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get employment type options from backend
 */
export async function getEmploymentTypeOptions(): Promise<Record<string, string>> {
  try {
    const response = await api.get<OptionsResponse>('/job-postings/employment-types');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get experience level options from backend
 */
export async function getExperienceLevelOptions(): Promise<Record<string, string>> {
  try {
    const response = await api.get<OptionsResponse>('/job-postings/experience-levels');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get employment type label in Turkish
 */
export function getEmploymentTypeLabel(type: EmploymentType): string {
  const labels: Record<EmploymentType, string> = {
    full_time: 'Tam Zamanlı',
    part_time: 'Yarı Zamanlı',
    contract: 'Sözleşmeli',
    internship: 'Staj',
    remote: 'Uzaktan',
  };
  return labels[type] || type;
}

/**
 * Get experience level label in Turkish
 */
export function getExperienceLevelLabel(level: ExperienceLevel): string {
  const labels: Record<ExperienceLevel, string> = {
    entry: 'Giriş Seviyesi',
    junior: 'Junior',
    mid: 'Mid-Level',
    senior: 'Senior',
    expert: 'Uzman',
  };
  return labels[level] || level;
}

/**
 * Format salary range
 */
export function formatSalaryRange(
  min?: number,
  max?: number,
  currency: string = 'TRY'
): string {
  if (!min && !max) return '-';

  const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }

  if (min) {
    return `${formatter.format(min)}+`;
  }

  if (max) {
    return `${formatter.format(max)}'e kadar`;
  }

  return '-';
}

/**
 * Check if job posting is expired
 */
export function isJobPostingExpired(jobPosting: JobPosting): boolean {
  if (!jobPosting.application_deadline) return false;
  return new Date(jobPosting.application_deadline) < new Date();
}

/**
 * Get status label (active/inactive)
 */
export function getStatusLabel(isActive: boolean): string {
  return isActive ? 'Aktif' : 'Pasif';
}

/**
 * Get visibility label (public/private)
 */
export function getVisibilityLabel(isPublic: boolean): string {
  return isPublic ? 'Herkese Açık' : 'Özel';
}
