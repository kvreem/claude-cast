# Privacy Policy

**claude-cast** does not collect, store, transmit, or share any personal data.

## What claude-cast does

- Connects to public streaming platforms (Twitch, YouTube, Kick) to play audio and read chat
- Stores playback state (volume, layout preference) locally on your machine at `~/.claude/channels/claude-cast/`
- All data stays on your device

## What claude-cast does NOT do

- Does not collect analytics or telemetry
- Does not send data to any external server
- Does not store chat messages permanently
- Does not require user accounts or authentication (Twitch chat uses anonymous read-only access)
- Does not track usage

## Third-party services

claude-cast connects to the following third-party services solely to stream content you request:

- **Twitch** (IRC chat, stream URLs via streamlink) — subject to [Twitch's Privacy Policy](https://www.twitch.tv/p/legal/privacy-notice/)
- **YouTube** (Live Chat API, stream URLs via streamlink) — subject to [Google's Privacy Policy](https://policies.google.com/privacy)
- **Kick** (WebSocket chat, stream URLs via streamlink) — subject to [Kick's Privacy Policy](https://kick.com/privacy-policy)

## API keys

If you configure a YouTube API key or Twitch Client ID, these are stored locally in `~/.claude/channels/claude-cast/config.json` on your machine. They are never transmitted anywhere other than directly to the respective platform's API.

## Contact

Questions about this policy: kareemthropic@gmail.com
