//
// Copyright (C) Fabian Lauer, Softwareschmiede Saar.
// All rights reserved.
//

import * as vscode from 'vscode';
import * as xmlFormatter from './xmlFormatter';

export function activate(context: vscode.ExtensionContext) {
	// whole document formatting
	context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('xml', {
		provideDocumentFormattingEdits: (document, options) => {
			return xmlFormatter.XmlFormatter.format(document, undefined, options);
		}
	}));
	
	// selection formatting
	context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider('xml', {
		provideDocumentRangeFormattingEdits: (document, range, options) => {
			return xmlFormatter.XmlFormatter.format(document, range, options);
		}
	}));
}