import * as vscode from 'vscode';
import * as xmlFormatter from './xmlFormatter';

export function activate(context: vscode.ExtensionContext) {
	// whole document formatting
	context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ language: 'xml' }, {
		provideDocumentFormattingEdits: (document, options) => {
			return xmlFormatter.XmlFormatter.format(document, undefined, options);
		}
	}));
}
