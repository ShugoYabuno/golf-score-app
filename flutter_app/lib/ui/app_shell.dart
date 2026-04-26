import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../domain/analytics.dart';
import '../domain/constants.dart';
import '../domain/courses.dart';
import '../domain/models.dart';
import '../state/round_store.dart';

enum _Tab { home, input, history, analytics, settings, complete }

enum _InputMenuAction { home, settings }

class RoundCompleteSummary {
  const RoundCompleteSummary({
    required this.roundId,
    required this.courseName,
    required this.playedAt,
    required this.roundType,
    required this.totalScore,
    required this.totalPar,
    required this.diff,
    required this.isBest,
    required this.highlights,
    required this.encouragement,
    required this.nextGoalText,
  });

  final String roundId;
  final String courseName;
  final String playedAt;
  final RoundType roundType;
  final int totalScore;
  final int totalPar;
  final int diff;
  final bool isBest;
  final List<String> highlights;
  final String encouragement;
  final String nextGoalText;
}

class AppShell extends StatefulWidget {
  const AppShell({super.key, required this.store});

  final RoundStore store;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  _Tab _tab = _Tab.home;
  RoundCompleteSummary? _completeSummary;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.store,
      builder: (context, _) {
        final currentRound = widget.store.currentRound;
        final effectiveTab = _normalizeTab(_tab, currentRound != null);
        final isInputMode = effectiveTab == _Tab.input && currentRound != null;
        final currentHole = currentRound == null
            ? null
            : currentRound.holes[currentRound.round.currentHoleNo - 1];

        return Scaffold(
          appBar: AppBar(
            leading: isInputMode
                ? PopupMenuButton<_InputMenuAction>(
                    tooltip: 'メニュー',
                    icon: const Icon(Icons.menu),
                    onSelected: (action) {
                      setState(() {
                        _tab = switch (action) {
                          _InputMenuAction.home => _Tab.home,
                          _InputMenuAction.settings => _Tab.settings,
                        };
                      });
                    },
                    itemBuilder: (context) => const [
                      PopupMenuItem(
                        value: _InputMenuAction.home,
                        child: ListTile(
                          leading: Icon(Icons.home_outlined),
                          title: Text('Home'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                      PopupMenuItem(
                        value: _InputMenuAction.settings,
                        child: ListTile(
                          leading: Icon(Icons.tune),
                          title: Text('次回ラウンド設定'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ],
                  )
                : null,
            title: Text(
              isInputMode
                  ? 'Hole ${currentRound.round.currentHoleNo}'
                  : 'Golf Score App',
            ),
            centerTitle: false,
            actions: [
              if (currentRound != null)
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Row(
                    children: [
                      if (isInputMode && currentHole != null) ...[
                        Chip(
                          label: Text('Par ${currentHole.par}'),
                          visualDensity: VisualDensity.compact,
                        ),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        '${currentRound.round.currentHoleNo}/${currentRound.round.holesCount}',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          body: _buildBody(effectiveTab),
          bottomNavigationBar:
              isInputMode ? null : _buildNavigationBar(effectiveTab),
        );
      },
    );
  }

  Widget _buildNavigationBar(_Tab effectiveTab) {
    return NavigationBar(
      selectedIndex: _tabToIndex(effectiveTab),
      onDestinationSelected: (index) {
        final next = _indexToTab(index);
        if (next == _Tab.input && widget.store.currentRound == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('ラウンドを開始すると入力タブが使えます')),
          );
          return;
        }
        setState(() {
          _tab = next;
        });
      },
      destinations: const [
        NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
        NavigationDestination(icon: Icon(Icons.golf_course), label: '入力'),
        NavigationDestination(icon: Icon(Icons.history), label: '履歴'),
        NavigationDestination(icon: Icon(Icons.insights_outlined), label: '分析'),
        NavigationDestination(icon: Icon(Icons.settings_outlined), label: '設定'),
      ],
    );
  }

  Widget _buildBody(_Tab tab) {
    if (!widget.store.hydrated) {
      return const Center(child: CircularProgressIndicator());
    }

    final currentRound = widget.store.currentRound;

    switch (tab) {
      case _Tab.home:
        return HomePanel(
          store: widget.store,
          onResume: () => setState(() => _tab = _Tab.input),
        );
      case _Tab.input:
        if (currentRound == null) {
          return const _EmptyState(
            title: 'ラウンドがありません',
            message: 'Homeから開始すると入力画面が使えます。',
          );
        }
        return RoundInputPanel(
          store: widget.store,
          record: currentRound,
          onCompleted: (roundId) {
            final completed = widget.store.rounds
                .where((record) => record.round.id == roundId)
                .firstOrNull;
            if (completed == null) return;
            setState(() {
              _completeSummary =
                  _createCompleteSummary(completed, widget.store.rounds);
              _tab = _Tab.complete;
            });
          },
        );
      case _Tab.history:
        return HistoryPanel(
            records: widget.store.rounds, courses: widget.store.courses);
      case _Tab.analytics:
        return AnalyticsPanel(records: widget.store.rounds);
      case _Tab.settings:
        return SettingsPanel(store: widget.store);
      case _Tab.complete:
        if (_completeSummary == null) {
          return const _EmptyState(
            title: '完了画面の情報がありません',
            message: '次のラウンド完了時にここへ表示されます。',
          );
        }
        return RoundCompletePanel(
          summary: _completeSummary!,
          onContinue: () => setState(() => _tab = _Tab.history),
        );
    }
  }

  _Tab _normalizeTab(_Tab tab, bool hasCurrentRound) {
    if (tab == _Tab.input && !hasCurrentRound) return _Tab.home;
    if (tab == _Tab.complete && _completeSummary == null) return _Tab.history;
    return tab;
  }

  int _tabToIndex(_Tab tab) {
    switch (tab) {
      case _Tab.home:
        return 0;
      case _Tab.input:
        return 1;
      case _Tab.history:
        return 2;
      case _Tab.analytics:
        return 3;
      case _Tab.settings:
      case _Tab.complete:
        return 4;
    }
  }

  _Tab _indexToTab(int index) {
    switch (index) {
      case 0:
        return _Tab.home;
      case 1:
        return _Tab.input;
      case 2:
        return _Tab.history;
      case 3:
        return _Tab.analytics;
      default:
        return _Tab.settings;
    }
  }

  RoundCompleteSummary _createCompleteSummary(
      RoundRecord completed, List<RoundRecord> allRecords) {
    final round = completed.round;
    final total = round.totalScore ?? 0;
    final totalPar =
        completed.holes.fold<int>(0, (sum, hole) => sum + hole.par);
    final diff = total - totalPar;

    final sameTypeCompleted = allRecords
        .where((record) =>
            record.round.roundType == round.roundType &&
            record.round.status == RoundStatus.completed)
        .toList();

    final scores = sameTypeCompleted
        .map((record) => record.round.totalScore)
        .whereType<int>()
        .toList();

    final best =
        scores.isNotEmpty ? scores.reduce((a, b) => a < b ? a : b) : total;
    final isBest = total <= best;

    final birdieOrBetter = completed.holes
        .where((hole) => hole.strokes != null && hole.strokes! <= hole.par - 1)
        .length;

    final fwSample = completed.holes
        .where((hole) => hole.par >= 4 && hole.fwKeep != null)
        .length;
    final fwKeep = completed.holes
        .where((hole) => hole.par >= 4 && hole.fwKeep == true)
        .length;
    final fwRate = fwSample == 0 ? null : (fwKeep * 100 / fwSample).round();

    final highlights = <String>[
      '合計スコア $total（${_relativeDiffLabel(diff)}）',
      if (birdieOrBetter > 0) 'バーディ以上 $birdieOrBetter 回',
      if (birdieOrBetter == 0) '最後まで記録を完了、ナイスラン',
      if (fwRate != null) 'FWキープ率 $fwRate%',
      if (fwRate == null) '次回はFWキープも記録すると分析が深まります',
    ];

    final encouragement =
        isBest ? 'ベスト更新です。安定した記録が結果につながりました。' : '今日の記録が次ラウンドの改善材料になります。';

    final nextGoalText = diff > 0
        ? '次回は +$diff から 1 打だけ縮めることを目標にしましょう。'
        : '次回はパット数を 1 つだけ改善してみましょう。';

    return RoundCompleteSummary(
      roundId: round.id,
      courseName: round.courseName,
      playedAt: round.playedAt,
      roundType: round.roundType,
      totalScore: total,
      totalPar: totalPar,
      diff: diff,
      isBest: isBest,
      highlights: highlights.take(3).toList(),
      encouragement: encouragement,
      nextGoalText: nextGoalText,
    );
  }
}

class HomePanel extends StatefulWidget {
  const HomePanel({super.key, required this.store, required this.onResume});

  final RoundStore store;
  final VoidCallback onResume;

  @override
  State<HomePanel> createState() => _HomePanelState();
}

class _HomePanelState extends State<HomePanel> {
  DateTime _playedAt = DateTime.now();
  RoundType _roundType = RoundType.full18;
  String? _selectedCourseId;
  bool _saving = false;
  late final TextEditingController _courseNameController;

  @override
  void initState() {
    super.initState();
    _courseNameController = TextEditingController();
  }

  @override
  void dispose() {
    _courseNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasCurrent = widget.store.currentRound != null;
    final courses = widget.store.courses;

    final selectedCourse = _selectedCourseId == null
        ? null
        : courses.where((course) => course.id == _selectedCourseId).firstOrNull;

    final selectedPreset = selectedCourse?.presets
        .where((preset) => preset.roundType == _roundType)
        .firstOrNull;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (hasCurrent) ...[
          Card(
            color: Theme.of(context).colorScheme.primaryContainer,
            child: ListTile(
              title: const Text('進行中のラウンドがあります'),
              subtitle: Text(widget.store.currentRound!.round.courseName),
              trailing: FilledButton(
                onPressed: widget.onResume,
                child: const Text('再開'),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
        const Text('次のラウンドを開始',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        const Text('開始までの入力を最小限にし、すぐ記録に入れる構成です。'),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextButton.icon(
                  onPressed: () async {
                    final next = await showDatePicker(
                      context: context,
                      initialDate: _playedAt,
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2100),
                    );
                    if (next != null) {
                      setState(() {
                        _playedAt = next;
                      });
                    }
                  },
                  icon: const Icon(Icons.event),
                  label:
                      Text('プレー日: ${_formatDate(_playedAt.toIso8601String())}'),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<RoundType>(
                  initialValue: _roundType,
                  decoration: const InputDecoration(labelText: 'ラウンド種別'),
                  items: RoundType.values
                      .map(
                        (type) => DropdownMenuItem(
                          value: type,
                          child: Text(
                              roundTypeLabels[type] ?? roundTypeToWire(type)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() {
                      _roundType = value;
                    });
                  },
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String?>(
                  initialValue: _selectedCourseId,
                  decoration: const InputDecoration(labelText: 'コース（任意）'),
                  items: [
                    const DropdownMenuItem<String?>(
                        value: null, child: Text('フリー入力')),
                    ...courses.map(
                      (course) => DropdownMenuItem<String?>(
                        value: course.id,
                        child: Text(course.name),
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedCourseId = value;
                    });
                  },
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _courseNameController,
                  decoration: const InputDecoration(
                    labelText: '表示名（任意）',
                    hintText: '例: 習志野CC / 週末ラウンド',
                  ),
                ),
                if (selectedPreset != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      '選択中プリセット: ${selectedPreset.label} (${selectedPreset.holePars.length}ホール)',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _saving
                        ? null
                        : () async {
                            setState(() => _saving = true);

                            final inferredName = selectedCourse?.name ?? '';
                            final typedName = _courseNameController.text.trim();
                            final courseName = typedName.isNotEmpty
                                ? typedName
                                : (inferredName.isNotEmpty
                                    ? inferredName
                                    : 'フリーラウンド');

                            final holePars = selectedPreset?.holePars;

                            await widget.store.startRound(
                              playedAt: _playedAt.toIso8601String(),
                              courseId: selectedCourse?.id,
                              courseName: courseName,
                              roundType: _roundType,
                              holePars: holePars,
                            );

                            if (!mounted) return;
                            setState(() => _saving = false);
                            widget.onResume();
                          },
                    child: Text(_saving ? '開始中...' : 'ラウンドを開始'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class RoundInputPanel extends StatefulWidget {
  const RoundInputPanel({
    super.key,
    required this.store,
    required this.record,
    required this.onCompleted,
  });

  final RoundStore store;
  final RoundRecord record;
  final ValueChanged<String> onCompleted;

  @override
  State<RoundInputPanel> createState() => _RoundInputPanelState();
}

class _RoundInputPanelState extends State<RoundInputPanel> {
  bool _saving = false;
  String? _lastSeededHoleKey;

  @override
  void initState() {
    super.initState();
    _scheduleSeedDefaults(widget.record);
  }

  @override
  void didUpdateWidget(covariant RoundInputPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    _scheduleSeedDefaults(widget.record);
  }

  void _scheduleSeedDefaults(RoundRecord record) {
    final hole = record.holes[record.round.currentHoleNo - 1];
    final needsStroke = hole.strokes == null;
    final needsPutt = hole.putts == null;

    if (!needsStroke && !needsPutt) return;

    final holeKey =
        '${record.round.id}:${hole.holeNo}:${needsStroke ? 's' : ''}${needsPutt ? 'p' : ''}';
    if (_lastSeededHoleKey == holeKey) return;
    _lastSeededHoleKey = holeKey;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _seedHoleDefaults(hole);
    });
  }

  Future<void> _seedHoleDefaults(HoleScore hole) async {
    await widget.store.updateHole(
      hole.holeNo,
      strokes: hole.strokes ?? hole.par,
      putts: hole.putts ?? 2,
      puttsUnknown: false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentHoleNo = widget.record.round.currentHoleNo;
    final hole = widget.record.holes[currentHoleNo - 1];
    final config = widget.record.round.configSnapshot;
    final progress = currentHoleNo / widget.record.round.holesCount;
    final hasOptionalInputs = (config.fw && hole.par >= 4) ||
        hole.par <= 3 ||
        config.ob ||
        config.bunker;
    final savedAtLabel = _formatDateTime(widget.record.round.lastInputAt);

    return LayoutBuilder(
      builder: (context, constraints) {
        final compact =
            constraints.maxHeight < 680 || constraints.maxWidth < 380;

        return Column(
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _InputStatusStrip(
                      progress: progress,
                      savedAtLabel: savedAtLabel,
                    ),
                    SizedBox(height: compact ? 8 : 12),
                    Expanded(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            child: _RotaryScoreDial(
                              label: '打数',
                              value: hole.strokes,
                              baseline: hole.par,
                              relationBuilder: (value) =>
                                  _relativeDiffLabel(value - hole.par),
                              min: 1,
                              max: 20,
                              compact: compact,
                              onChanged: (value) => _updateHole(strokes: value),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _RotaryScoreDial(
                              label: 'パット',
                              value: hole.puttsUnknown ? null : hole.putts,
                              baseline: 2,
                              relationBuilder: _puttRelationLabel,
                              min: 0,
                              max: 6,
                              compact: compact,
                              clearLabel:
                                  config.puttUnknown && !compact ? '不明' : null,
                              onClear: config.puttUnknown && !compact
                                  ? () => _updateHole(
                                        putts: null,
                                        puttsUnknown: true,
                                      )
                                  : null,
                              onChanged: (value) => _updateHole(
                                putts: value,
                                puttsUnknown: false,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (hasOptionalInputs) ...[
                      SizedBox(height: compact ? 8 : 12),
                      Card(
                        margin: EdgeInsets.zero,
                        child: Padding(
                          padding: const EdgeInsets.all(10),
                          child: _DetailInputSheet(
                            hole: hole,
                            config: config,
                            onDirection: (direction) {
                              if (hole.par >= 4) {
                                _updateHole(
                                  teeShotDirection: direction,
                                  fwKeep: false,
                                );
                              } else {
                                _updateHole(
                                  teeShotDirection: direction,
                                  gir: false,
                                );
                              }
                            },
                            onCenter: () {
                              if (hole.par >= 4) {
                                _updateHole(
                                  clearDirection: true,
                                  fwKeep: true,
                                );
                              } else {
                                _updateHole(
                                  clearDirection: true,
                                  gir: true,
                                );
                              }
                            },
                            onBunkerChanged: (value) =>
                                _updateHole(bunkerCount: value),
                            onObChanged: (value) => _updateHole(obCount: value),
                            onOtherPenaltyChanged: (value) =>
                                _updateHole(otherPenaltyCount: value),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  border: const Border(top: BorderSide(color: Colors.black12)),
                ),
                child: Row(
                  children: [
                    IconButton.outlined(
                      tooltip: '前のホール',
                      onPressed: currentHoleNo > 1
                          ? () => widget.store.goToHole(currentHoleNo - 1)
                          : null,
                      icon: const Icon(Icons.chevron_left),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton(
                        onPressed:
                            _saving ? null : () => _onNextOrComplete(context),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                        ),
                        child: Text(
                          currentHoleNo == widget.record.round.holesCount
                              ? 'ラウンド完了'
                              : '次のホールへ',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _updateHole({
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
    final holeNo = widget.record.round.currentHoleNo;
    await widget.store.updateHole(
      holeNo,
      strokes: strokes,
      putts: putts,
      teeShotDirection: teeShotDirection,
      clearDirection: clearDirection,
      puttsUnknown: puttsUnknown,
      obCount: obCount,
      otherPenaltyCount: otherPenaltyCount,
      fwKeep: fwKeep,
      clearFwKeep: clearFwKeep,
      gir: gir,
      clearGir: clearGir,
      bunkerIn: bunkerIn,
      clearBunkerIn: clearBunkerIn,
      bunkerCount: bunkerCount,
    );
  }

  Future<void> _onNextOrComplete(BuildContext context) async {
    final current = widget.store.currentRound;
    if (current == null) return;

    final hole = current.holes[current.round.currentHoleNo - 1];
    if (hole.strokes == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('打数を入力してから進みましょう')),
      );
      return;
    }

    final isLast = current.round.currentHoleNo == current.round.holesCount;
    if (isLast) {
      setState(() => _saving = true);
      final done = await widget.store.completeRound();
      if (!context.mounted) return;
      setState(() => _saving = false);

      if (!done) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('未入力ホールがあります。先に埋めましょう。')),
        );
        return;
      }
      widget.onCompleted(current.round.id);
      return;
    }

    final prevHole = current.round.currentHoleNo;
    await widget.store.goToHole(prevHole + 1);
  }
}

class _InputStatusStrip extends StatelessWidget {
  const _InputStatusStrip({
    required this.progress,
    required this.savedAtLabel,
  });

  final double progress;
  final String savedAtLabel;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  minHeight: 6,
                  value: progress,
                  backgroundColor: Colors.black12,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(
              Icons.check_circle_outline,
              size: 15,
              color: Colors.black54,
            ),
            const SizedBox(width: 5),
            Text(
              '保存済み $savedAtLabel',
              style: const TextStyle(fontSize: 11, color: Colors.black54),
            ),
          ],
        ),
      ],
    );
  }
}

class HistoryPanel extends StatelessWidget {
  const HistoryPanel({super.key, required this.records, required this.courses});

  final List<RoundRecord> records;
  final List<GolfCourse> courses;

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) {
      return const _EmptyState(
        title: '履歴はまだありません',
        message: '最初のラウンドを記録すると、ここで振り返りできます。',
      );
    }

    final sorted = [...records]
      ..sort((a, b) => b.round.playedAt.compareTo(a.round.playedAt));

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: sorted.length,
      itemBuilder: (context, index) {
        final record = sorted[index];
        final round = record.round;
        final totalPar =
            record.holes.fold<int>(0, (sum, hole) => sum + hole.par);
        final diff =
            round.totalScore == null ? null : round.totalScore! - totalPar;
        final course = findCourseById(round.courseId, courses);

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ExpansionTile(
            title: Text(round.courseName),
            subtitle: Text(
                '${_formatDate(round.playedAt)} ・ ${roundTypeLabels[round.roundType]}'),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(round.totalScore?.toString() ?? '-',
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                Text(diff == null ? '' : _relativeDiffLabel(diff),
                    style: const TextStyle(fontSize: 12)),
              ],
            ),
            childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            children: [
              if (course != null)
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text('${course.prefecture} / ${course.area}',
                      style: const TextStyle(color: Colors.black54)),
                ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: record.holes.map((hole) {
                  final diff =
                      hole.strokes == null ? null : hole.strokes! - hole.par;
                  return Chip(
                    label: Text(
                        'H${hole.holeNo}: ${hole.strokes ?? '-'} ${diff == null ? '' : _relativeDiffLabel(diff)}'),
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
  }
}

class AnalyticsPanel extends StatefulWidget {
  const AnalyticsPanel({super.key, required this.records});

  final List<RoundRecord> records;

  @override
  State<AnalyticsPanel> createState() => _AnalyticsPanelState();
}

class _AnalyticsPanelState extends State<AnalyticsPanel> {
  RoundType _roundType = RoundType.full18;

  @override
  Widget build(BuildContext context) {
    final snapshot = calculateAnalytics(widget.records, _roundType);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Analytics',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        const Text('比較条件を混ぜず、種別ごとに改善ポイントを表示します。'),
        const SizedBox(height: 16),
        SegmentedButton<RoundType>(
          segments: RoundType.values
              .map((type) => ButtonSegment<RoundType>(
                    value: type,
                    label: Text(roundTypeLabels[type] ?? roundTypeToWire(type)),
                  ))
              .toList(),
          selected: {_roundType},
          onSelectionChanged: (next) {
            setState(() {
              _roundType = next.first;
            });
          },
        ),
        const SizedBox(height: 16),
        _MetricCard(
          title: 'ラウンド数',
          value: '${snapshot.roundCount}',
          helper: '同種別のみ集計',
        ),
        _MetricCard(
          title: 'ベスト / 平均',
          value:
              '${snapshot.bestScore ?? '-'} / ${_avg(snapshot.averageScore)}',
          helper: '直近5R平均: ${_avg(snapshot.recentFiveAverage)}',
        ),
        _MetricCard(
          title: '平均パット',
          value: _avg(snapshot.averagePutts),
          helper: 'サンプル ${snapshot.puttSampleCount} ホール',
        ),
        _MetricCard(
          title: 'パーオン / FW キープ率',
          value: '${_percent(snapshot.girRate)} / ${_percent(snapshot.fwRate)}',
          helper:
              'パーオン ${snapshot.girSampleCount}・FW ${snapshot.fwSampleCount} サンプル',
        ),
        _MetricCard(
          title: 'ペナルティ平均',
          value: _avg(snapshot.penaltyAverage),
          helper: '1ホールあたり',
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Text(
              _recommendation(snapshot),
              style: const TextStyle(height: 1.5),
            ),
          ),
        ),
      ],
    );
  }

  String _recommendation(AnalyticsSnapshot snapshot) {
    if (snapshot.roundCount == 0) {
      return 'まだ分析データがありません。まず1ラウンド記録して、次の改善ポイントを見つけましょう。';
    }

    if ((snapshot.penaltyAverage ?? 0) > 1.0) {
      return '次ラウンドは「OBやペナルティを1回減らす」を小さな目標にすると、スコア改善が見えやすいです。';
    }

    if ((snapshot.averagePutts ?? 0) > 2.2) {
      return '次ラウンドは「3パットを1回減らす」を狙うと、スコアが安定しやすくなります。';
    }

    return '記録の質が安定しています。次は得意ホールの再現性を高めて、ベスト更新を狙いましょう。';
  }
}

class SettingsPanel extends StatefulWidget {
  const SettingsPanel({super.key, required this.store});

  final RoundStore store;

  @override
  State<SettingsPanel> createState() => _SettingsPanelState();
}

class _SettingsPanelState extends State<SettingsPanel> {
  late RoundConfig _roundConfig;
  late UiPreferences _ui;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _roundConfig = widget.store.roundDefaults;
    _ui = widget.store.uiPreferences;
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('設定',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        const Text('次のラウンドに適用する記録項目を調整できます。'),
        const SizedBox(height: 16),
        Card(
          child: Column(
            children: [
              SwitchListTile(
                title: const Text('FWキープを記録'),
                value: _roundConfig.fw,
                onChanged: (value) => setState(
                    () => _roundConfig = _roundConfig.copyWith(fw: value)),
              ),
              SwitchListTile(
                title: const Text('OB/ペナルティを記録'),
                value: _roundConfig.ob,
                onChanged: (value) => setState(
                    () => _roundConfig = _roundConfig.copyWith(ob: value)),
              ),
              SwitchListTile(
                title: const Text('バンカー記録を有効化'),
                value: _roundConfig.bunker,
                onChanged: (value) => setState(
                    () => _roundConfig = _roundConfig.copyWith(bunker: value)),
              ),
              SwitchListTile(
                title: const Text('パット不明を許可'),
                value: _roundConfig.puttUnknown,
                onChanged: (value) => setState(() =>
                    _roundConfig = _roundConfig.copyWith(puttUnknown: value)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: [
              SwitchListTile(
                title: const Text('ハイコントラスト'),
                value: _ui.highContrast,
                onChanged: (value) =>
                    setState(() => _ui = _ui.copyWith(highContrast: value)),
              ),
              SwitchListTile(
                title: const Text('ハプティクス'),
                value: _ui.haptics,
                onChanged: (value) =>
                    setState(() => _ui = _ui.copyWith(haptics: value)),
              ),
              SwitchListTile(
                title: const Text('完了演出'),
                value: _ui.celebration,
                onChanged: (value) =>
                    setState(() => _ui = _ui.copyWith(celebration: value)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: _saving
              ? null
              : () async {
                  setState(() => _saving = true);
                  await widget.store.saveDefaults(_roundConfig);
                  await widget.store.saveUiPreferences(_ui);
                  if (!context.mounted) return;
                  setState(() => _saving = false);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('設定を保存しました')),
                  );
                },
          child: Text(_saving ? '保存中...' : '設定を保存'),
        ),
      ],
    );
  }
}

class RoundCompletePanel extends StatelessWidget {
  const RoundCompletePanel(
      {super.key, required this.summary, required this.onContinue});

  final RoundCompleteSummary summary;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          color: const Color(0xFF2E5F45),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Round Complete',
                    style: TextStyle(color: Colors.white70, fontSize: 12)),
                const SizedBox(height: 6),
                Text(summary.courseName,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(
                  '${_formatDate(summary.playedAt)} ・ ${roundTypeLabels[summary.roundType]}',
                  style: const TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: _CompleteTile(
                          label: 'Total',
                          value: '${summary.totalScore}',
                          textColor: Colors.white),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _CompleteTile(
                          label: 'vs Par',
                          value: _relativeDiffLabel(summary.diff),
                          textColor: Colors.white),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('ハイライト',
                    style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                for (final item in summary.highlights)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text('・$item'),
                  ),
                const SizedBox(height: 10),
                Text(summary.encouragement),
                const SizedBox(height: 6),
                Text(
                  summary.nextGoalText,
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.w600),
                ),
                if (summary.isBest)
                  Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Chip(
                      avatar: const Icon(Icons.emoji_events, size: 18),
                      label: const Text('ベスト更新'),
                      backgroundColor: const Color(0xFFFFE0A3),
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: onContinue,
          child: const Text('履歴と分析へ進む'),
        ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard(
      {required this.title, required this.value, required this.helper});

  final String title;
  final String value;
  final String helper;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        title: Text(title),
        subtitle: Text(helper),
        trailing: Text(value,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(title,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _RotaryScoreDial extends StatefulWidget {
  const _RotaryScoreDial({
    required this.label,
    required this.value,
    required this.baseline,
    required this.relationBuilder,
    required this.min,
    required this.max,
    required this.compact,
    required this.onChanged,
    this.clearLabel,
    this.onClear,
  });

  final String label;
  final int? value;
  final int baseline;
  final String Function(int value) relationBuilder;
  final int min;
  final int max;
  final bool compact;
  final ValueChanged<int> onChanged;
  final String? clearLabel;
  final VoidCallback? onClear;

  @override
  State<_RotaryScoreDial> createState() => _RotaryScoreDialState();
}

class _RotaryScoreDialState extends State<_RotaryScoreDial> {
  static const double _stepThreshold = 24;
  double _dragCarry = 0;

  void _step(int delta) {
    final current = widget.value ?? widget.baseline;
    final next = (current + delta).clamp(widget.min, widget.max);
    if (next == widget.value) return;

    HapticFeedback.selectionClick();
    widget.onChanged(next);
  }

  void _handleDragUpdate(DragUpdateDetails details) {
    final dy = details.primaryDelta ?? 0;
    if (dy == 0) return;

    _dragCarry += dy;
    final steps = (_dragCarry.abs() / _stepThreshold).floor();
    if (steps == 0) return;

    final direction = _dragCarry < 0 ? 1 : -1;
    _step(direction * steps);
    _dragCarry = _dragCarry.remainder(_stepThreshold);
  }

  @override
  Widget build(BuildContext context) {
    final value = widget.value;
    final relation = value == null ? '未入力' : widget.relationBuilder(value);
    final relationColor = value == null
        ? Colors.white70
        : value <= widget.baseline
            ? const Color(0xFFBFE8C7)
            : const Color(0xFFFFD59A);
    final valueFontSize = widget.compact ? 32.0 : 42.0;
    final outerPadding = widget.compact ? 8.0 : 12.0;
    final innerVerticalPadding = widget.compact ? 8.0 : 12.0;
    final buttonHeight = widget.compact ? 34.0 : 42.0;

    return Container(
      padding: EdgeInsets.all(outerPadding),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF365741), Color(0xFF1D3126)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF182218).withValues(alpha: 0.18),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: widget.compact ? 6 : 8),
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onVerticalDragStart: (_) => _dragCarry = 0,
            onVerticalDragUpdate: _handleDragUpdate,
            onVerticalDragEnd: (_) => _dragCarry = 0,
            onVerticalDragCancel: () => _dragCarry = 0,
            child: Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(
                horizontal: 12,
                vertical: innerVerticalPadding,
              ),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.unfold_more,
                    color: Colors.white54,
                    size: widget.compact ? 18 : 20,
                  ),
                  Container(
                    width: double.infinity,
                    margin:
                        EdgeInsets.symmetric(vertical: widget.compact ? 4 : 6),
                    padding:
                        EdgeInsets.symmetric(vertical: widget.compact ? 8 : 10),
                    decoration: BoxDecoration(
                      border: Border.symmetric(
                        horizontal: BorderSide(
                            color: Colors.white.withValues(alpha: 0.14)),
                      ),
                    ),
                    child: Column(
                      children: [
                        Text(
                          value?.toString() ?? '-',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: valueFontSize,
                            height: 0.95,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        SizedBox(height: widget.compact ? 2 : 4),
                        Text(
                          relation,
                          style: TextStyle(
                              color: relationColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                  if (!widget.compact)
                    Text(
                      '上下スワイプ',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: widget.compact ? 10 : 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                ],
              ),
            ),
          ),
          SizedBox(height: widget.compact ? 6 : 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _step(-1),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side:
                        BorderSide(color: Colors.white.withValues(alpha: 0.18)),
                    minimumSize: Size.fromHeight(buttonHeight),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: const Text('-1'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _step(1),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side:
                        BorderSide(color: Colors.white.withValues(alpha: 0.18)),
                    minimumSize: Size.fromHeight(buttonHeight),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: const Text('+1'),
                ),
              ),
            ],
          ),
          if (widget.clearLabel != null && widget.onClear != null) ...[
            SizedBox(height: widget.compact ? 6 : 8),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: widget.onClear,
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white70,
                  minimumSize: Size.fromHeight(widget.compact ? 32 : 34),
                  padding: EdgeInsets.zero,
                  visualDensity: VisualDensity.compact,
                ),
                child: Text(widget.clearLabel!),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _DetailInputSheet extends StatelessWidget {
  const _DetailInputSheet({
    required this.hole,
    required this.config,
    required this.onDirection,
    required this.onCenter,
    required this.onBunkerChanged,
    required this.onObChanged,
    required this.onOtherPenaltyChanged,
  });

  final HoleScore hole;
  final RoundConfig config;
  final ValueChanged<TeeShotDirection> onDirection;
  final VoidCallback onCenter;
  final ValueChanged<int> onBunkerChanged;
  final ValueChanged<int> onObChanged;
  final ValueChanged<int> onOtherPenaltyChanged;

  @override
  Widget build(BuildContext context) {
    final centerLabel = hole.par >= 4 ? 'FW' : 'ON';

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _ShotDirectionPad(
                selected: hole.teeShotDirection,
                centerLabel: centerLabel,
                centerSelected:
                    hole.par >= 4 ? hole.fwKeep == true : hole.gir == true,
                onDirection: onDirection,
                onCenter: onCenter,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: _PenaltyCounter(
                bunkerCount: config.bunker ? hole.bunkerCount : null,
                obCount: config.ob ? hole.obCount : null,
                otherCount: config.ob ? hole.otherPenaltyCount : null,
                onBunkerChanged: onBunkerChanged,
                onObChanged: onObChanged,
                onOtherChanged: onOtherPenaltyChanged,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ShotDirectionPad extends StatelessWidget {
  const _ShotDirectionPad({
    required this.selected,
    required this.centerLabel,
    required this.centerSelected,
    required this.onDirection,
    required this.onCenter,
  });

  final TeeShotDirection? selected;
  final String centerLabel;
  final bool centerSelected;
  final ValueChanged<TeeShotDirection> onDirection;
  final VoidCallback onCenter;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _DirectionButton(
          icon: Icons.keyboard_arrow_up,
          label: 'Over',
          selected: selected == TeeShotDirection.over,
          onPressed: () => onDirection(TeeShotDirection.over),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _DirectionButton(
              icon: Icons.keyboard_arrow_left,
              label: 'Left',
              selected: selected == TeeShotDirection.left,
              onPressed: () => onDirection(TeeShotDirection.left),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: FilledButton.tonal(
                onPressed: onCenter,
                style: FilledButton.styleFrom(
                  backgroundColor: centerSelected
                      ? Theme.of(context).colorScheme.primaryContainer
                      : null,
                  fixedSize: const Size(50, 40),
                  padding: EdgeInsets.zero,
                ),
                child: Text(centerLabel,
                    style: const TextStyle(fontWeight: FontWeight.w800)),
              ),
            ),
            _DirectionButton(
              icon: Icons.keyboard_arrow_right,
              label: 'Right',
              selected: selected == TeeShotDirection.right,
              onPressed: () => onDirection(TeeShotDirection.right),
            ),
          ],
        ),
        _DirectionButton(
          icon: Icons.keyboard_arrow_down,
          label: 'Short',
          selected: selected == TeeShotDirection.short,
          onPressed: () => onDirection(TeeShotDirection.short),
        ),
      ],
    );
  }
}

class _DirectionButton extends StatelessWidget {
  const _DirectionButton({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: IconButton.filledTonal(
        isSelected: selected,
        onPressed: onPressed,
        icon: Icon(icon),
        constraints: const BoxConstraints.tightFor(width: 40, height: 40),
        padding: EdgeInsets.zero,
      ),
    );
  }
}

class _PenaltyCounter extends StatelessWidget {
  const _PenaltyCounter({
    required this.bunkerCount,
    required this.obCount,
    required this.otherCount,
    required this.onBunkerChanged,
    required this.onObChanged,
    required this.onOtherChanged,
  });

  final int? bunkerCount;
  final int? obCount;
  final int? otherCount;
  final ValueChanged<int> onBunkerChanged;
  final ValueChanged<int> onObChanged;
  final ValueChanged<int> onOtherChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (bunkerCount != null) ...[
          _CounterTile(
            label: 'バンカー',
            value: bunkerCount!,
            onChanged: onBunkerChanged,
          ),
          const SizedBox(height: 8),
        ],
        if (obCount != null) ...[
          _CounterTile(
            label: 'OB',
            value: obCount!,
            onChanged: onObChanged,
          ),
          const SizedBox(height: 8),
        ],
        if (otherCount != null)
          _CounterTile(
            label: 'ペナルティ',
            value: otherCount!,
            onChanged: onOtherChanged,
          ),
      ],
    );
  }
}

class _CounterTile extends StatelessWidget {
  const _CounterTile(
      {required this.label, required this.value, required this.onChanged});

  final String label;
  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        border: Border.all(color: Colors.black12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => onChanged((value - 1).clamp(0, 30)),
            icon: const Icon(Icons.remove, size: 16),
            visualDensity: VisualDensity.compact,
            constraints: const BoxConstraints.tightFor(width: 28, height: 38),
            padding: EdgeInsets.zero,
          ),
          Expanded(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: '$label ',
                      style: const TextStyle(fontSize: 11),
                    ),
                    TextSpan(
                      text: '$value',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                maxLines: 1,
              ),
            ),
          ),
          IconButton(
            onPressed: () => onChanged((value + 1).clamp(0, 30)),
            icon: const Icon(Icons.add, size: 16),
            visualDensity: VisualDensity.compact,
            constraints: const BoxConstraints.tightFor(width: 28, height: 38),
            padding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }
}

class _CompleteTile extends StatelessWidget {
  const _CompleteTile(
      {required this.label, required this.value, required this.textColor});

  final String label;
  final String value;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  color: textColor.withValues(alpha: 0.72), fontSize: 12)),
          const SizedBox(height: 2),
          Text(value,
              style: TextStyle(
                  color: textColor, fontWeight: FontWeight.w700, fontSize: 20)),
        ],
      ),
    );
  }
}

String _avg(double? value) {
  if (value == null) return '-';
  return value.toStringAsFixed(1);
}

String _percent(double? value) {
  if (value == null) return '-';
  return '${(value * 100).round()}%';
}

String _relativeDiffLabel(int diff) {
  if (diff == 0) return 'Par';
  return diff > 0 ? '+$diff' : '$diff';
}

String _puttRelationLabel(int putts) {
  if (putts == 0) return 'No putt';
  if (putts == 1) return '1 putt';
  if (putts == 2) return 'Standard';
  return '+${putts - 2} putt';
}

String _formatDate(String iso) {
  final dt = DateTime.tryParse(iso);
  if (dt == null) return iso;
  return '${dt.month}/${dt.day}';
}

String _formatDateTime(String iso) {
  final dt = DateTime.tryParse(iso);
  if (dt == null) return iso;
  final hour = dt.hour.toString().padLeft(2, '0');
  final minute = dt.minute.toString().padLeft(2, '0');
  return '${dt.month}/${dt.day} $hour:$minute';
}

extension IterableFirstOrNull<E> on Iterable<E> {
  E? get firstOrNull {
    if (isEmpty) return null;
    return first;
  }
}
