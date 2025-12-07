/**
 * cascadeDeleteHelper.test.ts - カスケード削除ヘルパーのテスト
 */

import { describe, it, expect } from "vitest";
import { cleanupUsageGroupsAfterFloorDeletion } from "./cascadeDeleteHelper";
import { type Floor, type Usage, type UsageGroup } from "../types";

describe("cleanupUsageGroupsAfterFloorDeletion", () => {
  // ヘルパー関数: Usage作成
  const createUsage = (id: string, code: string): Usage => ({
    id,
    annexedCode: code,
    annexedName: `用途${code}`,
    exclusiveArea: 100,
  });

  // ヘルパー関数: Floor作成
  const createFloor = (
    id: string,
    name: string,
    usages: Usage[] = [],
    usageGroups: UsageGroup[] = []
  ): Floor => ({
    id,
    name,
    floorType: "above-ground",
    floorCommonArea: 0,
    buildingCommonArea: 0,
    usages,
    usageGroups,
  });

  // ヘルパー関数: UsageGroup作成
  const createUsageGroup = (
    id: string,
    floorId: string,
    usageIds: string[],
    commonArea: number = 50
  ): UsageGroup => ({
    id,
    floorId,
    usageIds,
    commonArea,
  });

  describe("削除階に所属するグループ共用部の削除", () => {
    it("削除階に所属するグループ共用部を削除する", () => {
      const usage1 = createUsage("u1", "annex01_i");
      const usage2 = createUsage("u2", "annex06_ro");

      const floor1 = createFloor(
        "f1",
        "1階",
        [usage1],
        [createUsageGroup("ug1", "f1", ["u1", "u2"])]
      );
      const floor2 = createFloor("f2", "2階", [usage2], []);

      const floors = [floor1, floor2];
      const deleteFloorIds = ["f1"];

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      // 削除階のグループ共用部が空配列になっていることを確認
      const deletedFloor = result.find((f) => f.id === "f1");
      expect(deletedFloor?.usageGroups).toEqual([]);

      // 他階は影響を受けない
      const otherFloor = result.find((f) => f.id === "f2");
      expect(otherFloor?.usageGroups).toEqual([]);
    });

    it("複数の削除階のグループ共用部を削除する", () => {
      const floor1 = createFloor(
        "f1",
        "1階",
        [],
        [createUsageGroup("ug1", "f1", ["u1", "u2"])]
      );
      const floor2 = createFloor(
        "f2",
        "2階",
        [],
        [createUsageGroup("ug2", "f2", ["u3", "u4"])]
      );
      const floor3 = createFloor("f3", "3階", [], []);

      const floors = [floor1, floor2, floor3];
      const deleteFloorIds = ["f1", "f2"];

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      expect(result.find((f) => f.id === "f1")?.usageGroups).toEqual([]);
      expect(result.find((f) => f.id === "f2")?.usageGroups).toEqual([]);
      expect(result.find((f) => f.id === "f3")?.usageGroups).toEqual([]);
    });
  });

  describe("他階のグループ共用部から削除階の用途IDを除外", () => {
    it("削除階の用途IDを他階のグループ共用部から除外する", () => {
      const usage1 = createUsage("u1", "annex01_i"); // 1階の用途
      const usage2 = createUsage("u2", "annex06_ro"); // 2階の用途
      const usage3 = createUsage("u3", "annex02_ni"); // 2階の用途

      const floor1 = createFloor("f1", "1階", [usage1], []);
      const floor2 = createFloor(
        "f2",
        "2階",
        [usage2, usage3],
        [
          createUsageGroup("ug1", "f2", ["u1", "u2", "u3"]), // 1階の用途u1を含む
        ]
      );

      const floors = [floor1, floor2];
      const deleteFloorIds = ["f1"]; // 1階を削除 → u1が削除される

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      const floor2Result = result.find((f) => f.id === "f2");
      expect(floor2Result?.usageGroups).toHaveLength(1);
      expect(floor2Result?.usageGroups[0].usageIds).toEqual(["u2", "u3"]);
    });

    it("複数の削除階の用途IDを除外する", () => {
      const floor1 = createFloor("f1", "1階", [createUsage("u1", "code1")], []);
      const floor2 = createFloor("f2", "2階", [createUsage("u2", "code2")], []);
      const floor3 = createFloor(
        "f3",
        "3階",
        [createUsage("u3", "code3")],
        [createUsageGroup("ug1", "f3", ["u1", "u2", "u3"])]
      );

      const floors = [floor1, floor2, floor3];
      const deleteFloorIds = ["f1", "f2"]; // u1, u2を削除

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      const floor3Result = result.find((f) => f.id === "f3");
      expect(floor3Result?.usageGroups).toHaveLength(0); // 用途数が1になるため削除される
    });
  });

  describe("除外後の用途数が2未満のグループ共用部を削除", () => {
    it("除外後の用途数が2未満になったグループ共用部を削除する", () => {
      const floor1 = createFloor("f1", "1階", [createUsage("u1", "code1")], []);
      const floor2 = createFloor(
        "f2",
        "2階",
        [createUsage("u2", "code2")],
        [
          createUsageGroup("ug1", "f2", ["u1", "u2"]), // u1除外後、u2のみ（用途数1）→削除
        ]
      );

      const floors = [floor1, floor2];
      const deleteFloorIds = ["f1"];

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      const floor2Result = result.find((f) => f.id === "f2");
      expect(floor2Result?.usageGroups).toEqual([]); // 用途数1になったため削除
    });

    it("除外後も用途数が2以上のグループ共用部は保持する", () => {
      const floor1 = createFloor("f1", "1階", [createUsage("u1", "code1")], []);
      const floor2 = createFloor("f2", "2階", [createUsage("u2", "code2")], []);
      const floor3 = createFloor(
        "f3",
        "3階",
        [createUsage("u3", "code3")],
        [
          createUsageGroup("ug1", "f3", ["u1", "u2", "u3"]), // u1除外後、u2, u3（用途数2）→保持
        ]
      );

      const floors = [floor1, floor2, floor3];
      const deleteFloorIds = ["f1"];

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      const floor3Result = result.find((f) => f.id === "f3");
      expect(floor3Result?.usageGroups).toHaveLength(1);
      expect(floor3Result?.usageGroups[0].usageIds).toEqual(["u2", "u3"]);
    });

    it("複数のグループ共用部を持つ階で一部のみ削除される", () => {
      const floor1 = createFloor("f1", "1階", [createUsage("u1", "code1")], []);
      const floor2 = createFloor(
        "f2",
        "2階",
        [createUsage("u2", "code2"), createUsage("u3", "code3")],
        [
          createUsageGroup("ug1", "f2", ["u1", "u2"]), // u1除外後、u2のみ（用途数1）→削除
          createUsageGroup("ug2", "f2", ["u1", "u2", "u3"]), // u1除外後、u2, u3（用途数2）→保持
        ]
      );

      const floors = [floor1, floor2];
      const deleteFloorIds = ["f1"];

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      const floor2Result = result.find((f) => f.id === "f2");
      expect(floor2Result?.usageGroups).toHaveLength(1);
      expect(floor2Result?.usageGroups[0].id).toBe("ug2");
      expect(floor2Result?.usageGroups[0].usageIds).toEqual(["u2", "u3"]);
    });
  });

  describe("削除階以外のデータ保持", () => {
    it("削除階以外のグループ共用部が影響を受けない", () => {
      const floor1 = createFloor(
        "f1",
        "1階",
        [createUsage("u1", "code1")],
        [createUsageGroup("ug1", "f1", ["u1", "u2"])]
      );
      const floor2 = createFloor(
        "f2",
        "2階",
        [createUsage("u2", "code2")],
        [createUsageGroup("ug2", "f2", ["u2", "u3"])]
      );
      const floor3 = createFloor(
        "f3",
        "3階",
        [createUsage("u3", "code3")],
        [createUsageGroup("ug3", "f3", ["u3", "u4"])]
      );

      const floors = [floor1, floor2, floor3];
      const deleteFloorIds = ["f1"]; // 1階のみ削除

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      // 削除階のグループ共用部は削除される
      expect(result.find((f) => f.id === "f1")?.usageGroups).toEqual([]);

      // 他階のグループ共用部は削除階の用途を含まないため影響なし
      expect(result.find((f) => f.id === "f2")?.usageGroups).toEqual([
        createUsageGroup("ug2", "f2", ["u2", "u3"]),
      ]);
      expect(result.find((f) => f.id === "f3")?.usageGroups).toEqual([
        createUsageGroup("ug3", "f3", ["u3", "u4"]),
      ]);
    });

    it("削除階以外の階データ（usages、共用部面積）が保持される", () => {
      const floor1 = createFloor("f1", "1階", [createUsage("u1", "code1")], []);
      const floor2 = createFloor("f2", "2階", [createUsage("u2", "code2")], []);
      floor2.floorCommonArea = 200;
      floor2.buildingCommonArea = 50;

      const floors = [floor1, floor2];
      const deleteFloorIds = ["f1"];

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      const floor2Result = result.find((f) => f.id === "f2");
      expect(floor2Result?.usages).toEqual([createUsage("u2", "code2")]);
      expect(floor2Result?.floorCommonArea).toBe(200);
      expect(floor2Result?.buildingCommonArea).toBe(50);
    });
  });

  describe("エッジケース", () => {
    it("削除階IDが空配列の場合、何も変更しない", () => {
      const floor1 = createFloor(
        "f1",
        "1階",
        [],
        [createUsageGroup("ug1", "f1", ["u1", "u2"])]
      );
      const floors = [floor1];
      const deleteFloorIds: string[] = [];

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      expect(result).toEqual(floors); // 変更なし
    });

    it("全階を削除する場合、全グループ共用部が削除される", () => {
      const floor1 = createFloor(
        "f1",
        "1階",
        [],
        [createUsageGroup("ug1", "f1", ["u1", "u2"])]
      );
      const floor2 = createFloor(
        "f2",
        "2階",
        [],
        [createUsageGroup("ug2", "f2", ["u1", "u2"])]
      );

      const floors = [floor1, floor2];
      const deleteFloorIds = ["f1", "f2"];

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      expect(result.every((f) => f.usageGroups.length === 0)).toBe(true);
    });

    it("用途IDが重複する場合でも正しく除外される", () => {
      const floor1 = createFloor("f1", "1階", [createUsage("u1", "code1")], []);
      const floor2 = createFloor(
        "f2",
        "2階",
        [createUsage("u2", "code2")],
        [
          createUsageGroup("ug1", "f2", ["u1", "u1", "u2"]), // u1が重複
        ]
      );

      const floors = [floor1, floor2];
      const deleteFloorIds = ["f1"];

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      const floor2Result = result.find((f) => f.id === "f2");
      // u1が重複していても除外後はu2のみ（用途数1）→削除される
      expect(floor2Result?.usageGroups).toEqual([]);
    });

    it("グループ共用部を持たない階は影響を受けない", () => {
      const floor1 = createFloor("f1", "1階", [createUsage("u1", "code1")], []);
      const floor2 = createFloor("f2", "2階", [createUsage("u2", "code2")], []);

      const floors = [floor1, floor2];
      const deleteFloorIds = ["f1"];

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      expect(result.find((f) => f.id === "f1")?.usageGroups).toEqual([]);
      expect(result.find((f) => f.id === "f2")?.usageGroups).toEqual([]);
    });

    it("削除階の用途IDがどこからも参照されていない場合、影響なし", () => {
      const floor1 = createFloor("f1", "1階", [createUsage("u1", "code1")], []);
      const floor2 = createFloor(
        "f2",
        "2階",
        [createUsage("u2", "code2")],
        [
          createUsageGroup("ug1", "f2", ["u2", "u3"]), // u1を参照していない
        ]
      );

      const floors = [floor1, floor2];
      const deleteFloorIds = ["f1"];

      const result = cleanupUsageGroupsAfterFloorDeletion(
        floors,
        deleteFloorIds
      );

      const floor2Result = result.find((f) => f.id === "f2");
      expect(floor2Result?.usageGroups).toEqual([
        createUsageGroup("ug1", "f2", ["u2", "u3"]),
      ]);
    });
  });

  describe("不変性の検証", () => {
    it("元の階配列を変更しない（イミュータブル）", () => {
      const floor1 = createFloor(
        "f1",
        "1階",
        [createUsage("u1", "code1")],
        [createUsageGroup("ug1", "f1", ["u1", "u2"])]
      );
      const originalFloors = [floor1];
      const originalUsageGroups = [...floor1.usageGroups];

      const deleteFloorIds = ["f1"];

      cleanupUsageGroupsAfterFloorDeletion(originalFloors, deleteFloorIds);

      // 元の配列は変更されていないことを確認
      expect(originalFloors[0].usageGroups).toEqual(originalUsageGroups);
    });
  });
});
