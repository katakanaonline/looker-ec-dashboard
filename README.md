# EC Platform Dashboard - Looker Studio Custom Visualization

Looker Studio用のカスタムダッシュボード（4チャート統合）

## 構成

- **スコアカード**: 総売上表示
- **Platform比較縦棒グラフ**: Rakuten vs Amazon vs Yahoo（★クロスチャネル価値）
- **Platformテーブル**: モール別詳細
- **折れ線グラフ**: 日別売上推移（Platform別）

## 開発手順

### 1. ローカルでテスト

```bash
cd C:/Users/katak/ec-platform-aggregator/looker-custom-viz/src
# ブラウザでindex.htmlを開く
```

### 2. Google Cloud Storageにデプロイ

```bash
# GCSバケット作成（初回のみ）
gsutil mb gs://looker-ec-dashboard

# ファイルアップロード
gsutil cp src/index.js gs://looker-ec-dashboard/
gsutil cp src/index.css gs://looker-ec-dashboard/
gsutil cp src/index.json gs://looker-ec-dashboard/

# 公開設定
gsutil iam ch allUsers:objectViewer gs://looker-ec-dashboard
```

### 3. Looker Studioに追加

1. Looker Studioを開く
2. 「挿入」→「コミュニティ ビジュアリゼーションおよびコンポーネント」
3. 「ビルド」タブ → 「送信」
4. manifest.jsonのURLを入力

## ファイル構成

```
looker-custom-viz/
├── manifest.json          # コンポーネント設定
├── src/
│   ├── index.html        # 開発用プレビュー
│   ├── index.js          # メイン描画ロジック
│   ├── index.css         # レイアウト・スタイル
│   └── index.json        # データ設定
└── README.md
```

## 技術スタック

- **dscc**: Looker Studio Component Library
- **Chart.js**: グラフ描画
- **CSS Grid**: 2x2レイアウト（1200px × 700px）

## レイアウト仕様

| 位置 | チャート | サイズ |
|------|---------|--------|
| 左上 | スコアカード | 350x320px |
| 右上 | Platform比較縦棒 | 850x320px |
| 左下 | Platformテーブル | 350x380px |
| 右下 | 折れ線グラフ | 850x380px |

**重要**: 全体が1200x700pxに固定、絶対にはみださない設計
