# Practice SQL PWA

スマホのChromeからインストールできるPWA版です。初回のみインターネット接続が必要で、その後はService WorkerのキャッシュとIndexedDBでオフライン動作します。

## GitHub Pages公開手順（スマホのみ）
1. GitHubで新しいパブリックリポジトリを作成します。
2. このZIPを展開し、`practice-sql-pwa`フォルダー内のファイルをリポジトリ直下へアップロードします。
3. リポジトリの `Settings` → `Pages` を開きます。
4. `Deploy from a branch`、ブランチ`main`、フォルダー`/(root)`を選び保存します。
5. 表示された `https://ユーザー名.github.io/リポジトリ名/` をChromeで開きます。
6. Chromeメニューから「アプリをインストール」または「ホーム画面に追加」を選びます。
7. 初回起動時はオンラインのまま、ホーム画面と問題一覧を一度開いてください。

## 保存場所
- 問題進捗、追加問題、SQL練習場DBはブラウザーのIndexedDBに保存します。
- Chromeのサイトデータを削除すると、保存内容も消えます。必要な追加問題はJSONエクスポートしてください。

## 未確認事項
この環境ではAndroid実機へのインストール、GitHub Pages上でのService Worker動作、全208問の実行試験は未実施です。
