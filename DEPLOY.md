# クラウドに上げる（Render）

部屋サーバーは状態を持つ Node なので、Cloudflare Workers ではなく **Render の無料 Web Service** 向けです。

## データについて

- セーブは各端末のブラウザ（localStorage）に残ります
- クラウドの URL は今までの `192.168.x.x:8771` とは別物なので、街の「セーブうつし」でコピー＆ペーストしてください

## 手順

1. GitHub にこのフォルダを push する（既にある `animal-battle-quiz` リポジトリでOK）
2. [https://render.com](https://render.com) にログイン（GitHub連携）
3. **New + → Web Service** → このリポジトリを選ぶ
4. 設定例
   - Root Directory: （リポジトリ直下がこのゲームなら空）
   - Runtime: Node
   - Build Command: `true`
   - Start Command: `node room-server.cjs`
   - Instance type: **Free**
5. Deploy 後、出た URL（例 `https://alefgard.onrender.com`）を開く
6. 遊ぶアドレス
   - `https://（あなたのサービス）.onrender.com/adventure.html`
   - または `https://（あなたのサービス）.onrender.com/animal-battle-quiz/adventure.html`

## 注意

- 無料枠はしばらく誰も触らないと眠ります。最初の接続に1分くらいかかることがあります
- 部屋の中身はサーバーのメモリ上なので、サーバーが寝たり再起動すると部屋は消えます（セーブデータは端末側に残る）
