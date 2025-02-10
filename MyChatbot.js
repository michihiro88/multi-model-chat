/**
 * MultiModelChat - マルチモデルチャットボット
 * ====================================
 * 
 * 複数のAIモデル（OpenAI、Anthropic、Google、DeepSeek）を切り替えて使用できる
 * インタラクティブなチャットボットです。
 * 
 * 主な機能：
 * - 複数のAIプロバイダーのモデルをシームレスに切り替え
 * - 対話履歴の管理（サイズ制限、保存、表示）
 * - 詳細なログ機能
 * - 使いやすいコマンドインターフェース
 * 
 * @version 1.0.0
 * @author Michihiro Yamazaki
 * @license MIT
 * 
 * MIT License
 * 
 * Copyright (c) 2025 Michihiro Yamazaki
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatDeepSeek } from "@langchain/deepseek";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import * as readline from 'readline';
import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// 設定
let historySize = 10; // デフォルトの履歴保存数
let messages = []; // 対話履歴の配列

// ログディレクトリの作成
const LOG_DIR = 'logs';
const RAS_LOG_DIR = path.join(LOG_DIR, 'ras');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}
if (!fs.existsSync(RAS_LOG_DIR)) {
    fs.mkdirSync(RAS_LOG_DIR);
}

// 現在のログファイル名を取得する関数
function getCurrentLogFileName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return path.join(LOG_DIR, `chat_${year}${month}${day}.log`);
}

// RASログファイル名を取得する関数
function getCurrentRasFileName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return path.join(RAS_LOG_DIR, `ras_${year}${month}${day}.json`);
}

// RASログを保存する関数
function saveRasLog(requestData, responseData, modelInfo) {
    const logFile = getCurrentRasFileName();
    let logs = [];
    
    // 既存のログファイルが存在する場合は読み込む
    if (fs.existsSync(logFile)) {
        try {
            const fileContent = fs.readFileSync(logFile, 'utf8');
            logs = JSON.parse(fileContent);
        } catch (error) {
            console.error('RASログファイルの読み込みに失敗しました:', error);
            logs = [];
        }
    }

    // 新しいログエントリを作成
    const rasLog = {
        timestamp: new Date().toISOString(),
        model: modelInfo,
        request: requestData,
        response: responseData
    };
    
    // ログを配列に追加
    logs.push(rasLog);
    
    // ログを保存
    try {
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('RASログの保存に失敗しました:', error);
    }
}

// ログを保存する関数
function saveLog(role, content, modelName = '') {
    const now = new Date();
    const timestamp = now.toISOString();
    const logEntry = {
        timestamp,
        role,
        modelName,
        content
    };
    
    const logFile = getCurrentLogFileName();
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// カスタムコールバック関数を作成
const callbacks = {
    async handleLLMStart(llm, prompts) {
        this.startTime = Date.now();
        this.requestData = {
            timestamp: new Date().toISOString(),
            model: llm.model,
            prompts: prompts
        };
    },
    async handleLLMEnd(output) {
        const endTime = Date.now();
        const responseData = {
            timestamp: new Date().toISOString(),
            duration: endTime - this.startTime,
            output: output
        };
        
        // RASログを保存
        saveRasLog(
            this.requestData,
            responseData,
            {
                provider: currentModelName.split('/')[0],
                model: currentModelName.split('/')[1]
            }
        );
    },
    async handleLLMError(error) {
        const responseData = {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        };
        
        // エラー時のRASログを保存
        saveRasLog(
            this.requestData,
            responseData,
            {
                provider: currentModelName.split('/')[0],
                model: currentModelName.split('/')[1]
            }
        );
    }
};

// モデル定義
const models = {
    openai: {
        "gpt-4o": new ChatOpenAI({ model: "gpt-4o", temperature: 0, callbacks: [callbacks] }),
        "gpt-4o-mini": new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0, callbacks: [callbacks] }),
        "gpt-4-turbo": new ChatOpenAI({ model: "gpt-4-turbo", temperature: 0, callbacks: [callbacks] }),
        "gpt-4": new ChatOpenAI({ model: "gpt-4", temperature: 0, callbacks: [callbacks] }),
        "gpt-3.5-turbo": new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0, callbacks: [callbacks] }),
    },
    google: {
        "gemini-2.0-flash": new ChatGoogleGenerativeAI({ modelName: "gemini-2.0-flash", temperature: 0, callbacks: [callbacks] }),
        "gemini-1.5-flash": new ChatGoogleGenerativeAI({ modelName: "gemini-1.5-flash", temperature: 0, callbacks: [callbacks] }),
        "gemini-1.5-pro": new ChatGoogleGenerativeAI({ modelName: "gemini-1.5-pro", temperature: 0, callbacks: [callbacks] }),
    },
    anthropic: {
        "claude-3.5-sonnet": new ChatAnthropic({ modelName: "claude-3-5-sonnet-20241022", temperature: 0, callbacks: [callbacks] }),
        "claude-3.5-haiku": new ChatAnthropic({ modelName: "claude-3-5-haiku-20241022", temperature: 0, callbacks: [callbacks] }),
        "claude-3-opus": new ChatAnthropic({ modelName: "claude-3-opus-20240229", temperature: 0, callbacks: [callbacks] }),
        "claude-3-sonnet": new ChatAnthropic({ modelName: "claude-3-sonnet-20240229", temperature: 0, callbacks: [callbacks] }),
        "claude-3-haiku": new ChatAnthropic({ modelName: "claude-3-haiku-20240307", temperature: 0, callbacks: [callbacks] }),
    },
    deepseek: {
        "v3": new ChatDeepSeek({ model: "deepseek-chat", temperature: 0, callbacks: [callbacks] }),
    }
};

// Create interface for reading from console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// モデルの設定
let currentModel = models.openai["gpt-4"];
let currentModelName = "openai/gpt-4";

// プロンプトを更新する関数
function updatePrompt() {
    rl.setPrompt(`[${currentModelName}] 入力してください > `);
    rl.prompt(true); // 現在の行を再描画
}

// 初期プロンプトの設定
updatePrompt();

// プロンプト
const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `あなたは私が送ったメッセージをすべて覚えている親切なアシスタントです。`,
    ],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
]);

// コマンドの定義
const COMMANDS = {
    models: {
        description: "利用可能なモデルの一覧を表示",
        usage: "/models"
    },
    model: {
        description: "モデルを切り替え",
        usage: "/model <provider> <model_name>"
    },
    current: {
        description: "現在のモデルを表示",
        usage: "/current"
    },
    history_size: {
        description: "対話履歴の保存数を設定",
        usage: "/history_size <数値>"
    },
    history_info: {
        description: "現在の対話履歴の設定を表示",
        usage: "/history_info"
    },
    help: {
        description: "このヘルプを表示",
        usage: "/help"
    },
    quit: {
        description: "チャットを終了",
        usage: "/quit"
    }
};

// ヘルプを表示する関数
function showHelp() {
    console.log("利用可能なコマンド:");
    for (const [command, info] of Object.entries(COMMANDS)) {
        console.log(`${info.usage} - ${info.description}`);
    }
}

// メッセージ処理関数
async function processMessage(input) {
    try {
        // コマンド処理
        if (input.startsWith('/')) {
            const [command, ...args] = input.slice(1).split(' ');
            await handleCommand(command, args);
            return;
        }

        // 通常のメッセージ処理
        messages.push({ role: 'user', content: input });
        saveLog('user', input);

        try {
            const response = await currentModel.call(messages);
            console.log(`AI Assistant: ${response.content}`);
            messages.push({ role: 'assistant', content: response.content });
            saveLog('assistant', response.content);

            // 履歴サイズを制限
            while (messages.length > historySize) {
                messages.shift();
            }
        } catch (error) {
            console.error('エラーが発生しました:', error);
            messages.pop(); // エラーの場合、ユーザーの入力を履歴から削除
            saveLog('error', error.message);
        }
    } catch (error) {
        console.error('メッセージ処理中にエラーが発生しました:', error);
    }
}

// コマンドハンドラー
async function handleCommand(command, args) {
    if (!(command in COMMANDS)) {
        console.log(`未知のコマンドです。利用可能なコマンド:\n${Object.values(COMMANDS).map(cmd => cmd.usage).join(", ")}`);
        console.log("\n詳しい使い方は /help で確認できます。");
        return;
    }

    switch (command) {
        case 'models':
            console.log("\n利用可能なモデル一覧:");
            for (const [provider, providerModels] of Object.entries(models)) {
                console.log(`\n${provider}:`);
                for (const modelName of Object.keys(providerModels)) {
                    console.log(`  - ${modelName}`);
                }
            }
            console.log("\nモデルを変更するには: /model <provider> <model_name>");
            console.log("例: /model openai gpt-4");
            console.log("モデル一覧を表示するには: /models");
            console.log("現在のモデルを確認するには: /current");
            console.log("終了するには: /quit\n");
            break;
        case 'current':
            console.log(`現在のモデル: ${currentModelName}`);
            saveLog('system', `現在のモデルを確認: ${currentModelName}`);
            break;
        case 'model':
            if (args.length !== 2) {
                console.log("使用方法: /model <provider> <model_name>");
                break;
            }
            const [provider, modelName] = args;
            if (models[provider]?.[modelName]) {
                currentModel = models[provider][modelName];
                currentModelName = `${provider}/${modelName}`;
                console.log(`モデルを ${provider}の${modelName} に変更しました`);
                saveLog('system', `モデルを ${provider}の${modelName} に変更しました`);
                updatePrompt(); // プロンプトを更新
            } else {
                console.log("指定されたモデルは利用できません");
                console.log("\n利用可能なモデル一覧:");
                for (const [provider, providerModels] of Object.entries(models)) {
                    console.log(`\n${provider}:`);
                    for (const modelName of Object.keys(providerModels)) {
                        console.log(`  - ${modelName}`);
                    }
                }
                console.log("\nモデルを変更するには: /model <provider> <model_name>");
                console.log("例: /model openai gpt-4");
                console.log("モデル一覧を表示するには: /models");
                console.log("現在のモデルを確認するには: /current");
                console.log("終了するには: /quit\n");
            }
            break;
        case "history_size":
            if (args.length === 0) {
                console.log("使用法: /history_size <数値>\n例: /history_size 10");
                break;
            }
            const size = parseInt(args[0]);
            if (isNaN(size) || size < 1) {
                console.log("エラー: 1以上の数値を指定してください。");
                break;
            }
            historySize = size;
            // 履歴サイズを超える古いメッセージを削除
            while (messages.length > historySize) {
                messages.shift();
            }
            console.log(`対話履歴の保存数を${size}に設定しました。`);
            break;

        case "history_info":
            console.log(`現在の設定:\n- 対話履歴の保存数: ${historySize}\n- 現在の履歴数: ${messages.length}`);
            break;

        case 'quit':
            saveLog('system', 'チャットを終了しました');
            process.exit(0);
            break;
        case 'help':
            showHelp();
            break;
        default:
            showHelp();
    }
}

// Prompt user for input
rl.prompt();

// 入力イベント処理
rl.on('line', async (input) => {
    await processMessage(input);
    updatePrompt(); // 各入力後にプロンプトを更新
    rl.prompt();
});

// 終了イベント処理
rl.on('close', () => {
    console.log('プログラムを終了します');
    process.exit(0);
});