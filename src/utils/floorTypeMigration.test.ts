/**
 * floorTypeMigration.test.ts - 既存階データのfloorType移行ヘルパーのテスト
 */

import { describe, it, expect } from "vitest";
import { migrateFloorType } from "./floorTypeMigration";
import type { Floor } from "../types";

describe("migrateFloorType", () => {
  describe("階名から階タイプを推測", () => {
    it("階名に'地下'が含まれる場合、'basement'を設定する", () => {
      const floor: Floor = {
        id: "floor-1",
        name: "地下1階",
        floorCommonArea: 100,
        buildingCommonArea: 50,
        usages: [],
        usageGroups: [],
      };

      const result = migrateFloorType(floor);

      expect(result.floorType).toBe("basement");
      expect(result.name).toBe("地下1階");
      expect(result.id).toBe("floor-1");
    });

    it("階名に'地下'が含まれない場合、'above-ground'を設定する", () => {
      const floor: Floor = {
        id: "floor-2",
        name: "1階",
        floorCommonArea: 100,
        buildingCommonArea: 50,
        usages: [],
        usageGroups: [],
      };

      const result = migrateFloorType(floor);

      expect(result.floorType).toBe("above-ground");
      expect(result.name).toBe("1階");
      expect(result.id).toBe("floor-2");
    });

    it("数字のみの階名の場合、'above-ground'を設定する", () => {
      const floor: Floor = {
        id: "floor-3",
        name: "5階",
        floorCommonArea: 100,
        buildingCommonArea: 50,
        usages: [],
        usageGroups: [],
      };

      const result = migrateFloorType(floor);

      expect(result.floorType).toBe("above-ground");
    });

    it("階名に'地下'が含まれる場合（複数パターン）、'basement'を設定する", () => {
      const testCases = ["地下2階", "地下3階", "地下10階"];

      testCases.forEach((name, index) => {
        const floor: Floor = {
          id: `floor-${index}`,
          name,
          floorCommonArea: 100,
          buildingCommonArea: 50,
          usages: [],
          usageGroups: [],
        };

        const result = migrateFloorType(floor);
        expect(result.floorType).toBe("basement");
      });
    });
  });

  describe("既存のfloorTypeを保持", () => {
    it("既にfloorTypeが'above-ground'に設定されている場合、変更しない", () => {
      const floor: Floor = {
        id: "floor-4",
        name: "地下1階", // 名前は地下階だが、既にabove-groundが設定されている
        floorType: "above-ground",
        floorCommonArea: 100,
        buildingCommonArea: 50,
        usages: [],
        usageGroups: [],
      };

      const result = migrateFloorType(floor);

      expect(result.floorType).toBe("above-ground");
    });

    it("既にfloorTypeが'basement'に設定されている場合、変更しない", () => {
      const floor: Floor = {
        id: "floor-5",
        name: "1階", // 名前は地上階だが、既にbasementが設定されている
        floorType: "basement",
        floorCommonArea: 100,
        buildingCommonArea: 50,
        usages: [],
        usageGroups: [],
      };

      const result = migrateFloorType(floor);

      expect(result.floorType).toBe("basement");
    });
  });

  describe("デフォルト値の設定", () => {
    it("floorTypeが未設定で階名が不明な場合、'above-ground'をデフォルトとする", () => {
      const floor: Floor = {
        id: "floor-6",
        name: "不明な階",
        floorCommonArea: 100,
        buildingCommonArea: 50,
        usages: [],
        usageGroups: [],
      };

      const result = migrateFloorType(floor);

      expect(result.floorType).toBe("above-ground");
    });

    it("空文字の階名の場合、'above-ground'をデフォルトとする", () => {
      const floor: Floor = {
        id: "floor-7",
        name: "",
        floorCommonArea: 100,
        buildingCommonArea: 50,
        usages: [],
        usageGroups: [],
      };

      const result = migrateFloorType(floor);

      expect(result.floorType).toBe("above-ground");
    });
  });

  describe("元のデータを保持", () => {
    it("usagesとusageGroupsのデータを保持する", () => {
      const floor: Floor = {
        id: "floor-8",
        name: "2階",
        floorCommonArea: 100,
        buildingCommonArea: 50,
        usages: [
          {
            id: "usage-1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 200,
          },
        ],
        usageGroups: [
          {
            id: "group-1",
            floorId: "floor-8",
            usageIds: ["usage-1", "usage-2"],
            commonArea: 50,
          },
        ],
      };

      const result = migrateFloorType(floor);

      expect(result.usages).toEqual(floor.usages);
      expect(result.usageGroups).toEqual(floor.usageGroups);
      expect(result.floorCommonArea).toBe(100);
      expect(result.buildingCommonArea).toBe(50);
    });

    it("不変性を保持し、元のオブジェクトを変更しない", () => {
      const floor: Floor = {
        id: "floor-9",
        name: "3階",
        floorCommonArea: 100,
        buildingCommonArea: 50,
        usages: [],
        usageGroups: [],
      };

      const result = migrateFloorType(floor);

      // 結果は新しいオブジェクト
      expect(result).not.toBe(floor);
      // floorTypeが追加されている
      expect(result.floorType).toBe("above-ground");
      // 元のオブジェクトは変更されていない
      expect(floor.floorType).toBeUndefined();
    });
  });

  describe("配列処理のヘルパー", () => {
    it("複数の階を一括で移行できる", () => {
      const floors: Floor[] = [
        {
          id: "floor-1",
          name: "3階",
          floorCommonArea: 100,
          buildingCommonArea: 50,
          usages: [],
          usageGroups: [],
        },
        {
          id: "floor-2",
          name: "2階",
          floorCommonArea: 100,
          buildingCommonArea: 50,
          usages: [],
          usageGroups: [],
        },
        {
          id: "floor-3",
          name: "地下1階",
          floorCommonArea: 100,
          buildingCommonArea: 50,
          usages: [],
          usageGroups: [],
        },
      ];

      const results = floors.map(migrateFloorType);

      expect(results[0].floorType).toBe("above-ground");
      expect(results[1].floorType).toBe("above-ground");
      expect(results[2].floorType).toBe("basement");
    });
  });
});
