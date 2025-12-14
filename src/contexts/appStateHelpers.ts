import {
  generateUUID,
  type Building,
  type Floor,
  type Usage,
  type UsageGroup,
  type ValidationError,
} from "../types";

/**
 * 初期階を作成（ヘルパー内で独立して生成）
 */
export function createInitialFloor(): Floor {
  return {
    id: generateUUID(),
    name: "1階",
    floorCommonArea: 0,
    buildingCommonArea: 0,
    usages: [],
    usageGroups: [],
  };
}

/**
 * 初期状態を作成（ヘルパー内で提供）
 */
export function createInitialState(): {
  building: Building;
  calculationResults: null;
  uiState: { isCalculating: boolean; errors: ValidationError[] };
} {
  return {
    building: {
      id: generateUUID(),
      floors: [createInitialFloor()],
    },
    calculationResults: null,
    uiState: {
      isCalculating: false,
      errors: [] as ValidationError[],
    },
  };
}

export function updateBuildingHelper(
  building: Building,
  updates: Partial<Building>
): Building {
  return {
    ...building,
    ...updates,
  };
}

export function updateFloorHelper(
  floors: Floor[],
  floorId: string,
  updates: Partial<Floor>
): Floor[] {
  return floors.map((floor) =>
    floor.id === floorId ? { ...floor, ...updates } : floor
  );
}

export function updateUsageHelper(
  usages: Usage[],
  usageId: string,
  updates: Partial<Usage>
): Usage[] {
  return usages.map((usage) =>
    usage.id === usageId ? { ...usage, ...updates } : usage
  );
}

export function addFloorHelper(floors: Floor[]): Floor[] {
  return [...floors, createInitialFloor()];
}

export function deleteFloorHelper(floors: Floor[], floorId: string): Floor[] {
  return floors.filter((floor) => floor.id !== floorId);
}

export function addUsageHelper(usages: Usage[], usage: Usage): Usage[] {
  return [...usages, usage];
}

export function deleteUsageHelper(usages: Usage[], usageId: string): Usage[] {
  return usages.filter((usage) => usage.id !== usageId);
}

export function addUsageGroupHelper(
  usageGroups: UsageGroup[],
  usageGroup: UsageGroup
): UsageGroup[] {
  return [...usageGroups, usageGroup];
}

export function deleteUsageGroupHelper(
  usageGroups: UsageGroup[],
  groupId: string
): UsageGroup[] {
  return usageGroups.filter((group) => group.id !== groupId);
}

export function deleteUsageGroupsContainingUsageHelper(
  usageGroups: UsageGroup[],
  usageId: string
): UsageGroup[] {
  return usageGroups.filter((group) => !group.usageIds.includes(usageId));
}
