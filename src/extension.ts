import * as vscode from 'vscode';
import * as xml from 'tsxml';

export function activate(context: vscode.ExtensionContext) {
	// whole document formatting
	context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ language: 'xml' }, {
		provideDocumentFormattingEdits: (document, options) => {
			return XmlFormatter.format(document, undefined, options);
		}
	}));
}


class XmlFormatter {
	/**
	 * Format a text range and return a text edit array compatible with VS Code formatting providers.
	 */
	public static format(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions): Promise<vscode.TextEdit[]> {
		return new XmlFormatter(document, options).format(range);
	}


	/**
	 * **You can use the static method `XmlFormatter.format()` instead of instantiating manually.**
	 * @param _document The VS Code document to format.
	 */
	constructor(private document: vscode.TextDocument, private options?: vscode.FormattingOptions) {
		this.options = this.options || {
			insertSpaces: false,
			tabSize: 4
		};

		if (typeof this.options.insertSpaces === undefined) {
			this.options.insertSpaces = false;
			this.options.tabSize = 4;
		}

		if (typeof this.options.tabSize !== 'number' || isNaN(this.options.tabSize)) {
			this.options.tabSize = 4;
		}

		this.options.tabSize = Math.max(0, 4);
	}


	/**
	 * Format a text range and return a text edit array compatible with VS Code formatting providers.
	 */
	public format(range: vscode.Range): Promise<vscode.TextEdit[]> {
		return new Promise<vscode.TextEdit[]>((resolve, reject) => {
			// format the whole document if no range is provided by VS code
			range = range || new vscode.Range(
				// line 0, char 0:
				0, 0,
				// last line:
				this.document.lineCount,
				// last character:
				this.document.lineAt(this.document.lineCount - 1).range.end.character
			);
			xml.Compiler.formatXmlString(this.document.getText()).then(formattedXml => {
				resolve([new vscode.TextEdit(range, formattedXml)]);
			}).catch(err => {
				XmlFormatter.showFormattingErrorMessage(err);
				reject();
			});
		});
	}


	/**
	 * Displays a message that informs the user about an error that ocurred when formatting XML.
	 */
	private static showFormattingErrorMessage(errorInfo?: any): void {
		if (typeof errorInfo !== 'undefined' && errorInfo !== null) {
			if (typeof errorInfo.line === 'number' && typeof errorInfo.column === 'number') {
				vscode.window.showErrorMessage(`XML formatting failed: at line ${errorInfo.line}, column ${errorInfo.column}: ${errorInfo.message || errorInfo}.`);
			} else {
				vscode.window.showErrorMessage(`XML formatting failed: ${errorInfo}.`);
			}
		} else {
			vscode.window.showErrorMessage(`XML formatting failed.`);
		}
		try {
			console.log('XML Formatter: Error: ', errorInfo);
		} catch (err) {
			// ignore
		}
	}
}

