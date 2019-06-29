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

interface TypeParam
{
	name: string;
	variance: 'co' | 'contra' | 'none';
}

interface Type
{
	name: string;
	baseType: Type | null;
	typeVars: TypeParam[];
	args: TypeArg[];
}

export
function Type(name: string, baseType?: Type): Type
{
	return {
		name,
		baseType: baseType || null,
		typeVars: [],
		args: [],
	};
}

export
function sameType(a: Type, b: Type)
{
	if (a.name === b.name) {
		// types have the same name; check if arguments match
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

export
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
	if (target.name === source.name) {
		// types have the same type constructor; check if instantiations are compatible
		for (let i = 0; i < source.typeVars.length; ++i) {
			const sourceArg = source.args[i];
			const targetArg = target.args[i];

			// '[*]' is a universal value; '[?]' is a universal variable
			if (sourceArg.kind === 'star' || targetArg.kind === 'question')
				continue;

			// - target '[*]' can only receive another '[*]'
			// - source '[?]' can only supply another '[?]'
			if (targetArg.kind === 'star' || sourceArg.kind === 'question')
				return false;

			switch (target.typeVars[i].variance) {
				case 'none':
					if (!sameType(targetArg.type, sourceArg.type))
						return false;
					break;
				case 'co':
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
	else if (source.baseType !== null) {
		// check if we inherit from something compatible
		return typeCheck(source.baseType, target);
	}

	// guess the types aren't compatible after all
	return false;
}
