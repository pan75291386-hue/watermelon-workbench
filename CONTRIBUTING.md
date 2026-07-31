# Contributing to Watermelon Workbench

Thanks for considering a contribution! 🍉

## Development setup

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run typecheck
```

## Pull request checklist

Before opening a PR, please make sure:

- The plugin builds with `npm run build`.
- TypeScript passes with `npm run typecheck`.
- The change keeps Markdown files portable and human-readable.
- UI changes work in both light and dark Obsidian themes where possible.

## Design principles

- Keep the editor calm and writer-focused.
- Prefer local/offline helpers over cloud-only workflows.
- Avoid writing invisible metadata into the user's manuscript unless necessary.
- Backups should be easy to find and easy to understand.
