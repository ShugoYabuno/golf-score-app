import 'models.dart';

const defaultRoundConfig = RoundConfig(
  fw: true,
  gir: true,
  ob: true,
  bunker: false,
  puttUnknown: true,
);

const defaultUiPreferences = UiPreferences(
  highContrast: false,
  haptics: true,
  celebration: true,
  swipeSensitivity: SwipeSensitivity.medium,
  fontScale: FontScale.normal,
  distanceUnit: DistanceUnit.yard,
);

const Map<RoundType, List<int>> parTemplates = {
  RoundType.full18: [4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4, 5],
  RoundType.half9: [4, 4, 3, 5, 4, 3, 4, 5, 4],
  RoundType.short: [3, 3, 3, 3, 3, 3, 3, 3, 3],
};

const Map<RoundType, String> roundTypeLabels = {
  RoundType.full18: '18H',
  RoundType.half9: '9H',
  RoundType.short: 'ショート',
};
