/**
 *  Tuffle compiler
 *  Copyright (c) 2019, Fat Cerberus
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
**/

import { instantiate, mkTemplate, mkType, typeCheck, typeName, Type } from './types';

type Node =
	| { type: 'identifier', name: string }
	| { type: 'assignment', lhs: Node, rhs: Node }
	| { type: 'call', target: Node, args: Node[] };

function Identifier(name: string): Node
{
	return { type: 'identifier', name };
}

function Assignment(lhs: Node, rhs: Node): Node
{
	return { type: 'assignment', lhs, rhs };
}

function Call(target: Node, args: Node[]): Node
{
	return { type: 'call', target, args };
}

const anyType = mkType("any");
const functionType = mkTemplate("Function", anyType, [
	{ name: "T", variance: 'contra' },
	{ name: "R", variance: 'covariant' },
]);
const stringType = mkType("string", anyType);
const floatType = mkType("float", anyType);
const intType = mkType("int", floatType);
const intFunType = instantiate(functionType, [
	{ kind: 'type', type: intType },
	{ kind: 'type', type: stringType },
]);

const scope = new Map([
	[ 'pig', intFunType ],
	[ 'cow', intType ],
	[ 'ape', floatType ],
]);

const program: Node[] = [
	Assignment(Identifier('pig'), Identifier('cow')),
	Call(Identifier('whale'), [ Identifier('ape') ])
];

for (const node of program) {
	switch (node.type) {
		case 'assignment':
			const lhs = identifierOf(node.lhs)!;
			const rhs = identifierOf(node.rhs)!;
			const tgtType = scope.get(lhs)!;
			const srcType = scope.get(rhs)!;
			if (!typeCheck(tgtType, srcType))
				error(node, 9001, `value of type '${typeName(srcType)}' cannot act as type '${typeName(tgtType)}'`);
			break;
		case 'call':

			break;
	}
}

function identifierOf(node: Node): string | null
{
	if (node.type !== 'identifier') {
		error(node, 9002, `expected an identifier here`);
		return null;
	}
	return node.name;
}

function error(at: Node, code: number, message: string)
{
	console.log(`[tuf${code}]: '${at.type}': ${message}`);
}
