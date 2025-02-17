// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CodeSearchViewProvider } from './CodeSearchViewProvider';
import { structuredReplace, structuredSearch } from './utils';
// import write properties from fs:
import { writeFileSync } from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(
		'Congratulations, your extension "advanced-code-search" is now active!',
	);

	const codeSearchViewProvider = new CodeSearchViewProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			CodeSearchViewProvider.viewType,
			codeSearchViewProvider,
		),
	);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand(
		'advanced-code-search.helloWorld',
		() => {
			// The code you place here will be executed every time your command is executed

			// create a webview panel in sidebar

			const panel = vscode.window.createWebviewPanel(
				'codeSearch',
				'Code Search',
				vscode.ViewColumn.One,
				{
					enableScripts: true,
				},
			);

			fs.readFile(
				path.resolve(__dirname, '../webview-dist/index.html'),
				'utf8',
			).then(html => {
				panel.webview.html = html;
			});
		},
	);
	console.log('command registered');

	context.subscriptions.push(disposable);

	context.subscriptions.push(vscode.commands.registerCommand('advanced-code-search.structuredSearch', async () => {
		vscode.window.showInformationMessage('Hello from structuredSearch!');
		// FIXME: Set to null if no workspace is open
		const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.path ?? '/home/shivendu/projects/vscode-advanced-search/demo';
		if (!workspacePath) {
			vscode.window.showErrorMessage('Please open a workspace first');
			return;
		}
		const language = `.${vscode.workspace.textDocuments[0]?.languageId ?? 'js'}`;

		console.log(`workspacePath: ${workspacePath} language: ${language}`);

		const result = await structuredSearch('console.log(:[a])', workspacePath, language);
		console.log(result);
	}
	));

	context.subscriptions.push(vscode.commands.registerCommand('advanced-code-search.structuredReplace', async () => {
		vscode.window.showInformationMessage('Hello from structuredReplace!');

		const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.path ?? '/home/shivendu/projects/vscode-advanced-search/demo';
		if (!workspacePath) {
			vscode.window.showErrorMessage('Please open a workspace first');
			return;
		}
		const language = `.${vscode.workspace.textDocuments[0]?.languageId ?? 'js'}`;

		console.log(`workspacePath: ${workspacePath} language: ${language}`);

		const result = await structuredReplace('console.log(:[a])', 'console.log("hello")', workspacePath, language);
		console.log(result);

		// Iterate over all the results and show diff one by one (Store the result in a file and then show diff):
		// Keep this temp file common for all the results:
		// It should be in /tmp/ folder

		const tempFile = path.join(workspacePath, 'tempFile');

		for (const file of result) {
			// Write the updated file content to the temp file
			writeFileSync(tempFile, file.updatedFileContent);

			// const git = vscode.extensions.getExtension('vscode.git').exports.getAPI(1);
			//
			let res = await vscode.commands.executeCommand(
				"vscode.diff",
				vscode.Uri.file(file.filename),
				vscode.Uri.file(tempFile),
				'Structured Replace diff'
			);
		}
	}

	));
}

// This method is called when your extension is deactivated
export function deactivate() { }
