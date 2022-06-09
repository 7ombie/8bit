import { AssemblySyntaxError } from "./tokenize.js";
import { parse } from "./parse.js";

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

const not = arg => ! arg;

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

//// DEFINE AND EXPORT THE API FOR DEFINING THE INSTRUCTION GRAMMARS...

export const register = function(...args) {

    /* This helper takes one or more pattern strings, followed by either
    a callback or a number (which is wrapped by a function that takes an
    instruction and returns an array containing the given number). Once
    the callback is sorted, the `reolve` function is used to actually
    resolve and register the given patterns (this function is really
    just a wrapper that offers a more convenient API). */

    const callback = args.pop();

    resolve(args, callback instanceof Function ? callback : i => [callback]);
};

export const registerUnaryOperation = function(name, opcode) {

    /* This helper takes a unary mnemonic string and the base opcode for
    the mnemonic (the lowest opcode used by the group). It registers the
    required handlers, computing any patterns and opcodes as required. */

    register(name, opcode);
    register(`${name} []`, opcode + 1);
};

export const registerBinaryOperation = function(name, opcode) {

    /* This helper takes a binary mnemonic string and the base opcode for
    the mnemonic, and registers the required patterns and handlers. */

    register(`${name} <Number>`, i => [opcode, num(get(i, 0))]);
    register(`${name} <Index>`, i => [reg(opcode + 1, get(i, 0))]);
    register(`${name} []`, opcode + 4);
};

export const registerBranchOperation = function(name, opcode) {

    /* This helper takes a branch mnemonic string and the base opcode for
    the mnemonic, and registers the required patterns and handlers. */

    register(name, opcode);
    register(`${name} <Number>`, i => [opcode + 1, num(get(i, 0))]);
    register(`${name} [<Number>]`, i => [opcode + 2, num(get(i, 0, 0))]);
    register(`${name} []`, opcode + 3);
};

export const registerSimpleOperation = function(name, opcode) {

    /* This helper takes a mnemonic string for an instruction that operates
    on a single register (any register) and the base opcode for the mnemonic,
    and registers the required patterns and handlers. */

    register(`${name} <Register>`, i => [reg(opcode, get(i, 0))]);
};

//// DEFINE AND EXPORT THE DSL FOR DEFINING THE INSTRUCTION GRAMMARS...

export const get = function(instruction, ...indices) {

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

export const reg = function(code, register) {

    /* This helper takes a base opcode (the lowest opcode in a mnemonic
    group) and a register token. It enumerates the register, adds the
    enumeration to the code, and returns the result. Also see `get`. */

    return code + ["x", "y", "z", "pc", "sp", "fx"].indexOf(register.value);
};

export const num = function(literal) {

    /* This helper takes some kind of number literal or reference, and
    returns its numerical value (resolving references automatically).
    Note that negative numbers are replaced with the equivalent
    positive number (-1 becomes +255 etc). Also see `get`. */

    let result;

    if (literal.type === "Reference") result = LABELS[literal.value];
    else result = parseInt(literal.value.replace("#", "0x"));

    return result >= 0 ? result : 256 + result;
};

//// DEFINE AND EXPORT THE ENTRYPOINT CODEGEN FUNCTION...

export const assemble = function * (source) {

    /* This entrypoint generator takes a source string, and compiles it to
    a binary (parsing instructions, and in turn, tokens, only as required).
    The generator yields each byte of the executable one by one (with each
    byte represented by an integer in the range 0x00 to 0xFF).

    The use of generators for each stage of the pipeline permits programs
    to be stepped through, executing one instruction at a time, even when
    there is a completely unparsable syntax error later in the source. */

    let address = 0;

    for (const instruction of parse(source)) {

        const pattern = serialize(instruction);
        const handler = HANDLERS[pattern];

        if (not(handler)) throw new SemanticError(instruction, pattern);

        if (instruction.label) LABELS[instruction.label] = address;

        const result = handler(instruction);

        address += result.length;

        yield * result;
    }
};
