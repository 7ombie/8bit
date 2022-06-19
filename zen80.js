import { numericTypes, vectorTypes, controlCharacters } from "./tokenize.js";
import { register, GrammaticalError } from "./compile.js";

import { tokenize } from "./tokenize.js";
import { parse } from "./parse.js";
import { compile } from "./compile.js";
import { assemble } from "./assemble.js";

//// EXPORT THE API FUNCTIONS THAT MAKE UP THE LIBRARY...

export { assemble, compile, parse, tokenize }

//// DEFINE THE DSL FOR REGISTERING THE INSTRUCTION GRAMMARS...

const get = function(instruction, ...args) {

    /* This helper takes an instruction and one or two indices. It uses
    the first index to refer to a child of the instruction. When present,
    the second index is used to index the child (which implies an array).
    In either case, the function returns the result.

    This function compliments `reg` and `num`, and together these three
    helpers form a mini DSL that can be used to easily define callbacks
    suitable for passing to `register`. */

    const [x, y] = args;
    const children = instruction.children;

    return args.length === 1 ? children[x] : children[x][y];
};

const reg = function(code, register) {

    /* This helper takes a base opcode (the lowest opcode in a mnemonic
    group) and a register token. It enumerates the register, adds the
    enumeration to the code, and returns the result. Also see `get`. */

    return code + ["x", "y", "z", "pc", "sp", "fx"].indexOf(register.value);
};

const num = function(literal) {

    /* This helper takes some kind of number literal, reference or vector,
    and returns its numerical value (resolving references automatically).
    Note that negative numbers are replaced with the equivalent positive
    number (-1 becomes +255 etc). Also see `get`. */

    const {type, value} = literal;

    if (["Reference", "Loop", "Skip"].includes(type)) return literal;

    if (type === "Character") {

        if (value.length === 1) return value.charCodeAt();
        else return controlCharacters[value];
    }

    const result = parseInt(value.replace("#", "0x"));

    return result >= 0 ? result : 256 + result;
};

//// DEFINE THE LOCAL HELPER FUNCTIONS FOR REGISTERING THE GRAMMARS...

const registerUnaryOperation = function(name, opcode) {

    /* This helper takes a unary mnemonic string and the base opcode for
    the mnemonic (the lowest opcode used by the group). It registers the
    required handlers, computing any patterns and opcodes as required. */

    register(name, opcode);
    register(`${name} []`, opcode + 1);
};

const registerBinaryOperation = function(name, opcode) {

    /* This helper takes a binary mnemonic string and the base opcode for
    the mnemonic, and registers the required patterns and handlers. */

    register(`${name} <Number>`, i => [opcode, num(get(i, 0))]);
    register(`${name} <Index>`, i => [reg(opcode + 1, get(i, 0))]);
    register(`${name} []`, opcode + 4);
};

const registerBranchOperation = function(name, opcode) {

    /* This helper takes a branch mnemonic string and the base opcode for
    the mnemonic, and registers the required patterns and handlers. */

    register(name, opcode);
    register(`${name} <Number>`, i => [opcode + 1, num(get(i, 0))]);
    register(`${name} [<Number>]`, i => [opcode + 2, num(get(i, 0, 0))]);
    register(`${name} []`, opcode + 3);
};

const registerSimpleOperation = function(name, opcode) {

    /* This helper takes a mnemonic string for an instruction that operates
    on a single register (any register) and the base opcode for the mnemonic,
    and registers the required patterns and handlers. */

    register(`${name} <Register>`, i => [reg(opcode, get(i, 0))]);
};

//// REGISTER ALL OF THE INSTRUCTION GRAMMARS WITH THEIR HANDLERS...

register("done", 0x00);
register("halt", 0x01);
register("reset", 0x02);
register("return", 0x03);
register("nop", 0x04);

registerBranchOperation("race", 0x05);
registerBranchOperation("nudge", 0x09);
registerBranchOperation("jump", 0x0D);
registerBranchOperation("fork", 0x11);
registerBranchOperation("call", 0x15);
registerBranchOperation("lock", 0x1A);
registerBranchOperation("free", 0x1D);

register("set", 0x21);
registerSimpleOperation("set", 0x22);
register("clear", 0x28);
registerSimpleOperation("clear", 0x29);
registerSimpleOperation("copy", 0x2F);
registerSimpleOperation("sync", 0x35);

register("load [<Index>]", i => [reg(0x3B, get(i, 0, 0))]);
register("load <Number>", i => [0x3E, num(get(i, 0))]);
register("load [<Number>]", i => [0x3F, num(get(i, 0, 0))]);
register("load [<Number> <Index>]", i => [reg(0x40, get(i, 0, 1)), num(get(i, 0, 0))]);
register("load <Index> <Number>", i => [reg(0x43, get(i, 0)), num(get(i, 1))]);
register("load <Index> [<Number>]", i => [reg(0x46, get(i, 0)), num(get(i, 1, 0))]);

register("store [<Index>]", i => [reg(0x49, get(i, 0, 0))]);
register("store [<Number>]", i => [0x4C, num(get(i, 0, 0))]);
register("store [<Number> <Index>]", i => [reg(0x4D, get(i, 0, 1)), num(get(i, 0, 0))]);
register("store <Index> [<Number>]", i => [reg(0x50, get(i, 0)), num(get(i, 1, 0))]);

register("inc", 0x53);
register("inc <Index>", i => [reg(0x54, get(i, 0))]);
register("inc []", 0x57);
register("dec", 0x58);
register("dec <Index>", i => [reg(0x59, get(i, 0))]);
register("dec []", 0x5C);

registerBinaryOperation("add", 0x5D);
registerBinaryOperation("sub", 0x62);
registerBinaryOperation("addfx", 0x67);
registerBinaryOperation("subfx", 0x6C);
registerBinaryOperation("mul", 0x71);
registerBinaryOperation("div", 0x76);
registerBinaryOperation("mod", 0x7B);

registerBinaryOperation("eq", 0x80);
registerBinaryOperation("gt", 0x85);
registerBinaryOperation("lt", 0x8A);
registerBinaryOperation("neq", 0x8F);
registerBinaryOperation("ngt", 0x94);
registerBinaryOperation("nlt", 0x99);

registerBinaryOperation("and", 0x9E);
registerBinaryOperation("or", 0xA3);
registerBinaryOperation("xor", 0xA8);

registerBinaryOperation("zsh", 0xAD);
registerBinaryOperation("ssh", 0xB2);
registerBinaryOperation("lsh", 0xB7);
registerBinaryOperation("rot", 0xBC);

registerUnaryOperation("clz", 0xC1);
registerUnaryOperation("ctz", 0xC3);
registerUnaryOperation("nsa", 0xC5);

registerUnaryOperation("not", 0xC7);
registerUnaryOperation("truthy", 0xC9);
registerUnaryOperation("falsey", 0xCB);

register("push", 0xCD);
registerSimpleOperation("push", 0xCE);
register("pop", 0xD5);
registerSimpleOperation("pop", 0xD6);

register("drop", 0xDC);
register("dupe", 0xDD);
register("swap", 0xDE);
register("peek", 0xDF);
register("void", 0xE0);

register("queue", 0xE1);
registerSimpleOperation("queue", 0xE2);
register("queue <Number>", i => [0xE8, num(get(i, 0))]);
register("queue []", 0xE9);

register("flush", 0xEA);
register("drain", 0xEB);
register("array", 0xEC);

register("databank", 0xED);
register("codebank", 0xEE);
register("stackbank", 0xEF);
register("iobank", 0xF0)

register("copydata", 0xF1);
register("copycode", 0xF2);
register("copystack", 0xF3);
register("copyio", 0xF4);

register("ASSIGN <Number>", i => [num(get(i, 0))]); // pseudo-mnemonic

register("LOCATE <Number>", i => [0, num(get(i, 0))]);
register("LOCATE [<Number>]", i => [1, num(get(i, 0, 0))]);
register("LOCATE <Number> [<Number>]", i => [2, num(get(i, 0)), num(get(i, 1, 0))]);

register("DATA", function(instruction) {

    const output = new Array();

    for (const child of instruction.children) {

        const { type, value } = child;

        if (numericTypes.includes(type)) {

            if (vectorTypes.includes(type)) {

                throw new GrammaticalError("a Datum", child);

            } else output.push(num(child));

        } else if (type === "String") {

            for (const character of value) output.push(character.charCodeAt());

        } else if (type === "Newline") {

            for (const character of value) output.push(0x0A);

        } else throw new GrammaticalError("a Datum", child);

    } return output;
});
