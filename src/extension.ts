// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// configuration key
const CONFIG_SECTION = 'sreader';
const CONFIG_TEXT_PATH = 'textPath';
const CONFIG_PAGE_SIZE = 'pageSize';

// state key
const STATE_OFFSET = 'sreader.offset'; // stored as { [filePath: string]: number }

let operationPanel: vscode.StatusBarItem | undefined;
let progressPanel: vscode.StatusBarItem | undefined;
let contentPanel: vscode.StatusBarItem | undefined;
let textContent: string = '';
let pageSize: number = 20;
let textPath: string = '';
let panelsVisible: boolean = false;

function getConfig() {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	textPath = config.get<string>(CONFIG_TEXT_PATH, '');
	pageSize = config.get<number>(CONFIG_PAGE_SIZE, 20);
}

function loadText(): string {
	if (!textPath) {
		vscode.window.showErrorMessage('Text path is not configured. Please set it in the extension settings.');
		return '';
	}
	try {
		// Local file only!
		let fullPath: string;
		let workspaceFolder: vscode.WorkspaceFolder | undefined;
        if (path.isAbsolute(textPath)) {
            fullPath = textPath;
        } else {
            workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found.');
                return '';
            }
            fullPath = path.join(workspaceFolder.uri.fsPath, textPath);
        }
        
        const resolvedPath = path.resolve(fullPath);
        if (workspaceFolder && !resolvedPath.startsWith(workspaceFolder.uri.fsPath) && !path.isAbsolute(textPath)) {
            vscode.window.showErrorMessage('Invalid file path: outside workspace.');
            return '';
        }
        
        return fs.readFileSync(resolvedPath, 'utf-8');
	} catch (e) {
		vscode.window.showErrorMessage('Unable to read file due to: ' + e);
		return '';
	}
}

function getPage(offset: number): string {
	if (!textContent) {
		return '';
	}
	return textContent.substring(offset, offset + pageSize);
}

function showPanels(context: vscode.ExtensionContext, offset: number) {
	if (!operationPanel) {
		operationPanel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
		operationPanel.command = 'sreader.openSettings';
		operationPanel.text = '$(book)';
		operationPanel.tooltip = `📖 ${path.basename(textPath)}\n Click to open settings`;
		context.subscriptions.push(operationPanel);
	}
	if (!progressPanel) {
		progressPanel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
		context.subscriptions.push(progressPanel);
	}
	if (!contentPanel) {
		contentPanel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
		context.subscriptions.push(contentPanel);
	}
	operationPanel.show();
	progressPanel.show();
	contentPanel.show();
	panelsVisible = true;
	updatePanels(context, offset);
}

async function openSettings(context: vscode.ExtensionContext, currentOffset: number, saveOffsetFn: (offset: number) => void) {
	const action = await vscode.window.showQuickPick([
		{ label: '$(folder) Set Text Path', value: 'textPath' },
		{ label: '$(symbol-numeric) Set Page Size', value: 'pageSize' },
		{ label: '$(arrow-right) Set Current Offset', value: 'currentOffset' },
	], {
		placeHolder: 'Choose configuration option'
	});

	if (action) {
		const config = vscode.workspace.getConfiguration(CONFIG_SECTION);

		switch (action.value) {
			case 'textPath':
				const newPath = await vscode.window.showInputBox({
					prompt: 'Enter text file path',
					value: config.get<string>(CONFIG_TEXT_PATH, ''),
					placeHolder: 'e.g., /path/to/your/text/file.txt'
				});
				if (newPath !== undefined) {
					await config.update(CONFIG_TEXT_PATH, newPath, vscode.ConfigurationTarget.Global);
					vscode.commands.executeCommand('sreader.toggle');
					vscode.window.showInformationMessage('Text path updated');
				}
				break;
			case 'pageSize':
				const newSize = await vscode.window.showInputBox({
					prompt: 'Enter page size (characters per page)',
					value: config.get<number>(CONFIG_PAGE_SIZE, 20).toString(),
					validateInput: (value) => {
						const num = parseInt(value);
						return isNaN(num) || num <= 0 ? 'Please enter a positive number' : null;
					}
				});
				if (newSize !== undefined) {
					await config.update(CONFIG_PAGE_SIZE, parseInt(newSize), vscode.ConfigurationTarget.Global);
					vscode.commands.executeCommand('sreader.toggle');
					vscode.window.showInformationMessage('Page size updated');
				}
				break;
			case 'currentOffset':
				const currentProgress = textContent.length > 0 ? Math.round((currentOffset / textContent.length) * 100) : 0;
				const newOffset = await vscode.window.showInputBox({
					prompt: 'Enter new offset position (0 to ' + Math.max(0, textContent.length - pageSize) + ')',
					value: currentOffset.toString(),
					placeHolder: `Current: ${currentOffset} (${currentProgress}% of text)`,
					validateInput: (value) => {
						const num = parseInt(value);
						const maxOffset = Math.max(0, textContent.length - pageSize);
						if (isNaN(num)) {
							return 'Please enter a valid number';
						}
						if (num < 0) {
							return 'Offset cannot be negative';
						}
						if (num > maxOffset) {
							return `Offset cannot exceed ${maxOffset}`;
						}
						return null;
					}
				});
				if (newOffset !== undefined) {
					const offsetValue = parseInt(newOffset);
					saveOffsetFn(offsetValue);
					updatePanels(context, offsetValue);
					vscode.window.showInformationMessage(`Offset updated to ${offsetValue}`);
				}
				break;
		}
	}
}

function hidePanels(dispose: boolean = false) {
	if (operationPanel) {
		if (dispose) {
			operationPanel.dispose();
		} else {
			operationPanel.hide();
		}
		operationPanel = undefined;
	}
	if (progressPanel) {
		if (dispose) {
			progressPanel.dispose();
		} else {
			progressPanel.hide();
		}
		progressPanel = undefined;
	}
	if (contentPanel) {
		if (dispose) {
			contentPanel.dispose();
		} else {
			contentPanel.hide();
		}
		contentPanel = undefined;
	}
	panelsVisible = false;
}

function togglePanels(context: vscode.ExtensionContext, offset: number) {
	if (panelsVisible) {
		hidePanels();
	} else {
		getConfig();
		textContent = loadText();
		if (textContent) {
			showPanels(context, offset);
		}
	}
}

function updatePanels(context: vscode.ExtensionContext, offset: number) {
	if (!contentPanel || !progressPanel) {
		return;
	}
	// Calculate progress
	const progress = textContent.length > 0 ? Math.round((offset / textContent.length) * 100) : 0;
	contentPanel.text = getPage(offset).replace(/\n/g, ' ');
	progressPanel.text = `${progress}%`;
}

export function activate(context: vscode.ExtensionContext) {
	getConfig();
	textContent = loadText();

	// get all file offset map
	let offsetMap = context.globalState.get<{ [file: string]: number }>(STATE_OFFSET, {});
	// current file offset
	let offset = offsetMap[textPath] ?? 0;
	// max file offset
	let maxOffset = Math.max(0, textContent.length - pageSize);

	function saveOffset(newOffset: number) {
		offset = newOffset; // 更新局部变量
		offsetMap[textPath] = newOffset;
		context.globalState.update(STATE_OFFSET, offsetMap);
	}

	function getCurrentOffset(): number {
		return offset;
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('sreader.toggle', () => {
			getConfig();
			textContent = loadText();
			// get offsetMap and current offset
			offsetMap = context.globalState.get<{ [file: string]: number }>(STATE_OFFSET, {});
			offset = offsetMap[textPath] ?? 0;
			maxOffset = Math.max(0, textContent.length - pageSize);
			togglePanels(context, offset);
		}),
		vscode.commands.registerCommand('sreader.openSettings', async () => {
			await openSettings(context, getCurrentOffset(), saveOffset);
		}),
		vscode.commands.registerCommand('sreader.pageUp', () => {
			offset = Math.max(0, offset - pageSize);
			saveOffset(offset);
			updatePanels(context, offset);
		}),
		vscode.commands.registerCommand('sreader.pageDown', () => {
			offset = Math.min(maxOffset, offset + pageSize);
			saveOffset(offset);
			updatePanels(context, offset);
		}),
		vscode.commands.registerCommand('sreader.clear', () => {
			context.globalState.update(STATE_OFFSET, {});
			hidePanels(true);
			vscode.window.showInformationMessage('All saved offsets have been cleared.');
		})
	);
}

export function deactivate() { }
