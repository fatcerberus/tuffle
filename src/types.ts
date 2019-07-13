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

type TypeArg =
	| { kind: 'type', type: Type }
	| { kind: 'star' }
	| { kind: 'question' };

type TemplateArg =
	| TypeArg
	| { kind: 'index', index: number };

export
interface Template
{
	name: string;
	parameters: TypeParam[];
	bases: {
		template: Template;
		args: TemplateArg[];
	}[];
}

export
interface Type
{
	template: Template;
	baseTypes: Type[];
	args: TypeArg[];
}

interface TypeParam
{
	name: string;
	variance: 'none' | 'covariant' | 'contra';
}

export
function mkTemplate(name: string, baseType: Type, parameters: TypeParam[])
{
	const template: Template = {
		name,
		parameters: [ ...parameters ],
		bases: [
			{ template: baseType.template, args: [] },
		],
	};
	return template;
}
export
function mkType(name: string, baseType?: Type)
{
	const template: Template = {
		name,
		parameters: [],
		bases: [],
	};
	if (baseType !== undefined) {
		template.bases = [
			{ template: baseType.template, args: [] },
		];
	}
	return instantiate(template, []);
}

export
function instantiate(ctor: Template, args: TypeArg[])
{
	const baseTypes: Type[] = [];
	for (const base of ctor.bases) {
		const baseArgs: TypeArg[] = [];
		for (const baseArg of base.args) {
			if (baseArg.kind === 'index')
				baseArgs.push(args[baseArg.index]);
			else
				baseArgs.push(baseArg);
		}
		baseTypes.push(instantiate(base.template, baseArgs));
	}
	const type: Type = {
		template: ctor,
		baseTypes,
		args: [ ...args ],
	};
	return type;
}

function sameTemplate(a: Template, b: Template)
{
	return a.name === b.name;
}

export
function sameType(a: Type, b: Type)
{
	if (sameTemplate(a.template, b.template)) {
		// same type constructor, check if arguments match
		for (let i = 0; i < a.args.length; ++i) {
			const argA = a.args[i];
			const argB = b.args[i];
			if (!sameTypeArg(argA, argB))
				return false;
		}
		return true;
	}
	return false;
}

function sameTypeArg(a: TypeArg, b: TypeArg)
{
	if (a.kind === 'type' && b.kind === 'type')
		return sameType(a.type, b.type);
	else
		return a.kind === b.kind;
}

export
function typeCheck(target: Type, source: Type): boolean
{
	if (sameTemplate(target.template, source.template)) {
		// types have the same type constructor; check if instantiations are compatible
		const parameters = source.template.parameters;
		for (let i = 0, len = parameters.length; i < len; ++i) {
			const sourceArg = source.args[i];
			const targetArg = target.args[i];

			// '*' is a universal value, '?' is a universal receiver
			if (sourceArg.kind === 'star' || targetArg.kind === 'question')
				continue;

			// as a target, '*' can only receive another '*'
			// as a source, '?' can only be assigned to another '?'
			if (targetArg.kind === 'star' || sourceArg.kind === 'question')
				return false;

			switch (parameters[i].variance) {
				case 'none':  // totally invariant
					if (!sameType(targetArg.type, sourceArg.type))
						return false;
					break;
				case 'covariant':
					if (!typeCheck(sourceArg.type, targetArg.type))
						return false;
					break;
				case 'contra':
					if (!typeCheck(targetArg.type, sourceArg.type))
						return false;
					break;
			}
		}
		return true;
	}
	else {
		// check if we inherit from something compatible
		for (const baseType of source.baseTypes) {
			if (typeCheck(target, baseType))
				return true;
		}
	}

	// looks like the types aren't compatible after all...
	return false;
}

function typeArgName(arg: TypeArg)
{
	return arg.kind === 'star' ? "*"
		: arg.kind === 'question' ? "?"
		: typeName(arg.type);
}

export
function typeName(type: Type)
{
	let name = type.template.name;
	if (type.args.length > 0) {
		name += "[";
		for (let i = 0; i < type.args.length; ++i) {
			if (i > 0)
				name += ",";
			name += typeArgName(type.args[i]);
		}
		name += "]";
	}
	return name;
}
