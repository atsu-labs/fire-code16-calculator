/**
 * UsageGroupSelector コンポーネントの統合テスト
 * 3つ以上の用途がある場合の表示と折り畳み機能のテスト
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppStateProvider } from '../contexts/AppStateContext';
import App from '../App';

describe('UsageGroupSelector - 統合テスト', () => {
  describe('表示条件（3つ以上の用途）', () => {
    it('用途が2つ以下の場合、グループ共用部セクションは表示されない', async () => {
      const user = userEvent.setup();
      render(
        <AppStateProvider>
          <App />
        </AppStateProvider>
      );

      // 地上1階を設定
      const aboveGroundInput = screen.getByLabelText('地上階数');
      await user.clear(aboveGroundInput);
      await user.type(aboveGroundInput, '1');

      // 1階に2つの用途を追加
      const addUsageButtons = screen.getAllByText('用途を追加');
      await user.click(addUsageButtons[0]);
      await user.click(addUsageButtons[0]);

      // グループ共用部のセクションが表示されないことを確認
      expect(screen.queryByText(/この階のグループ共用部/)).not.toBeInTheDocument();
    });

    it('用途が3つ以上の場合、グループ共用部セクションが表示される', async () => {
      const user = userEvent.setup();
      render(
        <AppStateProvider>
          <App />
        </AppStateProvider>
      );

      // 地上1階を設定
      const aboveGroundInput = screen.getByLabelText('地上階数');
      await user.clear(aboveGroundInput);
      await user.type(aboveGroundInput, '1');

      // 1階に3つの用途を追加
      const addUsageButtons = screen.getAllByText('用途を追加');
      await user.click(addUsageButtons[0]);
      await user.click(addUsageButtons[0]);
      await user.click(addUsageButtons[0]);

      // 異なる用途コードを設定（ユニークな用途として認識されるため）
      const usageSelects = screen.getAllByLabelText('用途名');
      await user.selectOptions(usageSelects[0], 'annex01_i'); // １項イ
      await user.selectOptions(usageSelects[1], 'annex02_i'); // ２項イ
      await user.selectOptions(usageSelects[2], 'annex03_i'); // ３項イ

      // グループ共用部のセクションが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/この階のグループ共用部/)).toBeInTheDocument();
      });
    });
  });

  describe('折り畳み機能', () => {
    it('デフォルトで折り畳まれている（詳細が表示されていない）', async () => {
      const user = userEvent.setup();
      render(
        <AppStateProvider>
          <App />
        </AppStateProvider>
      );

      // 地上1階を設定
      const aboveGroundInput = screen.getByLabelText('地上階数');
      await user.clear(aboveGroundInput);
      await user.type(aboveGroundInput, '1');

      // 1階に3つの用途を追加
      const addUsageButtons = screen.getAllByText('用途を追加');
      await user.click(addUsageButtons[0]);
      await user.click(addUsageButtons[0]);
      await user.click(addUsageButtons[0]);

      // 異なる用途コードを設定
      const usageSelects = screen.getAllByLabelText('用途名');
      await user.selectOptions(usageSelects[0], 'annex01_i'); // １項イ
      await user.selectOptions(usageSelects[1], 'annex02_i'); // ２項イ
      await user.selectOptions(usageSelects[2], 'annex03_i'); // ３項イ

      // グループ共用部のヘッダーは表示されている
      await waitFor(() => {
        expect(screen.getByText(/この階のグループ共用部/)).toBeInTheDocument();
      });

      // 詳細（説明文）は表示されていない
      expect(screen.queryByText(/建物全体の任意の用途/)).not.toBeInTheDocument();
      expect(screen.queryByText(/2つ以上の用途を選択してグループを作成/)).not.toBeInTheDocument();
    });

    it('トグルボタンをクリックすると展開され、詳細が表示される', async () => {
      const user = userEvent.setup();
      render(
        <AppStateProvider>
          <App />
        </AppStateProvider>
      );

      // 地上1階を設定
      const aboveGroundInput = screen.getByLabelText('地上階数');
      await user.clear(aboveGroundInput);
      await user.type(aboveGroundInput, '1');

      // 1階に3つの用途を追加
      const addUsageButtons = screen.getAllByText('用途を追加');
      await user.click(addUsageButtons[0]);
      await user.click(addUsageButtons[0]);
      await user.click(addUsageButtons[0]);

      // 異なる用途コードを設定
      const usageSelects = screen.getAllByLabelText('用途名');
      await user.selectOptions(usageSelects[0], 'annex01_i'); // １項イ
      await user.selectOptions(usageSelects[1], 'annex02_i'); // ２項イ
      await user.selectOptions(usageSelects[2], 'annex03_i'); // ３項イ

      // トグルボタンを見つけてクリック
      await waitFor(() => {
        expect(screen.getByText(/この階のグループ共用部/)).toBeInTheDocument();
      });

      const toggleButton = screen.getByLabelText(/グループ共用部を展開する/);
      await user.click(toggleButton);

      // 詳細が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/建物全体の任意の用途/)).toBeInTheDocument();
        expect(screen.getByText(/2つ以上の用途を選択してグループを作成/)).toBeInTheDocument();
      });
    });

    it('展開後、トグルボタンをクリックすると再び折り畳まれる', async () => {
      const user = userEvent.setup();
      render(
        <AppStateProvider>
          <App />
        </AppStateProvider>
      );

      // 地上1階を設定
      const aboveGroundInput = screen.getByLabelText('地上階数');
      await user.clear(aboveGroundInput);
      await user.type(aboveGroundInput, '1');

      // 1階に3つの用途を追加
      const addUsageButtons = screen.getAllByText('用途を追加');
      await user.click(addUsageButtons[0]);
      await user.click(addUsageButtons[0]);
      await user.click(addUsageButtons[0]);

      // 異なる用途コードを設定
      const usageSelects = screen.getAllByLabelText('用途名');
      await user.selectOptions(usageSelects[0], 'annex01_i'); // １項イ
      await user.selectOptions(usageSelects[1], 'annex02_i'); // ２項イ
      await user.selectOptions(usageSelects[2], 'annex03_i'); // ３項イ

      // トグルボタンをクリックして展開
      await waitFor(() => {
        expect(screen.getByText(/この階のグループ共用部/)).toBeInTheDocument();
      });

      const toggleButton = screen.getByLabelText(/グループ共用部を展開する/);
      await user.click(toggleButton);

      // 詳細が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/建物全体の任意の用途/)).toBeInTheDocument();
      });

      // 再度トグルボタンをクリックして折り畳む
      const collapseButton = screen.getByLabelText(/グループ共用部を折り畳む/);
      await user.click(collapseButton);

      // 詳細が非表示になることを確認
      await waitFor(() => {
        expect(screen.queryByText(/建物全体の任意の用途/)).not.toBeInTheDocument();
      });
    });
  });

  describe('機能テスト（展開時）', () => {
    it('展開後、グループを追加できる', async () => {
      const user = userEvent.setup();
      render(
        <AppStateProvider>
          <App />
        </AppStateProvider>
      );

      // 地上1階を設定
      const aboveGroundInput = screen.getByLabelText('地上階数');
      await user.clear(aboveGroundInput);
      await user.type(aboveGroundInput, '1');

      // 1階に3つの用途を追加
      const addUsageButtons = screen.getAllByText('用途を追加');
      await user.click(addUsageButtons[0]);
      await user.click(addUsageButtons[0]);
      await user.click(addUsageButtons[0]);

      // 異なる用途コードを設定（デフォルトはすべて「１項イ」なので変更が必要）
      const usageSelects = screen.getAllByLabelText('用途名');
      await user.selectOptions(usageSelects[0], 'annex01_i'); // １項イ
      await user.selectOptions(usageSelects[1], 'annex02_i'); // ２項イ
      await user.selectOptions(usageSelects[2], 'annex03_i'); // ３項イ

      // トグルボタンをクリックして展開
      await waitFor(() => {
        expect(screen.getByText(/この階のグループ共用部/)).toBeInTheDocument();
      });

      const toggleButton = screen.getByLabelText(/グループ共用部を展開する/);
      await user.click(toggleButton);

      // 用途を選択
      await waitFor(() => {
        expect(screen.getByText(/建物全体の任意の用途/)).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      // 最初の2つの用途を選択（ユニークな用途が3つあるので、2つ選択できる）
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // グループ共用部面積を入力
      const areaInput = screen.getByLabelText(/グループ共用部面積/);
      await user.clear(areaInput);
      await user.type(areaInput, '50');

      // グループを追加
      const addGroupButton = screen.getByText('グループを追加');
      await user.click(addGroupButton);

      // 既存グループに追加されたことを確認
      await waitFor(() => {
        expect(screen.getByText(/この階の既存グループ/)).toBeInTheDocument();
      });
    });
  });
});
