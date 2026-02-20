/**
 * Instruction service
 * Handles care instruction operations
 */

import { apiEndpoints } from './apiEndpoints';
import type { ApiResponse } from '../types/api.types';
import type { CareInstruction } from '../types/instruction.types';

export const instructionService = {
  /**
   * Get all instructions for current user
   */
  getInstructions: async (_userId: string, role: string): Promise<CareInstruction[]> => {
    try {
      let raw: unknown;
      if (role === 'patient') {
        raw = await apiEndpoints.patient.getMyInstructions();
      } else if (role === 'provider') {
        raw = await apiEndpoints.provider.getInstructions();
      } else {
        throw new Error('Invalid role');
      }
      // Backend may return { success, data: [...] } or the array directly
      const rawWithData = raw as { data?: unknown };
      const list = Array.isArray(raw) ? raw : (Array.isArray(rawWithData?.data) ? rawWithData.data : []);
      return list as CareInstruction[];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch instructions');
    }
  },

  /**
   * Get instruction by ID
   */
  getInstruction: async (id: string): Promise<CareInstruction> => {
    try {
      // Try patient endpoint first, fallback to provider
      try {
        const response = await apiEndpoints.patient.getMyInstruction(id);
        return response.data;
      } catch {
        const response = await apiEndpoints.provider.getInstruction(id);
        return response.data;
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch instruction');
    }
  },

  /**
   * Create new instruction
   */
  createInstruction: async (instruction: Partial<CareInstruction>): Promise<CareInstruction> => {
    try {
      const response = await apiEndpoints.provider.createInstruction(instruction);
      const data = (response as ApiResponse<CareInstruction>)?.data ?? response;
      if (!data || typeof data !== 'object') throw new Error('Invalid create instruction response');
      return data as CareInstruction;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create instruction');
    }
  },

  /**
   * Update instruction
   */
  updateInstruction: async (id: string, updates: Partial<CareInstruction>): Promise<CareInstruction> => {
    try {
      const response = await apiEndpoints.provider.updateInstruction(id, updates);
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update instruction');
    }
  },

  /**
   * Acknowledge instruction
   */
  acknowledgeInstruction: async (
    instructionId: string,
    acknowledgmentType: 'receipt' | 'understanding' | 'commitment'
  ): Promise<void> => {
    try {
      await apiEndpoints.patient.acknowledgeInstruction(instructionId, acknowledgmentType);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to acknowledge instruction');
    }
  },
};
