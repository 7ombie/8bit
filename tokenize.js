import { put, not } from "./helpers.js";

//// DEFINE MODULE-WIDE GLOBAL VARIABLES...

let PREVIOUS_TOKEN;

//// DEFINE A BUNCH OF USEFUL STRINGS, REGEXES AND ARRAYS...

const [comma, colon, semicolon, hash, slash] = [",", ":", ";", "#", "/"];
const [space, newline, opener, closer] = [" ", "\n", "[", "]"];

const digits = "0123456789";
const unused = "(){}!@$%^&*=;'`<>?|/\\\"";

const whitespace = space + newline;
const terminators = comma + newline;
const specials = comma + opener + closer;
const irregulars = specials + whitespace;

export const indices = ["x", "y", "z"];
export const status = ["pc", "sp", "fx"];

export const indexMnemonics = ["inc", "dec"];
export const memoryMnemonics = ["load", "store"];
export const dataMnemonics = ["set", "clear", "copy", "sync",];
export const flowMnemonics = ["nop", "return", "reset", "halt", "done"];
export const bankMnemonics = ["databank", "codebank", "stackbank", "iobank"];
export const copyMnemonics = ["copydata", "copycode", "copystack", "copyio"];
export const stackMnemonics = ["push", "pop", "drop", "swap", "dupe"];
export const pipeMnemonics = ["queue", "flush", "drain", "count"];

export const unaryMnemonics = [
    "not", "truthy", "falsey", "clt", "ctz", "nsa",
];

export const binaryMnemonics = [
    "add", "sub", "mul", "div", "mod",
    "and", "or", "xor", "shr", "shl", "rtr", "rtl",
    "eq", "gt", "lt", "neq", "ngt", "nlt"
];

export const branchMnemonics = [
    "jump", "fork", "call","race", "nudge", "lock", "free"
];

export const mnemonics = Array()
    .concat(dataMnemonics)
    .concat(memoryMnemonics)
    .concat(indexMnemonics)
    .concat(unaryMnemonics)
    .concat(binaryMnemonics)
    .concat(branchMnemonics)
    .concat(flowMnemonics)
    .concat(bankMnemonics)
    .concat(copyMnemonics)
    .concat(stackMnemonics)
    .concat(pipeMnemonics);

const reference = /^[a-zA-Z][a-zA-Z0-9]*$/;
const assignment = /^[a-zA-Z][a-zA-Z0-9]*:$/;

const [dig, dec, hex] = [/^[0-9]$/, /^[+-][0-9]{1,3}$/, /^#[0-9A-F]{2}$/];

//// DEFINE CUSTOM SYNTAX ERROR CLASSES...

export class AssemblySyntaxError extends Error {

    /* This is an abstract base class for syntax errors. */

    constructor(message, line, column) {

        super(message);

        this.name = `${this.constructor.name}[${line}:${column}]`;
        this.stack = this.stack.split(newline)[0];
    }
}

class CharacterError extends AssemblySyntaxError {

    /* This is a custom error class for illegal characters in the source. */

    constructor(character, ...location) {

        const ordinal = character.charCodeAt(0);
        const padding = ordinal < 0x10 ? "0" : "";
        const message = "0x" + padding + ordinal.toString(16).toUpperCase();

        super(`Cannot scan \`${message}\`.`, ...location);
    }
}

class TokenError extends AssemblySyntaxError {

    /* This is a custom error class for invalid tokens. */

    constructor(value, line, column) {

        const message = `Cannot classify \`${value}\`.`;

        super(message, line, column);
    }
}

class TerminationError extends AssemblySyntaxError {

    /* This is a custom error class for commas immediately following
    another other terminal. */

    constructor(...location) {

        super("Empty instructions are not allowed.", ...location);
    }
}

//// DEFINE ANY LOCAL HELPER FUNCTIONS...

const decimal = function(value) {

    /* This function takes a token value string and returns a bool to
    indicate whether the value is a decimal number in the 8-bit range,
    (allowing for two's-compliment expressions) or not. */

    if (not(dec.test(value)) || value === "-0") return false;

    const number = parseInt(value);

    return number >= -128 && number <= +255;
};

const lexeme = function(value) {

    /* This function takes a token value string and returns a bool to
    indicate whether the value is a lexeme (a non-terminator) or not.
    Note that the function does not check for EOF tokens, as it will
    never be called that late in the process. */

    return not(terminators.includes(value));
};

const initialize = function(type, value, line, column, terminal=undefined) {

    /* This helper takes the arguments required to populate a token
    hash, which is returned, with the value swapped for a semicolon
    if a newline is given (just for convenience). */

    if (value === newline) value = semicolon;

    if (terminal === undefined) terminal = column + 1;

    return {type, value, location: {line, column, terminal}};
};

const classify = function(value, line, column, end) {

    /* This function takes a token string, a line number and a column
    number. It attempts to classify the token to construct and return
    a token hash. The function throws an `TokenError` whenever an ill-
    egal token is discovered , and returns `undefined` whenever a
    valid, but redundant, newline is found. */

    const init = type => initialize(type, value, line, column, end);

    const previous = PREVIOUS_TOKEN; PREVIOUS_TOKEN = value;

    if (value === opener) return init("Opener");

    if (value === closer) return init("Closer");

    if (mnemonics.includes(value)) return init("Mnemonic");

    if (indices.includes(value)) return init("Index");

    if (status.includes(value)) return init("Status");

    if (reference.test(value)) return init("Reference");

    if (assignment.test(value)) return init("Assignment");

    if (dig.test(value)) return init("Digit");

    if (hex.test(value)) return init("Hexadecimal");

    if (decimal(value)) return init("Decimal");

    if (terminators.includes(value)) {

        if (previous && lexeme(previous)) return init("Terminator");
        else if (previous !== comma && value !== comma) return undefined;
        else throw new TerminationError(line, column);
    }

    throw new TokenError(value, line, column);
};

//// DEFINE AND EXPORT THE ENTRYPOINT TOKENIZER FUNCTION...

export const tokenize = function * (source) {

    /* This generator function takes a source string and yields its
    tokens one at a time, as `Token` subclasses. Note that line and
    column numbers are one-indexed. */

    const on = candidates => candidates.includes(character);

    const at = candidates => candidates.includes(source[index + 1]);

    const comment = () => on(slash) && at(slash);

    const legal = function(character) {

        /* This helper takes a character, and returns a bool that is `true`
        for legal characters, and `false` otherwise. */

        if (character === newline) return true;
        else if (unused.includes(character)) return false;

        let ordinal = character.charCodeAt(0);

        return not(ordinal < 0x20 || ordinal > 0x7F);
    };

    const advance = function() {

        /* This helper advances the lexer by a single character, updating
        the nonlocal `character` and `index` variables, and returning the
        character too, all assuming it exists and is legal. The function
        returns `undefined` if the source has been exhausted, and will
        throw an `IllegalCharacter` error where appropriate. */

        if ((character = source[++index]) === undefined) return;

        if (legal(character)) return character;
        else throw new CharacterError(character, line, index - edge);
    };

    // initialize the local variables that are accessed throughout this
    // function and the functions defined inside it...

    let [character, value, token] = ["", "", undefined];
    let [index, line, column, edge] = [-1, 1, 1, -1];

    // gather and yield one token per iteration (ignoring comments and
    // insignificant whitespace)...

    while (advance()) {

        if (on(space)) continue;
        else if (comment()) do { advance() } while (character !== newline)

        [value, column, token] = [character, index - edge, undefined];

        if (on(newline)) { // line numbers and implicit terminators...

            token = classify(value, line, column);

            [line, edge] = [line + 1, index];

        } else if (on(specials)) { // brackets and explicit terminators...

            token = classify(value, line, column);

        } else { // gather up regular characters into a token...

            while (not(at(irregulars)) && advance()) value += character;

            token = classify(value, line, column, index - edge + 1);
        }

        if (token) yield token; // note: `classify` may return `undefined`
    }

    // yield a terminator, if required, followed by an end-of-file token...

    if (token = classify(newline, line, index - edge)) yield token;

    yield initialize("EOF", "EOF", line, index - edge);
};
