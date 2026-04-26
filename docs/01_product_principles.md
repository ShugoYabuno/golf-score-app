# Product Principles

## Target Problems
- ラウンド中の入力UIが重く、使いづらい
- 入力後データの分析がしづらい
- 18H/9H/ショート混在でベスト比較が崩れる
- 機能過多でスマートさが失われる
- 悪いスコアの日に継続意欲が下がりやすい
- 記録完了時の達成感が弱く、習慣化しづらい

## Design Principles
1. Fast: 1ホール入力10秒以内を目標
2. Safe: コピー依存を避け、誤入力を減らす
3. Comparable: ラウンド種別ごとに分離集計
4. Minimal: MVPは入力・履歴・分析の3画面
5. Encouraging: スコアの良し悪しに関係なく「記録したこと」を肯定する
6. Delightful: 完了と改善に軽い達成感を返す

## UX Rules (Round First)
- ラウンド中の主要入力は3タップ以内を目安にする
- 主要操作は下部サムゾーンに配置する
- タップターゲットは最低48x48pt、主要ボタンは52pt以上を目安にする
- スコア入力は選択式UIを優先し、テキスト入力を避ける
- ラウンド中にゲーム演出を割り込ませない
- 次ホール遷移後も短時間Undoを提供する

## Gamification Policy

### Adopt
- XP、レベル、バッジ
- ラウンド完了時ハイライト
- スコア改善ロードマップ
- 年間振り返り
- 友人内または同ハンデ帯での比較

### Avoid
- 毎日ストリーク
- デイリーゴール
- ライフ制
- 催促型プッシュ通知
- 無差別グローバルランキング

## Tone And Messaging
- アプリは審判ではなく伴走コーチとして振る舞う
- 悪いスコアの日も、完了メッセージは肯定的にする
- 「悪化」「平均以下」「失敗」など責める表現を使わない
- 改善は絶対値だけでなく相対値でも示す（先月比、直近5ラウンド比）

## Screen Priorities
- Home: 開始/再開導線を最短にし、情報を詰め込みすぎない
- Score Input: 現在ホール入力に集中し、補助項目は任意化する
- Round Complete: 達成感のピークを作る
- History/Analytics: 数字だけでなく自然言語コメントを添える
- Goals/Challenges: ユーザー主導で、未達成を責めない
- Profile/Level: 序列より成長の軌跡を見せる

## Scope (MVP)
- Round入力
- 履歴一覧/絞り込み
- 分析カード
- 設定による追加項目のON/OFF

## Source Of Truth
- Agent向け運用ルール: `/AGENTS.md`
- Cursorルール: `/.cursor/rules/golf-score-ui-ux.mdc`
