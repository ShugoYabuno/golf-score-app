# Data Model (MVP)

## Round
- id
- played_at
- started_at
- finished_at
- status: IN_PROGRESS | COMPLETED | ABANDONED
- course_name
- round_type: FULL_18 | HALF_9 | SHORT
- holes_count
- hole_pars
- current_hole_no
- config_snapshot
  - fw
  - gir
  - ob
  - bunker
  - putt_unknown
- last_input_at

## HoleScore
- round_id
- hole_no
- par
- strokes (required)
- putts (nullable when unknown)
- putts_unknown (bool)
- penalty_total (default 0)
- ob_count (optional)
- other_penalty_count (optional)
- fw_keep (true/false/null)
- gir (true/false/null)
- bunker_in (true/false/null)
- note (optional)
- updated_at

## Score Rules
- Best score is separated by round_type
  - Best 18H
  - Best 9H
  - Best Short
- Converted score is reference-only and excluded from best score calculation
- Incomplete rounds are excluded from best score and analytics

## Analytics Rules
- 欠損を許容
- 指標は対象ホール数を必ず併記
  - 例: GIR率 41% (対象17H)
- FW率は Par4/5 のみを対象にする
- optional項目がOFFのラウンドは、その指標の集計対象から除外する

## Config Rules
- 設定画面の値は新規ラウンド作成時の初期値にのみ使う
- Round開始後は config_snapshot を固定し、後から変更しない
- OB入力を有効にしたラウンドでは penalty_total = ob_count + other_penalty_count とする
