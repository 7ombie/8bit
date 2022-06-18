import { not, AssemblySyntaxError } from "./tokenize.js";
import { numericTypes, vectorTypes, registerTypes } from "./tokenize.js";
import { parse } from "./parse.js";

//// INITIALIZE MODULE-lEVEL GLOBAL VARIABLES...

const HANDLERS = Object.create(null);

//// DEFINE SOME USEFUL STRING ARRAYS...

const type2class = type => `<${type}>`;

const registerClasses = registerTypes.map(type2class);
const numericClasses = numericTypes.map(type2class);

//// DEFINE THE CUSTOM ERROR CLASS FOR THE CODEGEN MODULE...

class SemanticError extends AssemblySyntaxError {

    /* This custom error class is thrown when one kind of token was
    expected, but some other type was found. */

    constructor(instruction, pattern) {

        const { line, column } = instruction.location;

        super(`incomprehensible grammar, ${pattern}`, line, column);
    }
}

class AssignmentError extends AssemblySyntaxError {

    /* This custom error class is thrown when a reference uses a label
    that has already been assigned to. */

    constructor(label) {

        const { line, column } = label.location;
        const message = `label \`${label.value}\` is already assigned.`;

        super(message, line, column);
    }
}

class BankOverflowError extends AssemblySyntaxError {

    /* This custom error class is thrown when a bank overflows. */

    constructor(instruction, bank) {

        const { line, column } = instruction.location;
        const mnemonic = instruction.mnemonic;
        const type = instruction.directive ? "directive" : "instruction";
        const message = `the \`${mnemonic}\` ${type} overflowed Bank ${bank}.`;

        super(message, line, column);
    }
}

class VoidBankError extends AssemblySyntaxError {

    /* This custom error class is thrown when a locate-directive trys
    to select a bank which is unpopulated. */

    constructor(instruction, bank) {

        const { line, column } = instruction.location;
        const message = `Bank ${bank} is (currently) unpopulated.`;

        super(message, line, column);
    }
}

export class GrammaticalError extends AssemblySyntaxError {

    /* This custom error class is thrown when one type is expected
    and something else is found. Note that `parse.js` defines the
    same class, with a slightly different constructor. */

    constructor(expected, found) {

        const { line, column } = found.location;
        const type = vectorTypes.includes(found.type) ? "Vector" : found.type;
        const message = `expected ${expected} (not ${type}).`;

        super(message, line, column);
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

        let output = new Array();

        for (const child of children) if (child instanceof Array) {

            output.push(child.length ? `[${walk(child)}]` : "[]");

        } else output.push(`<${child.type}>`);

        return output.join(" ");
    };

    if (instruction.mnemonic === "DATA") return instruction.mnemonic;

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

        resolve(expand(pattern, "<Register>", ...registerClasses), handler);

    } else if (pattern.includes("<Number>")) {

        resolve(expand(pattern, "<Number>", ...numericClasses), handler);

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

//// DEFINE AND EXPORT THE ENTRYPOINT COMPILE FUNCTION...

export const compile = function (source, banks) {

    /* This function takes a source string, and the number of banks (taken
    from the UI). The function parses the source, then validates and final-
    izes each instruction (adding their `code` arrays, and their `bank` and
    `address` properties). The function also gathers any labels into a hash.
    All of this information is returned as a hash with four properties: The
    `instructions` array, a `labels` hash, and two integers, named `cores`
    and `banks`. Note that the `code` arrays in the instructions leave any
    References and Vector tokens unresolved, to be handled during the next
    phase (`assemble`), as the code needs to have been fully parsed to
    resolve forward-references *et cetera*. */

    const assign = function(label, address) {

        /* This local helper takes a label or `undefined`, and a value,
        and if the label is defined, the function assigns it to the value,
        unless the label is already assigned (an `AssignmentError`). */

        if (not(label)) return;
        else if (label.value in labels) throw new AssignmentError(label);
        else labels[label.value] = address;
    };

    let [address, bank] = [0, 0];

    const [instructions, labels] = [new Array(), Object.create(null)];

    for (const instruction of parse(source)) {

        const pattern = serialize(instruction);
        const handler = HANDLERS[pattern];

        if (handler) instructions.push(instruction);
        else throw new SemanticError(instruction, pattern);

        Object.assign(instruction, {address, bank, code: []});

        if (instruction.directive) { // assembler directives...

            if (instruction.mnemonic === "ASSIGN") {

                assign(instruction.label, handler(instruction)[0]);

            } else if (instruction.mnemonic === "DATA") {

                assign(instruction.label, address);

                instruction.code = handler(instruction);
                address += instruction.code.length;

            } else if (instruction.mnemonic === "LOCATE") {

                const [code, ...args] = handler(instruction);

                if (code === 0) bank = args[0];
                else if (code === 1) address = args[0];
                else [bank, address] = args;

                if (bank >= banks) throw new VoidBankError(instruction, bank);

                Object.assign(instruction, {address, bank});
                assign(instruction.label, address);
            }

        } else { // regular instructions...

            assign(instruction.label, address);

            instruction.code = handler(instruction);
            address += instruction.code.length;
        }

        if (address > 256) throw new BankOverflowError(instruction, bank);
    }

    return {instructions, labels};
};
