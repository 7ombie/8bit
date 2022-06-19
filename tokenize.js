//// DECLARE THE ONLY MODULE-WIDE GLOBAL VARIABLE...

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

const indices = ["x", "y", "z"];
const statuses = ["pc", "sp", "fx"];
const pointers = ["cb", "sb", "db"];

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
    "LOCATE", "DATA"
];

const words = mnemonics.concat(indices).concat(statuses).concat(pointers);

export const vectorTypes = ["Loop", "Skip"];
export const registerTypes = ["Index", "Status", "Pointer"];
export const numericTypes = [
    "Digit", "Decimal", "Hexadecimal",
    "Loop", "Skip", "Character", "Reference"
];

//// DEFINE AND EXPORT THE HELPERS AND THE ASCII CONTROL CHARACTER MAP...

export const not = arg => ! arg;

export const merge = (target, values) => Object.assign(target, values);

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

//// DEFINE CUSTOM SYNTAX ERROR CLASSES AND EXPORT THE BASE CLASS...

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

class LabelError extends AssemblySyntaxError {

    /* This is a custom error class for assignments to language words. */

    constructor(word, ...location) {

        const message = `a language word (${word}) cannot be used as a label.`;

        super(message, ...location);
    }
}

//// DEFINE THE VALUE-TYPE-TEST BOOLEAN FUNCTIONS...

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

const isLabelAssignment = value => (/^[a-zA-Z][a-zA-Z0-9]*:$/).test(value);

const isLabelReference = value => (/^[a-zA-Z][a-zA-Z0-9]*$/).test(value);

const isLoop = value => (/^<{1,4}$/).test(value);

const isSkip = value => (/^>{1,4}$/).test(value);

const isNewline = value => (/^\|{1,2}$/).test(value);

const isLexeme = value => value && not(terminators.includes(value));

//// DEFINE THE LOCAL HELPER FUNCTIONS...

const trim = value => value.slice(1, -1);

const trimtail = value => value.slice(0, -1);

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

    if (pointers.includes(value)) return init("Pointer");

    if (isDigitalLiteral(value)) return init("Digit");

    if (isDecimalLiteral(value)) return init("Decimal");

    if (isHexadecimalLiteral(value)) return init("Hexadecimal");

    if (isCharacterLiteral(value)) return init("Character", trim(value));

    if (isLoop(value)) return init("Loop");

    if (isSkip(value)) return init("Skip");

    if (isNewline(value)) return init("Newline");

    if (isLabelReference(value)) return init("Reference");

    if (isLabelAssignment(value)) {

        const label = trimtail(value);

        if (words.includes(label)) throw new LabelError(label, line, column);
        else return init("Assignment", label);
    }

    if (terminators.includes(value)) {

        if (previous && isLexeme(previous)) return init("Terminator");
        else if (previous !== comma && value !== comma) return undefined;
        else throw new TerminationError(line, column);
    }

    throw new TokenError(value, line, column);
};

//// DEFINE AND EXPORT THE API TOKENIZER FUNCTION...

export const tokenize = function * (userInput) {

    /* This entrypoint generator takes a source string and yields its
    tokens one at a time. Note that line, column and terminal numbers
    are all one-indexed. */

    const on = candidates => candidates.includes(character);

    const at = candidates => candidates.includes(userInput.source[index + 1]);

    const validateCloseQuote = function(value) {

        /* This helper takes a Character or String literal that has
        just been parsed (including the closing quote). The function
        raises a `TokenError` if the literal is immediately followed
        by a regular token. Otherwise, it returns `undefined`. */

        let raw = value;

        while (not(at(irregulars)) && advance()) raw += character;

        if (raw !== value) throw new TokenError(raw, line, column);
    };

    const gatherCharacterLiteral = function() {

        /* This helper trys to gather a character literal and return it,
        throwing a `TokenError` if the literal is left unclosed or fails
        to classify correctly. The function correctly handles singlequote
        character literals, which are spelled with three singlequotes. */

        while (not(at(singlequote + newline)) && advance()) value += character;

        if (at(singlequote)) value += advance();
        else throw new TokenError(value, line, column);

        if (value === emptyquotes) {

            if (at(singlequote)) value += advance();
            else throw new TokenError(value, line, column);
        }

        validateCloseQuote(value);

        return classify(value, line, column);
    };

    const gatherStringLiteral = function() {

        /* This helper trys to gather a string literal and return it. It
        throws a `TokenError` if the literal is empty, left unclosed, or
        the closing quote is immediately followed by a *regular* token. */

        while (not(at(doublequote + newline)) && advance()) value += character;

        if (not(at(doublequote))) throw new TokenError(value, line, column);

        if (value === doublequote) throw new TokenError('""', line, column);

        validateCloseQuote(value += advance());

        return initialize("String", trim(value), line, column);
    };

    const advance = function() {

        /* This helper advances the lexer by a single character, updat-
        ing the nonlocal `character` and `index` variables, and return-
        ing the character too, all assuming it exists and is legal. The
        function returns `undefined` if the source has been exhausted,
        and will throw an `IllegalCharacter` error when appropriate. */

        const legal = function(character) {

            /* This helper returns a bool indicating whether the given
            character is legal or not. */

            if (character === newline) return true;

            let ordinal = character.charCodeAt(0);

            return not(ordinal < 0x20 || ordinal > 0x7F);
        };

        if (not(character = userInput.source[++index])) return undefined;

        if (legal(character)) return character;
        else throw new CharacterError(character, line, index - edge);
    };

    let [character, value, token] = ["", "", undefined];
    let [index, line, column, edge] = [-1, 1, 1, -1];

    PREVIOUS_TOKEN = undefined;

    while (advance()) {

        if (on(space)) continue; // redundant whitespace and comments...

        if (on(slash) && at(slash)) do { advance() } while (not(on(newline)))

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
