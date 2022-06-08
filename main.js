import { AssemblySyntaxError } from "./tokenize.js";
import { parse } from "./parse.js";
import { put, not } from "./helpers.js";

//// DEFINE SOME USEFUL STRING ARRAYS...

const registers = ["<Index>", "<Status>"];
const numbers = ["<Digit>", "<Decimal>", "<Hexadecimal>", "<Reference>"];

//// INITIALIZE MODULE-lEVEL GLOBAL VARIABLES...

const LABELS = Object.create(null);
const HANDLERS = Object.create(null);

//// DEFINE THE CUSTOM ERROR CLASS FOR THE CODEGEN MODULE...

class SemanticError extends AssemblySyntaxError {

    /* This custom error class is thrown when one kind of token was
    expected, but some other type was found. */

    constructor(instruction, pattern) {

        const { line, column } = instruction.location;

        super(`Incomprehensible grammar \`${pattern}\`.`, line, column);
    }
}

//// DEFINE THE LOCAL HELPER FUNCTIONS...

const serialize = function(instruction) {

    /* This helper takes an instruction with a (possibly nested) array
    of child-tokens, and deterministically converts it to an abstract
    grammar (expressed as a string), and retuns the result. */

    const walk = function (children) {

        /* This internal helper recursively parses any child-tokens,
        converting them into a string and returning it. */

        let output = [];

        for (let child of children) if (child instanceof Array) {

            output.push(child.length ? `[${walk(child)}]` : "[]");

        } else output.push(`<${child.type}>`);

        return output.join(" ");
    };

    const children = walk(instruction.children);

    if (children.length) return `${instruction.mnemonic} ${children}`;
    else return instruction.mnemonic;
};

const get = function(instruction, ...indices) {

    /* This helper takes an instruction and one or two indices. It uses
    the first index to refer to a child of the instruction. When present,
    the second index is used to index the child (which implies an array).
    In either case, the function returns the result.

    This function compliments `reg` and `num`, and together these three
    helpers form a mini DSL that can be used to easily define callbacks
    suitable for passing to `register`. */

    const [x, y] = indices;
    const children = instruction.children;

    return indices.length === 1 ? children[x] : children[x][y];
};

const reg = function(code, register) {

    /* This helper takes a base opcode (the lowest opcode in a mnemonic
    group) and a register token. It enumerates the register, adds the
    enumeration to the code, and returns the result. Also see `get`. */

    return code + ["x", "y", "z", "pc", "sp", "fx"].indexOf(register.value);
};

const num = function(literal) {

    /* This helper takes some kind of number literal or reference, and
    returns its numerical value (resolving references automatically).
    Note that negative numbers are replaced with the equivalent
    positive number (-1 becomes +255 etc). Also see `get`. */

    let result;

    if (literal.type === "Reference") result = LABELS[literal.value];
    else result = parseInt(literal.value.replace("#", "0x"));

    return result >= 0 ? result : 256 + result;
};

const resolve = function(patterns, handler) {

    /* This helper takes an array of patterns and their handler, and
    registers each pattern with its handler. However, before regist-
    ering any patterns, the helper expands any abstract classes used
    in any pattern by generating a complete set of new patterns that
    each replace the first instance of the abstract class with one
    of its subclasses, recusively, matching every possible combin-
    ation of concrete classes (`serialize` returns patterns that
    always use the concrete classes). */

    const expand = function(pattern, target, ...group) {

        /* This helper takes a pattern string, a target token class and
        a group of args containing each of the target's subclasses. The
        helper returns an array of patterns, each replacing the first
        occurrence of the target class with one of its subclasses. */

        return group.map(item => pattern.replace(target, item));
    };

    // expand and recur for any abstract classes, registering patterns
    // that only contain concrete classes...

    for (let pattern of patterns) if (pattern.includes("<Register>")) {

        resolve(expand(pattern, "<Register>", ...registers), handler);

    } else if (pattern.includes("<Number>")) {

        resolve(expand(pattern, "<Number>", ...numbers), handler);

    } else HANDLERS[pattern] = handler;
};

const register = function(...args) {

    /* This helper takes one or more pattern strings, followed by either
    a callback or a number (which is wrapped by a function that takes an
    instruction and returns an array containing the given number). Once
    the callback is sorted, the `reolve` function is used to actually
    resolve and register the given patterns (this function is really
    just a wrapper that offers a more convenient API). */

    const callback = args.pop();

    resolve(args, callback instanceof Function ? callback : i => [callback]);
};

const registerALUOperation = function(name, code) {

    /* This helper takes a ALU Operation mnemonic name string and the base
    opcode for the mnemonic (the lowest opcode used by the group). The
    function registers the required handlers, computing patterns and
    opcodes as needed. */

    register(`${name} <Number>`, i => [code, num(get(i, 0))]);
    register(`${name} <Index>`, i => [reg(code + 1, get(i, 0))]);
    register(`${name} []`, code + 4);
};

const registerBranchOperation = function(name, code) {

    /* This helper takes a Branch Operation mnemonic name string and the
    base opcode for the mnemonic, and registers the required handlers. */

    register(name, code);
    register(`${name} <Number>`, i => [code + 1, num(get(i, 0))]);
    register(`${name} [<Number>]`, i => [code + 2, num(get(i, 0, 0))]);
    register(`${name} []`, code + 3);
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

register("set", 0x19);
register("set <Register>", i => [reg(0x1A, get(i, 0))]);

register("clear", 0x20);
register("clear <Register>", i => [reg(0x21, get(i, 0))]);

register("copy <Register>", i => [reg(0x27, get(i, 0))]);

register("sync <Register>", i => [reg(0x2D, get(i, 0))]);

register("load <Number>", i => [0x33, num(get(i, 0))]);
register("load [<Index>]", i => [reg(0x34, get(i, 0, 0))]);
register("load [<Number>]", i => [0x37, num(get(i, 0, 0))]);

register("load [<Number> <Index>]", i => {

    return [reg(0x38, get(i, 0, 1)), num(get(i, 0, 0))];
});

register("load <Index> <Number>", i => {

    return [reg(0x3B, get(i, 0)), num(get(i, 1))];
});

register("load <Index> [<Number>]", i => {

    return [reg(0x3E, get(i, 0)), num(get(i, 1, 0))];
});

register("store [<Index>]", i => [reg(0x41, get(i, 0, 0))]);
register("store [<Number>]", i => [0x44, num(get(i, 0, 0))]);

register("store [<Number> <Index>]", i => {

    return [reg(0x45, get(i, 0, 1)), num(get(i, 0, 0))];
});

register("store <Index> [<Number>]", i => {

    return [reg(0x48, get(i, 0)), num(get(i, 1, 0))];
});

registerALUOperation("add", 0x48);
registerALUOperation("sub", 0x4D);
registerALUOperation("mul", 0x52);
registerALUOperation("div", 0x57);

//// DEFINE AND EXPORT THE ENTRYPOINT CODEGEN FUNCTION...

const generate = function (source) {

    let address = 0;

    for (let instruction of parse(source)) {

        const pattern = serialize(instruction);
        const handler = HANDLERS[pattern];

        if (instruction.label) LABELS[instruction.label] = address;

        if (handler) {

            const result = handler(instruction);

            address += result.length;

            put(...result, pattern)

        } else throw new SemanticError(instruction, pattern);
    }
};




const source = `
loop: add -3, add x, loop: add y
add []
sub +128, sub z, sub y
loop: sub [], sub loop
spam: fork, fork spam, fork [], fork [+150]
done, halt, reset, return
race, race loop, race [spam], nop, race [+10]
set, set x, set z, set pc, set sp, set fx
clear x, clear fx, clear
copy x, copy pc, copy sp
sync fx, sync y
load 4, load loop
load [x], load [y], load [9], load [spam]
load [spam x], load [#3E y]
load y 6, load z #CC, load y [6], load z [#CC]

store [x], store [y], store [9], store [spam]
store [spam x], store [#3E y]
store y [6], store z [#CC]
`;

generate(source);

// for (let byte of generate(source)) put(byte);
