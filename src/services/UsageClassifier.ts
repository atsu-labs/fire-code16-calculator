/**
 * UsageClassifier - 複合用途防火対象物の用途判定サービス
 * 
 * 消防法施行令別表第一に基づき、按分後の用途別面積から
 * 16項イ、16項ロ、または15項を判定する
 */

import type { BuildingUsageTotal, UsageClassification } from '../types';

/**
 * 6項の集約マッピング
 * 6項イ(1)〜(4)、6項ロ(1)〜(5)、6項ハ(1)〜(5)をそれぞれ集約
 */
const ANNEX_06_AGGREGATION_MAP: Record<string, string> = {
  'annex06_i_1': 'annex06_i',
  'annex06_i_2': 'annex06_i',
  'annex06_i_3': 'annex06_i',
  'annex06_i_4': 'annex06_i',
  'annex06_ro_1': 'annex06_ro',
  'annex06_ro_2': 'annex06_ro',
  'annex06_ro_3': 'annex06_ro',
  'annex06_ro_4': 'annex06_ro',
  'annex06_ro_5': 'annex06_ro',
  'annex06_ha_1': 'annex06_ha',
  'annex06_ha_2': 'annex06_ha',
  'annex06_ha_3': 'annex06_ha',
  'annex06_ha_4': 'annex06_ha',
  'annex06_ha_5': 'annex06_ha',
};

/**
 * 16項イに該当する用途のリスト
 * （1）項から（4）項まで、（5）項イ、（6）項、（9）項イ
 */
const ANNEX_16_I_USAGES = [
  'annex01_i',
  'annex01_ro',
  'annex02_i',
  'annex02_ro',
  'annex02_ha',
  'annex02_ni',
  'annex03_i',
  'annex03_ro',
  'annex04',
  'annex05_i',
  'annex06_i', // 集約後
  'annex06_ro', // 集約後
  'annex06_ha', // 集約後
  'annex06_ni',
  'annex09', // 9項イとして扱う（詳細な分類がないため）
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
    // 1. 6項の集約を行う
    const aggregatedUsages = this.aggregateAnnex06(usageTotals);

    // 2. 従属的な部分の判定
    const { mainUsage, subordinateUsages, independentUsages } = 
      this.determineSubordinateUsages(aggregatedUsages, grandTotal);

    // 3. 有効な用途（独立した用途）を取得
    const effectiveUsages = independentUsages.length > 0 
      ? independentUsages 
      : aggregatedUsages;

    // 4. 16項イ、16項ロ、15項の判定
    const classification = this.determineClassification(effectiveUsages);

    // 5. 6項ハの入居・宿泊判定（データがないので両方のケースを判定）
    const hasAnnex06Ha = effectiveUsages.some(u => u.annexedCode === 'annex06_ha');
    let alternativeClassification = undefined;

    if (hasAnnex06Ha && effectiveUsages.length > 1) {
      // 6項ハがある場合、入居・宿泊ありとなしの両方のケースを判定
      const usagesWithout06Ha = effectiveUsages.filter(u => u.annexedCode !== 'annex06_ha');
      const alternativeClass = this.determineClassification(usagesWithout06Ha);
      
      // 判定結果が異なる場合のみ代替判定を表示
      if (alternativeClass !== classification) {
        alternativeClassification = {
          classification: alternativeClass,
          displayName: this.getDisplayName(alternativeClass),
          details: this.getClassificationDetails(usagesWithout06Ha, alternativeClass, subordinateUsages),
          note: '６項ハに入居・宿泊がない場合',
        };
      }
    }

    return {
      classification,
      displayName: this.getDisplayName(classification),
      details: this.getClassificationDetails(effectiveUsages, classification, subordinateUsages),
      mainUsage: mainUsage ? {
        annexedCode: mainUsage.annexedCode,
        annexedName: mainUsage.annexedName,
        area: mainUsage.totalArea,
      } : undefined,
      subordinateUsages: subordinateUsages.length > 0 ? subordinateUsages.map(u => ({
        annexedCode: u.annexedCode,
        annexedName: u.annexedName,
        area: u.totalArea,
      })) : undefined,
      alternativeClassification,
    };
  }

  /**
   * 6項の集約を行う
   * 6項イ(1)〜(4)、6項ロ(1)〜(5)、6項ハ(1)〜(5)をそれぞれ集約
   */
  private aggregateAnnex06(usageTotals: BuildingUsageTotal[]): BuildingUsageTotal[] {
    const aggregatedMap = new Map<string, BuildingUsageTotal>();

    for (const usage of usageTotals) {
      // 集約先のコードを取得（集約対象でない場合は元のコード）
      const targetCode = ANNEX_06_AGGREGATION_MAP[usage.annexedCode] || usage.annexedCode;

      if (aggregatedMap.has(targetCode)) {
        // すでに存在する場合は加算
        const existing = aggregatedMap.get(targetCode)!;
        existing.exclusiveArea += usage.exclusiveArea;
        existing.floorCommonArea += usage.floorCommonArea;
        existing.buildingCommonArea += usage.buildingCommonArea;
        existing.usageGroupCommonArea += usage.usageGroupCommonArea;
        existing.totalArea += usage.totalArea;
      } else {
        // 新規作成（集約された場合は用途名を更新）
        const annexedName = targetCode !== usage.annexedCode
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
      case 'annex06_i':
        return '６項イ';
      case 'annex06_ro':
        return '６項ロ';
      case 'annex06_ha':
        return '６項ハ';
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
   * - ただし、除外用途（2項ニ、5項イ、6項イ(1)〜(3)、6項ロ、6項ハ（入居・宿泊あり））は従属とみなせない
   * 
   * @returns 主たる用途、従属的な部分、独立した用途のリスト
   */
  private determineSubordinateUsages(
    usages: BuildingUsageTotal[],
    grandTotal: number
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
    const excludedFromSubordinate = [
      'annex02_ni', // 2項ニ
      'annex05_i',  // 5項イ
      'annex06_i',  // 6項イ（集約後）
      'annex06_ro', // 6項ロ（集約後）
      'annex06_ha', // 6項ハ（入居・宿泊ありの場合。データがないので除外対象として扱う）
    ];

    // 主たる用途以外の面積を計算
    const otherTotalArea = otherUsages.reduce((sum, u) => sum + u.totalArea, 0);

    // 従属的な部分の条件判定
    const mainUsageRatio = mainUsage.totalArea / grandTotal;
    const isMainUsageDominant = mainUsageRatio >= 0.9;
    const isOtherUsagesSmall = otherTotalArea < 300;

    // 除外用途が含まれているか確認
    const hasExcludedUsage = otherUsages.some(u => excludedFromSubordinate.includes(u.annexedCode));

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
   * 16項イ、16項ロ、15項の判定
   * 
   * - 用途が1つの場合: 15項
   * - 用途が2つ以上で、16項イ対象用途を含む場合: 16項イ
   * - 用途が2つ以上で、16項イ対象用途を含まない場合: 16項ロ
   */
  private determineClassification(
    usages: BuildingUsageTotal[]
  ): 'annex16_i' | 'annex16_ro' | 'annex15' {
    if (usages.length <= 1) {
      return 'annex15';
    }

    // 16項イ対象用途が含まれているか確認
    const hasAnnex16IUsage = usages.some(u => ANNEX_16_I_USAGES.includes(u.annexedCode));

    return hasAnnex16IUsage ? 'annex16_i' : 'annex16_ro';
  }

  /**
   * 判定結果の表示名を取得
   */
  private getDisplayName(classification: 'annex16_i' | 'annex16_ro' | 'annex15'): string {
    switch (classification) {
      case 'annex16_i':
        return '１６項イ';
      case 'annex16_ro':
        return '１６項ロ';
      case 'annex15':
        return '１５項';
    }
  }

  /**
   * 判定結果の詳細を取得
   */
  private getClassificationDetails(
    usages: BuildingUsageTotal[],
    classification: 'annex16_i' | 'annex16_ro' | 'annex15',
    subordinateUsages: BuildingUsageTotal[]
  ): string[] {
    const details: string[] = [];

    if (subordinateUsages.length > 0) {
      // 従属的な部分がある場合
      details.push('みなし従属（主たる用途90%以上かつ他の用途300㎡未満）');
      details.push(`構成用途: ${usages.map(u => u.annexedName).join('、')}`);
      details.push(`従属とみなされる用途: ${subordinateUsages.map(u => u.annexedName).join('、')}`);
    } else if (classification === 'annex15') {
      // 単一用途の場合
      details.push(`単一用途: ${usages[0]?.annexedName || ''}`);
    } else {
      // 複合用途の場合
      details.push(`構成用途: ${usages.map(u => u.annexedName).join('、')}`);
    }

    return details;
  }
}
