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

class Type
{
	constructor(name, baseType = null, typeVars = [])
	{
		this.name = name;
		this.baseType = baseType;
		this.vars = [ ...typeVars ];
		this.args = this.vars.map(() => null);

		console.log(this.toString());
	}

	toString()
	{
		return `type '${this.name}'`;
	}

	actsAs(targetType)
	{
		if (targetType.name === this.name) {
			// types have the same type constructor; check if typeargs are compatible
			for (let i = 0; i < this.vars.length; ++i) {
				const sourceArg = this.args[i];
				const targetArg = targetType.args[i];

				// '<*>' as source is always compatible
				if (sourceArg === null)
					continue;

				// note: '<*> = <*>' handled by above clause
				if (targetArg === null)
					return false;

				switch (this.vars[i].variance) {
					case 'none':
						if (!targetArg.equals(sourceArg))
							return false;
						break;
					case 'co':
						if (!sourceArg.actsAs(targetArg))
							return false;
						break;
					case 'contra':
						if (!targetArg.actsAs(sourceArg))
							return false;
						break;
				}
			}
			return true;
		}
		else if (this.baseType !== null) {
			// check if we inherit from something compatible
			return this.baseType.actsAs(targetType);
		}

		// guess the types aren't compatible after all
		return false;
	}

	equals(checkType)
	{
		if (this.name === checkType.name) {
			// types have the same name; check if arguments match
			for (let i = 0; i < this.args.length; ++i) {
				const typeA = this.args[i];
				const typeB = checkType.args[i];
				if (!typeA.equals(typeB))
					return false;
			}
			return true;
		}
		return false;
	}

	instantiate(typeArgs)
	{
		const newType = new Type(this.name, this.baseType, this.vars);
		newType.args = [ ...typeArgs ];
		return newType;
	}
}

// CommonJS export table
module.exports =
{
	Type,
};
