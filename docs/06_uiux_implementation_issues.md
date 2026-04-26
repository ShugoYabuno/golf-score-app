# UI/UX Implementation Issues (2026-04-23)

本ドキュメントは、`AGENTS.md` と `docs/01_product_principles.md` を基準に、現行実装を監査して作成した issue バックログ。

## Priority Summary
- P0: 3件（入力体験の中核、完了体験の欠落）
- P1: 4件（トーン、開始導線、分析体験）
- P2: 2件（ゲーミフィケーション拡張、回帰テスト）

## P0

### ISSUE-001: ラウンド完了時に「Round Complete」画面が存在しない
- Priority: P0
- Current:
  `completeRound()` 後に `currentRound` が `null` になり、タブが `history` に戻るため、完了時のクライマックス画面がない。
- Why:
  実装方針の「Round Completeを感情ピークにする」に未達。
- Done:
  ラウンド完了専用画面を追加し、以下を表示する。
  1. 総打数と対Par
  2. 今回のハイライト3件
  3. 小さな次回目標
  4. ベスト更新有無に関係ない肯定メッセージ
  5. そこから履歴/分析へ遷移
- Evidence:
  [components/app-shell.tsx:785](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:785)
  [components/app-shell.tsx:1992](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:1992)
  [components/app-shell.tsx:2002](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:2002)
  [AGENTS.md:77](/Users/shugoyabuno/Documents/MyProject/golf-score-app/AGENTS.md:77)

### ISSUE-002: ラウンド中の演出が入力テンポを止める
- Priority: P0
- Current:
  `handleAdvance` 内で演出時間分 `await` し、次ホール遷移を待たせる。`CelebrationOverlay` が全画面をブロックする。
- Why:
  「ラウンド中の演出は控えめ」「記録の邪魔をしない」に反する。
- Done:
  1. ラウンド中は非ブロッキング演出に変更
  2. オーバーレイ表示は完了時中心に移行
  3. 入力遷移は即時（演出待ちなし）
- Evidence:
  [components/app-shell.tsx:760](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:760)
  [components/app-shell.tsx:770](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:770)
  [components/app-shell.tsx:793](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:793)
  [AGENTS.md:36](/Users/shugoyabuno/Documents/MyProject/golf-score-app/AGENTS.md:36)
  [AGENTS.md:38](/Users/shugoyabuno/Documents/MyProject/golf-score-app/AGENTS.md:38)

### ISSUE-003: スコア入力画面が「最短入力」より多機能表示を優先している
- Priority: P0
- Current:
  打数/パットに加えて推奨チップ、ティー方向、詳細シート、ホール切替など、常時表示要素が多い。
- Why:
  「現在ホール入力に集中」「1画面1主目的」「3タップ以内」の達成が難しい。
- Done:
  1. クイック入力モードを導入（打数入力 + 次へを主導線化）
  2. ティー方向はデフォルト非表示（詳細へ移動）
  3. 補助UIは段階表示に統一
- Evidence:
  [components/app-shell.tsx:811](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:811)
  [components/app-shell.tsx:849](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:849)
  [components/app-shell.tsx:893](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:893)
  [components/app-shell.tsx:948](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:948)
  [AGENTS.md:72](/Users/shugoyabuno/Documents/MyProject/golf-score-app/AGENTS.md:72)

## P1

### ISSUE-004: ネガティブ評価語（STRUGGLING / 要調整）が残っている
- Priority: P1
- Current:
  Round Formや分析トレンドに、心理的負荷を上げる語が使われている。
- Why:
  「責める表現を使わない」「伴走コーチ」方針に反する。
- Done:
  1. `STRUGGLING` を中立/前向きラベルへ置換
  2. `要調整` を提案型文言へ置換
  3. 全画面コピー監査（悪化・平均以下・失敗の除去）
- Evidence:
  [components/app-shell.tsx:184](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:184)
  [components/app-shell.tsx:1556](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:1556)
  [components/app-shell.tsx:1730](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:1730)
  [AGENTS.md:49](/Users/shugoyabuno/Documents/MyProject/golf-score-app/AGENTS.md:49)

### ISSUE-005: ラウンド開始フローが重く、段階開示になっていない
- Priority: P1
- Current:
  コース検索、エリア絞り込み、プリセット、Par編集などが開始前に同時表示される。
- Why:
  初回や急ぎ利用時の認知負荷が高く、開始までの操作が長い。
- Done:
  1. クイックスタート（前回コース/フリー）を最上段に追加
  2. 詳細設定（Par編集、マスタ保存）は折りたたみ遷移に分離
  3. 開始ボタンまでの必須ステップを最小化
- Evidence:
  [components/app-shell.tsx:1213](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:1213)
  [components/app-shell.tsx:1257](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:1257)
  [components/app-shell.tsx:1385](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:1385)
  [AGENTS.md:66](/Users/shugoyabuno/Documents/MyProject/golf-score-app/AGENTS.md:66)

### ISSUE-006: Home相当の「次アクション中心画面」が存在しない
- Priority: P1
- Current:
  非ラウンド時の初期タブが `history`。開始/再開が主導線として独立していない。
- Why:
  「次アクションがすぐ分かる構成」に未達。
- Done:
  1. Homeタブを追加して開始/再開CTAを最上位化
  2. 直近ラウンドと短期推移を少量表示
  3. 履歴/設定は2次導線に移動
- Evidence:
  [components/app-shell.tsx:1992](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:1992)
  [components/app-shell.tsx:2018](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:2018)
  [AGENTS.md:64](/Users/shugoyabuno/Documents/MyProject/golf-score-app/AGENTS.md:64)

### ISSUE-007: 分析画面が「数字中心」で自然言語フィードバックが不足
- Priority: P1
- Current:
  カード・グラフはあるが、先月比/直近比較などの文脈コメントが限定的。
- Why:
  「数字羅列で終わらせない」「次アクションを前向き提示」が弱い。
- Done:
  1. 相対比較コメント（先月比、直近5R比）を追加
  2. ハイライト文を自動生成
  3. 次回に向けた1アクション提案を表示
- Evidence:
  [components/app-shell.tsx:1705](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:1705)
  [components/app-shell.tsx:1749](/Users/shugoyabuno/Documents/MyProject/golf-score-app/components/app-shell.tsx:1749)
  [AGENTS.md:86](/Users/shugoyabuno/Documents/MyProject/golf-score-app/AGENTS.md:86)

## P2

### ISSUE-008: 採用方針のゲーミフィケーション基盤（XP/バッジ/レベル）が未実装
- Priority: P2
- Current:
  一時的な演出はあるが、継続的な成長構造（XP、バッジ、レベル、ロードマップ）がない。
- Why:
  「記録が楽しい」体験の長期継続性に不足。
- Done:
  1. XP算出ルール実装（ラウンド完了、ベスト更新、初バーディ等）
  2. バッジ定義と獲得判定
  3. レベル表示と次レベル進捗
  4. ラウンド完了画面で獲得報酬を表示
- Evidence:
  [AGENTS.md:42](/Users/shugoyabuno/Documents/MyProject/golf-score-app/AGENTS.md:42)
  [docs/01_product_principles.md:30](/Users/shugoyabuno/Documents/MyProject/golf-score-app/docs/01_product_principles.md:30)

### ISSUE-009: 新方針に対するUI/UX回帰テストが不足
- Priority: P2
- Current:
  ドメインテストはあるが、画面遷移・文言トーン・完了体験のテストがない。
- Why:
  実装方針変更後の回帰検出が困難。
- Done:
  1. Round完了フローのコンポーネントテスト追加
  2. ネガティブ文言禁止のスナップショット/文字列監査追加
  3. クイック入力導線の回帰テスト追加
- Evidence:
  [tests/progress.test.ts:1](/Users/shugoyabuno/Documents/MyProject/golf-score-app/tests/progress.test.ts:1)
  [tests/analytics.test.ts:1](/Users/shugoyabuno/Documents/MyProject/golf-score-app/tests/analytics.test.ts:1)

## Notes
- GitHub Issue への直接起票は、ローカル `gh` が未認証のため未実施。
- 本ファイルの各セクションは、そのまま GitHub Issue 本文として転記可能。
