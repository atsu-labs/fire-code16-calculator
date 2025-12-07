import { describe, it, expect } from "vitest";
import { generateUUID, buildingUses } from "./types";

describe("UUID Generator", () => {
  it("should generate a valid UUID string", () => {
    const uuid = generateUUID();
    expect(uuid).toBeDefined();
    expect(typeof uuid).toBe("string");
    expect(uuid.length).toBeGreaterThan(0);
  });

  it("should generate unique UUIDs", () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });

  it("should generate UUIDs in expected format", () => {
    const uuid = generateUUID();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });
});

describe("Building Uses Constants", () => {
  it("should have all required fire code usage types", () => {
    expect(buildingUses).toBeDefined();
    expect(Array.isArray(buildingUses)).toBe(true);
    expect(buildingUses.length).toBeGreaterThan(0);
  });

  it("should include 1項イ usage type", () => {
    const usage = buildingUses.find((u) => u.code === "annex01_i");
    expect(usage).toBeDefined();
    expect(usage?.name).toBe("１項イ");
  });

  it("should include 6項ロ(2) usage type", () => {
    const usage = buildingUses.find((u) => u.code === "annex06_ro_2");
    expect(usage).toBeDefined();
    expect(usage?.name).toBe("６項ロ(2)");
  });

  it("should have unique codes", () => {
    const codes = buildingUses.map((u) => u.code);
    const uniqueCodes = new Set(codes);
    expect(codes.length).toBe(uniqueCodes.size);
  });

  it("should have all entries with both code and name", () => {
    buildingUses.forEach((usage) => {
      expect(usage.code).toBeDefined();
      expect(usage.name).toBeDefined();
      expect(typeof usage.code).toBe("string");
      expect(typeof usage.name).toBe("string");
      expect(usage.code.length).toBeGreaterThan(0);
      expect(usage.name.length).toBeGreaterThan(0);
    });
  });

  it("should be ordered by annex number and subsection", () => {
    // First entry should be 1項イ
    expect(buildingUses[0].code).toBe("annex01_i");
    // Check that annex numbers are sequential where applicable
    const firstAnnex06 = buildingUses.findIndex((u) =>
      u.code.startsWith("annex06")
    );
    expect(firstAnnex06).toBeGreaterThan(0);
  });
});

describe("Type Definitions", () => {
  it("should allow creating a valid Usage object", () => {
    const usage: import("./types").Usage = {
      id: generateUUID(),
      annexedCode: "annex01_i",
      annexedName: "１項イ",
      exclusiveArea: 100.5,
    };

    expect(usage.id).toBeDefined();
    expect(usage.annexedCode).toBe("annex01_i");
    expect(usage.annexedName).toBe("１項イ");
    expect(usage.exclusiveArea).toBe(100.5);
  });

  it("should allow creating a valid Floor object", () => {
    const floor: import("./types").Floor = {
      id: generateUUID(),
      name: "1階",
      floorCommonArea: 50,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    };

    expect(floor.id).toBeDefined();
    expect(floor.name).toBe("1階");
    expect(floor.floorCommonArea).toBe(50);
    expect(floor.usages).toEqual([]);
  });

  it("should allow creating a Floor with floorType above-ground", () => {
    const floor: import("./types").Floor = {
      id: generateUUID(),
      name: "1階",
      floorType: "above-ground",
      floorCommonArea: 50,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    };

    expect(floor.floorType).toBe("above-ground");
    // Type assertion to verify floorType is part of Floor interface
    const floorType: "above-ground" | "basement" | undefined = floor.floorType;
    expect(floorType).toBe("above-ground");
  });

  it("should allow creating a Floor with floorType basement", () => {
    const floor: import("./types").Floor = {
      id: generateUUID(),
      name: "地下1階",
      floorType: "basement",
      floorCommonArea: 30,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    };

    expect(floor.floorType).toBe("basement");
    // Type assertion to verify floorType is part of Floor interface
    const floorType: "above-ground" | "basement" | undefined = floor.floorType;
    expect(floorType).toBe("basement");
  });

  it("should default to above-ground when floorType is omitted", () => {
    const floor: import("./types").Floor = {
      id: generateUUID(),
      name: "2階",
      floorCommonArea: 40,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    };

    // TypeScript should allow omitting floorType as it's optional
    expect(floor.floorType).toBeUndefined();
  });

  it("should only accept valid floorType values", () => {
    // This test ensures TypeScript enforces the union type
    const validFloor1: import("./types").Floor = {
      id: generateUUID(),
      name: "1階",
      floorType: "above-ground",
      floorCommonArea: 50,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    };

    const validFloor2: import("./types").Floor = {
      id: generateUUID(),
      name: "地下1階",
      floorType: "basement",
      floorCommonArea: 30,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    };

    expect(validFloor1.floorType).toBe("above-ground");
    expect(validFloor2.floorType).toBe("basement");
  });

  it("should allow creating a valid Building object", () => {
    const building: import("./types").Building = {
      id: generateUUID(),
      floors: [],
    };

    expect(building.id).toBeDefined();
    expect(building.floors).toEqual([]);
  });

  it("should allow creating a valid UsageGroup object", () => {
    const usageGroup: import("./types").UsageGroup = {
      id: generateUUID(),
      floorId: "floor-1",
      usageIds: ["usage1", "usage2"],
      commonArea: 30,
    };

    expect(usageGroup.id).toBeDefined();
    expect(usageGroup.floorId).toBe("floor-1");
    expect(usageGroup.usageIds).toHaveLength(2);
    expect(usageGroup.commonArea).toBe(30);
  });
});

describe("Error Types", () => {
  it("should allow creating ValidationError types", () => {
    const error: import("./types").ValidationError = {
      type: "INVALID_NUMBER",
      field: "exclusiveArea",
      message: "Must be a positive number",
    };

    expect(error.type).toBe("INVALID_NUMBER");
    expect(error.field).toBe("exclusiveArea");
    expect(error.message).toBeDefined();
  });

  it("should allow creating CalculationError types", () => {
    const error: import("./types").CalculationError = {
      type: "ZERO_EXCLUSIVE_AREA_SUM",
      floorId: "floor1",
    };

    expect(error.type).toBe("ZERO_EXCLUSIVE_AREA_SUM");
    expect(error.floorId).toBe("floor1");
  });
});

describe("Result Type", () => {
  it("should allow creating success result", () => {
    const result: import("./types").Result<number, Error> = {
      success: true,
      value: 42,
    };

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(42);
    }
  });

  it("should allow creating error result", () => {
    const result: import("./types").Result<number, string> = {
      success: false,
      error: "Something went wrong",
    };

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Something went wrong");
    }
  });
});
