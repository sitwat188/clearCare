/**
 * Instruction service
 * Handles care instruction operations
 */

import { apiEndpoints } from './apiEndpoints';
import { mockInstructions } from './mockData';
import type { CareInstruction } from '../types/instruction.types';
import type { ApiResponse, PaginatedResponse } from '../types/api.types';

export const instructionService = {
  /**
   * Get all instructions for current user
   */
  getInstructions: async (userId: string, role: string): Promise<CareInstruction[]> => {
    try {
      if (role === 'patient') {
        const response = await apiEndpoints.patient.getMyInstructions();
        return response.data;
      } else if (role === 'provider') {
        const response = await apiEndpoints.provider.getInstructions();
        return response.data;
      }
      throw new Error('Invalid role');
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
    // TODO: Implement with actual API call
    throw new Error('Not implemented - will connect to backend');
  },

  /**
   * Update instruction
   */
  updateInstruction: async (id: string, updates: Partial<CareInstruction>): Promise<CareInstruction> => {
    // TODO: Implement with actual API call
    throw new Error('Not implemented - will connect to backend');
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
