import { describe, it, expect } from "vitest";
import { ValidationService } from "./ValidationService";
import type { Floor, Usage, UsageGroup } from "../types";

describe("ValidationService", () => {
  const service = new ValidationService();

  describe("validateArea", () => {
    it("should pass for valid positive number", () => {
      const result = service.validateArea(100.5, "exclusiveArea");
      expect(result.success).toBe(true);
    });

    it("should pass for zero", () => {
      const result = service.validateArea(0, "floorCommonArea");
      expect(result.success).toBe(true);
    });

    it("should accept decimal values", () => {
      const result = service.validateArea(123.456, "buildingCommonArea");
      expect(result.success).toBe(true);
    });

    it("should fail for negative number", () => {
      const result = service.validateArea(-50, "exclusiveArea");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("NEGATIVE_VALUE");
        expect(result.error.field).toBe("exclusiveArea");
        expect(result.error.message).toContain("負");
      }
    });

    it("should fail for NaN", () => {
      const result = service.validateArea(NaN, "exclusiveArea");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_NUMBER");
        expect(result.error.field).toBe("exclusiveArea");
      }
    });

    it("should fail for Infinity", () => {
      const result = service.validateArea(Infinity, "exclusiveArea");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_NUMBER");
      }
    });

    it("should fail for negative Infinity", () => {
      const result = service.validateArea(-Infinity, "exclusiveArea");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_NUMBER");
      }
    });
  });

  describe("validateFloorName", () => {
    it("should pass for valid floor name", () => {
      const result = service.validateFloorName("1階");
      expect(result.success).toBe(true);
    });

    it("should pass for numeric floor name", () => {
      const result = service.validateFloorName("5");
      expect(result.success).toBe(true);
    });

    it("should fail for empty string", () => {
      const result = service.validateFloorName("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("REQUIRED_FIELD");
        expect(result.error.field).toBe("floorName");
        expect(result.error.message).toContain("必須");
      }
    });

    it("should fail for whitespace only", () => {
      const result = service.validateFloorName("   ");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("REQUIRED_FIELD");
      }
    });
  });

  describe("validateUsageCode", () => {
    it("should pass for valid usage code", () => {
      const result = service.validateUsageCode("annex01_i");
      expect(result.success).toBe(true);
    });

    it("should pass for complex usage code", () => {
      const result = service.validateUsageCode("annex06_ro_2");
      expect(result.success).toBe(true);
    });

    it("should fail for empty string", () => {
      const result = service.validateUsageCode("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("REQUIRED_FIELD");
        expect(result.error.field).toBe("annexedCode");
        expect(result.error.message).toContain("必須");
      }
    });

    it("should fail for whitespace only", () => {
      const result = service.validateUsageCode("  ");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("REQUIRED_FIELD");
      }
    });
  });

  describe("validateFloor", () => {
    it("should pass for valid floor with all fields", () => {
      const floor: Partial<Floor> = {
        name: "1階",
        floorCommonArea: 50,
      };
      const result = service.validateFloor(floor);
      expect(result.success).toBe(true);
    });

    it("should pass for valid floor with zero common area", () => {
      const floor: Partial<Floor> = {
        name: "2階",
        floorCommonArea: 0,
      };
      const result = service.validateFloor(floor);
      expect(result.success).toBe(true);
    });

    it("should fail for missing name", () => {
      const floor: Partial<Floor> = {
        floorCommonArea: 50,
      };
      const result = service.validateFloor(floor);
      expect(result.success).toBe(false);
    });

    it("should fail for empty name", () => {
      const floor: Partial<Floor> = {
        name: "",
        floorCommonArea: 50,
      };
      const result = service.validateFloor(floor);
      expect(result.success).toBe(false);
    });

    it("should fail for negative floor common area", () => {
      const floor: Partial<Floor> = {
        name: "1階",
        floorCommonArea: -10,
      };
      const result = service.validateFloor(floor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("NEGATIVE_VALUE");
      }
    });
  });

  describe("validateUsage", () => {
    it("should pass for valid usage with all required fields", () => {
      const usage: Partial<Usage> = {
        annexedCode: "annex01_i",
        annexedName: "１項イ",
        exclusiveArea: 100,
      };
      const result = service.validateUsage(usage);
      expect(result.success).toBe(true);
    });

    it("should pass for usage with decimal area", () => {
      const usage: Partial<Usage> = {
        annexedCode: "annex06_ro_2",
        annexedName: "６項ロ(2)",
        exclusiveArea: 123.45,
      };
      const result = service.validateUsage(usage);
      expect(result.success).toBe(true);
    });

    it("should pass for usage with zero area", () => {
      const usage: Partial<Usage> = {
        annexedCode: "annex01_i",
        annexedName: "１項イ",
        exclusiveArea: 0,
      };
      const result = service.validateUsage(usage);
      expect(result.success).toBe(true);
    });

    it("should fail for missing annexed code", () => {
      const usage: Partial<Usage> = {
        annexedName: "１項イ",
        exclusiveArea: 100,
      };
      const result = service.validateUsage(usage);
      expect(result.success).toBe(false);
    });

    it("should fail for empty annexed code", () => {
      const usage: Partial<Usage> = {
        annexedCode: "",
        annexedName: "１項イ",
        exclusiveArea: 100,
      };
      const result = service.validateUsage(usage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("REQUIRED_FIELD");
      }
    });

    it("should fail for negative area", () => {
      const usage: Partial<Usage> = {
        annexedCode: "annex01_i",
        annexedName: "１項イ",
        exclusiveArea: -50,
      };
      const result = service.validateUsage(usage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("NEGATIVE_VALUE");
      }
    });

    it("should fail for invalid area (NaN)", () => {
      const usage: Partial<Usage> = {
        annexedCode: "annex01_i",
        annexedName: "１項イ",
        exclusiveArea: NaN,
      };
      const result = service.validateUsage(usage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_NUMBER");
      }
    });
  });

  describe("validateUsageGroup", () => {
    const floorUsages: Usage[] = [
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

    it("should pass for valid usage group with 2 usages", () => {
      const group: Partial<UsageGroup> = {
        usageIds: ["u1", "u2"],
        commonArea: 50,
      };
      const result = service.validateUsageGroup(floorUsages, group);
      expect(result.success).toBe(true);
    });

    it("should pass for valid usage group with 2 usages out of 3", () => {
      const group: Partial<UsageGroup> = {
        usageIds: ["u2", "u3"],
        commonArea: 30,
      };
      const result = service.validateUsageGroup(floorUsages, group);
      expect(result.success).toBe(true);
    });

    it("should pass for zero common area", () => {
      const group: Partial<UsageGroup> = {
        usageIds: ["u1", "u2"],
        commonArea: 0,
      };
      const result = service.validateUsageGroup(floorUsages, group);
      expect(result.success).toBe(true);
    });

    it("should fail for less than 2 usages", () => {
      const group: Partial<UsageGroup> = {
        usageIds: ["u1"],
        commonArea: 50,
      };
      const result = service.validateUsageGroup(floorUsages, group);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_USAGE_GROUP");
        expect(result.error.message).toContain("2用途以上");
      }
    });

    it("should fail for all usages in floor", () => {
      const group: Partial<UsageGroup> = {
        usageIds: ["u1", "u2", "u3"],
        commonArea: 50,
      };
      const result = service.validateUsageGroup(floorUsages, group);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_USAGE_GROUP");
        expect(result.error.message).toContain("全用途");
      }
    });

    it("should fail for empty usage ids", () => {
      const group: Partial<UsageGroup> = {
        usageIds: [],
        commonArea: 50,
      };
      const result = service.validateUsageGroup(floorUsages, group);
      expect(result.success).toBe(false);
    });

    it("should fail for negative common area", () => {
      const group: Partial<UsageGroup> = {
        usageIds: ["u1", "u2"],
        commonArea: -20,
      };
      const result = service.validateUsageGroup(floorUsages, group);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("NEGATIVE_VALUE");
      }
    });

    it("should fail for invalid common area (NaN)", () => {
      const group: Partial<UsageGroup> = {
        usageIds: ["u1", "u2"],
        commonArea: NaN,
      };
      const result = service.validateUsageGroup(floorUsages, group);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_NUMBER");
      }
    });

    it("should fail for non-existent usage ids", () => {
      const group: Partial<UsageGroup> = {
        usageIds: ["u1", "u999"],
        commonArea: 50,
      };
      const result = service.validateUsageGroup(floorUsages, group);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_USAGE_GROUP");
        expect(result.error.message).toContain("存在しない");
      }
    });

    it("should handle floor with only 1 usage", () => {
      const singleUsageFloor: Usage[] = [
        {
          id: "u1",
          annexedCode: "annex01_i",
          annexedName: "１項イ",
          exclusiveArea: 100,
        },
      ];
      const group: Partial<UsageGroup> = {
        usageIds: ["u1"],
        commonArea: 50,
      };
      const result = service.validateUsageGroup(singleUsageFloor, group);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_USAGE_GROUP");
      }
    });
  });

  describe("validateInteger", () => {
    it("should pass for positive integer", () => {
      const result = service.validateInteger(10, "階数");
      expect(result.success).toBe(true);
    });

    it("should pass for zero", () => {
      const result = service.validateInteger(0, "地上階数");
      expect(result.success).toBe(true);
    });

    it("should pass for large integer within limit", () => {
      const result = service.validateInteger(1000, "階数");
      expect(result.success).toBe(true);
    });

    it("should fail for negative integer", () => {
      const result = service.validateInteger(-5, "地上階数");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("NEGATIVE_VALUE");
        expect(result.error.field).toBe("地上階数");
        expect(result.error.message).toContain("0以上");
      }
    });

    it("should fail for decimal number", () => {
      const result = service.validateInteger(5.5, "地上階数");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_INTEGER");
        expect(result.error.field).toBe("地上階数");
        expect(result.error.message).toContain("整数");
      }
    });

    it("should fail for NaN", () => {
      const result = service.validateInteger(NaN, "階数");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_NUMBER");
        expect(result.error.field).toBe("階数");
        expect(result.error.message).toContain("有効な数値");
      }
    });

    it("should fail for Infinity", () => {
      const result = service.validateInteger(Infinity, "階数");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_NUMBER");
      }
    });

    it("should fail for exceeding maximum limit", () => {
      const result = service.validateInteger(1001, "階数");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("MAX_VALUE_EXCEEDED");
        expect(result.error.field).toBe("階数");
        expect(result.error.message).toContain("1000");
        expect(result.error.message).toContain("最大値");
      }
    });

    it("should provide error message with specific limit and fix method", () => {
      const result = service.validateInteger(2000, "地上階数");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("1000");
        expect(result.error.message).toMatch(/以下|まで/);
      }
    });
  });

  describe("Error messages in Japanese", () => {
    it("should provide Japanese error message for negative area", () => {
      const result = service.validateArea(-10, "exclusiveArea");
      if (!result.success) {
        expect(result.error.message).toMatch(/負|マイナス|0以上/);
      }
    });

    it("should provide Japanese error message for required field", () => {
      const result = service.validateFloorName("");
      if (!result.success) {
        expect(result.error.message).toMatch(/必須|入力/);
      }
    });

    it("should provide Japanese error message for invalid usage group", () => {
      const floorUsages: Usage[] = [
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
      const group: Partial<UsageGroup> = {
        usageIds: ["u1", "u2"],
        commonArea: 50,
      };
      const result = service.validateUsageGroup(floorUsages, group);
      if (!result.success) {
        expect(result.error.message).toMatch(/用途/);
      }
    });
  });
});
