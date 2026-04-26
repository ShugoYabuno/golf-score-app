import 'package:uuid/uuid.dart';

import 'models.dart';

const _uuid = Uuid();

const _standard18 = [4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4, 5];
const _strategic18 = [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4];
const _resort18 = [5, 4, 3, 4, 4, 3, 5, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5];
const _half9 = [4, 4, 3, 5, 4, 3, 4, 5, 4];
const _links9 = [5, 4, 3, 4, 4, 3, 5, 4, 4];
const _short9 = [3, 3, 3, 3, 3, 3, 3, 3, 3];
const _seedUpdatedAt = '2026-04-23T00:00:00.000Z';

CoursePreset _preset(
  String id,
  RoundType roundType,
  String label,
  List<int> holePars, {
  CourseConfidence confidence = CourseConfidence.unverified,
  CourseSource source = CourseSource.manual,
}) {
  return CoursePreset(
    id: id,
    roundType: roundType,
    label: label,
    holePars: holePars,
    source: source,
    confidence: confidence,
    sourceUrl: null,
    verifiedAt: confidence == CourseConfidence.unverified ? null : _seedUpdatedAt,
  );
}

final List<GolfCourse> courseCatalog = [
  GolfCourse(
    id: 'narashino-cc',
    name: '習志野カントリークラブ',
    prefecture: '千葉',
    area: '関東',
    category: CourseCategory.regular,
    source: CourseSource.manual,
    externalRakutenGoraId: 'seed-narashino',
    officialUrl: null,
    description: 'トーナメント気分で回れる、王道18ホール向けスターター。',
    presets: [
      _preset('narashino-king-queen-18', RoundType.full18, 'King & Queen 18H', _strategic18),
      _preset('narashino-front-9', RoundType.half9, 'Front 9', _half9),
    ],
    updatedAt: _seedUpdatedAt,
  ),
  GolfCourse(
    id: 'wakasu-links',
    name: '若洲ゴルフリンクス',
    prefecture: '東京',
    area: '関東',
    category: CourseCategory.regular,
    source: CourseSource.manual,
    externalRakutenGoraId: 'seed-wakasu',
    officialUrl: null,
    description: '海風を意識したリンクス風ラウンドの練習向け。',
    presets: [
      _preset('wakasu-seaside-18', RoundType.full18, 'Seaside 18H', _standard18),
      _preset('wakasu-bay-9', RoundType.half9, 'Bay 9', _links9),
    ],
    updatedAt: _seedUpdatedAt,
  ),
  GolfCourse(
    id: 'sapporo-classic',
    name: '札幌クラシックゴルフ倶楽部',
    prefecture: '北海道',
    area: '北海道',
    category: CourseCategory.regular,
    source: CourseSource.manual,
    externalRakutenGoraId: null,
    officialUrl: null,
    description: '広さと戦略性のバランスを見ながら振り返るのに向く構成。',
    presets: [
      _preset('sapporo-classic-18', RoundType.full18, 'Classic 18H', _resort18),
      _preset('sapporo-morning-9', RoundType.half9, 'Morning 9', _half9),
    ],
    updatedAt: _seedUpdatedAt,
  ),
  GolfCourse(
    id: 'hirono-style',
    name: '廣野スタイルコース',
    prefecture: '兵庫',
    area: '関西',
    category: CourseCategory.regular,
    source: CourseSource.manual,
    externalRakutenGoraId: null,
    officialUrl: null,
    description: '狙いどころを考えるタイプの18H向けプリセット。',
    presets: [
      _preset('hirono-championship-18', RoundType.full18, 'Championship 18H', _strategic18),
      _preset('hirono-practice-9', RoundType.half9, 'Practice 9', _links9),
    ],
    updatedAt: _seedUpdatedAt,
  ),
  GolfCourse(
    id: 'phoenix-resort',
    name: 'フェニックスリゾートGC',
    prefecture: '宮崎',
    area: '九州',
    category: CourseCategory.regular,
    source: CourseSource.manual,
    externalRakutenGoraId: null,
    officialUrl: null,
    description: 'リゾート感のある18Hと、気軽な9Hの両方を想定。',
    presets: [
      _preset('phoenix-resort-18', RoundType.full18, 'Resort 18H', _resort18),
      _preset('phoenix-twilight-9', RoundType.half9, 'Twilight 9', _half9),
    ],
    updatedAt: _seedUpdatedAt,
  ),
  GolfCourse(
    id: 'urban-short-nine',
    name: 'アーバンショートナイン',
    prefecture: '神奈川',
    area: '関東',
    category: CourseCategory.short,
    source: CourseSource.manual,
    externalRakutenGoraId: null,
    officialUrl: null,
    description: 'ショートゲームの記録と比較を分離したい日に使うプリセット。',
    presets: [
      _preset(
        'urban-short-9',
        RoundType.short,
        'Short 9',
        _short9,
        confidence: CourseConfidence.userVerified,
      ),
    ],
    updatedAt: _seedUpdatedAt,
  ),
  GolfCourse(
    id: 'green-terrace-short',
    name: 'グリーンテラスショートコース',
    prefecture: '静岡',
    area: '中部',
    category: CourseCategory.short,
    source: CourseSource.manual,
    externalRakutenGoraId: null,
    officialUrl: null,
    description: 'Par3中心で、アプローチとパットの反復に向いたショートコース。',
    presets: [
      _preset(
        'green-terrace-short-9',
        RoundType.short,
        'Terrace Short 9',
        const [3, 3, 3, 3, 4, 3, 3, 4, 3],
        confidence: CourseConfidence.userVerified,
      ),
    ],
    updatedAt: _seedUpdatedAt,
  ),
  GolfCourse(
    id: 'seaside-short-links',
    name: 'シーサイドショートリンクス',
    prefecture: '福岡',
    area: '九州',
    category: CourseCategory.short,
    source: CourseSource.manual,
    externalRakutenGoraId: null,
    officialUrl: null,
    description: 'ショートでもPar4を少し含む、実戦寄りの比較がしやすい構成。',
    presets: [
      _preset(
        'seaside-short-links-9',
        RoundType.short,
        'Links Short 9',
        const [3, 4, 3, 3, 3, 4, 3, 3, 3],
        confidence: CourseConfidence.userVerified,
      ),
    ],
    updatedAt: _seedUpdatedAt,
  ),
];

GolfCourse? findCourseById(String? courseId, [List<GolfCourse>? courses]) {
  if (courseId == null || courseId.isEmpty) return null;
  final source = courses ?? courseCatalog;
  for (final course in source) {
    if (course.id == courseId) return course;
  }
  return null;
}

ParBreakdown parBreakdown(List<int> holePars) {
  var par3 = 0;
  var par4 = 0;
  var par5 = 0;

  for (final par in holePars) {
    if (par == 3) par3 += 1;
    if (par == 4) par4 += 1;
    if (par == 5) par5 += 1;
  }

  return ParBreakdown(par3: par3, par4: par4, par5: par5);
}

GolfCourse createUserCourse({
  required String name,
  String? prefecture,
  String? area,
  required CourseCategory category,
  required RoundType roundType,
  required List<int> holePars,
}) {
  final now = DateTime.now().toIso8601String();
  final id = 'user-${_uuid.v4()}';

  return GolfCourse(
    id: id,
    name: name.trim().isEmpty ? 'ユーザー登録コース' : name.trim(),
    prefecture: prefecture ?? '未設定',
    area: area ?? 'ユーザー登録',
    category: category,
    source: CourseSource.user,
    externalRakutenGoraId: null,
    officialUrl: null,
    description: 'ユーザーがホールごとのParを編集して保存したコース。',
    presets: [
      CoursePreset(
        id: '$id-${roundTypeToWire(roundType).toLowerCase()}',
        roundType: roundType,
        label: category == CourseCategory.short ? 'User Short Course' : 'User Course Layout',
        holePars: holePars,
        source: CourseSource.user,
        confidence: CourseConfidence.userVerified,
        sourceUrl: null,
        verifiedAt: now,
      ),
    ],
    updatedAt: now,
  );
}

GolfCourse upsertUserPreset(
  GolfCourse course, {
  required RoundType roundType,
  required String label,
  required List<int> holePars,
}) {
  final now = DateTime.now().toIso8601String();
  final presetId = '${course.id}-${roundTypeToWire(roundType).toLowerCase()}-user';

  final nextPreset = CoursePreset(
    id: presetId,
    roundType: roundType,
    label: label,
    holePars: holePars,
    source: CourseSource.user,
    confidence: CourseConfidence.userVerified,
    sourceUrl: null,
    verifiedAt: now,
  );

  final filtered = course.presets
      .where((preset) => preset.id != presetId && preset.roundType != roundType)
      .toList();

  return course.copyWith(
    source: course.source == CourseSource.user ? CourseSource.user : course.source,
    presets: [nextPreset, ...filtered],
    updatedAt: now,
  );
}
