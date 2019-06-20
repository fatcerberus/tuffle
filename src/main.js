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

const { Type } = require('./types.js');

const anyType = new Type("any");
const functionType = new Type("function", anyType, [
	{ name: "T", variance: 'contra' },
	{ name: "R", variance: 'co' },
]);
const realType = new Type("real", anyType);
const intType = new Type("int", realType);
const stringType = new Type("string", anyType);
const realEater = functionType.instantiate([ realType, stringType ]);
const intEater = functionType.instantiate([ intType, stringType ]);

console.log("real = int OK:", intType.actsAs(realType));
console.log("int = real OK:", realType.actsAs(intType));
console.log("any = string OK:", stringType.actsAs(anyType));
console.log("string = any OK:", anyType.actsAs(stringType));
console.log("realFunc = intFunc OK:", intEater.actsAs(realEater));
console.log("intFunc = realFunc OK:", realEater.actsAs(intEater));
console.log("any = intFunc OK:", intEater.actsAs(anyType));
