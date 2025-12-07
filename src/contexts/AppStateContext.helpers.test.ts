/**
 * AppStateContext Helper Functions のテスト
 */

import { describe, it, expect } from "vitest";
import {
  updateBuildingHelper,
  updateFloorHelper,
  updateUsageHelper,
  addFloorHelper,
  deleteFloorHelper,
  addUsageHelper,
  deleteUsageHelper,
  addUsageGroupHelper,
  deleteUsageGroupHelper,
  deleteUsageGroupsContainingUsageHelper,
} from "./AppStateContext";
import {
  type Building,
  type Floor,
  type Usage,
  type UsageGroup,
} from "../types";

describe("AppStateContext Helper Functions", () => {
  describe("updateBuildingHelper", () => {
    it("建物の一部フィールドを更新する", () => {
      const building: Building = {
        id: "building-1",
        floors: [],
      };

      const updated = updateBuildingHelper(building, {
        id: "building-2",
      });

      expect(updated).not.toBe(building); // 不変性確認
      expect(updated.id).toBe("building-2");
      expect(updated.floors).toEqual([]);
    });
  });

  describe("updateFloorHelper", () => {
    it("指定した階のみを更新する", () => {
      const floors: Floor[] = [
        {
          id: "floor-1",
          name: "1階",
          floorCommonArea: 10,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: "floor-2",
          name: "2階",
          floorCommonArea: 20,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const updated = updateFloorHelper(floors, "floor-1", { name: "1F" });

      expect(updated).not.toBe(floors); // 不変性確認
      expect(updated[0]).not.toBe(floors[0]); // 更新された階は新しいオブジェクト
      expect(updated[1]).toBe(floors[1]); // 他の階は同じオブジェクト
      expect(updated[0].name).toBe("1F");
      expect(updated[1].name).toBe("2階");
    });

    it("存在しない階IDの場合は何も変更しない", () => {
      const floors: Floor[] = [
        {
          id: "floor-1",
          name: "1階",
          floorCommonArea: 10,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const updated = updateFloorHelper(floors, "non-existent", { name: "XX" });

      expect(updated[0]).toBe(floors[0]); // 同じオブジェクト
      expect(updated[0].name).toBe("1階");
    });
  });

  describe("addFloorHelper", () => {
    it("新しい階を追加する", () => {
      const floors: Floor[] = [
        {
          id: "floor-1",
          name: "1階",
          floorCommonArea: 10,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const updated = addFloorHelper(floors);

      expect(updated).not.toBe(floors); // 不変性確認
      expect(updated.length).toBe(2);
      expect(updated[0]).toBe(floors[0]); // 既存の階は同じオブジェクト
      expect(updated[1].id).toBeTruthy();
      expect(updated[1].name).toBe("1階");
      expect(updated[1].usages).toEqual([]);
    });
  });

  describe("deleteFloorHelper", () => {
    it("指定した階を削除する", () => {
      const floors: Floor[] = [
        {
          id: "floor-1",
          name: "1階",
          floorCommonArea: 10,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: "floor-2",
          name: "2階",
          floorCommonArea: 20,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const updated = deleteFloorHelper(floors, "floor-1");

      expect(updated).not.toBe(floors); // 不変性確認
      expect(updated.length).toBe(1);
      expect(updated[0].id).toBe("floor-2");
    });

    it("存在しない階IDの場合は何も削除しない", () => {
      const floors: Floor[] = [
        {
          id: "floor-1",
          name: "1階",
          floorCommonArea: 10,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const updated = deleteFloorHelper(floors, "non-existent");

      expect(updated.length).toBe(1);
      expect(updated[0]).toBe(floors[0]);
    });
  });

  describe("updateUsageHelper", () => {
    it("指定した用途のみを更新する", () => {
      const usages: Usage[] = [
        {
          id: "usage-1",
          annexedCode: "annex01_i",
          annexedName: "１項イ",
          exclusiveArea: 100,
        },
        {
          id: "usage-2",
          annexedCode: "annex02_i",
          annexedName: "２項イ",
          exclusiveArea: 200,
        },
      ];

      const updated = updateUsageHelper(usages, "usage-1", {
        exclusiveArea: 150,
      });

      expect(updated).not.toBe(usages); // 不変性確認
      expect(updated[0]).not.toBe(usages[0]); // 更新された用途は新しいオブジェクト
      expect(updated[1]).toBe(usages[1]); // 他の用途は同じオブジェクト
      expect(updated[0].exclusiveArea).toBe(150);
      expect(updated[1].exclusiveArea).toBe(200);
    });
  });

  describe("addUsageHelper", () => {
    it("新しい用途を追加する", () => {
      const usages: Usage[] = [
        {
          id: "usage-1",
          annexedCode: "annex01_i",
          annexedName: "１項イ",
          exclusiveArea: 100,
        },
      ];

      const newUsage: Usage = {
        id: "usage-2",
        annexedCode: "annex02_i",
        annexedName: "２項イ",
        exclusiveArea: 200,
      };

      const updated = addUsageHelper(usages, newUsage);

      expect(updated).not.toBe(usages); // 不変性確認
      expect(updated.length).toBe(2);
      expect(updated[0]).toBe(usages[0]);
      expect(updated[1]).toBe(newUsage);
    });
  });

  describe("deleteUsageHelper", () => {
    it("指定した用途を削除する", () => {
      const usages: Usage[] = [
        {
          id: "usage-1",
          annexedCode: "annex01_i",
          annexedName: "１項イ",
          exclusiveArea: 100,
        },
        {
          id: "usage-2",
          annexedCode: "annex02_i",
          annexedName: "２項イ",
          exclusiveArea: 200,
        },
      ];

      const updated = deleteUsageHelper(usages, "usage-1");

      expect(updated).not.toBe(usages); // 不変性確認
      expect(updated.length).toBe(1);
      expect(updated[0].id).toBe("usage-2");
    });
  });

  describe("addUsageGroupHelper", () => {
    it("新しい用途グループを追加する", () => {
      const usageGroups: UsageGroup[] = [
        {
          id: "group-1",
          floorId: "floor-1",
          usageIds: ["usage-1", "usage-2"],
          commonArea: 50,
        },
      ];

      const newGroup: UsageGroup = {
        id: "group-2",
        floorId: "floor-1",
        usageIds: ["usage-3", "usage-4"],
        commonArea: 100,
      };

      const updated = addUsageGroupHelper(usageGroups, newGroup);

      expect(updated).not.toBe(usageGroups); // 不変性確認
      expect(updated.length).toBe(2);
      expect(updated[0]).toBe(usageGroups[0]);
      expect(updated[1]).toBe(newGroup);
    });
  });

  describe("deleteUsageGroupHelper", () => {
    it("指定した用途グループを削除する", () => {
      const usageGroups: UsageGroup[] = [
        {
          id: "group-1",
          floorId: "floor-1",
          usageIds: ["usage-1", "usage-2"],
          commonArea: 50,
        },
        {
          id: "group-2",
          floorId: "floor-1",
          usageIds: ["usage-3", "usage-4"],
          commonArea: 100,
        },
      ];

      const updated = deleteUsageGroupHelper(usageGroups, "group-1");

      expect(updated).not.toBe(usageGroups); // 不変性確認
      expect(updated.length).toBe(1);
      expect(updated[0].id).toBe("group-2");
    });
  });

  describe("deleteUsageGroupsContainingUsageHelper", () => {
    it("指定した用途を含む全ての用途グループを削除する", () => {
      const usageGroups: UsageGroup[] = [
        {
          id: "group-1",
          floorId: "floor-1",
          usageIds: ["usage-1", "usage-2"],
          commonArea: 50,
        },
        {
          id: "group-2",
          floorId: "floor-1",
          usageIds: ["usage-2", "usage-3"],
          commonArea: 100,
        },
        {
          id: "group-3",
          floorId: "floor-2",
          usageIds: ["usage-3", "usage-4"],
          commonArea: 75,
        },
      ];

      const updated = deleteUsageGroupsContainingUsageHelper(
        usageGroups,
        "usage-2"
      );

      expect(updated).not.toBe(usageGroups); // 不変性確認
      expect(updated.length).toBe(1);
      expect(updated[0].id).toBe("group-3");
    });

    it("該当する用途がない場合は何も削除しない", () => {
      const usageGroups: UsageGroup[] = [
        {
          id: "group-1",
          floorId: "floor-1",
          usageIds: ["usage-1", "usage-2"],
          commonArea: 50,
        },
      ];

      const updated = deleteUsageGroupsContainingUsageHelper(
        usageGroups,
        "usage-999"
      );

      expect(updated.length).toBe(1);
      expect(updated[0]).toBe(usageGroups[0]);
    });
  });
});
