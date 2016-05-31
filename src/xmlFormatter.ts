import * as vscode from 'vscode';
const xml = require('./tsxml.js');

export class XmlFormatter {
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
	constructor(private _document: vscode.TextDocument, private _options?: vscode.FormattingOptions) {
		this._options = this._options || {
			insertSpaces: false,
			tabSize: 4
		};
		
		if (typeof this._options.insertSpaces === 'undefined') {
			this._options.insertSpaces = false;
			this._options.tabSize = 4;
		}
		
		if (typeof this._options.tabSize !== 'number' || isNaN(this._options.tabSize)) {
			this._options.tabSize = 4;
		}
		
		this._options.tabSize = Math.max(0, 4);
	}
	
	
	/**
	 * Format a text range and return a text edit array compatible with VS Code formatting providers.
	 */
	public format(range: vscode.Range): Promise<vscode.TextEdit[]> {
		return new Promise<vscode.TextEdit[]>((resolve: (range: vscode.TextEdit[]) => void, reject: (reason?: any) => void) => {
			// format the whole document if no range is provided by VS code
			range = range || new vscode.Range(
				// line 0, char 0:
				0, 0,
				// last line:
				this._document.lineCount,
				// last character:
				this._document.lineAt(this._document.lineCount - 1).range.end.character
			);
			
			const formattingOpts = {
				indentChar: this._getLineBreakCharacters(),
				newlineChar: this._getIndentCharacters()
			};
			
			xml.Compiler.formatXmlString(this._document.getText()).then(formattedXml => {
				resolve([new vscode.TextEdit(range, formattedXml)]);
			}).catch(err => {
				XmlFormatter._showFormattingErrorMessage(err);
				reject();
			});
		});
	}
	
	
	/**
	 * Checks whether the language setting of the current editor's document is supported.
	 * @param languageId The VS Code language id of the language to check.
	 */
	private static _checkLanguageSupport(languageId: string): boolean {
		switch (languageId) {
			default:
				return false;
			case 'xml':
			case 'html':
				return true;
		}
	}
	
	
	/**
	 * Displays a message that informs the user about an error that ocurred when formatting XML.
	 */
	private static _showFormattingErrorMessage(errorInfo?: any): void {
		if (typeof errorInfo !== 'undefined' && errorInfo !== null) {
			if (typeof errorInfo.line === 'number' && typeof errorInfo.column === 'number') {
				vscode.window.showErrorMessage(`XML formatting failed: at line ${errorInfo.line}, column ${errorInfo.column}: ${errorInfo.message || errorInfo}.`);
			} else {
				vscode.window.showErrorMessage(`XML formatting failed: ${errorInfo}.`);
			}
		} else {
			vscode.window.showErrorMessage(`XML formatting failed.`);
		}
	}
	
	
	/**
	 * Returns one or more characters that are supposed to be used as line breaks in formatted XML. Currently,
	 * the line break character(s) is determined automatically depending on what is predominantly used in the
	 * document's text (not the formatting range as we'll want to align XML pasted in the document to match
	 * the document's line breaks after formatting).
	 * TODO: Check whether VS code provides info about the current document's newline type and use that instead.
	 */
	private _getLineBreakCharacters(): string {
		this._lineBreakCharacter = this._lineBreakCharacter || XmlFormatter._determineLinebreakCharacter(this._document.getText());
		return this._lineBreakCharacter;
	}
	
	
	/**
	 * Returns one or more characters that are supposed to be used as indention in formatted XML.
	 */
	private _getIndentCharacters(): string {
		var str  = '';
		if (this._options.insertSpaces) {
			str = '';
			while (str.length < this._options.tabSize) {
				str += ' ';
			}
			return str;
		} else {
			return '\t';
		}
	}
	
	
	/**
	 * Determines what type of line break is predominantly used in a string and returns that character.
	 */
	private static _determineLinebreakCharacter(text: string): string {
		const crlfCount = (text.match(/\r\n/) || []).length,
			  lfCount = (text.match(/[^\r]\n/) || []).length;
		if (crlfCount > lfCount) {
			return '\r\n';
		} else {
			return '\n';
		}
	}
	
	
	/**
	 * This is determined just in time using static method `_determineLinebreakCharacter(...)`.
	 */
	private _lineBreakCharacter: string;
}