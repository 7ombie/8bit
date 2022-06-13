String literals begin and end with a double-quote character, and cannot directly contain a double-quote character. For example:

    "Hello, World!"

It is also illegal for a string literal to directly contain any control character (newline, tab, carriage return *et cetera*).

Puzzles generally use a subset of ASCII that can be directly represented by a string literal. However, when required, the otherwise unavailable characters can be expressed using an *escape sequence*.

An *escape sequence* is a sequence of one or more space-separated *escape expressions*, wrapped in a pair of curly braces.

Each expression within a (valid) sequence expresses exactly one character.

The entire sequence (including the braces surrounding it) is replaced in the expressed string by the sequence of characters that is expressed by the escape sequence.

There are three types of escape expression: *ordinal expressions*, *reference expressions* and *named expressions*. An escape sequence can contain any combination of escape expressions (of any type).

Ordinal expressions use the same hexadecimal notation that is used by number literals (for example, `#00` or `#B1`). They express an arbitrary 8-bit character ordinal (digital and decimal notations are not supported).

Reference expressions have the same syntax and semantics as in the language generally. They are expressed with a label (`foo`, `bar` *et cetera*), and evaluate to whatever the label is currently assigned to.

A named expression is written as a sequence of one or more uppercase letters, which spell out the name of a character (like `NEWLINE`, `TAB` or `OPENBRACE`), or for the most commonly used control characters, a single-character alias (like `N`, `T` or `R`), or for the commonly escaped printables, a two-character alias (like `OB`, `CB` or `DQ`).

These *escape names* are defined by the language, and are documented in *Appendix C: Escape Names to Ordinals Mapping*.

Note: As curly braces are used to wrap escape sequences, they cannot appear in a string otherwise (and have their own names and aliases).

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
