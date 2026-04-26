# Golf Score App

## Purpose
Round中の入力速度と、ラウンド後の分析価値を両立するゴルフスコア記録アプリ。

## Current Direction
モバイルアプリ化に向け、Flutter実装へのリプレースを開始しました。

- 既存Web実装: `Next.js`（このリポジトリ直下）
- 新モバイル実装: `flutter_app/`（Dart / Flutter）

## Flutter App Scope (Implemented)
`flutter_app/` には以下を実装済みです。

- ドメインロジック移植（型、ラウンド生成、進捗判定、分析、コースカタログ）
- ローカル状態管理（`ChangeNotifier` + `shared_preferences`）
- 主要画面
  - Home（開始 / 再開）
  - Score Input（ホール入力、次へ、Undo、完了）
  - History（履歴）
  - Analytics（種別分離集計）
  - Settings（入力項目設定）
  - Round Complete（肯定的な完了体験）

## Flutter Run
Flutter SDKが導入済みであれば以下で起動できます。

```bash
cd flutter_app
flutter pub get
flutter run
```

## Agent Rules
- AGENTS.md
- .cursor/rules/golf-score-ui-ux.mdc

## Project Docs
- docs/00_recommended_app_spec.md
- docs/01_product_principles.md
- docs/02_hole_screen_spec.md
- docs/03_data_model.md
- docs/04_mvp_backlog.md
