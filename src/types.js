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

class Template
{
	constructor(name, vars = [])
	{
		this.name = name;
		this.vars = vars;
	}

	toType(typeArgs)
	{
        return new Type(this, null, typeArgs);
	}
}

class Type
{
	static bespoke(name, baseType = null)
	{
        const template = new Template(name);
        return new Type(template, baseType);
	}

	constructor(template, baseType, typeArgs = [])
	{
		this.template = template;
		this.baseType = baseType;
		this.args = [ ...typeArgs ];

		this.name = `${this.template.name}`;
		if (this.args.length > 0) {
			this.name += "[";
			for (let i = 0, len = this.args.length; i < len; ++i) {
				this.name += this.args[i].name;
				if (i + 1 < len)
					this.name += ",";
			}
			this.name += "]";
		}

		console.log(this.toString());
	}

	toString()
	{
        return `type '${this.name}'`;
	}

	actsAs(checkType)
	{
		if (checkType.template === this.template) {
			// types have the same template; check if arguments are compatible
			for (let i = 0; i < this.template.vars.length; ++i) {
				const variance = this.template.vars[i].variance;
				const sourceArg = this.args[i];
				const targetArg = checkType.args[i];
				switch (variance) {
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
					case 'both':
						if (!sourceArg.actsAs(targetArg) && !targetArg.actsAs(sourceArg))
							return false;
						break;
				}
			}
			return true;
		}
		else if (this.baseType !== null) {
			// check if we inherit from something compatible
			return this.baseType.actsAs(checkType);
		}

        // guess the types aren't compatible after all
        return false;
	}

	equals(checkType)
	{
		if (this.template === checkType.template) {
			// types have the same template; check if arguments match
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
}

// CommonJS export table
module.exports =
{
    Template,
    Type,
};
