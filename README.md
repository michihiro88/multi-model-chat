# MultiModelChat - マルチモデルチャットボット

複数のAIモデルを切り替えて使用できるインタラクティブなチャットボットです。

## 機能

- 複数のAIプロバイダーのモデルをシームレスに切り替え
- 対話履歴の管理（サイズ制限、保存、表示）
- 詳細なログ機能
- 使いやすいコマンドインターフェース

## コマンド

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

## 利用可能なモデル

### OpenAI
- gpt-4o
- gpt-4o-mini
- gpt-4-turbo
- gpt-4
- gpt-3.5-turbo

### Google
- gemini-2.0-flash
- gemini-1.5-flash
- gemini-1.5-pro

### Anthropic
- claude-3.5-sonnet (claude-3-5-sonnet-20241022)
- claude-3.5-haiku (claude-3-5-haiku-20241022)
- claude-3-opus (claude-3-opus-20240229)
- claude-3-sonnet (claude-3-sonnet-20240229)
- claude-3-haiku (claude-3-haiku-20240307)

### DeepSeek
- v3 (deepseek-chat): 最新の汎用チャットモデル

## セットアップ

1. リポジトリをクローンまたはダウンロード

2. 必要なパッケージをインストール
```bash
npm install
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

```bash
node --no-deprecation MyChatbot.js
```

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
  }
]
```

## 注意事項

- 各モデルを使用するには、対応するAPIキーが必要です
- APIの利用料金は各プロバイダーの料金体系に従います
- 対話履歴は最新10件のみメモリに保持され、プログラム終了時に消去されます
- OpenAIの推論モード（O1シリーズ）のモデルは、使用量Tier 3-5の一部ユーザーにのみ提供されています

## エラー対処

1. APIキーエラー
- `.env`ファイルが正しく設定されているか確認
- APIキーが有効か確認

2. モデル切り替えエラー
- 正しいプロバイダー名とモデル名を指定しているか確認
- `/models`コマンドで利用可能なモデルを確認

## 参考資料

- [LangChain JavaScript Documentation](https://js.langchain.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google AI Documentation](https://ai.google.dev/)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/docs)
- [DeepSeek API Documentation](https://platform.deepseek.com/docs)

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照してください。
