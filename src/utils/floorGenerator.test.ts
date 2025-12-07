/**
 * floorGenerator.test.ts - 階生成ユーティリティのテスト
 */

import { describe, it, expect } from "vitest";
import { generateFloors } from "./floorGenerator";

describe("floorGenerator", () => {
  describe("generateFloors", () => {
    it("地上階数5、地階数0で5つの地上階を生成する", () => {
      const floors = generateFloors(5, 0);

      expect(floors).toHaveLength(5);
      expect(floors[0].name).toBe("5階");
      expect(floors[0].floorType).toBe("above-ground");
      expect(floors[4].name).toBe("1階");
      expect(floors[4].floorType).toBe("above-ground");
    });

    it("地上階数0、地階数3で3つの地階を生成する", () => {
      const floors = generateFloors(0, 3);

      expect(floors).toHaveLength(3);
      expect(floors[0].name).toBe("地下1階");
      expect(floors[0].floorType).toBe("basement");
      expect(floors[2].name).toBe("地下3階");
      expect(floors[2].floorType).toBe("basement");
    });

    it("地上階数3、地階数2で合計5階を正しい順序で生成する", () => {
      const floors = generateFloors(3, 2);

      expect(floors).toHaveLength(5);
      // 地上階（降順）
      expect(floors[0].name).toBe("3階");
      expect(floors[0].floorType).toBe("above-ground");
      expect(floors[1].name).toBe("2階");
      expect(floors[2].name).toBe("1階");
      // 地階（降順）
      expect(floors[3].name).toBe("地下1階");
      expect(floors[3].floorType).toBe("basement");
      expect(floors[4].name).toBe("地下2階");
      expect(floors[4].floorType).toBe("basement");
    });

    it("各階に一意のUUIDを割り当てる", () => {
      const floors = generateFloors(3, 2);

      const ids = floors.map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);

      // UUIDフォーマットの検証（簡易）
      ids.forEach((id) => {
        expect(id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
      });
    });

    it("各階の初期値を正しく設定する", () => {
      const floors = generateFloors(2, 1);

      floors.forEach((floor) => {
        expect(floor.floorCommonArea).toBe(0);
        expect(floor.buildingCommonArea).toBe(0);
        expect(floor.usages).toEqual([]);
        expect(floor.usageGroups).toEqual([]);
      });
    });

    it("地上階数0、地階数0で空配列を返す", () => {
      const floors = generateFloors(0, 0);

      expect(floors).toEqual([]);
    });

    it("大規模建物（地上階数50、地階数5）を処理できる", () => {
      const floors = generateFloors(50, 5);

      expect(floors).toHaveLength(55);
      expect(floors[0].name).toBe("50階");
      expect(floors[49].name).toBe("1階");
      expect(floors[50].name).toBe("地下1階");
      expect(floors[54].name).toBe("地下5階");
    });
  });
});
