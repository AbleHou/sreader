# sreader

Secret reader, a handy tool to quietly read local text files at the far right of the VS Code status bar.

## Features

- Display the content of a local text file in the far right of the status bar
- Support for paging up and down
- Show/hide content
- Quit reading at any time
- Clear all reading progress
- Click "book" to setting configuration 

## Installation

1. Available on VS Code Marketplace - search for "sreader".
2. Or build from source and install via VSIX.

## Usage

**Tip**: We recommend setting up keyboard shortcuts for the main commands for the most seamless reading experience!

1. Configure the local text file path (`sreader.textPath`) and page size (`sreader.pageSize`) in the settings.
2. Use the vscode Command Palette and enter the following commands:
   - `Show Secret`: Display content
   - `Page Up Secret`: Navigate to previous page  
   - `Page Down Secret`: Navigate to next page
   - `Hide Secret Content`: Hide the content panels
   - `Quit Secret Reader`: Completely quit and clean up
   - `Clear All Secret Offsets`: Reset all reading progress

The content will be displayed as a single line at the far right of the status bar, perfect for discreet reading.

## Configuration

| Setting             | Type    | Default | Description                  |
|---------------------|---------|---------|------------------------------|
| sreader.textPath    | string  | ""      | Path to the local text file  |
| sreader.pageSize    | number  | 40      | Number of characters per page|

## Commands

| Command                 | Description      |
|-------------------------|-----------------|
| sreader.show            | Show content    |
| sreader.pageUp          | Previous page   |
| sreader.pageDown        | Next page       |
| sreader.hide            | Hide content    |
| sreader.quit            | Quit reading    |
| sreader.clear           | Clear progress  |

## Examples

![Demo](assets/docs/demo.png)

## License

Apache-2.0

