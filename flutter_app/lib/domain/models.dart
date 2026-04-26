enum RoundType { full18, half9, short }

enum RoundStatus { inProgress, completed, abandoned }

enum CourseCategory { regular, short }

enum CourseSource { rakutenGora, official, user, manual }

enum CourseConfidence { official, userVerified, unverified }

enum SwipeSensitivity { low, medium, high }

enum FontScale { normal, large, xlarge }

enum DistanceUnit { yard, meter }

enum TeeShotDirection { left, right, short, over }

String roundTypeToWire(RoundType value) {
  switch (value) {
    case RoundType.full18:
      return 'FULL_18';
    case RoundType.half9:
      return 'HALF_9';
    case RoundType.short:
      return 'SHORT';
  }
}

RoundType roundTypeFromWire(String value) {
  switch (value) {
    case 'HALF_9':
      return RoundType.half9;
    case 'SHORT':
      return RoundType.short;
    default:
      return RoundType.full18;
  }
}

String roundStatusToWire(RoundStatus value) {
  switch (value) {
    case RoundStatus.inProgress:
      return 'IN_PROGRESS';
    case RoundStatus.completed:
      return 'COMPLETED';
    case RoundStatus.abandoned:
      return 'ABANDONED';
  }
}

RoundStatus roundStatusFromWire(String value) {
  switch (value) {
    case 'COMPLETED':
      return RoundStatus.completed;
    case 'ABANDONED':
      return RoundStatus.abandoned;
    default:
      return RoundStatus.inProgress;
  }
}

String courseCategoryToWire(CourseCategory value) {
  switch (value) {
    case CourseCategory.regular:
      return 'REGULAR';
    case CourseCategory.short:
      return 'SHORT';
  }
}

CourseCategory courseCategoryFromWire(String value) {
  switch (value) {
    case 'SHORT':
      return CourseCategory.short;
    default:
      return CourseCategory.regular;
  }
}

String courseSourceToWire(CourseSource value) {
  switch (value) {
    case CourseSource.rakutenGora:
      return 'rakuten_gora';
    case CourseSource.official:
      return 'official';
    case CourseSource.user:
      return 'user';
    case CourseSource.manual:
      return 'manual';
  }
}

CourseSource courseSourceFromWire(String value) {
  switch (value) {
    case 'rakuten_gora':
      return CourseSource.rakutenGora;
    case 'official':
      return CourseSource.official;
    case 'user':
      return CourseSource.user;
    default:
      return CourseSource.manual;
  }
}

String courseConfidenceToWire(CourseConfidence value) {
  switch (value) {
    case CourseConfidence.official:
      return 'official';
    case CourseConfidence.userVerified:
      return 'user_verified';
    case CourseConfidence.unverified:
      return 'unverified';
  }
}

CourseConfidence courseConfidenceFromWire(String value) {
  switch (value) {
    case 'official':
      return CourseConfidence.official;
    case 'user_verified':
      return CourseConfidence.userVerified;
    default:
      return CourseConfidence.unverified;
  }
}

String swipeSensitivityToWire(SwipeSensitivity value) {
  switch (value) {
    case SwipeSensitivity.low:
      return 'low';
    case SwipeSensitivity.medium:
      return 'medium';
    case SwipeSensitivity.high:
      return 'high';
  }
}

SwipeSensitivity swipeSensitivityFromWire(String value) {
  switch (value) {
    case 'low':
      return SwipeSensitivity.low;
    case 'high':
      return SwipeSensitivity.high;
    default:
      return SwipeSensitivity.medium;
  }
}

String fontScaleToWire(FontScale value) {
  switch (value) {
    case FontScale.normal:
      return 'normal';
    case FontScale.large:
      return 'large';
    case FontScale.xlarge:
      return 'xlarge';
  }
}

FontScale fontScaleFromWire(String value) {
  switch (value) {
    case 'large':
      return FontScale.large;
    case 'xlarge':
      return FontScale.xlarge;
    default:
      return FontScale.normal;
  }
}

String distanceUnitToWire(DistanceUnit value) {
  switch (value) {
    case DistanceUnit.yard:
      return 'yard';
    case DistanceUnit.meter:
      return 'meter';
  }
}

DistanceUnit distanceUnitFromWire(String value) {
  switch (value) {
    case 'meter':
      return DistanceUnit.meter;
    default:
      return DistanceUnit.yard;
  }
}

String teeShotDirectionToWire(TeeShotDirection value) {
  switch (value) {
    case TeeShotDirection.left:
      return 'LEFT';
    case TeeShotDirection.right:
      return 'RIGHT';
    case TeeShotDirection.short:
      return 'SHORT';
    case TeeShotDirection.over:
      return 'OVER';
  }
}

TeeShotDirection? teeShotDirectionFromWire(String? value) {
  switch (value) {
    case 'LEFT':
      return TeeShotDirection.left;
    case 'RIGHT':
      return TeeShotDirection.right;
    case 'SHORT':
      return TeeShotDirection.short;
    case 'OVER':
      return TeeShotDirection.over;
    default:
      return null;
  }
}

class RoundConfig {
  const RoundConfig({
    required this.fw,
    required this.gir,
    required this.ob,
    required this.bunker,
    required this.puttUnknown,
  });

  final bool fw;
  final bool gir;
  final bool ob;
  final bool bunker;
  final bool puttUnknown;

  RoundConfig copyWith({
    bool? fw,
    bool? gir,
    bool? ob,
    bool? bunker,
    bool? puttUnknown,
  }) {
    return RoundConfig(
      fw: fw ?? this.fw,
      gir: gir ?? this.gir,
      ob: ob ?? this.ob,
      bunker: bunker ?? this.bunker,
      puttUnknown: puttUnknown ?? this.puttUnknown,
    );
  }

  Map<String, dynamic> toJson() => {
        'fw': fw,
        'gir': gir,
        'ob': ob,
        'bunker': bunker,
        'puttUnknown': puttUnknown,
      };

  static RoundConfig fromJson(Map<String, dynamic> json) {
    return RoundConfig(
      fw: json['fw'] as bool? ?? true,
      gir: json['gir'] as bool? ?? true,
      ob: json['ob'] as bool? ?? true,
      bunker: json['bunker'] as bool? ?? false,
      puttUnknown: json['puttUnknown'] as bool? ?? true,
    );
  }
}

class UiPreferences {
  const UiPreferences({
    required this.highContrast,
    required this.haptics,
    required this.celebration,
    required this.swipeSensitivity,
    required this.fontScale,
    required this.distanceUnit,
  });

  final bool highContrast;
  final bool haptics;
  final bool celebration;
  final SwipeSensitivity swipeSensitivity;
  final FontScale fontScale;
  final DistanceUnit distanceUnit;

  UiPreferences copyWith({
    bool? highContrast,
    bool? haptics,
    bool? celebration,
    SwipeSensitivity? swipeSensitivity,
    FontScale? fontScale,
    DistanceUnit? distanceUnit,
  }) {
    return UiPreferences(
      highContrast: highContrast ?? this.highContrast,
      haptics: haptics ?? this.haptics,
      celebration: celebration ?? this.celebration,
      swipeSensitivity: swipeSensitivity ?? this.swipeSensitivity,
      fontScale: fontScale ?? this.fontScale,
      distanceUnit: distanceUnit ?? this.distanceUnit,
    );
  }

  Map<String, dynamic> toJson() => {
        'highContrast': highContrast,
        'haptics': haptics,
        'celebration': celebration,
        'swipeSensitivity': swipeSensitivityToWire(swipeSensitivity),
        'fontScale': fontScaleToWire(fontScale),
        'distanceUnit': distanceUnitToWire(distanceUnit),
      };

  static UiPreferences fromJson(Map<String, dynamic> json) {
    return UiPreferences(
      highContrast: json['highContrast'] as bool? ?? false,
      haptics: json['haptics'] as bool? ?? true,
      celebration: json['celebration'] as bool? ?? true,
      swipeSensitivity: swipeSensitivityFromWire(
          json['swipeSensitivity'] as String? ?? 'medium'),
      fontScale: fontScaleFromWire(json['fontScale'] as String? ?? 'normal'),
      distanceUnit:
          distanceUnitFromWire(json['distanceUnit'] as String? ?? 'yard'),
    );
  }
}

class HoleScore {
  const HoleScore({
    required this.roundId,
    required this.holeNo,
    required this.par,
    required this.strokes,
    required this.putts,
    required this.teeShotDirection,
    required this.puttsUnknown,
    required this.penaltyTotal,
    required this.obCount,
    required this.otherPenaltyCount,
    required this.fwKeep,
    required this.gir,
    required this.bunkerIn,
    required int? bunkerCount,
    required this.updatedAt,
  }) : _bunkerCount = bunkerCount;

  final String roundId;
  final int holeNo;
  final int par;
  final int? strokes;
  final int? putts;
  final TeeShotDirection? teeShotDirection;
  final bool puttsUnknown;
  final int penaltyTotal;
  final int obCount;
  final int otherPenaltyCount;
  final bool? fwKeep;
  final bool? gir;
  final bool? bunkerIn;
  final int? _bunkerCount;
  final String updatedAt;

  int get bunkerCount => _bunkerCount ?? 0;

  HoleScore copyWith({
    int? strokes,
    int? putts,
    TeeShotDirection? teeShotDirection,
    bool? clearDirection,
    bool? puttsUnknown,
    int? penaltyTotal,
    int? obCount,
    int? otherPenaltyCount,
    bool? fwKeep,
    bool? clearFwKeep,
    bool? gir,
    bool? clearGir,
    bool? bunkerIn,
    bool? clearBunkerIn,
    int? bunkerCount,
    String? updatedAt,
  }) {
    final nextBunkerCount = bunkerCount ?? this.bunkerCount;

    return HoleScore(
      roundId: roundId,
      holeNo: holeNo,
      par: par,
      strokes: strokes ?? this.strokes,
      putts: putts ?? this.putts,
      teeShotDirection: clearDirection == true
          ? null
          : teeShotDirection ?? this.teeShotDirection,
      puttsUnknown: puttsUnknown ?? this.puttsUnknown,
      penaltyTotal: penaltyTotal ?? this.penaltyTotal,
      obCount: obCount ?? this.obCount,
      otherPenaltyCount: otherPenaltyCount ?? this.otherPenaltyCount,
      fwKeep: clearFwKeep == true ? null : fwKeep ?? this.fwKeep,
      gir: clearGir == true ? null : gir ?? this.gir,
      bunkerIn: clearBunkerIn == true
          ? null
          : bunkerIn ??
              (bunkerCount != null ? nextBunkerCount > 0 : this.bunkerIn),
      bunkerCount: nextBunkerCount,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'roundId': roundId,
        'holeNo': holeNo,
        'par': par,
        'strokes': strokes,
        'putts': putts,
        'teeShotDirection': teeShotDirection == null
            ? null
            : teeShotDirectionToWire(teeShotDirection!),
        'puttsUnknown': puttsUnknown,
        'penaltyTotal': penaltyTotal,
        'obCount': obCount,
        'otherPenaltyCount': otherPenaltyCount,
        'fwKeep': fwKeep,
        'gir': gir,
        'bunkerIn': bunkerIn,
        'bunkerCount': bunkerCount,
        'updatedAt': updatedAt,
      };

  static HoleScore fromJson(Map<String, dynamic> json) {
    return HoleScore(
      roundId: json['roundId'] as String,
      holeNo: json['holeNo'] as int,
      par: json['par'] as int,
      strokes: json['strokes'] as int?,
      putts: json['putts'] as int?,
      teeShotDirection:
          teeShotDirectionFromWire(json['teeShotDirection'] as String?),
      puttsUnknown: json['puttsUnknown'] as bool? ?? false,
      penaltyTotal: json['penaltyTotal'] as int? ?? 0,
      obCount: json['obCount'] as int? ?? 0,
      otherPenaltyCount: json['otherPenaltyCount'] as int? ?? 0,
      fwKeep: json['fwKeep'] as bool?,
      gir: json['gir'] as bool?,
      bunkerIn: json['bunkerIn'] as bool?,
      bunkerCount: json['bunkerCount'] as int? ??
          ((json['bunkerIn'] as bool? ?? false) ? 1 : 0),
      updatedAt: json['updatedAt'] as String,
    );
  }
}

class Round {
  const Round({
    required this.id,
    required this.playedAt,
    required this.startedAt,
    required this.finishedAt,
    required this.status,
    required this.courseId,
    required this.courseName,
    required this.roundType,
    required this.holesCount,
    required this.holePars,
    required this.currentHoleNo,
    required this.configSnapshot,
    required this.totalScore,
    required this.lastInputAt,
  });

  final String id;
  final String playedAt;
  final String startedAt;
  final String? finishedAt;
  final RoundStatus status;
  final String? courseId;
  final String courseName;
  final RoundType roundType;
  final int holesCount;
  final List<int> holePars;
  final int currentHoleNo;
  final RoundConfig configSnapshot;
  final int? totalScore;
  final String lastInputAt;

  Round copyWith({
    String? finishedAt,
    RoundStatus? status,
    int? currentHoleNo,
    int? totalScore,
    String? lastInputAt,
  }) {
    return Round(
      id: id,
      playedAt: playedAt,
      startedAt: startedAt,
      finishedAt: finishedAt ?? this.finishedAt,
      status: status ?? this.status,
      courseId: courseId,
      courseName: courseName,
      roundType: roundType,
      holesCount: holesCount,
      holePars: holePars,
      currentHoleNo: currentHoleNo ?? this.currentHoleNo,
      configSnapshot: configSnapshot,
      totalScore: totalScore ?? this.totalScore,
      lastInputAt: lastInputAt ?? this.lastInputAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'playedAt': playedAt,
        'startedAt': startedAt,
        'finishedAt': finishedAt,
        'status': roundStatusToWire(status),
        'courseId': courseId,
        'courseName': courseName,
        'roundType': roundTypeToWire(roundType),
        'holesCount': holesCount,
        'holePars': holePars,
        'currentHoleNo': currentHoleNo,
        'configSnapshot': configSnapshot.toJson(),
        'totalScore': totalScore,
        'lastInputAt': lastInputAt,
      };

  static Round fromJson(Map<String, dynamic> json) {
    return Round(
      id: json['id'] as String,
      playedAt: json['playedAt'] as String,
      startedAt: json['startedAt'] as String,
      finishedAt: json['finishedAt'] as String?,
      status: roundStatusFromWire(json['status'] as String? ?? 'IN_PROGRESS'),
      courseId: json['courseId'] as String?,
      courseName: json['courseName'] as String,
      roundType: roundTypeFromWire(json['roundType'] as String? ?? 'FULL_18'),
      holesCount: json['holesCount'] as int,
      holePars: (json['holePars'] as List<dynamic>).cast<int>(),
      currentHoleNo: json['currentHoleNo'] as int,
      configSnapshot:
          RoundConfig.fromJson(json['configSnapshot'] as Map<String, dynamic>),
      totalScore: json['totalScore'] as int?,
      lastInputAt: json['lastInputAt'] as String,
    );
  }
}

class RoundRecord {
  const RoundRecord({required this.round, required this.holes});

  final Round round;
  final List<HoleScore> holes;

  Map<String, dynamic> toJson() => {
        'round': round.toJson(),
        'holes': holes.map((hole) => hole.toJson()).toList(),
      };

  static RoundRecord fromJson(Map<String, dynamic> json) {
    return RoundRecord(
      round: Round.fromJson(json['round'] as Map<String, dynamic>),
      holes: (json['holes'] as List<dynamic>)
          .map((entry) => HoleScore.fromJson(entry as Map<String, dynamic>))
          .toList(),
    );
  }
}

class RoundSummary {
  const RoundSummary({
    required this.id,
    required this.playedAt,
    required this.courseId,
    required this.courseName,
    required this.roundType,
    required this.status,
    required this.totalScore,
    required this.lastInputAt,
  });

  final String id;
  final String playedAt;
  final String? courseId;
  final String courseName;
  final RoundType roundType;
  final RoundStatus status;
  final int? totalScore;
  final String lastInputAt;
}

class CoursePreset {
  const CoursePreset({
    required this.id,
    required this.roundType,
    required this.label,
    required this.holePars,
    required this.source,
    required this.confidence,
    required this.sourceUrl,
    required this.verifiedAt,
  });

  final String id;
  final RoundType roundType;
  final String label;
  final List<int> holePars;
  final CourseSource source;
  final CourseConfidence confidence;
  final String? sourceUrl;
  final String? verifiedAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'roundType': roundTypeToWire(roundType),
        'label': label,
        'holePars': holePars,
        'source': courseSourceToWire(source),
        'confidence': courseConfidenceToWire(confidence),
        'sourceUrl': sourceUrl,
        'verifiedAt': verifiedAt,
      };

  static CoursePreset fromJson(Map<String, dynamic> json) {
    return CoursePreset(
      id: json['id'] as String,
      roundType: roundTypeFromWire(json['roundType'] as String? ?? 'FULL_18'),
      label: json['label'] as String,
      holePars: (json['holePars'] as List<dynamic>).cast<int>(),
      source: courseSourceFromWire(json['source'] as String? ?? 'manual'),
      confidence: courseConfidenceFromWire(
          json['confidence'] as String? ?? 'unverified'),
      sourceUrl: json['sourceUrl'] as String?,
      verifiedAt: json['verifiedAt'] as String?,
    );
  }
}

class ParBreakdown {
  const ParBreakdown(
      {required this.par3, required this.par4, required this.par5});

  final int par3;
  final int par4;
  final int par5;
}

class GolfCourse {
  const GolfCourse({
    required this.id,
    required this.name,
    required this.prefecture,
    required this.area,
    required this.category,
    required this.source,
    required this.externalRakutenGoraId,
    required this.officialUrl,
    required this.description,
    required this.presets,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String prefecture;
  final String area;
  final CourseCategory category;
  final CourseSource source;
  final String? externalRakutenGoraId;
  final String? officialUrl;
  final String description;
  final List<CoursePreset> presets;
  final String updatedAt;

  GolfCourse copyWith({
    CourseSource? source,
    List<CoursePreset>? presets,
    String? updatedAt,
  }) {
    return GolfCourse(
      id: id,
      name: name,
      prefecture: prefecture,
      area: area,
      category: category,
      source: source ?? this.source,
      externalRakutenGoraId: externalRakutenGoraId,
      officialUrl: officialUrl,
      description: description,
      presets: presets ?? this.presets,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'prefecture': prefecture,
        'area': area,
        'category': courseCategoryToWire(category),
        'source': courseSourceToWire(source),
        'externalIds': {
          if (externalRakutenGoraId != null)
            'rakutenGora': externalRakutenGoraId,
        },
        'officialUrl': officialUrl,
        'description': description,
        'presets': presets.map((preset) => preset.toJson()).toList(),
        'updatedAt': updatedAt,
      };

  static GolfCourse fromJson(Map<String, dynamic> json) {
    final externalIds = json['externalIds'] as Map<String, dynamic>?;
    return GolfCourse(
      id: json['id'] as String,
      name: json['name'] as String,
      prefecture: json['prefecture'] as String,
      area: json['area'] as String,
      category:
          courseCategoryFromWire(json['category'] as String? ?? 'REGULAR'),
      source: courseSourceFromWire(json['source'] as String? ?? 'manual'),
      externalRakutenGoraId:
          externalIds == null ? null : externalIds['rakutenGora'] as String?,
      officialUrl: json['officialUrl'] as String?,
      description: json['description'] as String? ?? '',
      presets: (json['presets'] as List<dynamic>)
          .map((entry) => CoursePreset.fromJson(entry as Map<String, dynamic>))
          .toList(),
      updatedAt: json['updatedAt'] as String,
    );
  }
}
