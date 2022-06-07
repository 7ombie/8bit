import { tokenize, AssemblySyntaxError } from "./tokenize.js";

//// INITIALIZE MODULE-lEVEL GLOBAL VARIABLES...

let TOKEN, TOKENS;

//// DEFINE THE CUSTOM ERROR CLASSES FOR THE PARSER MODULE...

class GrammaticalError extends AssemblySyntaxError {

    /* This custom error class is thrown when one kind of token was
    expected, but some other type was found. */

    constructor(expected) {

        const { line, column } = TOKEN.location;
        const message = `Expected ${expected} (found ${TOKEN.type}).`;

        super(message, line, column);
    }
}

class NestingError extends AssemblySyntaxError {

    /* This custom error class is thrown when a memory expression is
    opened, and not closed before the instruction is terminated. */

    constructor() {

        const { line, column } = TOKEN.location;

        super("Instruction terminated while nested.", line, column);
    }
}

//// DEFINE ANY LOCAL HELPER FUNCTIONS...

const initialize = function(label) {

    /* This helper initializes an instruction hash, populates its
    child-array, adds the location of its termination, and returns
    the result. This helper leaves the parser on the terminator. */

    const instruction = Object.create(null);

    instruction.label = label?.value.slice(0, -1);

    instruction.mnemonic = TOKEN.value;
    instruction.location = TOKEN.location;
    instruction.children = gatherChildren();
    instruction.terminal = TOKEN.location;

    return instruction;
};

const advance = function() {

    /* This helper advances the token stream by one token, updating
    the global `TOKEN` variable, and returnig a reference to it. */

    return TOKEN = TOKENS.next().value;
};

const gatherChildren = function(nested=false) {

    /* This recursive function gathers the child token array of the
    current instruction. Memory expressions (in square brackets) are
    nested in their own array as a single child element. */

    const children = new Array();

    while (advance().type !== "Terminator") {

        if (TOKEN.type === "Opener") children.push(gatherChildren(true));
        else if (TOKEN.type === "Closer") return children;
        else children.push(TOKEN);
    }

    if (nested) { throw new NestingError() } else return children;
};

//// DEFINE AND EXPORT ENTRYPOINT PARSE FUNCTION...

export const parse = function * (source) {

    /* This entrypoint function takes a source string, tokenizes it,
    then parses the token stream into a parse tree that will be valid
    if the source is valid, and is easier to validate (during the next
    stage) in any case. */

    let label;

    TOKENS = tokenize(source);

    while (advance().type !== "EOF") {

        if (TOKEN.type === "Assignment") { label = TOKEN; advance() }
        else label = undefined;

        if (TOKEN.type === "Mnemonic") yield initialize(label);
        else throw new GrammaticalError("a Mnemonic");
    }
};
