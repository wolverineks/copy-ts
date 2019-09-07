import * as vscode from 'vscode';
import { transform } from "sucrase";
import * as clipboard from "copy-paste"

export const activate = (context: vscode.ExtensionContext) => {
	const copyTs = vscode.commands.registerCommand('extension.copy-ts', async () => {
		const [selectedText, getTextError] = getSelectedText(vscode);
		if (getTextError) return notify.error(getTextError)

		const [javascript, compileError] = toJavascript(selectedText!)
		if (compileError) return notify.error(compileError)

		const [_result, copyError] = await toClipboard(javascript!)
		if (copyError) return notify.error(copyError)

		return notify.success("Successfully copied javascript to clipboard")
	})

	context.subscriptions.push(copyTs);
}

export const deactivate = () => { }

// DOMAIN
const toJavascript = (typescript: string) => tryCatch<string>(() => transform(typescript, { transforms: ["typescript"] }).code)
const toClipboard = (text: string) => tryCatchP<string>(() => toPromise<string>(clipboard.copy, [text]))

// VSCODE API WRAPPERS
const getEditor = (context: typeof vscode): [vscode.TextEditor, undefined] | [undefined, Error] =>
	context.window.activeTextEditor ? [context.window.activeTextEditor, undefined] : [undefined, new Error('No active text editor')]

const getText = (editor: vscode.TextEditor, range: vscode.Range) => tryCatch<string>(() => editor.document.getText(range))

const getSelectedText = (context: typeof vscode): [string, undefined] | [undefined, Error] => {
	const [editor, getEditorError] = getEditor(context)
	if (getEditorError) return [undefined, getEditorError]

	const [selectedText, getTextError] = getText(editor!, editor!.selection)
	if (getTextError) return [undefined, getTextError]

	return [selectedText!, undefined]
}

const notify = {
	success: (message: string) => vscode.window.showInformationMessage(message),
	error: (error: Error, ...items: string[]) => vscode.window.showErrorMessage(error.message, ...items),
}

// UTILITIES
const tryCatch = <T>(func: () => T) => {
	const onSuccess = (result: T): [T, undefined] => [result, undefined]
	const onError = (error: Error): [undefined, Error] => [undefined, error]

	try {
		return onSuccess(func())
	} catch (error) {
		return onError(error)
	}
}

const tryCatchP = <T>(func: () => Promise<T>) => {
	const onSuccess = (result: T): [T, undefined] => [result, undefined]
	const onError = (error: Error): [undefined, Error] => [undefined, error]

	return func()
		.then(onSuccess)
		.catch(onError)
}

const toPromise = <T>(func: Function, args: any[] = []): Promise<T> =>
	new Promise((resolve, reject) => {
		const callback = (error: Error, result: T) => {
			if (error) return reject(error)
			if (!error) return resolve(result)
		}
		func(...args, callback)
	})
