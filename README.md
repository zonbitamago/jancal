# 雀カル (JanCal)

麻雀の点数計算をクイズ形式で練習するWebアプリ。

初級・中級・上級・符計算の4レベルから出題され、手牌と条件を見て4択から正しい答えを選ぶ。問題は動的に生成される。

## 技術スタック

- **フレームワーク:** React + TypeScript
- **ビルドツール:** Vite
- **ルーティング:** React Router
- **テスト:** Vitest（約159テスト）
- **PWA:** vite-plugin-pwa（オフライン対応・インストール可能）
- **対象プラットフォーム:** Web

## ディレクトリ構成

```
src/
├── main.tsx                    # エントリポイント
├── App.tsx                     # ルーティング
├── domain/                     # ドメイン層（Reactに非依存）
│   ├── handAnalyzer.ts         # 面子分解（バックトラッキング）+ 副露対応
│   ├── yakuJudge.ts            # 役判定（Mリーグ準拠 23役+役満3種）
│   ├── fuCalculator.ts         # 符計算（Mリーグルール: 連風牌2符）
│   ├── scoreCalculator.ts      # 点数計算（切り上げ満貫あり、数え役満なし）
│   ├── problemGenerator.ts     # 動的問題生成エンジン
│   ├── fuQuizGenerator.ts      # 符計算特化クイズ生成エンジン
│   ├── scoreTable.ts           # 点数早見表データ生成
│   ├── scoreExplanation.ts     # 不正解時のステップバイステップ解説生成
│   └── models/
│       ├── hand.ts             # Hand, HandDecomposition, Chitoitsu/Kokushi
│       ├── mentsu.ts           # Mentsu, MentsuType
│       ├── scoreResult.ts      # ScoreResult
│       └── waitType.ts         # WaitType
├── models/
│   └── problem.ts              # Problem, QuizLevel, allProblems
├── utils/
│   └── tileParser.ts           # Tile, TileGroup, parseTiles, parseTileGroups
├── services/
│   └── statsService.ts         # 統計データ永続化（localStorage）
├── components/
│   ├── TileWidget.tsx          # 牌1枚の描画
│   ├── TileGroupWidget.tsx     # 牌グループの描画
│   ├── Badge.tsx               # 情報バッジ
│   └── InstallPrompt.tsx       # PWAインストール案内
├── screens/
│   ├── HomeScreen.tsx          # レベル選択画面
│   ├── QuizScreen.tsx          # クイズ画面（出題・回答・結果）
│   ├── ScoreTableScreen.tsx    # 点数早見表画面
│   └── FuLearnScreen.tsx       # 符計算学習画面
└── styles/
    └── app.css                 # グローバルスタイル

src/__tests__/domain/           # ドメイン層のテスト
├── handAnalyzer.test.ts
├── yakuJudge.test.ts
├── fuCalculator.test.ts
├── scoreCalculator.test.ts
├── fuQuizGenerator.test.ts
├── problemGenerator.test.ts
├── scoreTable.test.ts
├── scoreExplanation.test.ts
├── openHand.test.ts
└── integration.test.ts         # パイプライン結合テスト
```

## セットアップ

```bash
# 依存インストール
npm install

# 開発サーバー起動
npm run dev
```

## テスト

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch
```

## ビルド

```bash
# TypeScriptチェック + Viteビルド
npm run build
```

## アーキテクチャ

```
UI層 (screens/, components/)
  ↓ 問題データ参照・生成
アプリ層 (models/problem.ts, domain/problemGenerator.ts)
  ↓ 計算呼び出し
ドメイン層 (domain/) ← 純粋TypeScript、Reactに非依存
  ↓
ユーティリティ層 (utils/tileParser.ts)
```

- **UI層:** 画面描画とユーザー操作。牌はReactコンポーネントで描画（画像アセット不要）
- **ドメイン層:** 手牌分解 → 役判定 → 符計算 → 点数計算のパイプライン。詳細は [docs/domain.md](docs/domain.md) を参照
- **ユーティリティ層:** 牌表記文字列（`"123m"`）とTileオブジェクト間の変換

パイプライン: 手牌 → `analyzeHand()` → `judgeYaku()` → `calculateFu()` → `calculateScore()`

## 牌表記法

- 数牌: `{数字}{スート}` — `m`(萬子), `p`(筒子), `s`(索子)
- 字牌: `{番号}z` — 1東 2南 3西 4北 5白 6發 7中
- スペース区切りでグループ化: `"123m 456p 789s 11z"`
- `parseTiles()` でフラット、`parseTileGroups()` でグループ化

## デザイン

- ダークテーマ（`#0C1222` → `#0D2847` グラデーション）
- 萬子=赤、筒子=青、索子=緑
- アガリ牌: ゴールドハイライト
- ドラ: 赤枠

## CI/CD

- GitHub Actions でプッシュ時に自動テスト実行
- `main` ブランチへのプッシュで GitHub Pages へ自動デプロイ
</content>
</invoke>
