import { not, AssemblySyntaxError } from "./tokenize.js";
import { compile } from "./compile.js";

//// DEFINE THE CUSTOM ERROR CLASSES...

class VectorError extends AssemblySyntaxError {

    /* This custom error class is thrown when an implicit reference points
    to an instruction that is beyond the start or end of the current code,
    which runs from directive to directive. */

    constructor(reference, candidate, step) {

        const { line, column } = reference.location;
        const last = reference.value.length === step;
        const preposition = last ? "to" : "over";
        const problem = candidate ? "a directive" : "empty space";

        super(`cannot skip ${preposition} ${problem}.`, line, column);
    }
}

class ReferenceError extends AssemblySyntaxError {

    /* This custom error class is thrown when a reference uses a label
    that has not been assigned to. */

    constructor(label) {

        const { line, column } = label.location;
        const message = `label \`${label.value}\` has not been assigned.`;

        super(message, line, column);
    }
}

//// DEFINE THE ONLY LOCAL HELPER FUNCTION...

const initialize = function(userInput) {

    /* This helper takes a user input hash, compiles it to a program hash,
    adds a `memory` property with the given number of banks, and returns
    the result (ready for final assembly). */

    const banks = userInput.banks;
    const program = compile(userInput);
    const memory = Array(banks).fill().map(slot => new Uint8Array(256));

    Object.assign(program, {memory});

    return program;
};

//// DEFINE AND EXPORT THE ENTRYPOINT ASSEMBLER FUNCTION...

export const assemble = function(userInput) {

    /* This is the primary API function for the language assembler. It takes
    a user input hash, containing the source string (`source`) and the number
    of RAM banks (`banks`). The function assembles the source, and returns a
    regular array of `Uint8Array` instances, one per RAM bank, that are pop-
    ulated with the assembled code, with any references and vectors fully
    resolved (ready for execution). */

    const skip = function(token, bank, address, index, stepper) {

        /* This local helper takes a vector token, its bank and address, the
        index of the instruction it belongs to, and a function that expresses
        the operation (addition or subtraction) that determines the direction
        of the vector (forwards or backwards, respectively). Assuming a valid
        vector, the referenced address is written to `memory[bank][address]`.
        Otherwise, a `VectorError` is thrown. */

        let candidate;

        for (let step = 1; step <= token.value.length; step++) {

            candidate = instructions[stepper(index, step)];

            if (candidate && not(candidate.directive)) continue;
            else throw new VectorError(token, candidate, step);
        }

        memory[bank][address] = candidate.address;
    };

    const {memory, instructions, labels} = initialize(userInput);

    instructions.forEach(function(instruction, index) {

        instruction.code.forEach(function(byte, offset) {

            const bank = instruction.bank;
            const address = instruction.address + offset;

            if (byte instanceof Object) {

                if (byte.type === "Loop") {

                    skip(byte, bank, address, index, (i, s) => i - s);

                } else if (byte.type === "Skip") {

                    skip(byte, bank. address, index, (i, s) => i + s);

                } else if (byte.value in labels) {

                    memory[bank][address] = labels[byte.value];

                } else throw new ReferenceError(byte);

            } else memory[bank][address] = byte;
        });
    });

    return memory;
};
