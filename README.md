# マルチモデルチャットボット

このプロジェクトは、LangChainを使用して複数のAIモデルに対応したチャットボットを実装したものです。OpenAI、Google、Anthropic、DeepSeekの各種モデルを切り替えて使用することができます。

## 特徴

- 複数のAIプロバイダーに対応
  - OpenAI (GPT-4o, GPT-4o-mini, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo)
  - Google (Gemini Pro)
  - Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku)
  - DeepSeek (V3, R1)
- 対話履歴の保持（最新10件）
- 簡単なモデル切り替え機能
- エラーハンドリング機能
- チャットログの自動保存
  - 日付ごとに別ファイルで保存
  - タイムスタンプ、ロール、モデル名、内容を記録
  - JSONフォーマットで保存

## 必要条件

- Node.js (v16以上推奨)
- npm
- 各AIプロバイダーのAPIキー

## セットアップ

1. リポジトリをクローンまたはダウンロード

2. 必要なパッケージをインストール
```bash
npm install @langchain/openai @langchain/google-genai @langchain/anthropic @langchain/core dotenv uuid
```

3. 環境変数の設定
`.env.sample`を`.env`にコピーし、各APIキーを設定します：
```
OPENAI_API_KEY=<your-openai-api-key>
GOOGLE_API_KEY=<your-google-api-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
DEEPSEEK_API_KEY=<your-deepseek-api-key>
```

## 使用方法

1. プログラムの起動
```bash
node MyChatbot.js
```

2. コマンド
全てのコマンドは `/` で始まります（バックスラッシュ `\` ではありません）：

- `/model <プロバイダー> <モデル名>`: モデルを切り替えます
  - 例: `/model anthropic claude-3-opus`
- `/models`: 利用可能なモデルの一覧を表示
- `/current`: 現在使用中のモデルを表示
- `/history_size <数値>`: 対話履歴の保存数を設定
  - 例: `/history_size 20`
- `/history_info`: 現在の対話履歴の設定を表示
- `/help`: このヘルプを表示
- `/quit`: プログラムを終了

3. チャット
- 通常のチャットは、直接メッセージを入力するだけです
- プログラムは対話履歴を保持し、文脈を理解した応答を返します
- プロンプトには現在使用中のモデル名が表示されます（例：`[openai/gpt-4] 入力してください > `）

## ログ機能

チャットの内容は自動的に`logs`ディレクトリに保存されます。

### チャットログ
- ファイル名形式: `chat_YYYYMMDD.log`
- 保存される情報:
  - タイムスタンプ
  - ロール（user/assistant/system/error）
  - 使用中のモデル名
  - メッセージ内容
- ログファイルの場所: `./logs/chat_YYYYMMDD.log`
- フォーマット: 1行1JSONで保存

### RASログ（HTTPレベル通信ログ）
- ファイル名形式: `ras_YYYYMMDD.json`
- 保存場所: `./logs/ras/`ディレクトリ
- 保存される情報:
  - タイムスタンプ
  - モデル情報（プロバイダー、モデル名）
  - リクエストデータ
    - 送信時刻
    - 使用モデル
    - プロンプト内容
  - レスポンスデータ
    - 受信時刻
    - 処理時間
    - 応答内容
    - エラー情報（エラー発生時）
- フォーマット: 整形されたJSON配列
- 同じ日付のログは1つのファイルにまとめて保存

### ログの例
```json
// チャットログの例（chat_20250210.log）
{"timestamp":"2025-02-10T06:10:44.123Z","role":"user","modelName":"openai/gpt-4","content":"こんにちは"}
{"timestamp":"2025-02-10T06:10:45.456Z","role":"assistant","modelName":"openai/gpt-4","content":"こんにちは！お手伝いできることはありますか？"}

// RASログの例（ras_20250210.json）
[
  {
    "timestamp": "2025-02-10T06:10:44.123Z",
    "model": {
      "provider": "openai",
      "model": "gpt-4"
    },
    "request": {
      "timestamp": "2025-02-10T06:10:44.123Z",
      "model": "gpt-4",
      "prompts": ["こんにちは"]
    },
    "response": {
      "timestamp": "2025-02-10T06:10:45.456Z",
      "duration": 1333,
      "output": {
        "content": "こんにちは！お手伝いできることはありますか？"
      }
    }
  },
  {
    "timestamp": "2025-02-10T06:15:12.789Z",
    "model": {
      "provider": "openai",
      "model": "gpt-4"
    },
    "request": {
      "timestamp": "2025-02-10T06:15:12.789Z",
      "model": "gpt-4",
      "prompts": ["AIについて教えてください"]
    },
    "response": {
      "timestamp": "2025-02-10T06:15:14.123Z",
      "duration": 1334,
      "output": {
        "content": "AIは人工知能（Artificial Intelligence）の略称で..."
      }
    }
  }
]
```

## 利用可能なモデル一覧

### OpenAI
実験的モデル:
- gpt-4o
- gpt-4o-mini

通常モデル:
- gpt-4-turbo
- gpt-4
- gpt-3.5-turbo

注: 推論モード（O1シリーズ）のモデル（o1, o1-mini, o3-mini）は、OpenAIのAPI利用者の中でも、使用量Tier 3-5の一部ユーザーにのみ提供されています。

### Google
- gemini-2.0-flash (最新のFlashモデル)
- gemini-1.5-flash (高速な推論に最適化)
- gemini-1.5-pro (高性能な汎用モデル)

### Anthropic
Claude 3.5シリーズ:
- claude-3-5-sonnet (claude-3-5-sonnet-20241022)
- claude-3-5-haiku (claude-3-5-haiku-20241022)

Claude 3シリーズ:
- claude-3-opus (claude-3-opus-20240229)
- claude-3-sonnet (claude-3-sonnet-20240229)
- claude-3-haiku (claude-3-haiku-20240307)

### DeepSeek
- v3 (deepseek-chat): 最新の汎用チャットモデル

## 注意事項

- 各モデルを使用するには、対応するAPIキーが必要です
- APIの利用料金は各プロバイダーの料金体系に従います
- 対話履歴は最新10件のみメモリに保持され、プログラム終了時に消去されます

## エラー対処

1. APIキーエラー
- `.env`ファイルが正しく設定されているか確認
- APIキーが有効か確認

2. モデル切り替えエラー
- 正しいプロバイダー名とモデル名を指定しているか確認
- `/models`コマンドで利用可能なモデルを確認

## ライセンス

MITライセンス

## 参考資料

- [LangChain JavaScript Documentation](https://js.langchain.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google AI Documentation](https://ai.google.dev/)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/docs)
- [DeepSeek API Documentation](https://platform.deepseek.com/docs)
