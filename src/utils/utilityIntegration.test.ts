/**
 * utilityIntegration.test.ts - ユーティリティ関数の統合テスト
 *
 * このテストファイルは、floorGenerator, floorDiffCalculator, cascadeDeleteHelper
 * の3つのユーティリティ関数が連携して動作することを検証します。
 */

import { describe, it, expect } from "vitest";
import { generateFloors } from "./floorGenerator";
import { calculateFloorDiff } from "./floorDiffCalculator";
import { cleanupUsageGroupsAfterFloorDeletion } from "./cascadeDeleteHelper";
import { type Floor, type Usage, type UsageGroup } from "../types";

describe("Utility Functions Integration", () => {
  // ヘルパー関数: Usage作成
  const createUsage = (id: string, code: string): Usage => ({
    id,
    annexedCode: code,
    annexedName: `用途${code}`,
    exclusiveArea: 100,
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

  describe("階数増加時の統合フロー", () => {
    it("地上階数を2階から5階に増加した場合、既存データを保持しつつ新規階を追加する", () => {
      // 初期状態: 地上2階
      const initialFloors = generateFloors(2, 0);

      // 1階にデータを追加
      initialFloors[1].floorCommonArea = 100;
      initialFloors[1].usages = [createUsage("u1", "annex01_i")];

      // 2階にデータを追加
      initialFloors[0].floorCommonArea = 50;
      initialFloors[0].usages = [createUsage("u2", "annex06_ro")];

      // 目標: 地上5階
      const targetFloors = generateFloors(5, 0);

      // 差分検出
      const diff = calculateFloorDiff(initialFloors, targetFloors);

      // 検証
      expect(diff.mergedFloors).toHaveLength(5);
      expect(diff.deletedFloorIds).toEqual([]);

      // 既存データが保持されていることを確認
      const merged1F = diff.mergedFloors.find((f) => f.name === "1階");
      expect(merged1F?.floorCommonArea).toBe(100);
      expect(merged1F?.usages).toHaveLength(1);

      const merged2F = diff.mergedFloors.find((f) => f.name === "2階");
      expect(merged2F?.floorCommonArea).toBe(50);
      expect(merged2F?.usages).toHaveLength(1);

      // 新規階が追加されていることを確認
      expect(diff.mergedFloors.find((f) => f.name === "5階")).toBeDefined();
      expect(diff.mergedFloors.find((f) => f.name === "4階")).toBeDefined();
      expect(diff.mergedFloors.find((f) => f.name === "3階")).toBeDefined();
    });

    it("地階数を0から3に増加した場合、新規地階が追加される", () => {
      // 初期状態: 地上2階のみ
      const initialFloors = generateFloors(2, 0);

      // 目標: 地上2階 + 地下3階
      const targetFloors = generateFloors(2, 3);

      // 差分検出
      const diff = calculateFloorDiff(initialFloors, targetFloors);

      // 検証
      expect(diff.mergedFloors).toHaveLength(5);
      expect(diff.deletedFloorIds).toEqual([]);

      // 地上階が保持されていることを確認
      const merged2F = diff.mergedFloors.find((f) => f.name === "2階");
      const merged1F = diff.mergedFloors.find((f) => f.name === "1階");
      expect(merged2F).toBeDefined();
      expect(merged1F).toBeDefined();

      // 新規地階が追加されていることを確認
      expect(diff.mergedFloors.find((f) => f.name === "地下1階")).toBeDefined();
      expect(diff.mergedFloors.find((f) => f.name === "地下2階")).toBeDefined();
      expect(diff.mergedFloors.find((f) => f.name === "地下3階")).toBeDefined();
    });
  });

  describe("階数減少時の統合フロー（カスケード削除含む）", () => {
    it("地上階数を5階から2階に減少した場合、削除階のグループ共用部がクリーンアップされる", () => {
      // 初期状態: 地上5階
      const initialFloors = generateFloors(5, 0);

      // 各階に用途を追加
      initialFloors[0].usages = [createUsage("u5", "code5")]; // 5階
      initialFloors[1].usages = [createUsage("u4", "code4")]; // 4階
      initialFloors[2].usages = [createUsage("u3", "code3")]; // 3階
      initialFloors[3].usages = [createUsage("u2", "code2")]; // 2階
      initialFloors[4].usages = [createUsage("u1", "code1")]; // 1階

      // 5階にグループ共用部を追加（5階と4階の用途を参照）
      initialFloors[0].usageGroups = [
        createUsageGroup("ug1", initialFloors[0].id, ["u5", "u4"]),
      ];

      // 2階にグループ共用部を追加（5階、3階、2階の用途を参照）
      initialFloors[3].usageGroups = [
        createUsageGroup("ug2", initialFloors[3].id, ["u5", "u3", "u2"]),
      ];

      // 1階にグループ共用部を追加（2階と1階の用途を参照）
      initialFloors[4].usageGroups = [
        createUsageGroup("ug3", initialFloors[4].id, ["u2", "u1"]),
      ];

      // 目標: 地上2階
      const targetFloors = generateFloors(2, 0);

      // 差分検出
      const diff = calculateFloorDiff(initialFloors, targetFloors);

      // 削除階のカスケードクリーンアップ（全階配列に対して実行）
      const cleanedAllFloors = cleanupUsageGroupsAfterFloorDeletion(
        initialFloors,
        diff.deletedFloorIds
      );

      // クリーンアップ後、削除階を除外
      const cleanedFloors = cleanedAllFloors.filter(
        (f) => !diff.deletedFloorIds.includes(f.id)
      );

      // 検証
      expect(cleanedFloors).toHaveLength(2);
      expect(diff.deletedFloorIds).toHaveLength(3);

      // 2階のグループ共用部から削除階の用途（u5, u3）が除外され、用途数2未満で削除
      const merged2F = cleanedFloors.find((f) => f.name === "2階");
      expect(merged2F?.usageGroups).toEqual([]); // u5, u3除外後、u2のみ（用途数1）→削除

      // 1階のグループ共用部は影響なし（削除階の用途を参照していない）
      const merged1F = cleanedFloors.find((f) => f.name === "1階");
      expect(merged1F?.usageGroups).toHaveLength(1);
      expect(merged1F?.usageGroups[0].usageIds).toEqual(["u2", "u1"]);
    });

    it("地階数を3階から1階に減少した場合、削除階に所属するグループ共用部が削除される", () => {
      // 初期状態: 地上1階 + 地下3階
      const initialFloors = generateFloors(1, 3);

      // 各地階に用途を追加
      initialFloors[1].usages = [createUsage("ub1", "codeB1")]; // 地下1階
      initialFloors[2].usages = [createUsage("ub2", "codeB2")]; // 地下2階
      initialFloors[3].usages = [createUsage("ub3", "codeB3")]; // 地下3階

      // 地下2階にグループ共用部を追加
      initialFloors[2].usageGroups = [
        createUsageGroup("ugb1", initialFloors[2].id, ["ub1", "ub2"]),
      ];

      // 地下3階にグループ共用部を追加
      initialFloors[3].usageGroups = [
        createUsageGroup("ugb2", initialFloors[3].id, ["ub2", "ub3"]),
      ];

      // 目標: 地上1階 + 地下1階
      const targetFloors = generateFloors(1, 1);

      // 差分検出
      const diff = calculateFloorDiff(initialFloors, targetFloors);

      // 削除階のカスケードクリーンアップ（全階配列に対して実行）
      const cleanedAllFloors = cleanupUsageGroupsAfterFloorDeletion(
        initialFloors,
        diff.deletedFloorIds
      );

      // クリーンアップ後、削除階を除外
      const cleanedFloors = cleanedAllFloors.filter(
        (f) => !diff.deletedFloorIds.includes(f.id)
      );

      // 検証
      expect(cleanedFloors).toHaveLength(2);
      expect(diff.deletedFloorIds).toHaveLength(2); // 地下2階、地下3階

      // 地下1階には削除階の用途を参照するグループ共用部がないため、影響なし
      const mergedB1F = cleanedFloors.find((f) => f.name === "地下1階");
      expect(mergedB1F?.usageGroups).toEqual([]);
    });

    it("複雑な跨階参照を持つグループ共用部が正しくクリーンアップされる", () => {
      // 初期状態: 地上5階
      const initialFloors = generateFloors(5, 0);

      // 各階に用途を追加
      for (let i = 0; i < 5; i++) {
        initialFloors[i].usages = [createUsage(`u${5 - i}`, `code${5 - i}`)];
      }

      // 1階にグループ共用部を追加（全階の用途を参照）
      initialFloors[4].usageGroups = [
        createUsageGroup("ug_all", initialFloors[4].id, [
          "u5",
          "u4",
          "u3",
          "u2",
          "u1",
        ]),
      ];

      // 2階にグループ共用部を追加（4階と2階の用途を参照）
      initialFloors[3].usageGroups = [
        createUsageGroup("ug_4_2", initialFloors[3].id, ["u4", "u2"]),
      ];

      // 3階にグループ共用部を追加（5階と3階の用途を参照）
      initialFloors[2].usageGroups = [
        createUsageGroup("ug_5_3", initialFloors[2].id, ["u5", "u3"]),
      ];

      // 目標: 地上2階
      const targetFloors = generateFloors(2, 0);

      // 差分検出
      const diff = calculateFloorDiff(initialFloors, targetFloors);

      // 削除階のカスケードクリーンアップ（全階配列に対して実行）
      const cleanedAllFloors = cleanupUsageGroupsAfterFloorDeletion(
        initialFloors,
        diff.deletedFloorIds
      );

      // クリーンアップ後、削除階を除外
      const cleanedFloors = cleanedAllFloors.filter(
        (f) => !diff.deletedFloorIds.includes(f.id)
      );

      // 検証
      expect(cleanedFloors).toHaveLength(2);

      // 1階のグループ共用部: u5, u4, u3除外後、u2, u1（用途数2）→保持
      const merged1F = cleanedFloors.find((f) => f.name === "1階");
      expect(merged1F?.usageGroups).toHaveLength(1);
      expect(merged1F?.usageGroups[0].usageIds).toEqual(["u2", "u1"]);

      // 2階のグループ共用部: u4除外後、u2のみ（用途数1）→削除
      const merged2F = cleanedFloors.find((f) => f.name === "2階");
      expect(merged2F?.usageGroups).toEqual([]);
    });
  });

  describe("階数変更なしの場合", () => {
    it("階数が変わらない場合、既存データがそのまま保持される", () => {
      // 初期状態: 地上3階
      const initialFloors = generateFloors(3, 0);

      // 1階にデータを追加
      initialFloors[2].floorCommonArea = 100;
      initialFloors[2].usages = [createUsage("u1", "annex01_i")];
      initialFloors[2].usageGroups = [
        createUsageGroup("ug1", initialFloors[2].id, ["u1", "u2"]),
      ];

      // 目標: 地上3階（変更なし）
      const targetFloors = generateFloors(3, 0);

      // 差分検出
      const diff = calculateFloorDiff(initialFloors, targetFloors);

      // 検証
      expect(diff.mergedFloors).toHaveLength(3);
      expect(diff.deletedFloorIds).toEqual([]);

      // 既存データが保持されていることを確認
      const merged1F = diff.mergedFloors.find((f) => f.name === "1階");
      expect(merged1F?.floorCommonArea).toBe(100);
      expect(merged1F?.usages).toHaveLength(1);
      expect(merged1F?.usageGroups).toHaveLength(1);
    });
  });

  describe("エッジケース: 全階削除", () => {
    it("全階を削除する場合、全グループ共用部が削除される", () => {
      // 初期状態: 地上3階
      const initialFloors = generateFloors(3, 0);

      // 各階にグループ共用部を追加
      initialFloors[0].usageGroups = [
        createUsageGroup("ug1", initialFloors[0].id, ["u1", "u2"]),
      ];
      initialFloors[1].usageGroups = [
        createUsageGroup("ug2", initialFloors[1].id, ["u2", "u3"]),
      ];
      initialFloors[2].usageGroups = [
        createUsageGroup("ug3", initialFloors[2].id, ["u1", "u3"]),
      ];

      // 目標: 0階（全削除）
      const targetFloors = generateFloors(0, 0);

      // 差分検出
      const diff = calculateFloorDiff(initialFloors, targetFloors);

      // 削除階のカスケードクリーンアップ（全階配列に対して実行）
      const cleanedAllFloors = cleanupUsageGroupsAfterFloorDeletion(
        initialFloors,
        diff.deletedFloorIds
      );

      // クリーンアップ後、削除階を除外
      const cleanedFloors = cleanedAllFloors.filter(
        (f) => !diff.deletedFloorIds.includes(f.id)
      );

      // 検証
      expect(cleanedFloors).toEqual([]);
      expect(diff.deletedFloorIds).toHaveLength(3);
    });
  });

  describe("エッジケース: 循環参照", () => {
    it("階Aのグループ共用部が階Bの用途を参照し、階Bのグループ共用部が階Aの用途を参照する場合でも正しく処理される", () => {
      // 初期状態: 地上3階
      const initialFloors = generateFloors(3, 0);

      // 用途を追加
      initialFloors[0].usages = [createUsage("u3", "code3")]; // 3階
      initialFloors[1].usages = [createUsage("u2", "code2")]; // 2階
      initialFloors[2].usages = [createUsage("u1", "code1")]; // 1階

      // 3階のグループ共用部: 3階と2階の用途を参照
      initialFloors[0].usageGroups = [
        createUsageGroup("ug3", initialFloors[0].id, ["u3", "u2"]),
      ];

      // 2階のグループ共用部: 2階と3階の用途を参照（循環参照）
      initialFloors[1].usageGroups = [
        createUsageGroup("ug2", initialFloors[1].id, ["u2", "u3"]),
      ];

      // 目標: 地上1階（3階と2階を削除）
      const targetFloors = generateFloors(1, 0);

      // 差分検出
      const diff = calculateFloorDiff(initialFloors, targetFloors);

      // 削除階のカスケードクリーンアップ（全階配列に対して実行）
      const cleanedAllFloors = cleanupUsageGroupsAfterFloorDeletion(
        initialFloors,
        diff.deletedFloorIds
      );

      // クリーンアップ後、削除階を除外
      const cleanedFloors = cleanedAllFloors.filter(
        (f) => !diff.deletedFloorIds.includes(f.id)
      );

      // 検証
      expect(cleanedFloors).toHaveLength(1);
      expect(diff.deletedFloorIds).toHaveLength(2);

      // 1階には削除階の用途を参照するグループ共用部がないため、影響なし
      const merged1F = cleanedFloors.find((f) => f.name === "1階");
      expect(merged1F?.usageGroups).toEqual([]);
    });
  });

  describe("エッジケース: 用途ID重複", () => {
    it("グループ共用部の用途IDに重複がある場合でも正しく処理される", () => {
      // 初期状態: 地上3階
      const initialFloors = generateFloors(3, 0);

      // 用途を追加
      initialFloors[0].usages = [createUsage("u3", "code3")]; // 3階
      initialFloors[1].usages = [createUsage("u2", "code2")]; // 2階

      // 2階のグループ共用部: u3が重複
      initialFloors[1].usageGroups = [
        createUsageGroup("ug2", initialFloors[1].id, ["u3", "u3", "u2"]),
      ];

      // 目標: 地上2階（3階を削除）
      const targetFloors = generateFloors(2, 0);

      // 差分検出
      const diff = calculateFloorDiff(initialFloors, targetFloors);

      // 削除階のカスケードクリーンアップ（全階配列に対して実行）
      const cleanedAllFloors = cleanupUsageGroupsAfterFloorDeletion(
        initialFloors,
        diff.deletedFloorIds
      );

      // クリーンアップ後、削除階を除外
      const cleanedFloors = cleanedAllFloors.filter(
        (f) => !diff.deletedFloorIds.includes(f.id)
      );

      // 検証
      expect(cleanedFloors).toHaveLength(2);

      // 2階のグループ共用部: u3（重複）除外後、u2のみ（用途数1）→削除
      const merged2F = cleanedFloors.find((f) => f.name === "2階");
      expect(merged2F?.usageGroups).toEqual([]);
    });
  });

  describe("パフォーマンステスト", () => {
    it("大規模建物（100階）の階数変更でも妥当な時間内に処理が完了する", () => {
      // 初期状態: 地上50階
      const initialFloors = generateFloors(50, 0);

      // 目標: 地上100階
      const targetFloors = generateFloors(100, 0);

      const startTime = performance.now();

      // 差分検出
      const diff = calculateFloorDiff(initialFloors, targetFloors);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 検証: 処理時間が1000ms（1秒）未満であることを確認
      expect(duration).toBeLessThan(1000);
      expect(diff.mergedFloors).toHaveLength(100);
      expect(diff.deletedFloorIds).toEqual([]);
    });

    it("大量のグループ共用部を持つ建物でのカスケード削除が妥当な時間内に処理される", () => {
      // 初期状態: 地上20階
      const initialFloors = generateFloors(20, 0);

      // 各階に10個のグループ共用部を追加（合計200個）
      initialFloors.forEach((floor, index) => {
        floor.usages = [createUsage(`u${index}`, `code${index}`)];
        floor.usageGroups = Array.from({ length: 10 }, (_, i) => {
          const otherUsageIndex = (index + i + 1) % 20;
          return createUsageGroup(`ug${index}_${i}`, floor.id, [
            `u${index}`,
            `u${otherUsageIndex}`,
          ]);
        });
      });

      // 目標: 地上10階（10階分を削除）
      const targetFloors = generateFloors(10, 0);

      const startTime = performance.now();

      // 差分検出
      const diff = calculateFloorDiff(initialFloors, targetFloors);

      // 削除階のカスケードクリーンアップ（全階配列に対して実行）
      const cleanedAllFloors = cleanupUsageGroupsAfterFloorDeletion(
        initialFloors,
        diff.deletedFloorIds
      );

      // クリーンアップ後、削除階を除外
      const cleanedFloors = cleanedAllFloors.filter(
        (f) => !diff.deletedFloorIds.includes(f.id)
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 検証: 処理時間が1000ms（1秒）未満であることを確認
      expect(duration).toBeLessThan(1000);
      expect(cleanedFloors).toHaveLength(10);
      expect(diff.deletedFloorIds).toHaveLength(10);
    });
  });
});
