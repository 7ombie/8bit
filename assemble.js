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

export const assemble = function * (source, banks) {

    const skip = function(token, index, stepper) {

        /* This local helper takes a vector token, the index of the current
        instruction, and a function that either adds or subtracts the step
        from the index (permitting the helper to skip in both directions).
        If the helper is able to complete the skip, then it returns the
        implied address. Otherwise, a `VectorError` is thrown. */

        let candidate;

        for (let step = 1; step <= token.value.length; step++) {

            candidate = instructions[stepper(index, step)];

            if (candidate && not(candidate.directive)) continue;
            else throw new VectorError(token, candidate, step);

        } return candidate.address;
    };

    const { instructions, labels } = compile(source, banks);

    console.log("LABELS:", labels);

    for (let index = 0; index < instructions.length; index++) {

        const instruction = instructions[index];

        console.log(instruction);

        for (const byte of instruction.code) if (byte instanceof Object) {

            if (byte.type === "Loop") { // resolve any references...

                yield skip(byte, index, (index, step) => index - step);

            } else if (byte.type === "Skip") {

                yield skip(byte, index, (index, step) => index + step);

            } else if (byte.type === "Reference") {

                if (byte.value in labels) yield labels[byte.value];
                else throw new ReferenceError(byte);
            }

        } else yield byte; // or just yield the given byte
    }
};
