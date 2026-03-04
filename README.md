# 雀カル (JanCal)

麻雀の点数計算をクイズ形式で練習するFlutterアプリ。

初級・中級・上級の3レベル（各8問）から出題され、手牌と条件を見て4択から正しい点数を選ぶ。

## 技術スタック

- **フレームワーク:** Flutter (Dart SDK >=3.3.0)
- **対象プラットフォーム:** iOS / Android
- **主な依存:** google_fonts, cupertino_icons
- **テスト:** flutter_test（約95テスト）

## ディレクトリ構成

```
lib/
├── main.dart                 # アプリエントリポイント・セッション状態管理
├── domain/                   # ドメイン層（純粋Dart、UI非依存）
│   ├── hand_analyzer.dart    # 面子分解（バックトラッキング）
│   ├── yaku_judge.dart       # 役判定（12役対応）
│   ├── fu_calculator.dart    # 符計算
│   ├── score_calculator.dart # 点数計算（満貫テーブル）
│   └── models/
│       ├── hand.dart         # Hand, HandDecomposition
│       ├── mentsu.dart       # Mentsu, MentsuType
│       ├── score_result.dart # ScoreResult
│       └── wait_type.dart    # WaitType
├── models/
│   └── problem.dart          # クイズ問題データ（24問）
├── screens/
│   ├── home_screen.dart      # ホーム画面（レベル選択）
│   └── quiz_screen.dart      # クイズ画面（出題・回答・結果）
├── widgets/
│   ├── tile_painter.dart     # 牌のCustomPaint描画
│   ├── tile_widget.dart      # 牌ウィジェット
│   ├── tile_group.dart       # 牌グループ表示
│   └── badge.dart            # 情報バッジ
└── utils/
    └── tile_parser.dart      # 牌表記パーサー（"123m" → Tile[]）

test/
├── domain/
│   ├── hand_analyzer_test.dart
│   ├── yaku_judge_test.dart
│   ├── fu_calculator_test.dart
│   ├── score_calculator_test.dart
│   └── integration_test.dart   # パイプライン結合テスト
└── widget_test.dart
```

## セットアップ

```bash
# 依存インストール
flutter pub get

# 実行
flutter run
```

## テスト

```bash
# 全テスト実行
flutter test

# ドメイン層のみ
flutter test test/domain/

# 特定ファイル
flutter test test/domain/score_calculator_test.dart
```

## アーキテクチャ

```
UI層 (screens/, widgets/)
  ↓ 問題データ参照
アプリ層 (models/problem.dart, main.dart)
  ↓ 計算呼び出し
ドメイン層 (domain/) ← 純粋Dart、Flutter非依存
  ↓
ユーティリティ層 (utils/tile_parser.dart)
```

- **UI層:** 画面描画とユーザー操作。牌はCustomPaintで描画（画像アセット不要）
- **ドメイン層:** 手牌分解→役判定→符計算→点数計算のパイプライン。詳細は [docs/domain.md](docs/domain.md) を参照
- **ユーティリティ層:** 牌表記文字列（`"123m"`）とTileオブジェクト間の変換

## デザイン

- ダークテーマ（`#0C1222` → `#0D2847` グラデーション）
- 萬子=赤、筒子=青、索子=緑
- アガリ牌: ゴールドハイライト
- ドラ: 赤枠 + "D"バッジ
