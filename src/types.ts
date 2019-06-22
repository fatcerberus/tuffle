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
	args: (Type | null)[];
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
function sameType(typeA: Type, typeB: Type)
{
	if (typeA.name === typeB.name) {
		// types have the same name; check if arguments match
		for (let i = 0; i < typeA.args.length; ++i) {
			const argA = typeA.args[i];
			const argB = typeB.args[i];
			if (!sameType(argA, argB))
				return false;
		}
		return true;
	}
	return false;
}

export
function typeCheck(target: Type, source: Type): boolean
{
	if (target.name === source.name) {
		// types have the same type constructor; check if instantiations are compatible
		for (let i = 0; i < source.typeVars.length; ++i) {
			const sourceArg = source.args[i];
			const targetArg = target.args[i];

			// '<*>' as source is always compatible
			if (sourceArg === null)
				continue;

			// note: '<*> = <*>' handled by above clause
			if (targetArg === null)
				return false;

			switch (target.typeVars[i].variance) {
				case 'none':
					if (!sameType(targetArg, sourceArg))
						return false;
					break;
				case 'co':
					if (!typeCheck(sourceArg, targetArg))
						return false;
					break;
				case 'contra':
					if (!typeCheck(targetArg, sourceArg))
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
