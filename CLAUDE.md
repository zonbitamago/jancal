# 雀カル - 麻雀点数計算トレーニングアプリ

## 概要
麻雀の点数計算をクイズ形式で練習するアプリ。

## 技術スタック
- React + TypeScript
- Vite (ビルドツール)
- Vitest (テストフレームワーク)
- React Router (画面遷移)
- 対象: Web

## 画面構成
- ホーム画面（レベル選択）
- クイズ画面（牌表示 + 4択）
- 結果表示（クイズ画面内でインライン表示）

## デザイン方針
- ダークテーマ（#0c1222〜#0d2847のグラデーション）
- 牌はReactコンポーネントで描画（画像アセット不要）
- 萬子=赤、筒子=青、索子=緑
- アガリ牌はゴールドハイライト、ドラは赤枠

## ファイル構成

```
src/
├── domain/
│   ├── handAnalyzer.ts        # 面子分解（バックトラッキング）+ 副露対応
│   ├── yakuJudge.ts           # 役判定（Mリーグ準拠 23役+役満3種）
│   ├── fuCalculator.ts        # 符計算（Mリーグルール: 連風牌2符）
│   ├── scoreCalculator.ts     # 点数計算（切り上げ満貫あり、数え役満なし）
│   ├── problemGenerator.ts    # 動的問題生成エンジン
│   ├── fuQuizGenerator.ts     # 符計算特化クイズ生成エンジン
│   ├── scoreTable.ts          # 点数早見表データ生成
│   ├── scoreExplanation.ts    # 不正解時のステップバイステップ解説生成
│   └── models/
│       ├── hand.ts            # Hand, HandDecomposition, Chitoitsu/Kokushi
│       ├── mentsu.ts          # Mentsu, MentsuType
│       ├── scoreResult.ts     # ScoreResult
│       └── waitType.ts        # WaitType
├── models/
│   └── problem.ts             # Problem, QuizLevel, allProblems
├── utils/
│   └── tileParser.ts          # Tile, TileGroup, parseTiles, parseTileGroups
├── services/
│   └── statsService.ts        # 統計データ永続化（localStorage）
├── components/
│   ├── TileWidget.tsx         # 牌1枚の描画
│   ├── TileGroupWidget.tsx    # 牌グループの描画
│   └── Badge.tsx              # 情報バッジ
├── screens/
│   ├── HomeScreen.tsx         # レベル選択画面
│   ├── QuizScreen.tsx         # クイズ画面
│   └── ScoreTableScreen.tsx   # 点数早見表画面
├── styles/
│   └── app.css                # グローバルスタイル
├── App.tsx                    # ルーティング
└── main.tsx                   # エントリポイント
```

パイプライン: 手牌 → analyzeHand() → judgeYaku() → calculateFu() → calculateScore()

詳細: [docs/domain.md](docs/domain.md)

## 牌表記法

- 数牌: `{数字}{スート}` — `m`(萬子), `p`(筒子), `s`(索子)
- 字牌: `{番号}z` — 1東 2南 3西 4北 5白 6發 7中
- スペース区切りでグループ化: `"123m 456p 789s 11z"`
- parseTiles() でフラット、parseTileGroups() でグループ化

## コマンド

```bash
# 全テスト
npm test

# ウォッチモード
npm run test:watch

# ビルド (TypeScriptチェック + Viteビルド)
npm run build

# 開発サーバー
npm run dev
```

## 開発ルール

### 言語
- コード内の変数名・関数名・型名: 英語
- コメント・ドキュメント・コミットメッセージ: 日本語
- UI表示テキスト: 日本語

### コーディング規約
- TypeScript strict モードを遵守
- ドメインロジック (`src/domain/`) はReactに依存しないこと
- 新しい役・ルールの追加時は必ずテストを書くこと
- テストファイルは `src/__tests__/domain/` に配置

### アーキテクチャ
- ドメイン層 (`src/domain/`) とUI層 (`src/components/`, `src/screens/`) を分離
- パイプライン: 手牌 → `analyzeHand()` → `judgeYaku()` → `calculateFu()` → `calculateScore()`
- 点数計算ルールはMリーグ準拠（切り上げ満貫あり、数え役満なし）

### リリース・バージョン管理
- 機能追加・バグ修正など、リリースに含まれる変更を行う際は `package.json` の `version` を必ず更新すること
- バージョンは [セマンティックバージョニング](https://semver.org/lang/ja/) に従う
  - パッチ (x.y.Z): バグ修正
  - マイナー (x.Y.0): 機能追加（後方互換あり）
  - メジャー (X.0.0): 破壊的変更
- バージョンはビルド時に `__APP_VERSION__` としてアプリに埋め込まれ、ホーム画面に表示される

### CI/CD
- GitHub Actions でプッシュ時に自動テスト実行
- `main` ブランチへのプッシュで GitHub Pages へ自動デプロイ
