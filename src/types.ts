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

export
enum Variance
{
	None,
	Co,
	Contra,
	Both,
}

interface TypeVar
{
	name: string;
	variance: Variance;
}

export
class Template
{
	name: string;
	vars: TypeVar[];

	constructor(name: string, vars: TypeVar[] = [])
	{
		this.name = name;
		this.vars = vars;
	}
}

export
class Type
{
	name: string;
	template: Template;
	baseType: Type | null = null;
	args: Type[] = [];

	constructor(template: Template, args?: Type[])
	constructor(name: string)
	constructor(basis: Template | string, args: Type[] = [])
	{
		this.template = basis instanceof Template
			? basis : new Template(basis);
		this.name = `${this.template.name}`;
		if (args.length > 0) {
			this.name += "<";
			for (let i = 0; i < args.length; ++i) {
				this.name += args[i].name;
				if (i + 1 < args.length)
					this.name += ", ";
			}
			this.name += ">";
		}
	}

	toString()
	{
		return `type '${this.name}'`;
	}

	equals(other: Type)
	{
		if (this.template === other.template) {
			// types have the same template; check if arguments match
			for (let i = 0; i < this.args.length; ++i) {
				const typeA = this.args[i];
				const typeB = other.args[i];
				if (!typeA.equals(typeB))
					return false;
			}
			return true;
		}
		else {
			return false;
		}
	}

	worksAs(checkType: Type): boolean
	{
		if (checkType.template === this.template) {
			// types have the same template; check if arguments are compatible
			for (let i = 0; i < this.template.vars.length; ++i) {
				const variance = this.template.vars[i].variance;
				const sourceArg = this.args[i];
				const targetArg = checkType.args[i];
				switch (variance) {
					case Variance.None:
						if (!targetArg.equals(sourceArg))
							return false;
						break;
					case Variance.Co:
						if (!sourceArg.worksAs(targetArg))
							return false;
						break;
					case Variance.Contra:
						if (!targetArg.worksAs(sourceArg))
							return false;
						break;
					case Variance.Both:
						if (!sourceArg.worksAs(targetArg) && !targetArg.worksAs(sourceArg))
							return false;
						break;
				}
			}
			return true;
		}
		else if (this.baseType !== null) {
			// check if we inherit from something compatible
			return this.baseType.worksAs(checkType);
		}
		else {
			// guess the types aren't compatible after all
			return false;
		}
	}
}
