import 'package:flutter/material.dart';

import 'state/round_store.dart';
import 'ui/app_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GolfScoreApp());
}

class GolfScoreApp extends StatefulWidget {
  const GolfScoreApp({super.key});

  @override
  State<GolfScoreApp> createState() => _GolfScoreAppState();
}

class _GolfScoreAppState extends State<GolfScoreApp> {
  late final RoundStore _store;

  @override
  void initState() {
    super.initState();
    _store = RoundStore();
    _store.boot();
  }

  @override
  void dispose() {
    _store.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Golf Score App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2E5F45),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFF7F3EB),
        useMaterial3: true,
      ),
      home: AppShell(store: _store),
    );
  }
}
