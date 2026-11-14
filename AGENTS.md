# Project workflow

- Keep the game interface and content in English.
- After each completed update, run the checks appropriate to the change, create one focused Git commit with a descriptive message, and push it to the GitHub remote.
- Preserve existing game saves and user progress when changing state or persistence.
- Publish completed app updates to the existing MARS: Genesis Vercel project unless the user requests local-only work.
- Never commit dependencies, build output, local deployment metadata, credentials, or environment files.
