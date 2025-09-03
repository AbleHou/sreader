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

let panel: vscode.StatusBarItem | undefined;
let textContent: string = '';
let pageSize: number = 20;
let textPath: string = '';

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
		return fs.readFileSync(path.isAbsolute(textPath) ? textPath : path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', textPath), 'utf-8');
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

function showPanel(context: vscode.ExtensionContext, offset: number) {
	if (!panel) {
		panel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
		context.subscriptions.push(panel);
	}
	panel.show();
	console.log('Showing panel at offset:', offset);
	updatePanel(context, offset);
}

function updatePanel(context: vscode.ExtensionContext, offset: number) {
	if (!panel) {
		return;
	}
	const page = getPage(offset).replace(/\n/g, ' ');
	panel.text = page;
}


export function activate(context: vscode.ExtensionContext) {
	getConfig();
	textContent = loadText();

	// get all file offset map
	let offsetMap = context.globalState.get<{ [file: string]: number }>(STATE_OFFSET, {});
	// current file offset
	let offset = offsetMap[textPath] ?? 0;

	function saveOffset(newOffset: number) {
		offsetMap[textPath] = newOffset;
		context.globalState.update(STATE_OFFSET, offsetMap);
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('sreader.show', () => {
			console.log('sreader.show');
			getConfig();
			textContent = loadText();
			// get offsetMap and current offset
			offsetMap = context.globalState.get<{ [file: string]: number }>(STATE_OFFSET, {});
			offset = offsetMap[textPath] ?? 0;
			showPanel(context, offset);
		}),
		vscode.commands.registerCommand('sreader.pageUp', () => {
			offset = Math.max(0, offset - pageSize);
			saveOffset(offset);
			updatePanel(context, offset);
		}),
		vscode.commands.registerCommand('sreader.pageDown', () => {
			offset = Math.min(textContent.length - 1, offset + pageSize);
			saveOffset(offset);
			updatePanel(context, offset);
		}),
		vscode.commands.registerCommand('sreader.hide', () => {
			if (panel) {
				panel.hide();
			}
		}),
		vscode.commands.registerCommand('sreader.quit', () => {
			saveOffset(offset);
			if (panel) {
				panel.dispose();
				panel = undefined;
			}
		}),
		vscode.commands.registerCommand('sreader.clear', () => {
			context.globalState.update(STATE_OFFSET, {});
			if (panel) {
				panel.dispose();
				panel = undefined;
			}
			vscode.window.showInformationMessage('All saved offsets have been cleared.');
		})
	);
}

export function deactivate() {}
