// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { transform } from "sucrase";
import * as clipboard from "copy-paste"

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('extension.copy-ts', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return

		const originalCode = editor.document.getText(editor.selection);
		const [compiledCode, error] = tryCatch<string>(() => transform(originalCode, { transforms: ["typescript"] }).code)

		if (error) {
			vscode.window.showInformationMessage(`Error: ${error.message}`);
			return
		}

		clipboard.copy(compiledCode, () => vscode.window.showInformationMessage("Successfully copied as javascript"))
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }

const tryCatch = <Data>(func: Function): [Data, undefined] | [undefined, Error] => {
	try {
		return [func(), undefined]
	} catch (error) {
		return [undefined, error]
	}
}