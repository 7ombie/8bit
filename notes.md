The ZEN 80 is an 8-bit system, with absolutely no Unicode awareness.

Source files use a subset of ASCII which includes all of the printable characters, as well as the Line Feed character, which is the only legal newline character (and the only legal control character) allowed in a source file (no tabs).

The grammar uses the longest-match rule, which divides the character set into two groups of characters, *regular characters* and *special characters*. Tokenization treats special characters as single character tokens, and any unbroken sequence of regular characters as a multi-character token (always accepting the longest match).

The special characters are the Comma (`,`), both square brackets (`[]`) and both whitespace characters (Space and Line Feed). The remaining ASCII printables are all regular characters.

//// MAP THE ESCAPE NAMES TO THE CORRESPONDING ORDINALS...


DEVELOPER NOTES
===============

This file contains various implementation details.

THE PARSER
----------

When discussing the parser, the following terms are used:

+ Token: Any atomic sequence of characters, whether explicit or implied.
+ Terminator: Any Terminator token, whether explicit or implied.
+ Lexeme: Any token that is not a Terminator or EOF token.
+ Mnemonic: The name of any group of instructions or operations.
+ Qualifier: Any lexeme that is not an mnemonic.

FF 00 CORES
FF 01 BANKS
FF 02 LOCATION <Number>
FF 03 LOCATION [<Number>]
FF 04 LOCATION <Number> [<Number>]

``` txt



CORES 3, BANKS 2

score: #F0, lives: #F1

load pc #80, load sp #A0

LOCATION 3 [0], message: DATA "Hello, World!"

DATA 0 #30 3 +128

load x []

```


<program> : <instruction> <terminator> *

<instruction> : <assignment ?> <number>
              | <assignment ?> <data>
              | <assignment ?> <inst>

<data> : data <datum +>

<datum> : <number>
        | <string>

<inst> : <mnemonic> <qualifier *>

<qualifier> : <number>
            | <address>
            | <register>
            | <stack>

<address> : [ <register> ]
          | [ <number> ]
          | [ <number> <register> ]

<number>  : <digital>
          | <decimal>
          | <hexadecimal>
          | <reference>

<register> : x  | y  | z
           | pc | sp | fx
           | cb | sb | db

<stack> : $
