import { describe, it, expect } from "vitest";
import type { Floor } from "./types";

describe("Floor type - floorType field", () => {
  it("should have floorType property in Floor interface", () => {
    // This is a compile-time test - if Floor doesn't have floorType,
    // TypeScript will show an error
    const floor: Floor = {
      id: "test-id",
      name: "1階",
      floorType: "above-ground",
      floorCommonArea: 0,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    };

    // Runtime verification
    expect(floor).toHaveProperty("floorType");
    expect(floor.floorType).toBe("above-ground");
  });

  it("should accept 'above-ground' as floorType", () => {
    const floor: Floor = {
      id: "test-id",
      name: "1階",
      floorType: "above-ground",
      floorCommonArea: 0,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    };

    expect(floor.floorType).toBe("above-ground");
  });

  it("should accept 'basement' as floorType", () => {
    const floor: Floor = {
      id: "test-id",
      name: "地下1階",
      floorType: "basement",
      floorCommonArea: 0,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    };

    expect(floor.floorType).toBe("basement");
  });

  it("should allow floorType to be optional (undefined)", () => {
    const floor: Floor = {
      id: "test-id",
      name: "2階",
      floorCommonArea: 0,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    };

    expect(floor.floorType).toBeUndefined();
  });

  it("should type-check floorType as union type", () => {
    const floor: Floor = {
      id: "test-id",
      name: "1階",
      floorType: "above-ground",
      floorCommonArea: 0,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    };

    // This ensures the type is correctly constrained
    const floorType: "above-ground" | "basement" | undefined = floor.floorType;
    expect(["above-ground", "basement", undefined]).toContain(floorType);
  });
});
