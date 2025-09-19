# Change Log

## [1.0.3]

### Added
- **Set Current Offset**: New option in settings to jump to specific position in text, allowing users to skip uninteresting content
- **Toggle functionality**: Merged show/hide panels into a single toggle command for better user experience

### Changed
- Combined `sreader.show` and `sreader.hide` commands into `sreader.toggle` for simplified operation
- Enhanced settings panel with new "Set Current Offset" option that includes input validation and progress display
- Improved offset state management to ensure consistency across all operations

### Removed
- Removed redundant `sreader.quit` command (functionality covered by toggle)
- Removed separate show/hide commands in favor of unified toggle approach

### Fixed
- Fixed offset synchronization issue where manual offset changes weren't reflected in subsequent operations
- Fixed progress display to show correct current position after manual offset changes

## [1.0.2]

- Added a new "book" icon (📖) in the status bar that allows you to quickly access configuration settings
- Added progress indicator showing reading percentage
- Better organized status bar with separate panels for operations, progress, and content
- Improved tooltips showing current file name and helpful hints

## [1.0.1]

- Add clear the reading progress

## [1.0.0]

- Initial release
