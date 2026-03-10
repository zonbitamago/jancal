# ドメイン層設計ドキュメント

## 設計思想

ドメイン層（`lib/domain/`）は**純粋Dart**で実装されており、Flutter / UIへの依存がない。これにより：

- `flutter test` で高速にテスト可能
- UI層と独立して開発・検証できる
- 計算ロジックの正確性を単体テストで保証

## 点数計算パイプライン

```
手牌(文字列) → parseTiles() → Tile[]
                                 ↓
                          analyzeHand()
                                 ↓
                      HandDecomposition[] (面子分解候補)
                                 ↓
                    judgeYaku() ← Hand(条件)
                                 ↓
                        YakuResult[] + 翻数
                                 ↓
                         calculateFu()
                                 ↓
                           符(fu)
                                 ↓
                      calculateScore(fu, han)
                                 ↓
                        ScoreResult → 点数文字列
```

複数の面子分解が存在する場合は、それぞれに対して役判定→符計算→点数計算を行い、**最高得点の分解を採用**する。

## モジュール詳細

### hand_analyzer.dart — 面子分解

**関数:** `analyzeHand(List<Tile> tiles, Tile winTile) → List<HandDecomposition>`

14枚の手牌を面子（メンツ）に分解し、すべての有効な分解を返す。

#### アルゴリズム

1. **通常形（4面子+1雀頭）:** バックトラッキングで再帰的に探索
   - 各牌を雀頭候補として試行
   - 残りの牌から刻子（3枚同じ）→ 順子（3連番）の順に抽出
   - すべての有効な組み合わせを列挙
2. **七対子:** 7種の牌が各2枚あるか判定
3. **国士無双:** 13種の么九牌＋1枚重複があるか判定

#### 待ち判定

アガリ牌がどの面子に属するかを分析し、`WaitType` を決定：

| 待ち | 条件 | 例 |
|------|------|----|
| 両面 (ryanmen) | 順子の端でアガリ（1, 9を除く） | 45 + **6** |
| 辺張 (penchan) | 順子の端でアガリ（1または9） | 89 + **7**, 12 + **3** |
| 嵌張 (kanchan) | 順子の中央でアガリ | 46 + **5** |
| 双碰 (shanpon) | 2枚の対子の片方でアガリ | 55 + 77 → **5** or **7** |
| 単騎 (tanki) | 雀頭の片方でアガリ | 3 + **3** |

### yaku_judge.dart — 役判定

**関数:** `judgeYaku({required Hand hand, required HandDecomposition decomposition}) → List<YakuResult>`

Mリーグ公式ルール準拠で以下の役に対応：

| 役名 | 翻数 | 判定条件 |
|------|------|----------|
| 国士無双 | 13 (役満) | KokushiDecomposition |
| 四暗刻 | 13 (役満) | 暗刻×4（双碰ロンは不可） |
| 大三元 | 13 (役満) | 三元牌3つの刻子/槓子 |
| 七対子 | 2 | ChitoitsuDecomposition |
| リーチ | 1 | hand.isRiichi |
| 一発 | 1 | hand.isIppatsu |
| ツモ | 1 | 門前 + ツモ |
| ピンフ | 1 | 門前 + 全順子 + 両面待ち + 役牌以外の雀頭 |
| タンヤオ | 1 | 全牌が2〜8の数牌 |
| 役牌 | 1 | 三元牌/自風/場風の刻子（連風牌は2翻） |
| 一盃口 | 1 | 同一順子が2組（門前のみ） |
| 二盃口 | 3 | 同一順子が2組×2（門前のみ、一盃口と排他） |
| 三色同順 | 2 (食い下がり1) | 萬・筒・索に同じ数の順子 |
| 三色同刻 | 2 | 萬・筒・索に同じ数の刻子 |
| 一気通貫 | 2 (食い下がり1) | 同一スートで123+456+789 |
| トイトイ | 2 | 全面子が刻子/槓子 |
| 三暗刻 | 2 | 暗刻が3つ |
| 小三元 | 2 | 三元牌2刻子+1雀頭 |
| チャンタ | 2 (食い下がり1) | 全面子+雀頭に么九字牌、字牌含む |
| 混老頭 | 2 | 全牌が么九牌+字牌のみ |
| 純チャン | 3 (食い下がり2) | 全面子+雀頭に1or9、字牌なし |
| 混一色 | 3 (食い下がり2) | 1種の数牌 + 字牌のみ |
| 清一色 | 6 (食い下がり5) | 1種の数牌のみ |

**ドラカウント:** `countDora(List<Tile> handTiles, List<Tile> doraTiles) → int`
- ドラ表示牌と手牌の一致数をカウント（表示牌 = ドラそのもの）

### fu_calculator.dart — 符計算

**関数:** `calculateFu({decomposition, isTsumo, isMenzen, isPinfu, seatWind, roundWind}) → int`

#### 符の構成

| 要素 | 符 |
|------|-----|
| 副底（基本） | 20 |
| 門前ロン加符 | +10 |
| ツモ符 | +2 |

**面子符:**

| 面子 | 中張牌 | 么九牌 |
|------|--------|--------|
| 順子 | 0 | 0 |
| 明刻 | 2 | 4 |
| 暗刻 | 4 | 8 |
| 明槓 | 8 | 16 |
| 暗槓 | 16 | 32 |

**待ち符:** 嵌張・辺張・単騎 = 2符、両面・双碰 = 0符

**雀頭符:** 役牌（三元牌・自風・場風）= 2符（Mリーグルール: 連風牌でも2符、4符にはならない）

**特例:**
- ピンフロン → 30符固定
- ピンフツモ → 20符固定
- 七対子 → 25符固定
- 役満 → 0符（符計算なし）

最終結果は**10符単位に切り上げ**。

### score_calculator.dart — 点数計算

**関数:** `calculateScore({required int fu, required int han, required bool isParent, required bool isTsumo, bool isYakuman = false}) → ScoreResult`

#### 基本点テーブル（Mリーグルール準拠）

| 条件 | 基本点 | 名称 |
|------|--------|------|
| isYakuman=true | 8000 | 役満 |
| ≥13翻（数え役満なし） | 6000 | 三倍満 |
| 11-12 | 6000 | 三倍満 |
| 8-10 | 4000 | 倍満 |
| 6-7 | 3000 | 跳満 |
| 5翻、または4翻30符以上、3翻60符以上 | 2000 | 満貫（切り上げ満貫） |
| それ以外 | fu × 2^(han+2) | 通常計算 |

通常計算の基本点が2000を超える場合は満貫（2000）に切り上げ。

#### 支払い計算

**ロン:**
- 親: 基本点 × 6（100点単位切り上げ）
- 子: 基本点 × 4（100点単位切り上げ）

**ツモ:**
- 親: 基本点 × 2 を全員から（100点単位切り上げ）
- 子: 親から 基本点 × 2、子から 基本点 × 1（各100点単位切り上げ）

**役満（固定点）:**

| | ロン | ツモ |
|---|------|------|
| 親 | 48000 | 16000 all |
| 子 | 32000 | 8000/16000 |

#### ScoreResult

```dart
class ScoreResult {
  final int basePoints;
  final bool isParent;
  final bool isTsumo;

  int get ronPoints;       // ロン時の支払い
  int get tsumoKoPoints;   // ツモ時の子の支払い
  int get tsumoOyaPoints;  // ツモ時の親の支払い

  String toAnswerString(); // "2000", "1000/2000", "4000 all"
}
```

`toAnswerString()` の出力形式：
- ロン: `"2000"`
- 子ツモ: `"1000/2000"` （子払い/親払い）
- 親ツモ: `"4000 all"`

## モデル一覧

### Tile（utils/tile_parser.dart）

```dart
class Tile {
  final int number;        // 数字（字牌: 1-7）
  final TileType type;     // man, pin, sou, wind, dragon
  final String displayChar; // 表示文字
}
```

### Mentsu（domain/models/mentsu.dart）

```dart
enum MentsuType { shuntsu, minko, anko, minkan, ankan }

class Mentsu {
  final MentsuType type;
  final List<Tile> tiles;
  int get fuValue;  // 面子の符
}
```

### WaitType（domain/models/wait_type.dart）

```dart
enum WaitType { ryanmen, shanpon, kanchan, penchan, tanki }
```

### Hand（domain/models/hand.dart）

```dart
class Hand {
  final List<Tile> tiles;    // 14枚
  final Tile winTile;
  final bool isTsumo, isMenzen, isParent, isRiichi, isIppatsu;
  final List<Tile> dora;
  final Tile? seatWind, roundWind;
}
```

### HandDecomposition（domain/models/hand.dart）

```dart
class HandDecomposition {
  final List<Mentsu> mentsuList;  // 4面子
  final List<Tile> jantai;        // 雀頭（2枚）
  final WaitType waitType;
}

class ChitoitsuDecomposition extends HandDecomposition { ... }
class KokushiDecomposition extends HandDecomposition { ... }
```

## 牌表記法（Tile Notation）

### 基本フォーマット

`{数字}{スート}` の繰り返し。同スートの連続する牌はまとめて記述可能。

| スート | 記号 | 例 |
|--------|------|----|
| 萬子 (man) | `m` | `123m` → 一萬・二萬・三萬 |
| 筒子 (pin) | `p` | `55p` → 五筒×2 |
| 索子 (sou) | `s` | `789s` → 七索・八索・九索 |
| 字牌 (honor) | `z` | `1234567z` → 東南西北白發中 |

### 字牌の番号対応

| 番号 | 牌 | TileType |
|------|------|----------|
| 1z | 東 | wind |
| 2z | 南 | wind |
| 3z | 西 | wind |
| 4z | 北 | wind |
| 5z | 白 | dragon |
| 6z | 發 | dragon |
| 7z | 中 | dragon |

### グループ表記

スペース区切りで面子グループを表現：

```
"123m 456p 789s 11z"     → 3面子 + 雀頭
"22m 44p 66p 33s 77s 88s 99m" → 七対子
"19m 19p 19s 1234567z"   → 国士無双
```

`parseTiles()` はスペースを無視してすべての牌をフラットなリストとして返す。
`parseTileGroups()` はスペース区切りでグループ化して返す。

## Mリーグルール準拠の変更点

- **切り上げ満貫**: 30符4翻・60符3翻は満貫に切り上げ
- **連風牌**: 雀頭が連風牌でも2符（4符にはならない）
- **数え役満なし**: 13翻以上でも三倍満止まり。役満は `isYakuman` フラグで判定
- **役の追加**: 役牌、一気通貫、チャンタ、トイトイ、三暗刻、小三元、混老頭、純チャン、二盃口、三色同刻、大三元を追加

## クイズデータとの既知の不整合

以下の問題は、ドメイン層の計算結果と `problem.dart` の `correctAnswer` が一致しない。
問題データ側の `correctAnswer` / `choices` が実際の点数計算と異なっている。

| 問題ID | problem.dartの回答 | 正しい計算結果(Mリーグルール) | 原因 |
|--------|-------------------|---------------|------|
| b2 | 1000/2000 | 500/1000 | 30符2翻 子ツモの計算ミス |
| b4 | 1300/2600 | 700/1300 | 20符3翻 子ツモの計算ミス |
| b5 | 2000 | 2900 | 30符2翻 親ロンの計算ミス |
| i4 | 2000/4000 | 1300/2600 | 20符4翻は満貫にならない（基本点1280 < 2000） |

これらは `test/domain/integration_test.dart` の `directTests` で正しい値が検証されている。
問題データの修正は UI層の改修と合わせて対応予定。
