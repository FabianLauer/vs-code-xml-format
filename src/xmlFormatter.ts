import * as vscode from 'vscode';
import * as parser from './parser';

export class XmlFormatter {
	/**
	 * Format a text range and return a text edit array compatible with VS Code formatting providers.
	 */
	public static format(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions): vscode.TextEdit[] {
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
	public format(range: vscode.Range): vscode.TextEdit[] {
		// format the whole document if no range is provided by VS code
		range = range || new vscode.Range(
			// line 0, char 0:
			0, 0,
			// last line:
			this._document.lineCount,
			// last character:
			this._document.lineAt(this._document.lineCount - 1).range.end.character
		);
		
	
		// parse the unformatted XML string
		let parsedXml = this._parseXmlString(this._document.getText());
		
		if (parsedXml) {
			let formattedXml: string;
			
			// try to format or show an error message in case formatting fails
			try {
				formattedXml = this._formatParsedXml(parsedXml);
			} catch(err) {
				// formatting failed, show an error message and cancel (original document is unchanged)
				XmlFormatter._showFormattingErrorMessage();
				return;
			}
			
			// formatting worked, we're done
			return [new vscode.TextEdit(range, formattedXml)];
		}
		// the parser didn't return anything we can use, show an error message and return
		else {
			XmlFormatter._showFormattingErrorMessage();
			return;
		}
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
	private static _showFormattingErrorMessage(): void {
		vscode.window.showErrorMessage(`Sorry, XML formatting failed.`);
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
	 * Returns a sequence of indention characters. The used characters are defined in method `_getIndentCharacters()`.
	 * @param indentDepth The number of times to repeat the indention characters.
	 */
	private _getIndentString(indentDepth = 0): string {
		var str = '',
			i = 0;
		
		for (; i < indentDepth; i++) {
			str += this._getIndentCharacters();
		}
		
		return str;
	}
	
	
	/**
	 * Returns one line break (see method `_getLineBreakCharacters()`) with succeeding indention (see method `_getIndentString()`).
	 * @param indentDepth The number of times to repeat the indention characters.
	 */
	private _getLineBreakWithIndent(indentDepth = 0): string {
		return this._getLineBreakCharacters() + this._getIndentString(indentDepth);
	}
	
	
	/**
	 * Parses an XML string using gjohnson's "xml-parser".
	 */
	private _parseXmlString(xml: string): parser.IXmlParserNode | parser.IXmlParserDeclarationNode {
		return require('xml-parser')(xml);
	}
	
	
	/**
	 * Converts XML objects parsed with method `_parseXmlString(...)` to a formatted string. This recursively self-calls to
	 * convert child nodes of either the root node or any of its children to formatted XML strings.
	 * @param xmlNode An XML object created using method `_parsedXmlString(...)`.
	 * @param indentDepth The absolute indention depth for the returned string. Any recursive calls to this method will increment
	 *                    this value by one. Optional, default is zero.
	 */
	private _formatParsedXml(xmlNode: parser.IXmlParserDeclarationNode | parser.IXmlParserNode, indentDepth = 0): string {
		var xml = '';
		
		// declaration nodes:
		if ((<parser.IXmlParserDeclarationNode>xmlNode).declaration || (<parser.IXmlParserDeclarationNode>xmlNode).root) {
			const declarationNode = <parser.IXmlParserDeclarationNode>xmlNode;
			
			if ((<parser.IXmlParserDeclarationNode>xmlNode).declaration) {
				// example:
				//     <?xml version="1.0"?>
				xml += `<?xml${this._parsedAttrObjectToAtrrString(declarationNode.declaration.attributes)}?>${this._getLineBreakWithIndent(0)}`;
			}
			
			// generate and append XML for the root node if it exists
			if (declarationNode.root) {
				xml += this._formatParsedXml(declarationNode.root, 0);
			}
		}
		// all other nodes:
		else {
			const node = <parser.IXmlParserNode>xmlNode;
			
			// example:
			//     <fibo nacci="1"
			xml += `<${node.name}${this._parsedAttrObjectToAtrrString(node.attributes)}`;
			
			// immediately close if it's a self closing node
			if (XmlFormatter._isSelfClosingNode(node)) {
				xml += ' />';
			}
			// generate XML for all child nodes and append it
			else if (node.children && node.children.length > 0) {
				// we already have:
				//    <fibo nacci="1"
				// we're appending:
				//    >\n\t
				xml += `>${this._getLineBreakWithIndent(indentDepth + 1)}`;
				
				// generate XML for all child nodes into an array (returned by the call to `map`), join
				// that array with the newline and the required indention and append it
				xml += node.children
							.map(child => this._formatParsedXml(child, indentDepth + 1))
							.join(this._getLineBreakWithIndent(indentDepth + 1));
				
				// append another line break and close the node
				xml += `${this._getLineBreakWithIndent(indentDepth)}</${node.name}>`;
			}
			// append text content and close the node
			else if (typeof node.content === 'string' && node.content.length > 0) {
				// we already have:
				//    <fibo nacci="1"
				// we're appending:
				//    >Some text content.</fibo>
				xml += `>${node.content}</${node.name}>`;
			}
		}
		
		return xml;
	}
	
	
	/**
	 * Checks whether an XML object parsed with the "xml-parser" module is self-closing or not.
	 * @param The XML object to check.
	 * @return Returns `true` when the node self closes, `false` if not.
	 */
	private static _isSelfClosingNode(node: parser.IXmlParserNode): boolean {
		switch (true) {
			default:
				return true;
			
			case typeof node.content === 'string' && node.content.length > 0:
			case node.children && node.children.length > 0:
				return false;
		}
	}
	
	
	/**
	 * Converts an attribute object parsed by module "xml-parser" into an XML attribute string. The returned
	 * string will have a leading space if there is at least one attribute name in param `attrObject`.
	 * @param attrObject The key value map of attribute names to their respective values.
	 */
	private _parsedAttrObjectToAtrrString(attrObject: { [attrName: string]: string; }): string {
		var xml = '';
		
		for (let attrName in attrObject) {
			xml += `${attrName}="${attrObject[attrName]}" `;
		}
		
		// add a leading space if necessary
		if (xml.length > 0) {
			xml = ' ' + xml;
		}
		
		// remove the trailing space and return
		return xml.slice(0, -1);
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