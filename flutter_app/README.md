# Golf Score App (Flutter)

Flutter版のモバイル実装です。既存Next.js版のドメインロジックを移植し、
入力・履歴・分析・設定・完了体験の最小一式を実装しています。

## Directory

- `lib/main.dart`: エントリーポイント
- `lib/ui/app_shell.dart`: 画面全体（Home/Input/History/Analytics/Settings/Complete）
- `lib/state/round_store.dart`: 状態管理とローカル永続化
- `lib/domain/*`: ドメインモデル・ロジック

## Features

- ラウンド開始/再開
- 1ホール入力（打数、パット、FW、GIR、ペナルティ等）
- 次ホール遷移 + 短時間Undo
- ラウンド完了判定と完了画面
- 履歴の展開表示
- 種別分離した分析（FULL_18 / HALF_9 / SHORT）
- 次ラウンド向け設定保存

## Run

```bash
flutter pub get
flutter run
```

## Notes

- 永続化は `shared_preferences` を使用しています。
- 完全ネイティブDB（SQLite等）への移行は次フェーズで対応可能です。
