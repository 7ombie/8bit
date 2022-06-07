DEVELOPER NOTES
===============

This file contains various implementation details.

THE PARSER
----------

When discussing the parser, the following terms are often used:

+ Token: Any atomic sequence of characters, whether explicit or implied.
+ Terminator: Any Terminator token, whether explicit or implied.
+ Lexeme: Any token that is not a Terminator or EOF token.
+ Operator: Any lexeme that is an instruction mnemonic.
+ Qualifier: Any lexeme that is not an operator.

The names used for the instruction classes follow a naming convention that
allows the classes to be referenced programatically. Each class name begins
with the mnemonic in fullcaps. The mnemonic is followed by zero or more
underscore-separated groups of uppercase letters. These groups refer
to the various kinds of expression:

    Code    Syntax          # * Parameters (Operands/Addresses/Destinations)
    ------------------------------------------------------------------------
            op              1 * The Accumulator, Stack or Pipe (implicit)
    S       op []           1 * The Stack
    X       op x            1 * The X Register
    Y       op y            1 * The Y Register
    Z       op z            1 * The Z Register
    I       op 0            1 * The given immediate
    A       op [0]          1 * The given address
    XA      op [x]          1 * The address in the X Register
    YA      op [y]          1 * The address in the Y Register
    ZA      op [z]          1 * The address in the Z Register
    AX      op [0 x]        1 * The given address X-Indexed
    AY      op [0 y]        1 * The given address Y-Indexed
    AZ      op [0 z]        1 * The given address Z-Indexed
    X_I     op x 0          2 * [The X Register, the given immediate]
    Y_I     op y 0          2 * [The Y Register, the given immediate]
    Z_I     op z 0          2 * [The Z Register, the given immediate]
    X_A     op x [0]        2 * [The X Register, the given address]
    Y_A     op y [0]        2 * [The Y Register, the given address]
    Z_A     op z [0]        2 * [The Z Register, the given address]

Note: Instructions that have no parameter, have no groups of initials. Any
instruction with a single parameter has single group of initials, while the
instructions that use two parameters, have two groups of initials.

For example, the class for the `inc` instruction is named `INC`, the class
for `load [#100 y]` is named `LOAD_AY`, and the class for `store z [+128]`
is named `STORE_Z_A`.

The static `Instruction.reference` helper method is used throughout the
parser module to reference `Instruction` subclasses by name, using the
conventions documented above.
