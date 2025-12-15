/**
 * floorGenerator.test.ts - 非階生成機能のテスト
 */

import { describe, it, expect } from "vitest";
import { generateNonFloors } from "./floorGenerator";

describe("generateNonFloors", () => {
  it("非階数0の場合、空配列を返す", () => {
    const result = generateNonFloors(0);
    expect(result).toEqual([]);
  });

  it("非階数1の場合、1つの非階を生成する", () => {
    const result = generateNonFloors(1);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("非階1");
    expect(result[0].floorType).toBe("non-floor");
    expect(result[0].floorCommonArea).toBe(0);
    expect(result[0].buildingCommonArea).toBe(0);
    expect(result[0].usages).toEqual([]);
    expect(result[0].usageGroups).toEqual([]);
  });

  it("非階数3の場合、3つの非階を生成する", () => {
    const result = generateNonFloors(3);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("非階1");
    expect(result[1].name).toBe("非階2");
    expect(result[2].name).toBe("非階3");
  });

  it("各非階に一意のIDが割り当てられる", () => {
    const result = generateNonFloors(3);
    const ids = result.map((f) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it("すべての非階のfloorTypeが'non-floor'である", () => {
    const result = generateNonFloors(5);
    result.forEach((floor) => {
      expect(floor.floorType).toBe("non-floor");
    });
  });

  it("すべての非階の初期値が正しい", () => {
    const result = generateNonFloors(2);
    result.forEach((floor) => {
      expect(floor.floorCommonArea).toBe(0);
      expect(floor.buildingCommonArea).toBe(0);
      expect(floor.usages).toEqual([]);
      expect(floor.usageGroups).toEqual([]);
    });
  });
});
