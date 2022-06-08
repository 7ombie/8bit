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

const enumerate = function(register) {

    /* This helper takes a register token and returns its associated
    enumeration (from `0` to `5`, inclusive). */

    return ["x", "y", "z", "pc", "sp", "fx"].indexOf(register.value);
};

const evaluate = function(literal) {

    /* This helper takes some kind of number literal or reference, and
    returns its numerical value (resolving references automatically).
    Note that negative numbers are replaced with the equivalent
    positive number (-1 becomes +255 etc). */

    let result;

    if (literal.type === "Reference") result = LABELS[literal.value];
    else result = parseInt(literal.value.replace("#", "0x"));

    return result >= 0 ? result : 256 + result;
};

const get = function(instruction, ...indices) {

    /* This helper takes an instruction and one or two indices. It uses
    the first index to refer to a child of the instruction. When present,
    the second index is used to index the child (which implies an array).
    In either case, the function returns the result. */

    const [x, y] = indices;
    const children = instruction.children;

    return indices.length === 1 ? children[x] : children[x][y];
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

    register(`${name} <Number>`, i => [code, evaluate(get(i, 0))]);
    register(`${name} <Index>`, i => [code + 1 + enumerate(get(i, 0))]);
    register(`${name} []`, code + 4);
};

const registerBranchOperation = function(name, code) {

    /* This helper takes a Branch Operation mnemonic name string and the
    base opcode for the mnemonic, and registers the required handlers. */

    register(name, code);
    register(`${name} <Number>`, i => [code + 1, evaluate(get(i, 0))]);
    register(`${name} [<Number>]`, i => [code + 2, evaluate(get(i, 0, 0))]);
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
registerBranchOperation("fork", 0x21);

registerALUOperation("add", 0x48);
registerALUOperation("sub", 0x4D);
registerALUOperation("mul", 0x52);
registerALUOperation("div", 0x57);

register("push", 0xA0);
register("push <Register>", i => [0xA1 + enumerate(get(i, 0))]);
register("push <Number>", i => [0xA7, evaluate(get(i, 0))]);

register("load <Index> [<Number>]", i => {

    const register = enumerate(get(i, 0));
    const address = evaluate(get(i, 1, 0));

    return [0x09 + register, address];
});

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
load x [#80]
push, push pc, push x, push 7
`;

generate(source);

// for (let byte of generate(source)) put(byte);
