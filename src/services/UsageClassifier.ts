/**
 * UsageClassifier - 複合用途防火対象物の用途判定サービス
 *
 * 消防法施行令別表第一に基づき、按分後の用途別面積から
 * 16項イ、16項ロ、または15項を判定する
 */

import type { BuildingUsageTotal, UsageClassification } from "../types";
import { buildingUses } from "../types";

/**
 * 6項の集約マッピング
 * 6項イ(1)〜(4)、6項ロ(1)〜(5)、6項ハ(1)〜(5)をそれぞれ集約
 */
const ANNEX_06_AGGREGATION_MAP: Record<string, string> = {
  annex06_i_1: "annex06_i",
  annex06_i_2: "annex06_i",
  annex06_i_3: "annex06_i",
  // NOTE: annex06_i_4 はみなし従属可能なため集約しない（個別コードを保持する）
  // 'annex06_i_4': 'annex06_i',
  annex06_ro_1: "annex06_ro",
  annex06_ro_2: "annex06_ro",
  annex06_ro_3: "annex06_ro",
  annex06_ro_4: "annex06_ro",
  annex06_ro_5: "annex06_ro",
  annex06_ha_1: "annex06_ha",
  annex06_ha_2: "annex06_ha",
  annex06_ha_3: "annex06_ha",
  annex06_ha_4: "annex06_ha",
  annex06_ha_5: "annex06_ha",
};

/**
 * 16項イに該当する用途のリスト
 * （1）項から（4）項まで、（5）項イ、（6）項、（9）項イ
 */
const ANNEX_16_I_USAGES = [
  "annex01_i",
  "annex01_ro",
  "annex02_i",
  "annex02_ro",
  "annex02_ha",
  "annex02_ni",
  "annex03_i",
  "annex03_ro",
  "annex04",
  "annex05_i",
  "annex06_i", // 集約後
  "annex06_i_4", // ６項イ(4) は個別扱い（みなし従属可能）
  "annex06_ro", // 集約後
  "annex06_ha", // 集約後
  "annex06_ni",
  "annex09_i", // 9項イ
];

export class UsageClassifier {
  /**
   * 按分後の用途別面積から用途分類を判定する
   *
   * @param usageTotals - 按分後の用途別合計面積
   * @param grandTotal - 建物全体の延べ面積
   * @returns 用途判定結果
   */
  classify(
    usageTotals: BuildingUsageTotal[],
    grandTotal: number
  ): UsageClassification {
    // 入力データの検証
    if (usageTotals.length === 0) {
      throw new Error("用途データが空です。用途を追加してください。");
    }

    if (grandTotal <= 0) {
      throw new Error(
        "建物の延べ面積が0以下です。正しい面積を入力してください。"
      );
    }

    // 1. 6項の集約を行う
    const aggregatedUsages = this.aggregateAnnex06(usageTotals);

    // 2. 従属的な部分の判定
    const { mainUsage, subordinateUsages, independentUsages } =
      this.determineSubordinateUsages(aggregatedUsages, grandTotal);

    // 3. 有効な用途（独立した用途）を取得
    const effectiveUsages =
      independentUsages.length > 0 ? independentUsages : aggregatedUsages;

    // 4. 16項イ、16項ロ、15項の判定
    const classification = this.determineClassification(effectiveUsages);

    // 5. 6項ハの入居・宿泊判定（データがないので両方のケースを判定）
    // aggregatedUsagesから6項ハの存在を確認（従属判定前の状態）
    const hasAnnex06Ha = aggregatedUsages.some(
      (u) => u.annexedCode === "annex06_ha"
    );
    let alternativeClassification = undefined;

    if (hasAnnex06Ha && effectiveUsages.length > 1) {
      // 6項ハがある場合、入居・宿泊ありとなしの両方のケースを判定
      // ここでは「入居・宿泊がない」ケースを、6項ハを除外して判定する（単独用途になる場合など）
      const usagesWithout06Ha = effectiveUsages.filter(
        (u) => u.annexedCode !== "annex06_ha"
      );

      const alternativeSubordinate =
        usagesWithout06Ha.length > 0
          ? this.determineSubordinateUsages(usagesWithout06Ha, grandTotal)
          : { mainUsage: null, subordinateUsages: [], independentUsages: [] };

      const alternativeEffectiveUsages =
        alternativeSubordinate.independentUsages.length > 0
          ? alternativeSubordinate.independentUsages
          : usagesWithout06Ha;

      const alternativeClass = this.determineClassification(
        alternativeEffectiveUsages
      );

      // 代替判定では、6項ハ自体は"入居・宿泊がない"ケースで従属的に扱えるため
      // 表示する従属リストに 6項ハ を含める（実際の判定では除外しているが、代替シナリオの説明のため）
      const annex06HaUsage = effectiveUsages.find(
        (u) => u.annexedCode === "annex06_ha"
      );
      const alternativeSubordinateUsages = annex06HaUsage
        ? [...alternativeSubordinate.subordinateUsages, annex06HaUsage]
        : alternativeSubordinate.subordinateUsages;

      // 判定結果が異なる場合のみ代替判定を表示
      if (alternativeClass !== classification) {
        alternativeClassification = {
          classification: alternativeClass,
          displayName: this.getDisplayName(alternativeClass),
          details: this.getClassificationDetails(
            alternativeEffectiveUsages,
            alternativeClass,
            alternativeSubordinateUsages
          ),
          note: "６項ハに入居・宿泊がない場合",
        };
      }
    }

    return {
      classification,
      displayName: this.getDisplayName(classification),
      details: this.getClassificationDetails(
        effectiveUsages,
        classification,
        subordinateUsages
      ),
      mainUsage: mainUsage
        ? {
            annexedCode: mainUsage.annexedCode,
            annexedName: mainUsage.annexedName,
            area: mainUsage.totalArea,
          }
        : undefined,
      subordinateUsages:
        subordinateUsages.length > 0
          ? subordinateUsages.map((u) => ({
              annexedCode: u.annexedCode,
              annexedName: u.annexedName,
              area: u.totalArea,
            }))
          : undefined,
      alternativeClassification,
    };
  }

  /**
   * 6項の集約を行う
   * 6項イ(1)〜(4)、6項ロ(1)〜(5)、6項ハ(1)〜(5)をそれぞれ集約
   */
  private aggregateAnnex06(
    usageTotals: BuildingUsageTotal[]
  ): BuildingUsageTotal[] {
    const aggregatedMap = new Map<string, BuildingUsageTotal>();

    // 事前に存在する用語コードを確認して、annex06_i_4 を集約するか決める
    const presentCodes = new Set(usageTotals.map((u) => u.annexedCode));
    const hasAnyI123 = ["annex06_i_1", "annex06_i_2", "annex06_i_3"].some(
      (code) => presentCodes.has(code)
    );
    const hasI4 = presentCodes.has("annex06_i_4");
    // annex06_i_4 は、他の 6項イ(1-3) が存在する場合にのみ annex06_i に集約する
    const shouldAggregateI4 = hasI4 && hasAnyI123;

    for (const usage of usageTotals) {
      // デフォルトはマップに基づく集約だが、annex06_i_4 は条件付きで扱う
      let targetCode =
        ANNEX_06_AGGREGATION_MAP[usage.annexedCode] || usage.annexedCode;

      if (usage.annexedCode === "annex06_i_4") {
        targetCode = shouldAggregateI4 ? "annex06_i" : "annex06_i_4";
      }

      if (aggregatedMap.has(targetCode)) {
        const existing = aggregatedMap.get(targetCode)!;
        aggregatedMap.set(targetCode, {
          annexedCode: existing.annexedCode,
          annexedName: existing.annexedName,
          exclusiveArea: existing.exclusiveArea + usage.exclusiveArea,
          floorCommonArea: existing.floorCommonArea + usage.floorCommonArea,
          buildingCommonArea:
            existing.buildingCommonArea + usage.buildingCommonArea,
          usageGroupCommonArea:
            existing.usageGroupCommonArea + usage.usageGroupCommonArea,
          totalArea: existing.totalArea + usage.totalArea,
        });
      } else {
        const annexedName =
          targetCode !== usage.annexedCode
            ? this.getAggregatedName(targetCode)
            : usage.annexedName;

        aggregatedMap.set(targetCode, {
          annexedCode: targetCode,
          annexedName: annexedName,
          exclusiveArea: usage.exclusiveArea,
          floorCommonArea: usage.floorCommonArea,
          buildingCommonArea: usage.buildingCommonArea,
          usageGroupCommonArea: usage.usageGroupCommonArea,
          totalArea: usage.totalArea,
        });
      }
    }

    return Array.from(aggregatedMap.values());
  }

  /**
   * 集約された用途コードの表示名を取得
   */
  private getAggregatedName(annexedCode: string): string {
    switch (annexedCode) {
      case "annex06_i":
        return "６項イ";
      case "annex06_ro":
        return "６項ロ";
      case "annex06_ha":
        return "６項ハ";
      default:
        return annexedCode;
    }
  }

  /**
   * 従属的な部分の判定
   *
   * 条件：
   * - 主たる用途の面積が延べ面積の90%以上
   * - かつ、主たる用途以外の独立した用途の面積が300㎡未満
   * - ただし、除外用途（2項ニ、5項イ、6項イ、6項ロ、6項ハ（入居・宿泊あり））は従属とみなせない
   *
   * @returns 主たる用途、従属的な部分、独立した用途のリスト
   */
  private determineSubordinateUsages(
    usages: BuildingUsageTotal[],
    grandTotal: number,
    // allowAnnex06HaAsSubordinate: 6項ハを従属として扱う（代替ケース用）
    allowAnnex06HaAsSubordinate: boolean = false
  ): {
    mainUsage: BuildingUsageTotal | null;
    subordinateUsages: BuildingUsageTotal[];
    independentUsages: BuildingUsageTotal[];
  } {
    if (usages.length <= 1) {
      return {
        mainUsage: usages[0] || null,
        subordinateUsages: [],
        independentUsages: usages,
      };
    }

    // 面積順にソート（降順）
    const sortedUsages = [...usages].sort((a, b) => b.totalArea - a.totalArea);
    const mainUsage = sortedUsages[0];
    const otherUsages = sortedUsages.slice(1);

    // 除外用途（従属とみなせない用途）
    // 消防法施行令別表第一に基づき、以下の用途は従属とみなすことができない
    const excludedFromSubordinate = [
      "annex02_ni", // 2項ニ
      "annex05_i", // 5項イ
      "annex06_i", // 6項イ（集約後、サブカテゴリ(1)〜(4)を含む）
      "annex06_ro", // 6項ロ（集約後、サブカテゴリ(1)〜(5)を含む）
      // annex06_ha は通常は除外対象（入居・宿泊ありの可能性があるため）
      "annex06_ha", // 6項ハ（集約後、サブカテゴリ(1)〜(5)を含む）
    ];

    // 代替ケースで「6項ハに入居・宿泊がない」場合は 6項ハ を従属として扱えるようにする
    if (allowAnnex06HaAsSubordinate) {
      const idx = excludedFromSubordinate.indexOf("annex06_ha");
      if (idx !== -1) excludedFromSubordinate.splice(idx, 1);
    }

    // 主たる用途以外の面積を計算
    const otherTotalArea = otherUsages.reduce((sum, u) => sum + u.totalArea, 0);

    // 従属的な部分の条件判定
    const mainUsageRatio = mainUsage.totalArea / grandTotal;
    const isMainUsageDominant = mainUsageRatio >= 0.9;
    const isOtherUsagesSmall = otherTotalArea < 300;

    // 除外用途が含まれているか確認
    const hasExcludedUsage = otherUsages.some((u) =>
      excludedFromSubordinate.includes(u.annexedCode)
    );

    if (isMainUsageDominant && isOtherUsagesSmall && !hasExcludedUsage) {
      // 従属的な部分として扱う
      return {
        mainUsage,
        subordinateUsages: otherUsages,
        independentUsages: [mainUsage],
      };
    }

    // 従属とはみなせない場合
    return {
      mainUsage,
      subordinateUsages: [],
      independentUsages: usages,
    };
  }

  /**
   * 16項イ、16項ロ、または単一用途の判定
   *
   * - 用途が1つの場合: その用途コード（単一用途）
   * - 用途が2つ以上で、16項イ対象用途を含む場合: 16項イ
   * - 用途が2つ以上で、16項イ対象用途を含まない場合: 16項ロ
   */
  private determineClassification(usages: BuildingUsageTotal[]): string {
    if (usages.length <= 1) {
      // 単一用途の場合はその用途コードを返す
      return usages[0]?.annexedCode || "annex15";
    }

    // 16項イ対象用途が含まれているか確認
    const hasAnnex16IUsage = usages.some((u) =>
      ANNEX_16_I_USAGES.includes(u.annexedCode)
    );

    return hasAnnex16IUsage ? "annex16_i" : "annex16_ro";
  }

  /**
   * 判定結果の表示名を取得
   */
  private getDisplayName(classification: string): string {
    switch (classification) {
      case "annex16_i":
        return "１６項イ";
      case "annex16_ro":
        return "１６項ロ";
      case "annex15":
        return "１５項";
      default:
        // 単一用途の場合は、buildingUsesから表示名を取得
        const usage = buildingUses.find((u) => u.code === classification);
        return usage ? usage.name : classification;
    }
  }

  /**
   * 判定結果の詳細を取得
   */
  private getClassificationDetails(
    usages: BuildingUsageTotal[],
    classification: string,
    subordinateUsages: BuildingUsageTotal[]
  ): string[] {
    const details: string[] = [];

    if (subordinateUsages.length > 0) {
      // 従属的な部分がある場合
      details.push("みなし従属（主たる用途90%以上かつ他の用途300㎡未満）");
      details.push(`構成用途: ${usages.map((u) => u.annexedName).join("、")}`);
      details.push(
        `従属とみなされる用途: ${subordinateUsages
          .map((u) => u.annexedName)
          .join("、")}`
      );
    } else if (
      classification !== "annex16_i" &&
      classification !== "annex16_ro"
    ) {
      // 単一用途の場合（16項イでも16項ロでもない場合）
      details.push(`単一用途: ${usages[0]?.annexedName || ""}`);
    } else {
      // 複合用途の場合
      details.push(`構成用途: ${usages.map((u) => u.annexedName).join("、")}`);
    }

    return details;
  }
}
