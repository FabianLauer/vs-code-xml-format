/**
 * A key value map of XML attribute values and their respective values. These objects are created
 * by the XML parser.
 */
export interface IXmlParserAttributeObject {
	[attrName: string]: string;
}


/**
 * Describes an XML node. These objects are created by the XML parser.
 */
export interface IXmlParserNode {
	/**
	 * The node's tag name.
	 */
	name: string;
	
	/**
	 * The text content of the XML node.
	 */
	content?: string;
	
	/**
	 * A key value map of attribute names and values.
	 */
	attributes?: IXmlParserAttributeObject;
	
	/**
	 * The child nodes of a node.
	 */
	children?: IXmlParserNode[];
}


/**
 * Describes an XML declaration node, such as `<?xml version="1.0"?>`. These objects are created by the XML parser.
 */
export interface IXmlParserDeclarationNode {
	declaration: {
		attributes: IXmlParserAttributeObject;
	};
	root: IXmlParserNode;
}