import { not, AssemblySyntaxError } from "./tokenize.js";
import { compile } from "./compile.js";

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

//// DEFINE AND EXPORT THE ENTRYPOINT CODEGEN FUNCTION...

export const assemble = function(userInput) {

    /* This is the primary API function for the language assembler. It takes
    a source string and the number of RAM banks in the system, and assembles
    the source, returning an array of `Uint8Array(256)`s, one per RAM bank,
    populated with the assembled code, ready for execution. */

    const init = banks => Array(banks).fill().map(slot => new Uint8Array(256));

    const skip = function(token, bank, address, index, stepper) {

        /* This local helper takes a vector token, its bank and address, the
        index of the instruction it belongs to, and a function that expresses
        the operation (addition or subtraction) that determines the direction
        of the vector. If the vector is valid, the implied address is written
        to `ram`. Otherwise, a `VectorError` is thrown. */

        let candidate;

        for (let step = 1; step <= token.value.length; step++) {

            candidate = instructions[stepper(index, step)];

            if (candidate && not(candidate.directive)) continue;
            else throw new VectorError(token, candidate, step);
        }

        ram[bank][address] = candidate.address;
    };

    const ram = init(userInput.banks);
    const {instructions, labels} = compile(userInput);

    instructions.forEach(function(instruction, index) {

        instruction.code.forEach(function(byte, offset) {

            const bank = instruction.bank;
            const address = instruction.address + offset;

            if (byte instanceof Object) { // vectors and references...

                if (byte.type === "Loop") {

                    skip(byte, bank, address, index, (i, s) => i - s);

                } else if (byte.type === "Skip") {

                    skip(byte, bank. address, index, (i, s) => i + s);

                } else if (byte.value in labels) {

                    ram[bank][address] = labels[byte.value];

                } else throw new ReferenceError(byte);

            } else ram[bank][address] = byte; // ready, compiled bytes...
        });
    });

    return ram;
};
