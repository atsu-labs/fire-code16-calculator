/**
 * floorSorter.test.ts - 階ソート機能のテスト
 */

import { describe, it, expect } from "vitest";
import { sortFloors } from "./floorSorter";
import type { Floor } from "../types";

// テスト用の階を作成するヘルパー
function createFloor(
  name: string,
  floorType?: "above-ground" | "basement" | "non-floor"
): Floor {
  return {
    id: `id-${name}`,
    name,
    floorType,
    floorCommonArea: 0,
    buildingCommonArea: 0,
    usages: [],
    usageGroups: [],
  };
}

describe("sortFloors", () => {
  it("空配列の場合、空配列を返す", () => {
    const result = sortFloors([]);
    expect(result).toEqual([]);
  });

  it("地上階のみの場合、降順にソートする", () => {
    const floors = [
      createFloor("1階", "above-ground"),
      createFloor("3階", "above-ground"),
      createFloor("2階", "above-ground"),
    ];
    const result = sortFloors(floors);
    expect(result.map((f) => f.name)).toEqual(["3階", "2階", "1階"]);
  });

  it("地階のみの場合、昇順にソートする（地下1階が先）", () => {
    const floors = [
      createFloor("地下3階", "basement"),
      createFloor("地下1階", "basement"),
      createFloor("地下2階", "basement"),
    ];
    const result = sortFloors(floors);
    expect(result.map((f) => f.name)).toEqual([
      "地下1階",
      "地下2階",
      "地下3階",
    ]);
  });

  it("非階のみの場合、順序を維持する", () => {
    const floors = [
      createFloor("非階1", "non-floor"),
      createFloor("非階3", "non-floor"),
      createFloor("非階2", "non-floor"),
    ];
    const result = sortFloors(floors);
    expect(result.map((f) => f.name)).toEqual(["非階1", "非階3", "非階2"]);
  });

  it("非階→地上階→地階の順序でソートする", () => {
    const floors = [
      createFloor("1階", "above-ground"),
      createFloor("地下1階", "basement"),
      createFloor("非階1", "non-floor"),
      createFloor("3階", "above-ground"),
      createFloor("非階2", "non-floor"),
      createFloor("地下2階", "basement"),
      createFloor("2階", "above-ground"),
    ];
    const result = sortFloors(floors);
    expect(result.map((f) => f.name)).toEqual([
      "非階1",
      "非階2",
      "3階",
      "2階",
      "1階",
      "地下1階",
      "地下2階",
    ]);
  });

  it("floorTypeがundefinedの階は地上階として扱う", () => {
    const floors = [
      createFloor("1階"), // floorType: undefined
      createFloor("3階", "above-ground"),
      createFloor("2階"), // floorType: undefined
    ];
    const result = sortFloors(floors);
    expect(result.map((f) => f.name)).toEqual(["3階", "2階", "1階"]);
  });

  it("複雑な組み合わせで正しくソートする", () => {
    const floors = [
      createFloor("10階", "above-ground"),
      createFloor("地下3階", "basement"),
      createFloor("非階1", "non-floor"),
      createFloor("1階", "above-ground"),
      createFloor("PH", "non-floor"),
      createFloor("地下1階", "basement"),
      createFloor("5階", "above-ground"),
      createFloor("M階", "non-floor"),
    ];
    const result = sortFloors(floors);
    expect(result.map((f) => f.name)).toEqual([
      "非階1",
      "PH",
      "M階",
      "10階",
      "5階",
      "1階",
      "地下1階",
      "地下3階",
    ]);
  });

  it("元の配列を変更しない（イミュータブル）", () => {
    const floors = [
      createFloor("1階", "above-ground"),
      createFloor("2階", "above-ground"),
    ];
    const original = [...floors];
    sortFloors(floors);
    expect(floors).toEqual(original);
  });
});
