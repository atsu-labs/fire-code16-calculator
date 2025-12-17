/**
 * UsageClassifier のテスト
 */

import { describe, it, expect } from 'vitest';
import { UsageClassifier } from './UsageClassifier';
import type { BuildingUsageTotal } from '../types';

describe('UsageClassifier', () => {
  const classifier = new UsageClassifier();

  describe('6項の集約', () => {
    it('6項イ(1)〜(4)を6項イに集約する', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex06_i_1',
          annexedName: '６項イ(1)',
          exclusiveArea: 100,
          floorCommonArea: 10,
          buildingCommonArea: 5,
          usageGroupCommonArea: 0,
          totalArea: 115,
        },
        {
          annexedCode: 'annex06_i_3',
          annexedName: '６項イ(3)',
          exclusiveArea: 200,
          floorCommonArea: 20,
          buildingCommonArea: 10,
          usageGroupCommonArea: 0,
          totalArea: 230,
        },
      ];

      const result = classifier.classify(usageTotals, 345);

      // 単一用途（集約後）なので15項
      expect(result.classification).toBe('annex15');
      expect(result.details).toContain('単一用途: ６項イ');
    });

    it('6項ロ(1)〜(5)を6項ロに集約する', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex06_ro_2',
          annexedName: '６項ロ(2)',
          exclusiveArea: 100,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 100,
        },
        {
          annexedCode: 'annex06_ro_5',
          annexedName: '６項ロ(5)',
          exclusiveArea: 100,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 100,
        },
      ];

      const result = classifier.classify(usageTotals, 200);

      expect(result.classification).toBe('annex15');
      expect(result.details).toContain('単一用途: ６項ロ');
    });

    it('6項ハ(1)〜(5)を6項ハに集約する', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex06_ha_2',
          annexedName: '６項ハ(2)',
          exclusiveArea: 100,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 100,
        },
        {
          annexedCode: 'annex06_ha_5',
          annexedName: '６項ハ(5)',
          exclusiveArea: 100,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 100,
        },
      ];

      const result = classifier.classify(usageTotals, 200);

      expect(result.classification).toBe('annex15');
      expect(result.details).toContain('単一用途: ６項ハ');
    });
  });

  describe('15項の判定', () => {
    it('単一用途の場合は15項と判定する', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex04',
          annexedName: '４項',
          exclusiveArea: 1000,
          floorCommonArea: 100,
          buildingCommonArea: 50,
          usageGroupCommonArea: 0,
          totalArea: 1150,
        },
      ];

      const result = classifier.classify(usageTotals, 1150);

      expect(result.classification).toBe('annex15');
      expect(result.displayName).toBe('１５項');
      expect(result.details).toContain('単一用途: ４項');
    });
  });

  describe('16項イの判定', () => {
    it('1項イと5項ロの複合用途は16項イと判定する', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex01_i',
          annexedName: '１項イ',
          exclusiveArea: 500,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 500,
        },
        {
          annexedCode: 'annex05_ro',
          annexedName: '５項ロ',
          exclusiveArea: 500,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 500,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      expect(result.classification).toBe('annex16_i');
      expect(result.displayName).toBe('１６項イ');
      expect(result.details[0]).toContain('構成用途: １項イ、５項ロ');
    });

    it('4項と6項イの複合用途は16項イと判定する', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex04',
          annexedName: '４項',
          exclusiveArea: 400,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 400,
        },
        {
          annexedCode: 'annex06_i_1',
          annexedName: '６項イ(1)',
          exclusiveArea: 300,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 300,
        },
      ];

      const result = classifier.classify(usageTotals, 700);

      expect(result.classification).toBe('annex16_i');
      expect(result.displayName).toBe('１６項イ');
    });
  });

  describe('16項ロの判定', () => {
    it('7項と8項の複合用途は16項ロと判定する', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex07',
          annexedName: '７項',
          exclusiveArea: 500,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 500,
        },
        {
          annexedCode: 'annex08',
          annexedName: '８項',
          exclusiveArea: 500,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 500,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      expect(result.classification).toBe('annex16_ro');
      expect(result.displayName).toBe('１６項ロ');
      expect(result.details[0]).toContain('構成用途: ７項、８項');
    });

    it('10項と11項の複合用途は16項ロと判定する', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex10',
          annexedName: '１０項',
          exclusiveArea: 600,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 600,
        },
        {
          annexedCode: 'annex11',
          annexedName: '１１項',
          exclusiveArea: 400,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 400,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      expect(result.classification).toBe('annex16_ro');
      expect(result.displayName).toBe('１６項ロ');
    });
  });

  describe('従属的な部分の判定', () => {
    it('主たる用途90%以上かつ他の用途300㎡未満の場合、従属とみなす', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex04',
          annexedName: '４項',
          exclusiveArea: 950,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 950,
        },
        {
          annexedCode: 'annex07',
          annexedName: '７項',
          exclusiveArea: 50,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 50,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      expect(result.classification).toBe('annex15');
      expect(result.displayName).toBe('１５項');
      expect(result.details[0]).toContain('みなし従属');
      expect(result.subordinateUsages).toHaveLength(1);
      expect(result.subordinateUsages![0].annexedCode).toBe('annex07');
    });

    it('主たる用途90%未満の場合、従属とみなさない', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex04',
          annexedName: '４項',
          exclusiveArea: 850,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 850,
        },
        {
          annexedCode: 'annex07',
          annexedName: '７項',
          exclusiveArea: 150,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 150,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      expect(result.classification).toBe('annex16_i');
      expect(result.details[0]).not.toContain('みなし従属');
      expect(result.subordinateUsages || []).toHaveLength(0);
    });

    it('他の用途が300㎡以上の場合、従属とみなさない', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex04',
          annexedName: '４項',
          exclusiveArea: 950,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 950,
        },
        {
          annexedCode: 'annex07',
          annexedName: '７項',
          exclusiveArea: 350,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 350,
        },
      ];

      const result = classifier.classify(usageTotals, 1300);

      expect(result.classification).toBe('annex16_i');
      expect(result.details[0]).not.toContain('みなし従属');
    });

    it('2項ニが含まれる場合、従属とみなさない', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex04',
          annexedName: '４項',
          exclusiveArea: 950,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 950,
        },
        {
          annexedCode: 'annex02_ni',
          annexedName: '２項ニ',
          exclusiveArea: 50,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 50,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      expect(result.classification).toBe('annex16_i');
      expect(result.details[0]).not.toContain('みなし従属');
    });

    it('5項イが含まれる場合、従属とみなさない', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex04',
          annexedName: '４項',
          exclusiveArea: 950,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 950,
        },
        {
          annexedCode: 'annex05_i',
          annexedName: '５項イ',
          exclusiveArea: 50,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 50,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      expect(result.classification).toBe('annex16_i');
      expect(result.details[0]).not.toContain('みなし従属');
    });

    it('6項イが含まれる場合、従属とみなさない', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex04',
          annexedName: '４項',
          exclusiveArea: 950,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 950,
        },
        {
          annexedCode: 'annex06_i_1',
          annexedName: '６項イ(1)',
          exclusiveArea: 50,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 50,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      expect(result.classification).toBe('annex16_i');
      expect(result.details[0]).not.toContain('みなし従属');
    });
  });

  describe('6項ハの入居・宿泊判定', () => {
    it('6項ハを含む複合用途の場合、代替判定を提供する', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex06_ha_2',
          annexedName: '６項ハ(2)',
          exclusiveArea: 500,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 500,
        },
        {
          annexedCode: 'annex04',
          annexedName: '４項',
          exclusiveArea: 500,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 500,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      // 6項ハを含む場合は16項イ
      expect(result.classification).toBe('annex16_i');
      
      // 代替判定（6項ハに入居・宿泊がない場合）は15項（単一用途の4項のみ）
      expect(result.alternativeClassification).toBeDefined();
      expect(result.alternativeClassification!.classification).toBe('annex15');
      expect(result.alternativeClassification!.note).toBe('６項ハに入居・宿泊がない場合');
    });

    it('6項ハのみの場合、代替判定は提供されない', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex06_ha_2',
          annexedName: '６項ハ(2)',
          exclusiveArea: 1000,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 1000,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      expect(result.classification).toBe('annex15');
      expect(result.alternativeClassification).toBeUndefined();
    });
  });

  describe('複雑なケース', () => {
    it('6項イ(1)、6項イ(3)、7項の複合用途', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex06_i_1',
          annexedName: '６項イ(1)',
          exclusiveArea: 300,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 300,
        },
        {
          annexedCode: 'annex06_i_3',
          annexedName: '６項イ(3)',
          exclusiveArea: 200,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 200,
        },
        {
          annexedCode: 'annex07',
          annexedName: '７項',
          exclusiveArea: 500,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 500,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      // 6項イ(1)と6項イ(3)が集約されて6項イになり、7項との複合用途で16項イ
      expect(result.classification).toBe('annex16_i');
      expect(result.details[0]).toContain('構成用途');
      expect(result.details[0]).toContain('６項イ');
      expect(result.details[0]).toContain('７項');
    });

    it('主たる用途90%以上、6項ロ(2)が従属範囲内だが除外用途なので従属とみなさない', () => {
      const usageTotals: BuildingUsageTotal[] = [
        {
          annexedCode: 'annex04',
          annexedName: '４項',
          exclusiveArea: 950,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 950,
        },
        {
          annexedCode: 'annex06_ro_2',
          annexedName: '６項ロ(2)',
          exclusiveArea: 50,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 50,
        },
      ];

      const result = classifier.classify(usageTotals, 1000);

      // 6項ロは除外用途なので従属とみなさない
      expect(result.classification).toBe('annex16_i');
      expect(result.details[0]).not.toContain('みなし従属');
    });
  });
});
