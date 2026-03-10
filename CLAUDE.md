# 雀カル - 麻雀点数計算トレーニングアプリ

## 概要
麻雀の点数計算をクイズ形式で練習するアプリ。

## 技術スタック
- Flutter (Dart SDK >=3.3.0)
- 対象: iOS / Android

## 画面構成
- ホーム画面（レベル選択）
- クイズ画面（牌表示 + 4択）
- 結果表示（クイズ画面内でインライン表示）

## デザイン方針
- ダークテーマ（#0c1222〜#0d2847のグラデーション）
- 牌はCustomPaintで描画（画像アセット不要）
- 萬子=赤、筒子=青、索子=緑
- アガリ牌はゴールドハイライト、ドラは赤枠

## ドメイン層ファイル構成

```
lib/domain/
├── hand_analyzer.dart     # 面子分解（バックトラッキング）
├── yaku_judge.dart        # 役判定（Mリーグ準拠 23役+役満3種）
├── fu_calculator.dart     # 符計算（Mリーグルール: 連風牌2符）
├── score_calculator.dart  # 点数計算（切り上げ満貫あり、数え役満なし）
└── models/
    ├── hand.dart          # Hand, HandDecomposition, Chitoitsu/Kokushi
    ├── mentsu.dart        # Mentsu, MentsuType
    ├── score_result.dart  # ScoreResult
    └── wait_type.dart     # WaitType
```

パイプライン: 手牌 → analyzeHand() → judgeYaku() → calculateFu() → calculateScore()

詳細: [docs/domain.md](docs/domain.md)

## 牌表記法

- 数牌: `{数字}{スート}` — `m`(萬子), `p`(筒子), `s`(索子)
- 字牌: `{番号}z` — 1東 2南 3西 4北 5白 6發 7中
- スペース区切りでグループ化: `"123m 456p 789s 11z"`
- parseTiles() でフラット、parseTileGroups() でグループ化

## テスト実行

```bash
# 全テスト
flutter test

# ドメイン層のみ
flutter test test/domain/

# 個別ファイル
flutter test test/domain/score_calculator_test.dart
flutter test test/domain/fu_calculator_test.dart
flutter test test/domain/hand_analyzer_test.dart
flutter test test/domain/yaku_judge_test.dart
flutter test test/domain/integration_test.dart
```
