import {not, tokenize } from "./tokenize.js";
import {numericTypes, AssemblySyntaxError } from "./tokenize.js";

//// INITIALIZE MODULE-lEVEL GLOBAL VARIABLES...

let TOKEN, TOKENS;

//// DEFINE THE CUSTOM ERROR CLASSES...

class GrammaticalError extends AssemblySyntaxError {

    /* This custom error class is thrown when one type is expected
    and something else wisas found. */

    constructor(expected) {

        const { line, column } = TOKEN.location;
        const message = `expected ${expected} (not ${TOKEN.type}).`;

        super(message, line, column);
    }
}

class NestingError extends AssemblySyntaxError {

    /* This custom error class is thrown when brackets are improperly
    nested within an instruction. */

    constructor(open) {

        /* This constructor takes a bool that indicates whether the
        issue was an opener without a closer or the opposite. */

        const { line, column } = TOKEN.location;

        if (open) super("instruction terminated while nested.", line, column);
        else super("closer found without a preceding Opener.", line, column);
    }
}

//// DEFINE ANY LOCAL HELPER FUNCTIONS...

const initialize = function(label) {

    /* This helper initializes an instruction (or directive) hash,
    populates its child-array, and returns the result, leaving the
    parser on the terminator. */

    const directives = ["CORES", "BANKS", "LOCATE", "DATA"];
    const instruction = Object.create(null);

    instruction.label = label;
    instruction.mnemonic = TOKEN.value;
    instruction.location = TOKEN.location;
    instruction.children = gatherChildren();
    instruction.directive = directives.includes(instruction.mnemonic);

    return instruction;
};

const assign = function(label) {

    /* This function implements `initialize` for the `ASSIGN` directive,
    which is special-cased, as it is implied in the source by assigning
    a label to a number literal. */

    const instruction = Object.create(null);

    instruction.label = label;
    instruction.mnemonic = "ASSIGN";
    instruction.location = label.location;
    instruction.children = [TOKEN];
    instruction.directive = true;

    if (advance().type === "Terminator") return instruction;
    else throw new GrammaticalError("a Terminator");
};

const gatherChildren = function(nested=false) {

    /* This recursive function gathers the child token array of the
    current instruction. Memory expressions (in square brackets) are
    nested in their own array as a single child element. */

    const children = new Array();

    while (advance().type !== "Terminator") {

        if (TOKEN.type === "Opener") children.push(gatherChildren(true));
        else if (TOKEN.type === "Closer") {

            if (nested) return children;
            else throw new NestingError(false);

        } else children.push(TOKEN);
    }

    if (nested) { throw new NestingError(true) } else return children;
};

const advance = function() {

    /* This helper advances the token stream by one token, updating
    the global `TOKEN` variable, and returnig a reference to it. */

    return TOKEN = TOKENS.next().value;
};

//// DEFINE AND EXPORT ENTRYPOINT PARSE FUNCTION...

export const parse = function * (userInput) {

    /* This entrypoint generator takes a source string, tokenizes it,
    then parses the token stream into a parse tree that will be valid
    if the source is valid, and is easier to validate (during the next
    stage) in any case. */

    let label;

    TOKENS = tokenize(userInput);

    while (advance().type !== "EOF") {

        if (TOKEN.type === "Assignment") { label = TOKEN; advance() }
        else label = undefined;

        const type = TOKEN.type;

        if (type === "Mnemonic") yield initialize(label);
        else if (label && numericTypes.includes(type)) yield assign(label);
        else throw new GrammaticalError("a Mnemonic");
    }
};
