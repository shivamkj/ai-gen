# Gen-AI

A minimal AI chat app with a Go backend and Preact frontend, served as a single binary.

## Models

- Claude 4.6 Sonnet (via AWS Bedrock)
- Claude 4.5 Sonnet (via AWS Bedrock)
- DeepSeek v3 (via DeepSeek API)

## Setup

Create a `.env` file:

```env
# For Bedrock models
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# For DeepSeek
DEEPSEEK_API_KEY=...

# Optional
PORT=6713
```

## Dev

```sh
# Build binary
./build.sh
# Start server
./gen-ai
```

## Running on Startup

The `gen-ai` binary and its `.env`/`chats.db` files must stay in the same directory — the binary loads `.env` and writes `chats.db` relative to its working directory.

### Linux (systemd)

A ready-to-use service file is at [`deploy/gen-ai.service`](deploy/gen-ai.service).

1. Get your current username:

   ```sh
   whoami
   ```

2. Edit the file and replace `YOUR_USERNAME` with your actual username and `/path/to/gen-ai` with your actual path value:

   ```sh
   nano deploy/gen-ai.service
   ```

3. Copy it to the systemd directory and enable it:

   ```sh
   sudo cp deploy/gen-ai.service /etc/systemd/system/gen-ai.service
   sudo systemctl daemon-reload
   sudo systemctl enable gen-ai
   sudo systemctl start gen-ai
   ```

4. Check status and logs:

   ```sh
   sudo systemctl status gen-ai
   sudo journalctl -u gen-ai -f
   ```

To stop or disable:

```sh
sudo systemctl stop gen-ai
sudo systemctl disable gen-ai
```

---

### macOS (launchd)

A ready-to-use plist is at [`deploy/com.gen-ai.plist`](deploy/com.gen-ai.plist).

1. Edit the plist and replace `/path/to/gen-ai` with the absolute path to the directory containing the `gen-ai` binary:

   ```sh
   nano deploy/com.gen-ai.plist
   ```

2. Copy it to your user's LaunchAgents directory and load it:

   ```sh
   cp deploy/com.gen-ai.plist ~/Library/LaunchAgents/com.gen-ai.plist
   launchctl load ~/Library/LaunchAgents/com.gen-ai.plist
   ```

   The service will now start automatically on login and restart if it crashes.

3. Check logs:

   ```sh
   tail -f /tmp/gen-ai.log
   tail -f /tmp/gen-ai.error.log
   ```

To stop or disable:

```sh
launchctl unload ~/Library/LaunchAgents/com.gen-ai.plist
```

To remove it permanently:

```sh
launchctl unload ~/Library/LaunchAgents/com.gen-ai.plist
rm ~/Library/LaunchAgents/com.gen-ai.plist
```

---

### Windows (Task Scheduler)

Windows Task Scheduler can run the binary at login with automatic restart on failure — no extra software needed.

1. Open **Task Scheduler** (search for it in the Start menu).

2. Click **Create Task** (not "Create Basic Task") in the right panel.

3. **General tab:**
   - Name: `Gen-AI`
   - Select **Run whether user is logged on or not** if you want it to run in the background without a visible window.
   - Check **Run with highest privileges** if needed.

4. **Triggers tab:**
   - Click **New** → **Begin the task:** `At log on` → OK.

5. **Actions tab:**
   - Click **New** → **Action:** `Start a program`.
   - **Program/script:** Browse to `C:\path\to\gen-ai\gen-ai.exe`.
   - **Start in:** `C:\path\to\gen-ai` (the directory containing the binary and `.env`). This is required so the binary finds its `.env` and `chats.db`.
   - Click OK.

6. **Settings tab:**
   - Check **If the task fails, restart every:** `1 minute`, and set **Attempt to restart up to:** `999 times` for automatic recovery.

7. Click **OK** and enter your Windows password when prompted.

To start immediately without logging out and back in, right-click the task in Task Scheduler and select **Run**.

To view output, the app logs to stdout — you can redirect it by changing the Action to run a wrapper script:

```bat
@echo off
cd /d C:\path\to\gen-ai
gen-ai.exe >> logs\gen-ai.log 2>&1
```

Then point the Task Scheduler action at this `.bat` file with **Start in** set to the same directory.

---

## Stack

- **Backend:** Go, SQLite (`modernc.org/sqlite`)
- **Frontend:** Preact, Tailwind CSS v4, Vite
