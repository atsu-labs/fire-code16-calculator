/**
 * AppStateContext - アプリケーション全体の状態管理
 * React Context API + useReducer を使用した状態管理
 */

/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import {
  type Building,
  type Floor,
  type Usage,
  type UsageGroup,
  type CalculationResults,
  type ValidationError,
} from '../types';
import { createInitialState } from './appStateHelpers';

// ============================================================================
// State Types
// ============================================================================

/**
 * AppState - アプリケーション全体の状態
 */
export interface AppState {
  building: Building;
  calculationResults: CalculationResults | null;
  uiState: {
    isCalculating: boolean;
    errors: ValidationError[];
  };
}

/**
 * AppAction - 状態変更アクション
 */
export type AppAction =
  | { type: 'UPDATE_BUILDING'; payload: Partial<Building> }
  | { type: 'ADD_FLOOR'; payload: Floor }
  | { type: 'UPDATE_FLOOR'; payload: { floorId: string; updates: Partial<Floor> } }
  | { type: 'DELETE_FLOOR'; payload: string }
  | { type: 'SET_FLOOR_COUNTS'; payload: { floors: Floor[]; deletedFloorIds: string[] } }
  | { type: 'ADD_USAGE'; payload: { floorId: string; usage: Usage } }
  | { type: 'UPDATE_USAGE'; payload: { floorId: string; usageId: string; updates: Partial<Usage> } }
  | { type: 'DELETE_USAGE'; payload: { floorId: string; usageId: string } }
  | { type: 'ADD_USAGE_GROUP'; payload: { floorId: string; usageGroup: UsageGroup } }
  | { type: 'UPDATE_USAGE_GROUP'; payload: { floorId: string; groupId: string; updates: Partial<UsageGroup> } }
  | { type: 'DELETE_USAGE_GROUP'; payload: { floorId: string; groupId: string } }
  | { type: 'SET_CALCULATION_RESULTS'; payload: CalculationResults | null }
  | { type: 'SET_CALCULATING'; payload: boolean }
  | { type: 'SET_ERRORS'; payload: ValidationError[] }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_STATE' };

// ============================================================================
// Initial State
// ============================================================================

// 初期状態は appStateHelpers の createInitialState を使用

// ============================================================================
// Reducer
// ============================================================================

/**
 * appStateReducer - 状態更新ロジック
 */
function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_BUILDING':
      return {
        ...state,
        building: {
          ...state.building,
          ...action.payload,
        },
      };

    case 'ADD_FLOOR':
      return {
        ...state,
        building: {
          ...state.building,
          floors: [...state.building.floors, action.payload],
        },
      };

    case 'UPDATE_FLOOR': {
      const { floorId, updates } = action.payload;
      return {
        ...state,
        building: {
          ...state.building,
          floors: state.building.floors.map((floor) =>
            floor.id === floorId ? { ...floor, ...updates } : floor
          ),
        },
      };
    }

    case 'DELETE_FLOOR':
      return {
        ...state,
        building: {
          ...state.building,
          floors: state.building.floors.filter((floor) => floor.id !== action.payload),
        },
      };

    case 'SET_FLOOR_COUNTS': {
      const { floors } = action.payload;
      return {
        ...state,
        building: {
          ...state.building,
          floors: floors,
        },
      };
    }

    case 'ADD_USAGE': {
      const { floorId, usage } = action.payload;
      return {
        ...state,
        building: {
          ...state.building,
          floors: state.building.floors.map((floor) =>
            floor.id === floorId
              ? { ...floor, usages: [...floor.usages, usage] }
              : floor
          ),
        },
      };
    }

    case 'UPDATE_USAGE': {
      const { floorId, usageId, updates } = action.payload;
      return {
        ...state,
        building: {
          ...state.building,
          floors: state.building.floors.map((floor) =>
            floor.id === floorId
              ? {
                  ...floor,
                  usages: floor.usages.map((usage) =>
                    usage.id === usageId ? { ...usage, ...updates } : usage
                  ),
                }
              : floor
          ),
        },
      };
    }

    case 'DELETE_USAGE': {
      const { floorId, usageId } = action.payload;
      return {
        ...state,
        building: {
          ...state.building,
          floors: state.building.floors.map((floor) =>
            floor.id === floorId
              ? {
                  ...floor,
                  usages: floor.usages.filter((usage) => usage.id !== usageId),
                }
              : floor
          ),
        },
      };
    }

    case 'ADD_USAGE_GROUP': {
      const { floorId, usageGroup } = action.payload;
      return {
        ...state,
        building: {
          ...state.building,
          floors: state.building.floors.map((floor) =>
            floor.id === floorId
              ? { ...floor, usageGroups: [...floor.usageGroups, usageGroup] }
              : floor
          ),
        },
      };
    }

    case 'UPDATE_USAGE_GROUP': {
      const { floorId, groupId, updates } = action.payload;
      return {
        ...state,
        building: {
          ...state.building,
          floors: state.building.floors.map((floor) =>
            floor.id === floorId
              ? {
                  ...floor,
                  usageGroups: floor.usageGroups.map((group) =>
                    group.id === groupId ? { ...group, ...updates } : group
                  ),
                }
              : floor
          ),
        },
      };
    }

    case 'DELETE_USAGE_GROUP': {
      const { floorId, groupId } = action.payload;
      return {
        ...state,
        building: {
          ...state.building,
          floors: state.building.floors.map((floor) =>
            floor.id === floorId
              ? {
                  ...floor,
                  usageGroups: floor.usageGroups.filter((group) => group.id !== groupId),
                }
              : floor
          ),
        },
      };
    }

    case 'SET_CALCULATION_RESULTS':
      return {
        ...state,
        calculationResults: action.payload,
      };

    case 'SET_CALCULATING':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          isCalculating: action.payload,
        },
      };

    case 'SET_ERRORS':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          errors: action.payload,
        },
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          errors: [],
        },
      };

    case 'RESET_STATE':
      return createInitialState();

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

export interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}
export const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface AppStateProviderProps {
  children: ReactNode;
}

/**
 * AppStateProvider - アプリケーション状態のプロバイダー
 */
export function AppStateProvider({ children }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(appStateReducer, createInitialState());

  const value: AppStateContextValue = {
    state,
    dispatch,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useAppState - アプリケーション状態へのアクセス
 */
export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

// ============================================================================
// Helper Functions (不変更新ヘルパー)
// ============================================================================
// ヘルパー関数は `src/contexts/appStateHelpers.ts` に移動しました
