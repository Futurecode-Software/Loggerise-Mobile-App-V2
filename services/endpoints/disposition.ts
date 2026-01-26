/**
 * Disposition API Endpoints
 *
 * Handles disposition (dispozisyon) management operations.
 */

import api, { getErrorMessage } from '../api';
import { Load } from './loads';
import { Position, Pagination } from './positions';

/**
 * Draft position with loads
 */
export interface DraftPosition extends Position {
  loads?: Load[];
  loads_count?: number;
}

/**
 * Disposition data response
 */
export interface DispositionData {
  draft_positions: DraftPosition[];
  active_positions: Position[];
  unassigned_loads: Load[];
  disposition_type: 'export' | 'import';
}

/**
 * Disposition index response
 */
interface DispositionIndexResponse {
  success: boolean;
  data: DispositionData;
}

/**
 * Single position response
 */
interface PositionResponse {
  success: boolean;
  message: string;
  data: {
    position: DraftPosition;
  };
}

/**
 * Delete response
 */
interface DeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Bulk confirm response
 */
interface BulkConfirmResponse {
  success: boolean;
  message: string;
  data: {
    positions: Position[];
    errors: string[];
  };
}

/**
 * Get disposition data (draft positions, unassigned loads, active positions)
 */
export async function getDispositionData(
  type: 'export' | 'import' = 'export'
): Promise<DispositionData> {
  try {
    const response = await api.get<DispositionIndexResponse>('/disposition', {
      params: { type },
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create a new draft position
 */
export async function createDraftPosition(
  positionType: 'export' | 'import'
): Promise<DraftPosition> {
  try {
    const response = await api.post<PositionResponse>('/disposition/draft-positions', {
      position_type: positionType,
    });
    return response.data.data.position;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update a draft position
 */
export async function updateDraftPosition(
  positionId: number,
  data: Partial<DraftPosition>
): Promise<DraftPosition> {
  try {
    const response = await api.put<PositionResponse>(
      `/disposition/draft-positions/${positionId}`,
      data
    );
    return response.data.data.position;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Confirm (approve) a draft position
 */
export async function confirmDraftPosition(positionId: number): Promise<DraftPosition> {
  try {
    const response = await api.post<PositionResponse>(
      `/disposition/draft-positions/${positionId}/confirm`
    );
    return response.data.data.position;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete a draft position
 */
export async function deleteDraftPosition(positionId: number): Promise<void> {
  try {
    await api.delete<DeleteResponse>(`/disposition/draft-positions/${positionId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Assign load to draft position
 */
export async function assignLoadToPosition(
  positionId: number,
  loadId: number
): Promise<DraftPosition> {
  try {
    const response = await api.post<PositionResponse>(
      `/disposition/draft-positions/${positionId}/loads`,
      { load_id: loadId }
    );
    return response.data.data.position;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Remove load from draft position
 */
export async function removeLoadFromPosition(positionId: number, loadId: number): Promise<void> {
  try {
    await api.delete<DeleteResponse>(`/disposition/draft-positions/${positionId}/loads/${loadId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Bulk confirm multiple draft positions
 */
export async function bulkConfirmDraftPositions(
  positionIds: number[]
): Promise<{ positions: Position[]; errors: string[] }> {
  try {
    const response = await api.post<BulkConfirmResponse>('/disposition/bulk-confirm', {
      position_ids: positionIds,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Calculate position capacity from loads
 */
export function calculatePositionCapacity(loads: Load[]): {
  totalVolume: number;
  totalWeight: number;
  totalLademetre: number;
  loadCount: number;
} {
  let totalVolume = 0;
  let totalWeight = 0;
  let totalLademetre = 0;

  loads.forEach((load) => {
    if (load.items) {
      load.items.forEach((item: any) => {
        totalVolume += item.volume || 0;
        totalWeight += item.gross_weight || 0;
        totalLademetre += item.lademetre || 0;
      });
    }
  });

  return {
    totalVolume: Math.round(totalVolume * 100) / 100,
    totalWeight: Math.round(totalWeight * 100) / 100,
    totalLademetre: Math.round(totalLademetre * 100) / 100,
    loadCount: loads.length,
  };
}
