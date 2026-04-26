import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../domain/analytics.dart';
import '../domain/constants.dart';
import '../domain/courses.dart';
import '../domain/models.dart';
import '../domain/progress.dart';
import '../domain/rounds.dart';

class RoundStore extends ChangeNotifier {
  static const _roundsKey = 'round_records_v1';
  static const _coursesKey = 'courses_v1';
  static const _settingsKey = 'settings_v1';

  RoundRecord? currentRound;
  List<RoundRecord> rounds = [];
  List<GolfCourse> courses = [];
  RoundConfig roundDefaults = mergeConfig();
  UiPreferences uiPreferences = defaultUiPreferences;
  bool hydrated = false;

  Future<void> boot() async {
    final prefs = await SharedPreferences.getInstance();

    final roundsRaw = prefs.getString(_roundsKey);
    if (roundsRaw != null && roundsRaw.isNotEmpty) {
      final decoded = (jsonDecode(roundsRaw) as List<dynamic>)
          .map((entry) => RoundRecord.fromJson(entry as Map<String, dynamic>))
          .toList();
      rounds = decoded;
    } else {
      rounds = [];
    }

    final coursesRaw = prefs.getString(_coursesKey);
    if (coursesRaw != null && coursesRaw.isNotEmpty) {
      courses = (jsonDecode(coursesRaw) as List<dynamic>)
          .map((entry) => GolfCourse.fromJson(entry as Map<String, dynamic>))
          .toList();
    } else {
      courses = List<GolfCourse>.from(courseCatalog);
    }

    final settingsRaw = prefs.getString(_settingsKey);
    if (settingsRaw != null && settingsRaw.isNotEmpty) {
      final settings = jsonDecode(settingsRaw) as Map<String, dynamic>;
      roundDefaults = RoundConfig.fromJson(
        settings['roundDefaults'] as Map<String, dynamic>? ??
            defaultRoundConfig.toJson(),
      );
      uiPreferences = UiPreferences.fromJson(
        settings['uiPreferences'] as Map<String, dynamic>? ??
            defaultUiPreferences.toJson(),
      );
    } else {
      roundDefaults = mergeConfig();
      uiPreferences = defaultUiPreferences;
    }

    currentRound = _findInProgressRound(rounds);
    hydrated = true;
    notifyListeners();
  }

  Future<void> startRound({
    required String playedAt,
    String? courseId,
    required String courseName,
    required RoundType roundType,
    List<int>? holePars,
  }) async {
    final record = createRoundRecord(
      CreateRoundInput(
        playedAt: playedAt,
        courseId: courseId,
        courseName: courseName,
        roundType: roundType,
        configSnapshot: roundDefaults,
        holePars: holePars,
      ),
    );

    currentRound = record;
    rounds = [
      record,
      ...rounds.where((entry) => entry.round.id != record.round.id)
    ];

    await _persist();
    notifyListeners();
  }

  Future<void> updateHole(
    int holeNo, {
    int? strokes,
    int? putts,
    TeeShotDirection? teeShotDirection,
    bool clearDirection = false,
    bool? puttsUnknown,
    int? obCount,
    int? otherPenaltyCount,
    bool? fwKeep,
    bool clearFwKeep = false,
    bool? gir,
    bool clearGir = false,
    bool? bunkerIn,
    bool clearBunkerIn = false,
    int? bunkerCount,
  }) async {
    final current = currentRound;
    if (current == null) return;

    final now = DateTime.now().toIso8601String();

    final holes = current.holes.map((hole) {
      if (hole.holeNo != holeNo) return hole;

      final nextObCount = obCount ?? hole.obCount;
      final nextOtherCount = otherPenaltyCount ?? hole.otherPenaltyCount;

      return hole.copyWith(
        strokes: strokes,
        putts: putts,
        teeShotDirection: teeShotDirection,
        clearDirection: clearDirection,
        puttsUnknown: puttsUnknown,
        obCount: nextObCount,
        otherPenaltyCount: nextOtherCount,
        penaltyTotal: nextObCount + nextOtherCount,
        fwKeep: fwKeep,
        clearFwKeep: clearFwKeep,
        gir: gir,
        clearGir: clearGir,
        bunkerIn: bunkerIn,
        clearBunkerIn: clearBunkerIn,
        bunkerCount: bunkerCount,
        updatedAt: now,
      );
    }).toList();

    final record = _touchRound(RoundRecord(round: current.round, holes: holes));
    currentRound = record;
    rounds = [
      record,
      ...rounds.where((entry) => entry.round.id != record.round.id)
    ];

    await _persist();
    notifyListeners();
  }

  Future<void> goToHole(int holeNo) async {
    final current = currentRound;
    if (current == null) return;

    final nextHoleNo = holeNo.clamp(1, current.round.holesCount);
    final nextRound = current.round.copyWith(
      currentHoleNo: nextHoleNo,
      lastInputAt: DateTime.now().toIso8601String(),
    );

    final record = RoundRecord(round: nextRound, holes: current.holes);
    currentRound = record;
    rounds = [
      record,
      ...rounds.where((entry) => entry.round.id != record.round.id)
    ];

    await _persist();
    notifyListeners();
  }

  Future<bool> completeRound() async {
    final current = currentRound;
    if (current == null) return false;
    if (!isRoundReadyToComplete(current)) return false;

    final completedAt = DateTime.now().toIso8601String();

    final nextRound = current.round.copyWith(
      status: RoundStatus.completed,
      finishedAt: completedAt,
      totalScore: calcRoundTotal(current.holes),
      lastInputAt: completedAt,
    );

    final completedRecord = RoundRecord(round: nextRound, holes: current.holes);

    currentRound = null;
    rounds = [
      completedRecord,
      ...rounds.where((entry) => entry.round.id != completedRecord.round.id),
    ];

    await _persist();
    notifyListeners();
    return true;
  }

  Future<void> saveCourseMaster(GolfCourse course) async {
    final nextCourses = [
      course,
      ...courses.where((entry) => entry.id != course.id),
    ]..sort((a, b) => a.name.compareTo(b.name));

    courses = nextCourses;
    await _persist();
    notifyListeners();
  }

  Future<void> saveDefaults(RoundConfig config) async {
    roundDefaults = mergeConfig(config);
    await _persist();
    notifyListeners();
  }

  Future<void> saveUiPreferences(UiPreferences preferences) async {
    uiPreferences = preferences;
    await _persist();
    notifyListeners();
  }

  RoundRecord? _findInProgressRound(List<RoundRecord> records) {
    for (final record in records) {
      if (record.round.status == RoundStatus.inProgress) {
        return record;
      }
    }
    return null;
  }

  RoundRecord _touchRound(RoundRecord record) {
    final total = calcRoundTotal(record.holes);
    final touchedRound = record.round.copyWith(
      totalScore: total,
      lastInputAt: DateTime.now().toIso8601String(),
    );
    return RoundRecord(round: touchedRound, holes: record.holes);
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(
      _roundsKey,
      jsonEncode(rounds.map((entry) => entry.toJson()).toList()),
    );

    await prefs.setString(
      _coursesKey,
      jsonEncode(courses.map((entry) => entry.toJson()).toList()),
    );

    await prefs.setString(
      _settingsKey,
      jsonEncode({
        'roundDefaults': roundDefaults.toJson(),
        'uiPreferences': uiPreferences.toJson(),
      }),
    );
  }
}
