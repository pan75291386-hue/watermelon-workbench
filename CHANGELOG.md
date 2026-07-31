# Changelog

## 0.1.2

### Fixed

- Updated plugin metadata to satisfy Obsidian community plugin review rules.
- Removed unload-time leaf detaching so workspace layouts are preserved.
- Replaced the settings heading with Obsidian's recommended `Setting#setHeading()` API.
- Avoided APIs newer than the declared minimum app version.

## 0.1.1

### Added

- Added chapter count to the compact live stats panel.
- Added total novel word count across Markdown files in the current chapter folder.

### Changed

- Added a public `authorUrl` in `manifest.json` for Obsidian community plugin submission.

## 0.1.0

Initial public-ready release.

### Added

- Focused Obsidian writing workbench for Markdown files.
- Current-leaf open/exit flow that returns to the normal Markdown editor.
- Chapter list for sibling Markdown files.
- Typography controls for font, size, and line height.
- Writing-friendly displayed indentation that keeps saved Markdown clean.
- Local random name and place generator.
- Time Machine snapshots in a local `备份` folder.
- Snapshot diff and restore actions.
- Compact live writing statistics.
- Comfortable auto-scroll while writing near the bottom of the editor.
