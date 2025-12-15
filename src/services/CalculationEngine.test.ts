import { describe, it, expect } from "vitest";
import { CalculationEngine } from "./CalculationEngine";
import type {
  Usage,
  UsageGroup,
  UsageAreaBreakdown,
  BuildingUsageTotal,
} from "../types";

describe("CalculationEngine", () => {
  const engine = new CalculationEngine();

  describe("Task 3.1: calculateFloorCommonArea - 階の共用部案分計算", () => {
    describe("正常系", () => {
      it("should distribute floor common area proportionally to usages", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 200,
          },
        ];
        const floorCommonArea = 60;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("u1")).toBe(20); // 100/300 * 60 = 20
          expect(result.value.get("u2")).toBe(40); // 200/300 * 60 = 40
        }
      });

      it("should round to 2 decimal places", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 200,
          },
          {
            id: "u3",
            annexedCode: "annex03_i",
            annexedName: "３項イ",
            exclusiveArea: 150,
          },
        ];
        const floorCommonArea = 100;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        expect(result.success).toBe(true);
        if (result.success) {
          // 累積丸めによる計算:
          // u1: 100/450 * 100 = 22.222... → 累積 22.22 → 差分 22.22
          expect(result.value.get("u1")).toBe(22.22);
          // u2: 200/450 * 100 = 44.444... → 累積 66.67 (22.22+44.45) → 差分 44.45
          expect(result.value.get("u2")).toBe(44.45);
          // u3: 150/450 * 100 = 33.333... → 累積 100.00 → 差分 33.33
          expect(result.value.get("u3")).toBe(33.33);

          // 合計が元の値と一致することを確認
          const sum =
            (result.value.get("u1") || 0) +
            (result.value.get("u2") || 0) +
            (result.value.get("u3") || 0);
          expect(sum).toBe(100);
        }
      });

      it("should handle zero common area", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
        ];
        const floorCommonArea = 0;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("u1")).toBe(0);
        }
      });

      it("should handle single usage", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
        ];
        const floorCommonArea = 50;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("u1")).toBe(50); // Gets all common area
        }
      });

      it("should handle decimal exclusive areas", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100.5,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 200.3,
          },
        ];
        const floorCommonArea = 60.2;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        expect(result.success).toBe(true);
        if (result.success) {
          // Results should be rounded to 2 decimal places
          expect(typeof result.value.get("u1")).toBe("number");
          expect(typeof result.value.get("u2")).toBe("number");

          // Verify sum is close to original (within rounding error)
          const sum =
            (result.value.get("u1") || 0) + (result.value.get("u2") || 0);
          expect(Math.abs(sum - floorCommonArea)).toBeLessThan(0.01);
        }
      });
    });

    describe("境界値", () => {
      it("should handle usage with zero exclusive area", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 0,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 100,
          },
        ];
        const floorCommonArea = 50;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("u1")).toBe(0);
          expect(result.value.get("u2")).toBe(50);
        }
      });

      it("should handle very small exclusive areas", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 0.01,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 0.01,
          },
        ];
        const floorCommonArea = 10;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("u1")).toBe(5);
          expect(result.value.get("u2")).toBe(5);
        }
      });

      it("should handle large exclusive areas", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 10000,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 20000,
          },
        ];
        const floorCommonArea = 3000;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("u1")).toBe(1000);
          expect(result.value.get("u2")).toBe(2000);
        }
      });
    });

    describe("エラーケース", () => {
      it("should distribute equally when all exclusive areas are zero", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 0,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 0,
          },
        ];
        const floorCommonArea = 50;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        expect(result.success).toBe(true);
        if (result.success) {
          // 等分配: 50 / 2 = 25
          expect(result.value.get("u1")).toBe(25);
          expect(result.value.get("u2")).toBe(25);

          // 合計が元の値と一致することを確認
          const sum =
            (result.value.get("u1") || 0) + (result.value.get("u2") || 0);
          expect(sum).toBe(50);
        }
      });

      it("should return empty map with empty usages array and non-zero common area", () => {
        const usages: Usage[] = [];
        const floorCommonArea = 50;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.size).toBe(0);
        }
      });

      it("should handle empty usages array with zero common area", () => {
        const usages: Usage[] = [];
        const floorCommonArea = 0;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        // This should succeed as there's no area to distribute
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.size).toBe(0);
        }
      });

      it("should use cumulative rounding for equal distribution with zero exclusive areas", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 0,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 0,
          },
          {
            id: "u3",
            annexedCode: "annex03_i",
            annexedName: "３項イ",
            exclusiveArea: 0,
          },
        ];
        const floorCommonArea = 100;

        const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

        expect(result.success).toBe(true);
        if (result.success) {
          // 累積丸めによる等分配:
          // u1: 100/3 = 33.333... → 累積 33.33 → 差分 33.33
          // u2: 100/3 = 33.333... → 累積 66.67 → 差分 33.34
          // u3: 100/3 = 33.333... → 累積 100.00 → 差分 33.33
          expect(result.value.get("u1")).toBe(33.33);
          expect(result.value.get("u2")).toBe(33.34);
          expect(result.value.get("u3")).toBe(33.33);

          // 合計が元の値と一致することを確認
          const sum =
            (result.value.get("u1") || 0) +
            (result.value.get("u2") || 0) +
            (result.value.get("u3") || 0);
          expect(sum).toBe(100);
        }
      });
    });

    describe("べき等性", () => {
      it("should return same result when called multiple times", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 200,
          },
        ];
        const floorCommonArea = 60;

        const result1 = engine.calculateFloorCommonArea(
          usages,
          floorCommonArea
        );
        const result2 = engine.calculateFloorCommonArea(
          usages,
          floorCommonArea
        );

        expect(result1).toEqual(result2);
      });
    });
  });

  describe("Task 3.2: calculateBuildingCommonArea - 建物全体の共用部案分計算", () => {
    describe("正常系", () => {
      it("should distribute building common area proportionally to all usages", () => {
        const allUsages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 200,
          },
          {
            id: "u3",
            annexedCode: "annex03_i",
            annexedName: "３項イ",
            exclusiveArea: 300,
          },
        ];
        const buildingCommonArea = 120;

        const result = engine.calculateBuildingCommonArea(
          allUsages,
          buildingCommonArea
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("u1")).toBe(20); // 100/600 * 120 = 20
          expect(result.value.get("u2")).toBe(40); // 200/600 * 120 = 40
          expect(result.value.get("u3")).toBe(60); // 300/600 * 120 = 60
        }
      });

      it("should round to 2 decimal places", () => {
        const allUsages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 200,
          },
          {
            id: "u3",
            annexedCode: "annex03_i",
            annexedName: "３項イ",
            exclusiveArea: 250,
          },
        ];
        const buildingCommonArea = 100;

        const result = engine.calculateBuildingCommonArea(
          allUsages,
          buildingCommonArea
        );

        expect(result.success).toBe(true);
        if (result.success) {
          // 累積丸めによる計算:
          // u1: 100/550 * 100 = 18.181... → 累積 18.18 → 差分 18.18
          expect(result.value.get("u1")).toBe(18.18);
          // u2: 200/550 * 100 = 36.363... → 累積 54.55 (18.18+36.37) → 差分 36.37
          expect(result.value.get("u2")).toBe(36.37);
          // u3: 250/550 * 100 = 45.454... → 累積 100.00 → 差分 45.45
          expect(result.value.get("u3")).toBe(45.45);

          // 合計が元の値と一致することを確認
          const sum =
            (result.value.get("u1") || 0) +
            (result.value.get("u2") || 0) +
            (result.value.get("u3") || 0);
          expect(sum).toBe(100);
        }
      });

      it("should handle zero common area", () => {
        const allUsages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
        ];
        const buildingCommonArea = 0;

        const result = engine.calculateBuildingCommonArea(
          allUsages,
          buildingCommonArea
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("u1")).toBe(0);
        }
      });

      it("should handle usages from multiple floors", () => {
        // Simulating usages from different floors
        const allUsages: Usage[] = [
          {
            id: "f1u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
          {
            id: "f1u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 150,
          },
          {
            id: "f2u1",
            annexedCode: "annex03_i",
            annexedName: "３項イ",
            exclusiveArea: 200,
          },
          {
            id: "f2u2",
            annexedCode: "annex04",
            annexedName: "４項",
            exclusiveArea: 50,
          },
        ];
        const buildingCommonArea = 100;

        const result = engine.calculateBuildingCommonArea(
          allUsages,
          buildingCommonArea
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("f1u1")).toBe(20); // 100/500 * 100
          expect(result.value.get("f1u2")).toBe(30); // 150/500 * 100
          expect(result.value.get("f2u1")).toBe(40); // 200/500 * 100
          expect(result.value.get("f2u2")).toBe(10); // 50/500 * 100
        }
      });
    });

    describe("エラーケース", () => {
      it("should distribute equally when all exclusive areas are zero", () => {
        const allUsages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 0,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 0,
          },
        ];
        const buildingCommonArea = 100;

        const result = engine.calculateBuildingCommonArea(
          allUsages,
          buildingCommonArea
        );

        expect(result.success).toBe(true);
        if (result.success) {
          // 等分配: 100 / 2 = 50
          expect(result.value.get("u1")).toBe(50);
          expect(result.value.get("u2")).toBe(50);

          // 合計が元の値と一致することを確認
          const sum =
            (result.value.get("u1") || 0) + (result.value.get("u2") || 0);
          expect(sum).toBe(100);
        }
      });

      it("should return empty map with empty usages array and non-zero common area", () => {
        const allUsages: Usage[] = [];
        const buildingCommonArea = 100;

        const result = engine.calculateBuildingCommonArea(
          allUsages,
          buildingCommonArea
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.size).toBe(0);
        }
      });
    });
  });

  describe("Task 3.3: calculateUsageGroupCommonArea - 特定用途間の共用部案分計算", () => {
    const allUsages: Usage[] = [
      {
        id: "u1",
        annexedCode: "annex01_i",
        annexedName: "１項イ",
        exclusiveArea: 100,
      },
      {
        id: "u2",
        annexedCode: "annex02_i",
        annexedName: "２項イ",
        exclusiveArea: 200,
      },
      {
        id: "u3",
        annexedCode: "annex03_i",
        annexedName: "３項イ",
        exclusiveArea: 150,
      },
      {
        id: "u4",
        annexedCode: "annex04",
        annexedName: "４項",
        exclusiveArea: 50,
      },
    ];

    describe("正常系", () => {
      it("should distribute common area only to usages in the group", () => {
        const usageGroup: UsageGroup = {
          floorId: "test-floor",
          id: "g1",
          usageIds: ["u1", "u2"],
          commonArea: 60,
        };

        const result = engine.calculateUsageGroupCommonArea(
          allUsages,
          usageGroup
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("u1")).toBe(20); // 100/300 * 60
          expect(result.value.get("u2")).toBe(40); // 200/300 * 60
          expect(result.value.has("u3")).toBe(false); // Not in group
          expect(result.value.has("u4")).toBe(false); // Not in group
        }
      });

      it("should round to 2 decimal places", () => {
        const usageGroup: UsageGroup = {
          floorId: "test-floor",
          id: "g1",
          usageIds: ["u1", "u2", "u3"],
          commonArea: 100,
        };

        const result = engine.calculateUsageGroupCommonArea(
          allUsages,
          usageGroup
        );

        expect(result.success).toBe(true);
        if (result.success) {
          // 累積丸めによる計算:
          // u1: 100/450 * 100 = 22.222... → 累積 22.22 → 差分 22.22
          expect(result.value.get("u1")).toBe(22.22);
          // u2: 200/450 * 100 = 44.444... → 累積 66.67 (22.22+44.45) → 差分 44.45
          expect(result.value.get("u2")).toBe(44.45);
          // u3: 150/450 * 100 = 33.333... → 累積 100.00 → 差分 33.33
          expect(result.value.get("u3")).toBe(33.33);

          // 合計が元の値と一致することを確認
          const sum =
            (result.value.get("u1") || 0) +
            (result.value.get("u2") || 0) +
            (result.value.get("u3") || 0);
          expect(sum).toBe(100);
        }
      });

      it("should handle zero common area", () => {
        const usageGroup: UsageGroup = {
          floorId: "test-floor",
          id: "g1",
          usageIds: ["u1", "u2"],
          commonArea: 0,
        };

        const result = engine.calculateUsageGroupCommonArea(
          allUsages,
          usageGroup
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("u1")).toBe(0);
          expect(result.value.get("u2")).toBe(0);
        }
      });

      it("should handle group with usage having zero exclusive area", () => {
        const usagesWithZero: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 0,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 100,
          },
          {
            id: "u3",
            annexedCode: "annex03_i",
            annexedName: "３項イ",
            exclusiveArea: 200,
          },
        ];
        const usageGroup: UsageGroup = {
          floorId: "test-floor",
          id: "g1",
          usageIds: ["u1", "u2"],
          commonArea: 50,
        };

        const result = engine.calculateUsageGroupCommonArea(
          usagesWithZero,
          usageGroup
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.get("u1")).toBe(0);
          expect(result.value.get("u2")).toBe(50);
        }
      });
    });

    describe("複数グループの処理", () => {
      it("should calculate multiple groups independently", () => {
        const group1: UsageGroup = {
          id: "g1",
          floorId: "test-floor",
          usageIds: ["u1", "u2"],
          commonArea: 60,
        };
        const group2: UsageGroup = {
          id: "g2",
          floorId: "test-floor",
          usageIds: ["u2", "u3"],
          commonArea: 70,
        };

        const result1 = engine.calculateUsageGroupCommonArea(allUsages, group1);
        const result2 = engine.calculateUsageGroupCommonArea(allUsages, group2);

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);

        if (result1.success && result2.success) {
          // u2 should get different amounts from each group
          expect(result1.value.get("u2")).toBe(40); // From group1
          expect(result2.value.get("u2")).toBe(40); // From group2 (200/350 * 70)
        }
      });

      it("should demonstrate that same usage can receive from multiple groups", () => {
        // This test shows u2 is in both groups
        const group1: UsageGroup = {
          id: "g1",
          floorId: "test-floor",
          usageIds: ["u1", "u2"],
          commonArea: 30,
        };
        const group2: UsageGroup = {
          id: "g2",
          floorId: "test-floor",
          usageIds: ["u2", "u3"],
          commonArea: 35,
        };

        const result1 = engine.calculateUsageGroupCommonArea(allUsages, group1);
        const result2 = engine.calculateUsageGroupCommonArea(allUsages, group2);

        expect(result1.success && result2.success).toBe(true);

        if (result1.success && result2.success) {
          const u2FromGroup1 = result1.value.get("u2") || 0;
          const u2FromGroup2 = result2.value.get("u2") || 0;

          // u2 should receive amounts from both groups
          expect(u2FromGroup1).toBeGreaterThan(0);
          expect(u2FromGroup2).toBeGreaterThan(0);

          // Total for u2 would be sum of both (if aggregating)
          const u2Total = u2FromGroup1 + u2FromGroup2;
          expect(u2Total).toBeGreaterThan(u2FromGroup1);
          expect(u2Total).toBeGreaterThan(u2FromGroup2);
        }
      });
    });

    describe("エラーケース", () => {
      it("should distribute equally when all group usages have zero exclusive area", () => {
        const usagesWithZero: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 0,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 0,
          },
          {
            id: "u3",
            annexedCode: "annex03_i",
            annexedName: "３項イ",
            exclusiveArea: 100,
          },
        ];
        const usageGroup: UsageGroup = {
          floorId: "test-floor",
          id: "g1",
          usageIds: ["u1", "u2"],
          commonArea: 50,
        };

        const result = engine.calculateUsageGroupCommonArea(
          usagesWithZero,
          usageGroup
        );

        expect(result.success).toBe(true);
        if (result.success) {
          // 等分配: 50 / 2 = 25
          expect(result.value.get("u1")).toBe(25);
          expect(result.value.get("u2")).toBe(25);

          // 合計が元の値と一致することを確認
          const sum =
            (result.value.get("u1") || 0) + (result.value.get("u2") || 0);
          expect(sum).toBe(50);
        }
      });

      it("should fail when usage IDs in group do not exist", () => {
        const usageGroup: UsageGroup = {
          floorId: "test-floor",
          id: "g1",
          usageIds: ["u999", "u888"],
          commonArea: 50,
        };

        const result = engine.calculateUsageGroupCommonArea(
          allUsages,
          usageGroup
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe("INVALID_USAGE_GROUP");
          if (result.error.type === "INVALID_USAGE_GROUP") {
            expect(result.error.groupId).toBe("g1");
          }
        }
      });

      it("should fail when some usage IDs do not exist", () => {
        const usageGroup: UsageGroup = {
          floorId: "test-floor",
          id: "g1",
          usageIds: ["u1", "u999"],
          commonArea: 50,
        };

        const result = engine.calculateUsageGroupCommonArea(
          allUsages,
          usageGroup
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe("INVALID_USAGE_GROUP");
        }
      });
    });

    describe("べき等性", () => {
      it("should return same result when called multiple times", () => {
        const usageGroup: UsageGroup = {
          floorId: "test-floor",
          id: "g1",
          usageIds: ["u1", "u2"],
          commonArea: 60,
        };

        const result1 = engine.calculateUsageGroupCommonArea(
          allUsages,
          usageGroup
        );
        const result2 = engine.calculateUsageGroupCommonArea(
          allUsages,
          usageGroup
        );

        expect(result1).toEqual(result2);
      });
    });
  });

  describe("Task 3.4: calculateTotalAreas and aggregateBuildingTotals - 総面積算出と建物全体集計", () => {
    describe("calculateTotalAreas - 総面積算出", () => {
      it("should calculate total area for each usage combining all common areas", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 200,
          },
        ];

        const floorCommonResults = new Map([
          ["u1", 20],
          ["u2", 40],
        ]);

        const buildingCommonResults = new Map([
          ["u1", 10],
          ["u2", 20],
        ]);

        const usageGroupResults = new Map([
          ["u1", 5],
          ["u2", 10],
        ]);

        const result = engine.calculateTotalAreas(
          usages,
          floorCommonResults,
          buildingCommonResults,
          usageGroupResults
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toHaveLength(2);

          const u1Breakdown = result.value.find(
            (b: UsageAreaBreakdown) => b.usageId === "u1"
          );
          expect(u1Breakdown).toBeDefined();
          expect(u1Breakdown?.exclusiveArea).toBe(100);
          expect(u1Breakdown?.floorCommonArea).toBe(20);
          expect(u1Breakdown?.buildingCommonArea).toBe(10);
          expect(u1Breakdown?.usageGroupCommonArea).toBe(5);
          expect(u1Breakdown?.totalArea).toBe(135); // 100 + 20 + 10 + 5

          const u2Breakdown = result.value.find(
            (b: UsageAreaBreakdown) => b.usageId === "u2"
          );
          expect(u2Breakdown?.totalArea).toBe(270); // 200 + 40 + 20 + 10
        }
      });

      it("should handle usage not in group (zero usage group common area)", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 200,
          },
        ];

        const floorCommonResults = new Map([
          ["u1", 20],
          ["u2", 40],
        ]);

        const buildingCommonResults = new Map([
          ["u1", 10],
          ["u2", 20],
        ]);

        // Only u1 is in a usage group
        const usageGroupResults = new Map([["u1", 5]]);

        const result = engine.calculateTotalAreas(
          usages,
          floorCommonResults,
          buildingCommonResults,
          usageGroupResults
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const u1Breakdown = result.value.find(
            (b: UsageAreaBreakdown) => b.usageId === "u1"
          );
          expect(u1Breakdown?.usageGroupCommonArea).toBe(5);
          expect(u1Breakdown?.totalArea).toBe(135);

          const u2Breakdown = result.value.find(
            (b: UsageAreaBreakdown) => b.usageId === "u2"
          );
          expect(u2Breakdown?.usageGroupCommonArea).toBe(0); // Not in any group
          expect(u2Breakdown?.totalArea).toBe(260); // 200 + 40 + 20 + 0
        }
      });

      it("should handle usage in multiple groups (sum group common areas)", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
          {
            id: "u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 200,
          },
          {
            id: "u3",
            annexedCode: "annex03_i",
            annexedName: "３項イ",
            exclusiveArea: 150,
          },
        ];

        const floorCommonResults = new Map([
          ["u1", 20],
          ["u2", 40],
          ["u3", 30],
        ]);

        const buildingCommonResults = new Map([
          ["u1", 10],
          ["u2", 20],
          ["u3", 15],
        ]);

        // Simulate u2 being in multiple groups
        // Group1: u1, u2 -> u2 gets 10
        // Group2: u2, u3 -> u2 gets 15
        // Total for u2 from groups: 25
        const usageGroupResults = new Map([
          ["u1", 5],
          ["u2", 25], // Sum of multiple groups
          ["u3", 20],
        ]);

        const result = engine.calculateTotalAreas(
          usages,
          floorCommonResults,
          buildingCommonResults,
          usageGroupResults
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const u2Breakdown = result.value.find(
            (b: UsageAreaBreakdown) => b.usageId === "u2"
          );
          expect(u2Breakdown?.usageGroupCommonArea).toBe(25);
          expect(u2Breakdown?.totalArea).toBe(285); // 200 + 40 + 20 + 25
        }
      });

      it("should round total area to 2 decimal places", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100.33,
          },
        ];

        const floorCommonResults = new Map([["u1", 20.22]]);
        const buildingCommonResults = new Map([["u1", 10.11]]);
        const usageGroupResults = new Map([["u1", 5.55]]);

        const result = engine.calculateTotalAreas(
          usages,
          floorCommonResults,
          buildingCommonResults,
          usageGroupResults
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const breakdown = result.value[0];
          // 100.33 + 20.22 + 10.11 + 5.55 = 136.21
          expect(breakdown.totalArea).toBe(136.21);
        }
      });

      it("should include annexedCode and annexedName in breakdown", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex06_ro_2",
            annexedName: "６項ロ(2)",
            exclusiveArea: 100,
          },
        ];

        const result = engine.calculateTotalAreas(
          usages,
          new Map([["u1", 0]]),
          new Map([["u1", 0]]),
          new Map()
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value[0].annexedCode).toBe("annex06_ro_2");
          expect(result.value[0].annexedName).toBe("６項ロ(2)");
        }
      });

      it("should handle all common areas being zero", () => {
        const usages: Usage[] = [
          {
            id: "u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
        ];

        const result = engine.calculateTotalAreas(
          usages,
          new Map([["u1", 0]]),
          new Map([["u1", 0]]),
          new Map()
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value[0].totalArea).toBe(100);
        }
      });
    });

    describe("aggregateBuildingTotals - 建物全体集計", () => {
      it("should aggregate usages by annexedCode across floors", () => {
        const floorBreakdowns = [
          // Floor 1
          [
            {
              usageId: "f1u1",
              annexedCode: "annex01_i",
              annexedName: "１項イ",
              exclusiveArea: 100,
              floorCommonArea: 20,
              buildingCommonArea: 10,
              usageGroupCommonArea: 5,
              totalArea: 135,
            },
            {
              usageId: "f1u2",
              annexedCode: "annex02_i",
              annexedName: "２項イ",
              exclusiveArea: 200,
              floorCommonArea: 40,
              buildingCommonArea: 20,
              usageGroupCommonArea: 10,
              totalArea: 270,
            },
          ],
          // Floor 2 - has same annex01_i
          [
            {
              usageId: "f2u1",
              annexedCode: "annex01_i",
              annexedName: "１項イ",
              exclusiveArea: 150,
              floorCommonArea: 30,
              buildingCommonArea: 15,
              usageGroupCommonArea: 7,
              totalArea: 202,
            },
            {
              usageId: "f2u2",
              annexedCode: "annex03_i",
              annexedName: "３項イ",
              exclusiveArea: 250,
              floorCommonArea: 50,
              buildingCommonArea: 25,
              usageGroupCommonArea: 12,
              totalArea: 337,
            },
          ],
        ];

        const result = engine.aggregateBuildingTotals(floorBreakdowns);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.usageTotals).toHaveLength(3);

          // annex01_i should be aggregated from both floors
          const annex01Total = result.value.usageTotals.find(
            (u: BuildingUsageTotal) => u.annexedCode === "annex01_i"
          );
          expect(annex01Total).toBeDefined();
          expect(annex01Total?.exclusiveArea).toBe(250); // 100 + 150
          expect(annex01Total?.floorCommonArea).toBe(50); // 20 + 30
          expect(annex01Total?.buildingCommonArea).toBe(25); // 10 + 15
          expect(annex01Total?.usageGroupCommonArea).toBe(12); // 5 + 7
          expect(annex01Total?.totalArea).toBe(337); // 135 + 202

          // annex02_i only on floor 1
          const annex02Total = result.value.usageTotals.find(
            (u: BuildingUsageTotal) => u.annexedCode === "annex02_i"
          );
          expect(annex02Total?.totalArea).toBe(270);

          // annex03_i only on floor 2
          const annex03Total = result.value.usageTotals.find(
            (u: BuildingUsageTotal) => u.annexedCode === "annex03_i"
          );
          expect(annex03Total?.totalArea).toBe(337);
        }
      });

      it("should calculate grand total of all usage totals", () => {
        const floorBreakdowns = [
          [
            {
              usageId: "u1",
              annexedCode: "annex01_i",
              annexedName: "１項イ",
              exclusiveArea: 100,
              floorCommonArea: 20,
              buildingCommonArea: 10,
              usageGroupCommonArea: 5,
              totalArea: 135,
            },
          ],
          [
            {
              usageId: "u2",
              annexedCode: "annex02_i",
              annexedName: "２項イ",
              exclusiveArea: 200,
              floorCommonArea: 40,
              buildingCommonArea: 20,
              usageGroupCommonArea: 10,
              totalArea: 270,
            },
          ],
        ];

        const result = engine.aggregateBuildingTotals(floorBreakdowns);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.grandTotal).toBe(405); // 135 + 270
        }
      });

      it("should sort usage totals by annexedCode", () => {
        const floorBreakdowns = [
          [
            {
              usageId: "u3",
              annexedCode: "annex06_ro_2",
              annexedName: "６項ロ(2)",
              exclusiveArea: 50,
              floorCommonArea: 10,
              buildingCommonArea: 5,
              usageGroupCommonArea: 2,
              totalArea: 67,
            },
            {
              usageId: "u1",
              annexedCode: "annex01_i",
              annexedName: "１項イ",
              exclusiveArea: 100,
              floorCommonArea: 20,
              buildingCommonArea: 10,
              usageGroupCommonArea: 5,
              totalArea: 135,
            },
            {
              usageId: "u2",
              annexedCode: "annex03_i",
              annexedName: "３項イ",
              exclusiveArea: 150,
              floorCommonArea: 30,
              buildingCommonArea: 15,
              usageGroupCommonArea: 7,
              totalArea: 202,
            },
          ],
        ];

        const result = engine.aggregateBuildingTotals(floorBreakdowns);

        expect(result.success).toBe(true);
        if (result.success) {
          const codes = result.value.usageTotals.map(
            (u: BuildingUsageTotal) => u.annexedCode
          );
          expect(codes).toEqual(["annex01_i", "annex03_i", "annex06_ro_2"]);
        }
      });

      it("should round aggregated values to 2 decimal places", () => {
        const floorBreakdowns = [
          [
            {
              usageId: "u1",
              annexedCode: "annex01_i",
              annexedName: "１項イ",
              exclusiveArea: 100.11,
              floorCommonArea: 20.22,
              buildingCommonArea: 10.11,
              usageGroupCommonArea: 5.05,
              totalArea: 135.49,
            },
          ],
          [
            {
              usageId: "u2",
              annexedCode: "annex01_i",
              annexedName: "１項イ",
              exclusiveArea: 50.22,
              floorCommonArea: 10.11,
              buildingCommonArea: 5.05,
              usageGroupCommonArea: 2.53,
              totalArea: 67.91,
            },
          ],
        ];

        const result = engine.aggregateBuildingTotals(floorBreakdowns);

        expect(result.success).toBe(true);
        if (result.success) {
          const total = result.value.usageTotals[0];
          expect(total.exclusiveArea).toBe(150.33); // 100.11 + 50.22
          expect(total.floorCommonArea).toBe(30.33); // 20.22 + 10.11
          expect(total.buildingCommonArea).toBe(15.16); // 10.11 + 5.05
          expect(total.usageGroupCommonArea).toBe(7.58); // 5.05 + 2.53
          expect(total.totalArea).toBe(203.4); // 135.49 + 67.91
          expect(result.value.grandTotal).toBe(203.4);
        }
      });

      it("should handle empty floor breakdowns", () => {
        const result = engine.aggregateBuildingTotals([]);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.usageTotals).toHaveLength(0);
          expect(result.value.grandTotal).toBe(0);
        }
      });

      it("should handle single floor", () => {
        const floorBreakdowns = [
          [
            {
              usageId: "u1",
              annexedCode: "annex01_i",
              annexedName: "１項イ",
              exclusiveArea: 100,
              floorCommonArea: 20,
              buildingCommonArea: 10,
              usageGroupCommonArea: 5,
              totalArea: 135,
            },
          ],
        ];

        const result = engine.aggregateBuildingTotals(floorBreakdowns);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.usageTotals).toHaveLength(1);
          expect(result.value.grandTotal).toBe(135);
        }
      });
    });

    describe("統合テスト - Full calculation flow", () => {
      it("should calculate complete building with multiple floors and usage groups", () => {
        // Floor 1 usages
        const floor1Usages: Usage[] = [
          {
            id: "f1u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 100,
          },
          {
            id: "f1u2",
            annexedCode: "annex02_i",
            annexedName: "２項イ",
            exclusiveArea: 200,
          },
        ];

        // Floor 2 usages
        const floor2Usages: Usage[] = [
          {
            id: "f2u1",
            annexedCode: "annex01_i",
            annexedName: "１項イ",
            exclusiveArea: 150,
          },
          {
            id: "f2u2",
            annexedCode: "annex03_i",
            annexedName: "３項イ",
            exclusiveArea: 250,
          },
        ];

        // All usages for building common area calculation
        const allUsages = [...floor1Usages, ...floor2Usages];

        // Calculate floor common areas
        const floor1CommonResult = engine.calculateFloorCommonArea(
          floor1Usages,
          60
        );
        const floor2CommonResult = engine.calculateFloorCommonArea(
          floor2Usages,
          80
        );

        // Calculate building common area
        const buildingCommonResult = engine.calculateBuildingCommonArea(
          allUsages,
          140
        );

        // Calculate usage group (f1u1 and f1u2 share common area)
        const usageGroup: UsageGroup = {
          floorId: "test-floor",
          id: "g1",
          usageIds: ["f1u1", "f1u2"],
          commonArea: 30,
        };
        const groupCommonResult = engine.calculateUsageGroupCommonArea(
          floor1Usages,
          usageGroup
        );

        // Aggregate usage group results
        const allGroupResults = new Map<string, number>();
        if (groupCommonResult.success) {
          groupCommonResult.value.forEach((value, key) => {
            allGroupResults.set(key, (allGroupResults.get(key) || 0) + value);
          });
        }

        // Calculate total areas for each floor
        const floor1Totals = engine.calculateTotalAreas(
          floor1Usages,
          floor1CommonResult.success ? floor1CommonResult.value : new Map(),
          buildingCommonResult.success ? buildingCommonResult.value : new Map(),
          allGroupResults
        );

        const floor2Totals = engine.calculateTotalAreas(
          floor2Usages,
          floor2CommonResult.success ? floor2CommonResult.value : new Map(),
          buildingCommonResult.success ? buildingCommonResult.value : new Map(),
          new Map() // Floor 2 has no usage groups
        );

        // Aggregate building totals
        const buildingTotals = engine.aggregateBuildingTotals([
          floor1Totals.success ? floor1Totals.value : [],
          floor2Totals.success ? floor2Totals.value : [],
        ]);

        // Verify all calculations succeeded
        expect(floor1CommonResult.success).toBe(true);
        expect(floor2CommonResult.success).toBe(true);
        expect(buildingCommonResult.success).toBe(true);
        expect(groupCommonResult.success).toBe(true);
        expect(floor1Totals.success).toBe(true);
        expect(floor2Totals.success).toBe(true);
        expect(buildingTotals.success).toBe(true);

        // Verify building totals
        if (buildingTotals.success) {
          // annex01_i appears on both floors
          const annex01Total = buildingTotals.value.usageTotals.find(
            (u: BuildingUsageTotal) => u.annexedCode === "annex01_i"
          );
          expect(annex01Total).toBeDefined();
          expect(annex01Total?.exclusiveArea).toBe(250); // 100 + 150

          // Grand total should be sum of all usage totals
          expect(buildingTotals.value.grandTotal).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("累積丸め (Cumulative Rounding) による誤差修正", () => {
    it("should ensure sum equals total when distributing floor common area", () => {
      // 10.00を7つに均等案分する極端なケース
      const usages: Usage[] = Array.from({ length: 7 }, (_, i) => ({
        id: `u${i + 1}`,
        annexedCode: `annex${i + 1}`,
        annexedName: `用途${i + 1}`,
        exclusiveArea: 1, // すべて同じ比率
      }));
      const floorCommonArea = 10;

      const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

      expect(result.success).toBe(true);
      if (result.success) {
        // 各案分値を取得
        const values = Array.from(result.value.values());

        // 合計が正確に10.00になることを確認
        const sum = values.reduce((acc, val) => acc + val, 0);
        expect(sum).toBe(10);

        // すべての値が小数点以下2桁の精度であることを確認（浮動小数点誤差を許容）
        values.forEach((val) => {
          const rounded = Math.round(val * 100) / 100;
          expect(Math.abs(val - rounded)).toBeLessThan(0.000001);
        });

        // 個別丸めだと 1.43 × 7 = 10.01 になるが、累積丸めで正確に10.00になる
        console.log("7つの案分値:", values);
        console.log("合計:", sum);
      }
    });

    it("should ensure sum equals total when distributing building common area", () => {
      // 複雑な比率での案分
      const usages: Usage[] = [
        {
          id: "u1",
          annexedCode: "a1",
          annexedName: "用途1",
          exclusiveArea: 33.33,
        },
        {
          id: "u2",
          annexedCode: "a2",
          annexedName: "用途2",
          exclusiveArea: 66.67,
        },
        {
          id: "u3",
          annexedCode: "a3",
          annexedName: "用途3",
          exclusiveArea: 100.0,
        },
      ];
      const buildingCommonArea = 50.55;

      const result = engine.calculateBuildingCommonArea(
        usages,
        buildingCommonArea
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const values = Array.from(result.value.values());
        const sum = values.reduce((acc, val) => acc + val, 0);

        // 合計が元の値と一致することを確認
        expect(sum).toBe(buildingCommonArea);
      }
    });

    it("should ensure sum equals total when distributing usage group common area", () => {
      const usages: Usage[] = [
        {
          id: "u1",
          annexedCode: "a1",
          annexedName: "用途1",
          exclusiveArea: 111.11,
        },
        {
          id: "u2",
          annexedCode: "a2",
          annexedName: "用途2",
          exclusiveArea: 222.22,
        },
        {
          id: "u3",
          annexedCode: "a3",
          annexedName: "用途3",
          exclusiveArea: 333.33,
        },
      ];

      const usageGroup: UsageGroup = {
        floorId: "f1",
        id: "g1",
        usageIds: ["u1", "u2", "u3"],
        commonArea: 99.99,
      };

      const result = engine.calculateUsageGroupCommonArea(usages, usageGroup);

      expect(result.success).toBe(true);
      if (result.success) {
        const values = Array.from(result.value.values());
        const sum = values.reduce((acc, val) => acc + val, 0);

        // 合計が元の値と一致することを確認
        expect(sum).toBe(usageGroup.commonArea);
      }
    });

    it("should handle edge case: distributing 0.01 among many usages", () => {
      // 非常に小さい値を多数に案分する極端なケース
      const usages: Usage[] = Array.from({ length: 5 }, (_, i) => ({
        id: `u${i + 1}`,
        annexedCode: `annex${i + 1}`,
        annexedName: `用途${i + 1}`,
        exclusiveArea: 1,
      }));
      const floorCommonArea = 0.01;

      const result = engine.calculateFloorCommonArea(usages, floorCommonArea);

      expect(result.success).toBe(true);
      if (result.success) {
        const values = Array.from(result.value.values());
        const sum = values.reduce((acc, val) => acc + val, 0);

        // 合計が正確に0.01になることを確認
        expect(sum).toBe(0.01);

        // ほとんどの値が0で、1つだけ0.01になる
        const nonZeroCount = values.filter((v) => v > 0).length;
        expect(nonZeroCount).toBeGreaterThan(0);
      }
    });
  });
});
