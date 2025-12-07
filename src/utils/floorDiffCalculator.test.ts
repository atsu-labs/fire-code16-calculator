/**
 * floorDiffCalculator.test.ts - 階差分検出ユーティリティのテスト
 */

import { describe, it, expect } from "vitest";
import { calculateFloorDiff } from "./floorDiffCalculator";
import { type Floor, generateUUID } from "../types";

describe("floorDiffCalculator", () => {
  describe("calculateFloorDiff", () => {
    it("既存階が空で、目標階が3階の場合、3階すべてを追加対象とする", () => {
      const currentFloors: Floor[] = [];
      const targetFloors: Floor[] = [
        {
          id: generateUUID(),
          name: "3階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const result = calculateFloorDiff(currentFloors, targetFloors);

      expect(result.mergedFloors).toHaveLength(3);
      expect(result.deletedFloorIds).toEqual([]);
      expect(result.mergedFloors[0].name).toBe("3階");
      expect(result.mergedFloors[2].name).toBe("1階");
    });

    it("既存階と目標階が同じ場合、既存データを保持する", () => {
      const existingFloorId = generateUUID();
      const currentFloors: Floor[] = [
        {
          id: existingFloorId,
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 100,
          buildingCommonArea: 50,
          usages: [
            {
              id: generateUUID(),
              annexedCode: "annex01_i",
              annexedName: "１項イ",
              exclusiveArea: 200,
            },
          ],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const targetFloors: Floor[] = [
        {
          id: generateUUID(),
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const result = calculateFloorDiff(currentFloors, targetFloors);

      expect(result.mergedFloors).toHaveLength(2);
      expect(result.deletedFloorIds).toEqual([]);

      // 既存の2階のデータが保持されていることを確認
      const merged2F = result.mergedFloors.find((f) => f.name === "2階");
      expect(merged2F?.id).toBe(existingFloorId);
      expect(merged2F?.floorCommonArea).toBe(100);
      expect(merged2F?.buildingCommonArea).toBe(50);
      expect(merged2F?.usages).toHaveLength(1);
      expect(merged2F?.usages[0].exclusiveArea).toBe(200);
    });

    it("階数が増加した場合、不足する階のみを追加する", () => {
      const existingId1 = generateUUID();
      const existingId2 = generateUUID();

      const currentFloors: Floor[] = [
        {
          id: existingId2,
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 50,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: existingId1,
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 100,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const targetFloors: Floor[] = [
        {
          id: generateUUID(),
          name: "4階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "3階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const result = calculateFloorDiff(currentFloors, targetFloors);

      expect(result.mergedFloors).toHaveLength(4);
      expect(result.deletedFloorIds).toEqual([]);

      // 既存データが保持されていることを確認
      const merged2F = result.mergedFloors.find((f) => f.name === "2階");
      const merged1F = result.mergedFloors.find((f) => f.name === "1階");
      expect(merged2F?.id).toBe(existingId2);
      expect(merged2F?.floorCommonArea).toBe(50);
      expect(merged1F?.id).toBe(existingId1);
      expect(merged1F?.floorCommonArea).toBe(100);

      // 新規階が追加されていることを確認
      expect(result.mergedFloors.find((f) => f.name === "4階")).toBeDefined();
      expect(result.mergedFloors.find((f) => f.name === "3階")).toBeDefined();
    });

    it("階数が減少した場合、余剰な階を削除対象とする", () => {
      const id5F = generateUUID();
      const id4F = generateUUID();
      const id3F = generateUUID();
      const id2F = generateUUID();
      const id1F = generateUUID();

      const currentFloors: Floor[] = [
        {
          id: id5F,
          name: "5階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: id4F,
          name: "4階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: id3F,
          name: "3階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: id2F,
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: id1F,
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const targetFloors: Floor[] = [
        {
          id: generateUUID(),
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const result = calculateFloorDiff(currentFloors, targetFloors);

      expect(result.mergedFloors).toHaveLength(2);
      expect(result.deletedFloorIds).toHaveLength(3);
      expect(result.deletedFloorIds).toContain(id5F);
      expect(result.deletedFloorIds).toContain(id4F);
      expect(result.deletedFloorIds).toContain(id3F);

      // 残った階のIDが保持されていることを確認
      const merged2F = result.mergedFloors.find((f) => f.name === "2階");
      const merged1F = result.mergedFloors.find((f) => f.name === "1階");
      expect(merged2F?.id).toBe(id2F);
      expect(merged1F?.id).toBe(id1F);
    });

    it("地上階と地階の混在ケースで正しく差分を検出する", () => {
      const id2F = generateUUID();
      const id1F = generateUUID();

      const currentFloors: Floor[] = [
        {
          id: id2F,
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 100,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: id1F,
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 50,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const targetFloors: Floor[] = [
        {
          id: generateUUID(),
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "地下1階",
          floorType: "basement",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "地下2階",
          floorType: "basement",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const result = calculateFloorDiff(currentFloors, targetFloors);

      expect(result.mergedFloors).toHaveLength(4);
      expect(result.deletedFloorIds).toEqual([]);

      // 既存地上階のデータが保持されていることを確認
      const merged2F = result.mergedFloors.find((f) => f.name === "2階");
      const merged1F = result.mergedFloors.find((f) => f.name === "1階");
      expect(merged2F?.id).toBe(id2F);
      expect(merged2F?.floorCommonArea).toBe(100);
      expect(merged1F?.id).toBe(id1F);
      expect(merged1F?.floorCommonArea).toBe(50);

      // 新規地階が追加されていることを確認
      expect(
        result.mergedFloors.find((f) => f.name === "地下1階")
      ).toBeDefined();
      expect(
        result.mergedFloors.find((f) => f.name === "地下2階")
      ).toBeDefined();
    });

    it("地階のみが削除される場合、地階のIDのみを削除対象とする", () => {
      const id1F = generateUUID();
      const idB1F = generateUUID();
      const idB2F = generateUUID();

      const currentFloors: Floor[] = [
        {
          id: id1F,
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: idB1F,
          name: "地下1階",
          floorType: "basement",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: idB2F,
          name: "地下2階",
          floorType: "basement",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const targetFloors: Floor[] = [
        {
          id: generateUUID(),
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const result = calculateFloorDiff(currentFloors, targetFloors);

      expect(result.mergedFloors).toHaveLength(1);
      expect(result.deletedFloorIds).toHaveLength(2);
      expect(result.deletedFloorIds).toContain(idB1F);
      expect(result.deletedFloorIds).toContain(idB2F);

      const merged1F = result.mergedFloors[0];
      expect(merged1F.id).toBe(id1F);
      expect(merged1F.name).toBe("1階");
    });

    it("全階削除の場合、全てのIDを削除対象とする", () => {
      const id3F = generateUUID();
      const id2F = generateUUID();
      const id1F = generateUUID();

      const currentFloors: Floor[] = [
        {
          id: id3F,
          name: "3階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: id2F,
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: id1F,
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const targetFloors: Floor[] = [];

      const result = calculateFloorDiff(currentFloors, targetFloors);

      expect(result.mergedFloors).toEqual([]);
      expect(result.deletedFloorIds).toHaveLength(3);
      expect(result.deletedFloorIds).toContain(id3F);
      expect(result.deletedFloorIds).toContain(id2F);
      expect(result.deletedFloorIds).toContain(id1F);
    });

    it("階名とfloorTypeの組み合わせで一致判定を行う", () => {
      const idAbove1F = generateUUID();
      const idBasement1F = generateUUID();

      // "1階"（地上階）と"地下1階"は異なる階として扱う
      const currentFloors: Floor[] = [
        {
          id: idAbove1F,
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 100,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const targetFloors: Floor[] = [
        {
          id: generateUUID(),
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: idBasement1F,
          name: "地下1階",
          floorType: "basement",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const result = calculateFloorDiff(currentFloors, targetFloors);

      expect(result.mergedFloors).toHaveLength(2);
      expect(result.deletedFloorIds).toEqual([]);

      const merged1F = result.mergedFloors.find(
        (f) => f.name === "1階" && f.floorType === "above-ground"
      );
      expect(merged1F?.id).toBe(idAbove1F);
      expect(merged1F?.floorCommonArea).toBe(100);

      const mergedB1F = result.mergedFloors.find(
        (f) => f.name === "地下1階" && f.floorType === "basement"
      );
      expect(mergedB1F).toBeDefined();
    });

    it("マージ後の階配列が目標階の順序を保つ", () => {
      const id2F = generateUUID();

      const currentFloors: Floor[] = [
        {
          id: id2F,
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 100,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const targetFloors: Floor[] = [
        {
          id: generateUUID(),
          name: "5階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "4階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "3階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "2階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
        {
          id: generateUUID(),
          name: "1階",
          floorType: "above-ground",
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      const result = calculateFloorDiff(currentFloors, targetFloors);

      expect(result.mergedFloors).toHaveLength(5);
      expect(result.mergedFloors[0].name).toBe("5階");
      expect(result.mergedFloors[1].name).toBe("4階");
      expect(result.mergedFloors[2].name).toBe("3階");
      expect(result.mergedFloors[3].name).toBe("2階");
      expect(result.mergedFloors[3].id).toBe(id2F); // 既存データ保持
      expect(result.mergedFloors[4].name).toBe("1階");
    });
  });
});
