# Flutter Replacement Plan

## 目的
Next.js実装から、iOS/Android配布前提のFlutter実装へ段階移行する。

## 今回完了した範囲
- `flutter_app/` を新設
- ドメインロジック（rounds/analytics/progress/courses）をDartへ移植
- Home / Score Input / History / Analytics / Settings / Round Complete を実装
- `shared_preferences` でローカル永続化
- ドメイン単体テスト（3本）を追加

## 次フェーズ
1. Flutter SDK導入環境で `flutter test` / `flutter run` 実行
2. 永続化を SQLite/Drift へ移行
3. 既存WebデータからFlutterローカルデータへの移行スクリプトを追加
4. 通知・バックアップなどモバイル機能を実装
5. App Store / Google Play 配布設定
