# 💖 Sayri Live Notebook Bot 💖

A feature-packed, interactive **YouTube Live Chat Bot & OBS Overlay** with Google TTS (Text-to-Speech), automated Shayari recitation, live voting battles, multi-tier VIP badges, and full host controls!

---

## 🌟 Complete Features & Function List

### 🎙️ 1. Smart Chat & Speech Modes
- **📜 Sayri Mode (Default):** Converts live comments from viewers into romantic Shayaris, Jokes, or Great Leader Quotes.
- **💬 Chat Mode (`chat mode` or `/chat mode`):** Reads actual viewer comments directly as spoken text (*"Rahul ji bol rahe hain... [message]"*).
- **📜 Return to Sayri Mode (`sayri mode` or `/sayri mode`):** Reverts back to converting comments into romantic Shayaris and Jokes.

---

### 👑 2. Host Exclusive Controls (`@Ruchi-gupta101`)
All control commands are strictly reserved for `@Ruchi-gupta101` (Host):
- **`Read <Message>`:** Host message is displayed instantly on the dairy screen and read aloud via TTS.
- **`STOP` or `/STOP`:** Immediately pauses audio TTS and idle Shayari system.
- **`START` or `/START`:** Resumes audio TTS and idle Shayari system.
- **`WINNER` or `/WINNER`:** Pops up the Top Commenter's profile card for **3 seconds**.
- **`LIST` or `/LIST`:** Displays the Live Viewers Directory List with DPs, names, and ranks, reads 1st, 2nd, and 3rd rank viewers aloud, and auto-closes after 9 seconds.
- **`CLOSE LIST` or `/CLOSE LIST`:** Manually closes the Viewers Directory List.
- **`@ViewerName` / Mentioning Viewer:** Pops up a **BIG 150px Avatar DP** overlay with glowing hearts and speaks a personalized Taareef (praise) for that viewer!
- **Slash Commands (`/...`):** Any host comment starting with `/` (that is not a control command) is completely hidden (no TTS, no screen display).
- **Instant Display:** Host comments render on screen instantly without waiting in line.

---

### ⚔️ 3. VS Battle & Live Voting System (`@UserA vs @UserB`)
- **Start Battle:** Host types `@rahul vs @rohit` or `Rahul VS Rohit`.
- **VS Overlay:** Displays side-by-side Avatars with Option A and Option B, an animated flaming `VS` badge, and a real-time live progress bar.
- **Live Voting:** Viewers vote in real time by typing `A`, `B`, `aaaaa`, `bbbbb`, `1`, `2`, `Option A`, `Option B`.
- **End Battle:** Host types `CLOSE VS` or `END VS` to declare the winner with fireworks and victory announcements!

---

### 📜 4. Idle Shayari & 50 Great Personalities Quotes
When no one is commenting for 12 seconds:
- **Shayaris:** Recites romantic, love, dosti, and sad Shayaris automatically.
- **50 Quotes:** Speaks quotes attributed to great leaders in spoken Hindi (*"Dr. APJ Abdul Kalam ji ne kaha tha... Sapne wo nahi jo hum sote hue dekhte hain..."*). Leaders include:
  - Dr. APJ Abdul Kalam
  - Mahatma Gandhi
  - Swami Vivekananda
  - Dr. B.R. Ambedkar
  - Shaheed Bhagat Singh
  - Netaji Subhas Chandra Bose
  - Gautam Buddha
  - Acharya Chanakya
  - Sant Kabir Das
  - Chhatrapati Shivaji Maharaj
  - Rabindranath Tagore & Albert Einstein
- **Personalized Idle Welcome:** Welcomes and thanks the most recent commenter personally (*"Suno na Rahul ji, live stream mein aapka swagat hai..."*).

---

### 🥇 5. Multi-Level VIP Badges System
- **🥉 Bronze Badge (5 Comments):** Bronze overlay celebration & `🥉` badge.
- **👑 Gold VIP Badge (10 Comments):** Gold VIP overlay celebration & `👑` badge.
- **💎 Diamond Legend Badge (25 Comments):** Grand Diamond Legend overlay & `💎` badge.
- **💖 Host Badge (`@Ruchi-gupta101`):** Pink-gold glowing card with `💖` badge.

---

### 🎯 6. Keyword Reactions & Interactive Commands
Viewers can trigger special reactions by typing keywords in chat:
- **`ROSE` / `GULAB`** -> Rose gift reaction + Heart explosion.
- **`CHOCOLATE`** -> Chocolate gift reaction + Heart explosion.
- **`RING` / `ANGOOTHI`** -> Ring gift reaction + Heart explosion.
- **`JOKE`** -> Tells a funny joke + Laugh sound.
- **`VICHAR` / `QUOTE` / `KALAM` / `GANDHI` / `AMBEDKAR`** -> Speaks an inspirational quote.
- **`BDAY` / `BIRTHDAY` / `JANAMDIN`** -> Birthday wishes + Fireworks show.
- **`VIP`** -> Early Bird VIP entry card.
- **`DIL` / `FIRE`** -> Hearts / Fireworks screen takeover animation.

---

### ⚡ 7. Smart Server & Performance Features
- **Server Restart Backlog Filter:** Ignores old messages when server restarts (only reads fresh new live comments).
- **Anti-Spam Cooldown:** 15 seconds cooldown per viewer.
- **Auto-Reconnect Loop:** Retries connecting every 10 seconds if stream is buffering or starting up.
- **OBS-Friendly Notebook Overlay:** Transparent, smooth CSS animations at `http://localhost:3000`.

---

## 🚀 How to Run

### Windows (Command Prompt / PowerShell)
```cmd
node server.js "YOUR_YOUTUBE_LIVE_URL_OR_VIDEO_ID"
```
Or double-click `run_server.bat` and enter your live URL.

### Termux (Android)
```bash
bash start.sh
```

### OBS Studio Setup
1. Open OBS -> Add **Browser Source**.
2. URL: `http://localhost:3000`
3. Width: `1920`, Height: `1080`
4. Interact / Click once on browser page to enable Google TTS audio!
