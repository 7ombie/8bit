//// DEFINE MODULE-WIDE GLOBAL VARIABLES...

let PREVIOUS_TOKEN;

//// DEFINE A BUNCH OF USEFUL STRINGS, REGEXES AND ARRAYS...

const [empty, space, newline] = ["", " ", "\n"];
const [comma, colon, semicolon, hash] = [",", ":", ";", "#"];
const [opener, closer, openBrace, closeBrace] = ["[", "]", "{", "}"];
const [singlequote, doublequote, slash, backslash] = ["'", '"', "/", "\\"];

const digits = "0123456789";
const whitespace = space + newline;
const terminators = comma + newline;
const specials = comma + opener + closer;
const irregulars = specials + whitespace;
const emptyquotes = singlequote + singlequote;

const [indices, statuses] = [["x", "y", "z"], ["pc", "sp", "fx"]];

const mnemonics = [
    "nop", "return", "reset", "halt", "done",
    "jump", "fork", "call", "race", "nudge", "lock", "free",
    "set", "clear", "copy", "sync", "load", "store",
    "inc", "dec", "add", "sub", "addfx", "subfx", "mul", "div", "mod",
    "and", "or", "xor", "zsh", "ssh", "lsh", "rot",
    "eq", "gt", "lt", "neq", "ngt", "nlt",
    "not", "clz", "ctz", "nsa", "truthy", "falsey",
    "push", "pop", "drop", "dupe", "swap", "peek", "void",
    "queue", "flush", "drain", "array", "length",
    "databank", "codebank", "stackbank", "iobank",
    "copydata", "copycode", "copystack", "copyio",
];

//// DEFINE AND EXPORT THE ASCII CONTROL CHARACTER MAP...

export const controlCharacters = {
    NUL: 0x00, SOH: 0x01, STX: 0x02, ETX: 0x03,
    EOT: 0x04, ENQ: 0x05, ACK: 0x06, BEL: 0x07,
     BS: 0x08,  HT: 0x09,  LF: 0x0A,  VT: 0x0B,
     FF: 0x0C,  CR: 0x0D,  SO: 0x0E,  SI: 0x0F,
    DLE: 0x10, DC1: 0x11, DC2: 0x12, DC3: 0x13,
    DC4: 0x14, NAK: 0x15, SYN: 0x16, ETB: 0x17,
    CAN: 0x18,  EM: 0x19, SUB: 0x1A, ESC: 0x1B,
     FS: 0x1C,  GS: 0x1D,  RS: 0x1E,  US: 0x1F, DEL: 0x7F
};

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

    /* This is a custom error class for illegal characters in the
    source code. */

    constructor(character, ...location) {

        const ordinal = character.charCodeAt(0);
        const padding = ordinal < 0x10 ? "0" : "";
        const message = "0x" + padding + ordinal.toString(16).toUpperCase();

        super(`cannot scan charcode, ${message}`, ...location);
    }
}

class TokenError extends AssemblySyntaxError {

    /* This is a custom error class for invalid tokens. */

    constructor(value, ...location) {

        const message = `unrecognized token, ${value}`;

        super(message, ...location);
    }
}

class StringError extends AssemblySyntaxError {

    /* This is a custom error class for improperly terminated string
    literals */

    constructor(value, ...location) {

        const message = `invalid string literal, ${value}`;

        super(message, ...location);
    }
}

class EscapeCharacterError extends AssemblySyntaxError {

    /* This is a custom error class for invalid escape characters
    within string literals. */

    constructor(character, ...location) {

        const message = `invalid escape character, ${backslash}${character}`;

        super(message, ...location);
    }
}

//// DEFINE ANY LOCAL HELPER FUNCTIONS...

const not = arg => ! arg;

const trim = value => value.slice(1, -1);

const encode = function(character, ...location) {

    /* This helper takes a character string, as well as a line and
    column number (in case of an error). If the character is a known
    escape character, the corresponding character is returned, else
    a `EscapeCharacterError` is thrown. */

    const map = {n: newline, "\\": backslash, "\"": doublequote};

    if (character in map) return map[character];
    else throw new EscapeCharacterError(character, ...location);
};

const initialize = function(type, value, line, column) {

    /* This helper takes the arguments required to populate a token
    hash, which is returned, with the value swapped for a semicolon
    if a newline is given (just for convenience). */

    if (value === newline) value = semicolon;

    return {type, value, location: {line, column}};
};

const classify = function(value, line, column) {

    /* This function takes a token string, a line number and a column
    number. It attempts to classify the token to construct and return
    a token hash. The function throws an `TokenError` whenever an ill-
    egal token is discovered , and returns `undefined` whenever a
    valid, but redundant, newline is found. */

    const init = (type, token=value) => initialize(type, token, line, column);

    const previous = PREVIOUS_TOKEN; PREVIOUS_TOKEN = value;

    if (value === opener) return init("Opener");

    if (value === closer) return init("Closer");

    if (mnemonics.includes(value)) return init("Mnemonic");

    if (indices.includes(value)) return init("Index");

    if (statuses.includes(value)) return init("Status");

    if (isDigitalLiteral(value)) return init("Digit");

    if (isDecimalLiteral(value)) return init("Decimal");

    if (isHexadecimalLiteral(value)) return init("Hexadecimal");

    if (isCharacterLiteral(value)) return init("Character", trim(value));

    if (isLabelReference(value)) return init("Reference");

    if (isLabelAssignment(value)) return init("Assignment");

    if (terminators.includes(value)) {

        if (previous && isLexeme(previous)) return init("Terminator");
        else if (previous !== comma && value !== comma) return undefined;
        else throw new TerminationError(line, column);
    }

    throw new TokenError(value, line, column);
};

//// DEFINE THE BOOLEAN VALUE FUNCTIONS...

const isDecimalLiteral = function(value) {

    const regex = /^[+-][0-9]{1,3}$/;

    if (not(regex.test(value)) || value === "-0") return false;

    const number = parseInt(value);

    return number >= -128 && number <= +255;
};

const isCharacterLiteral = function(value) {

    if ((/^'[ -~]{1}'$/).test(value)) return true;
    else return trim(value) in controlCharacters;
};

const isDigitalLiteral = value => (/^[0-9]$/).test(value);

const isHexadecimalLiteral = value => (/^#[0-9A-F]{2}$/).test(value);

const isLabelReference = value => (/^[a-zA-Z][a-zA-Z0-9]*$/).test(value);

const isLabelAssignment = value => (/^[a-zA-Z][a-zA-Z0-9]*:$/).test(value);

const isLexeme = value => value && not(terminators.includes(value));

//// DEFINE AND EXPORT THE ENTRYPOINT TOKENIZER FUNCTION...

export const tokenize = function * (source) {

    /* This entrypoint generator takes a source string and yields its
    tokens one at a time. Note that line, column and terminal numbers
    are all one-indexed. */

    const on = candidates => candidates.includes(character);

    const at = candidates => candidates.includes(source[index + 1]);

    const comment = () => on(slash) && at(slash);

    const gatherCharacterLiteral = function() {

        /* This helper trys to gather a character literal and return it,
        throwing a `TokenError` if the literal is left unclosed or fails
        to classify correctly. */

        while (not(at(singlequote + newline)) && advance()) value += character;

        if (at(singlequote)) value += advance();
        else throw new TokenError(value, line, column);

        if (value !== emptyquotes) return classify(value, line, column);

        if (at(singlequote)) return classify(value + advance(), line, column);
        else throw new TokenError(value, line, column);
    };

    const gatherStringLiteral = function() {

        /* This helper trys to gather a character literal and return it,
        throwing a `StringError` if the literal is left unclosed. */

        let raw = doublequote; // keep the raw string (for error messages)

        const cat = (v, r) => { value += v; raw += r};

        while (not(at(doublequote + newline)) && advance()) {

            if (not(on(backslash))) cat(character, character);
            else cat(encode(advance(), line, column), backslash + character);
        }

        if (at([newline, undefined])) throw new StringError(raw, line, column);

        return initialize("String", trim(value + advance()), line, column);
    };

    const legal = function(character) {

        /* This helper takes a character, and returns a bool that is
        `true` for legal characters, and `false` otherwise. */

        if (character === newline) return true;

        let ordinal = character.charCodeAt(0);

        return not(ordinal < 0x20 || ordinal > 0x7F);
    };

    const advance = function() {

        /* This helper advances the lexer by a single character, updat-
        ing the nonlocal `character` and `index` variables, and return-
        ing the character too, all assuming it exists and is legal. The
        function returns `undefined` if the source has been exhausted,
        and will throw an `IllegalCharacter` error when appropriate. */

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

        if (comment()) do { advance() } while (character !== newline)

        [value, column] = [character, index - edge];

        if (on(newline)) { // line numbers and implicit terminators...

            const token = classify(value, line, column);

            [line, edge] = [line + 1, index];

            if (token) yield token;

        } else if (on(specials)) { // brackets and explicit terminators...

            yield classify(value, line, column);

        } else if (on(singlequote)) { // character literals...

            yield gatherCharacterLiteral();

        } else if (on(doublequote)) { // string literals...

            yield gatherStringLiteral();

        } else { // gather up regular characters into a token...

            while (not(at(irregulars)) && advance()) value += character;

            yield classify(value, line, column);
        }
    }

    // yield a terminator, if required, followed by an end-of-file token...

    if (token = classify(newline, line, index - edge)) yield token;

    yield initialize("EOF", ";", line, index - edge);
};
