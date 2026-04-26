# Hole Screen Spec (iPhone Portrait)

## Layout
- Header (88pt)
  - Prev / Hole x/y + Par / Round info
  - Progress bar
- Input Area (scrollable)
  - Required:
    - Strokes (+/-)
    - Putts (0,1,2,3,4+, Unknown)
    - Penalty Total (default 0)
  - Optional (round設定で有効な項目のみ表示):
    - FW Keep (Par4/5 only)
    - GIR
    - OB
    - Bunker In
- Bottom Actions (96pt fixed)
  - Undo (3秒)
  - Primary: 次のホールへ

## Button and Tap Area
- Minimum tap target: 48x48pt (recommended 52pt+)
- Strokes +/-: 64x64pt
- Primary button: height 56pt
- Chip buttons: height 52pt

## Input Flow
1. 打数を入力
2. パットを入力（不明可）
3. ペナルティを必要時のみ修正（初期値は0）
4. Optional項目を入力
5. 次のホールへ（手動）

## Validation
- 必須不足時は遷移不可
- 不足項目を強調
- ペナルティ合計は0を初期値とするため未入力扱いにしない
- 異常値は警告表示のみ（入力は許可）

## Save / Undo / Next State
- Draft: 編集中
- Saving: 入力のたびに非ブロッキング保存中表示
- Saved: 保存済み表示（短時間）
- Next:
  - 必須OK -> 保存後に次ホール遷移
  - 必須不足 -> 遷移せず不足へフォーカス
- Undo:
  - 遷移後3秒のみ有効

## Round Config Rule
- ラウンド中に記録項目設定は変更しない
- Hole画面では「このラウンドで何を記録するか」を参照表示のみ行う
