instructions = """
### CONTROL FLOW INSTRUCTIONS ###

DONE                1, 1
HALT                1, 1
NUKE                1, 1
NOOP                1, 1

RETURN              1, 1 if PL == 0 else 2

JUMP                1, 1
JUMP <Number>       2, 2

FORK                1, 1
FORK <Number>       2, 2

ELSE                1, 1
ELSE <Number>       2, 2

CALL                1, 1 if PL == 0 else 2
CALL <Number>       2, 2 if PL == 0 else 3

RACE                1, 1
RACE <Number>       2, 2

POKE                1, 1
POKE <Number>       2, 2

LOCK                1, 2
LOCK <Number>       2, 3

FREE                1, 2
FREE <Number>       2, 3

### BLOCK INSTRUCTIONS ###

READ                1, 1 + (1 per 8-byte block)
WRITE               1, 1 + (1 per 8-byte block)

ADDRESS             1, 1
ADDRESS <Number>    1, 1

EXECUTE             1, 1
EXECUTE <Number>    1, 1

OPERATE             1, 1
OPERATE <Number>    1, 1 (rename to TRACE, CONJURE, ARRANGE or ACCOUNT ??)

### REGISTER INSTRUCTIONS ###

SET                 1, 1
SET x               1, 1
SET y               1, 1
SET z               1, 1

RESET               1, 1
RESET x             1, 1
RESET y             1, 1
RESET z             1, 1

COPY x              1, 1
COPY y              1, 1
COPY z              1, 1
COPY pc             1, 1
COPY sp             1, 1
COPY fx             1, 1
COPY cb             1, 1
COPY sb             1, 1
COPY db             1, 1

SYNC x              1, 1
SYNC y              1, 1
SYNC Z              1, 1
SYNC pc             1, 1
SYNC sp             1, 1
SYNC fx             1, 1
SYNC cb             1, 1
SYNC sp             1, 1
SYNC db             1, 1

LOAD [x]            1, 2
LOAD [y]            1, 2
LOAD [z]            1, 2

LOAD <Number>       2, 2

LOAD [<Number>]     2, 3

LOAD [<Number> x]   2, 3
LOAD [<Number> y]   2, 3
LOAD [<Number> z]   2, 3

LOAD x <Number>     2, 2
LOAD y <Number>     2, 2
LOAD z <Number>     2, 2
LOAD pc <Number>    2, 2
LOAD sp <Number>    2, 2
LOAD fx <Number>    2, 2
LOAD cb <Number>    2, 2
LOAD sb <Number>    2, 2
LOAD db <Number>    2, 2

LOAD x [<Number>]   2, 3
LOAD y [<Number>]   2, 3
LOAD z [<Number>]   2, 3
LOAD pc [<Number>]  2, 3
LOAD sp [<Number>]  2, 3
LOAD fx [<Number>]  2, 3
LOAD cb [<Number>]  2, 3
LOAD sb [<Number>]  2, 3
LOAD db [<Number>]  2, 3

STORE [x]           1, 2
STORE [y]           1, 2
STORE [z]           1, 2

STORE [<Number>]    2, 3

STORE [<Number> x]  2, 3
STORE [<Number> y]  2, 3
STORE [<Number> z]  2, 3

### STACK INSTRUCTIONS ###

PUSH                1, 2
PUSH x              1, 2
PUSH y              1, 2
PUSH z              1, 2
PUSH pc             1, 2
PUSH sp             1, 2
PUSH fx             1, 2
PUSH cb             1, 2
PUSH sb             1, 2
PUSH db             1, 2
PUSH <Number>       2, 2

POP                 1, 2
POP x               1, 2
POP y               1, 2
POP z               1, 2
POP pc              1, 2
POP sp              1, 2
POP fx              1, 2
POP cb              1, 2
POP sb              1, 2
POP db              1, 2

DROP                1, 1
DUPE                1, 3
SWAP                1, 3
PEEK                1, 2
VOID                1, 1

### PIPE INSTRUCTIONS ### (rename to QUEUE ??)

PACK                1, 1
PACK x              1, 1
PACK y              1, 1
PACK z              1, 1
PACK pc             1, 1
PACK sp             1, 1
PACK fx             1, 1
PACK cb             1, 1
PACK sb             1, 1
PACK db             1, 1
PACK $              1, 2
PACK <Number>       2, 2

PASS                1, 1 if PL == 0 else 2 (rename to YIELD ??)
DUMP                1, 1 (rename to DRAIN ??)
POLL                1, 1 (rename to COUNT, LENGTH ??)

### COMPARISON OPERATIONS ###

EQ <Number>         2, 2    # FX = A == I
EQ x                1, 1    # FX = A == X
EQ y                1, 1    # FX = A == Y
EQ z                1, 1    # FX = A == Z
EQ $                1, 2    # pop $1, $2; FX = $1 == $2

GT <Number>         2, 2    # FX = A > I
GT x                1, 1    # FX = A > X
GT y                1, 1    # FX = A > Y
GT z                1, 1    # FX = A > Z
GT $                1, 2    # pop $1, $2; FX = $1 > $2

LT <Number>         2, 2    # FX = A < I
LT x                1, 1    # FX = A < X
LT y                1, 1    # FX = A < Y
LT z                1, 1    # FX = A < Z
LT $                1, 2    # pop $1, $2; FX = $1 < $2

NEQ <Number>        2, 2    # FX = A != I
NEQ x               1, 1    # FX = A != X
NEQ y               1, 1    # FX = A != Y
NEQ z               1, 1    # FX = A != Z
NEQ $               1, 2    # pop $1, $2; FX = $1 != $2

NGT <Number>        2, 2    # FX = A <= I
NGT x               1, 1    # FX = A <= X
NGT y               1, 1    # FX = A <= Y
NGT z               1, 1    # FX = A <= Z
NGT $               1, 2    # pop $1, $2; FX = $1 <= $2

NLT <Number>        2, 2    # FX = A >= I
NLT x               1, 1    # FX = A >= X
NLT y               1, 1    # FX = A >= Y
NLT z               1, 1    # FX = A >= Z
NLT $               1, 2    # pop $1, $2; FX = $1 >= $2

### UNARY OPERATIONS ###

CLZ                 1, 1    # A = CLZ(A); FX = BOOL(A) (count leading zeros)
CLZ $               1, 3

CTZ                 1, 1    # A = CTZ(A); FX = BOOL(A) (count trailing zeros)
CTZ $               1, 3

NSA                 1, 1    # A = POPCNT(A); FX = BOOL(A) (population count)
NSA $               1, 3

NOT                 1, 1
NOT $               1, 3

### BINARY ARITHMETIC OPERATIONS ###

INC                 1, 1    # A++; FX = BOOL(A)
INC x               1, 1    # X++; FX = BOOL(X)
INC y               1, 1    # Y++; FX = BOOL(Y)
INC z               1, 1    # Z++; FX = BOOL(Z)
INC $               1, 3    # pop $1; $0 = $1 + 1; push $0; FX = BOOL($0)

DEC                 1, 1    # A--; FX = BOOL(A)
DEC x               1, 1    # X--; FX = BOOL(X)
DEC y               1, 1    # Y--; FX = BOOL(Y)
DEC z               1, 1    # Z--; FX = BOOL(Z)
DEC $               1, 3    # pop $1; $0 = $1 - 1; push $0; FX = BOOL($0)

ADD <Number>        2, 2    # A = A + I; FX = CARRYBIT
ADD x               1, 1    # A = A + X; FX = CARRYBIT
ADD y               1, 1    # A = A + Y; FX = CARRYBIT
ADD z               1, 1    # A = A + Z; FX = CARRYBIT
ADD $               1, 3    # pop $1, $2; $0 = $1 + $2; push $0; FX = CARRYBIT

SUB <Number>        2, 2    # A = A - I; FX = BORROWBIT
SUB x               1, 1    # A = A - X; FX = BORROWBIT
SUB y               1, 1    # A = A - Y; FX = BORROWBIT
SUB z               1, 1    # A = A - Z; FX = BORROWBIT
SUB $               1, 3    # pop $1, $2; $0 = $1 - $2; push $0; FX = FX = BORROWBIT

TALLY <Number>      2, 2    # A = A + I + FX; FX = CARRYBIT
TALLY x             1, 1    # A = A + X + FX; FX = CARRYBIT
TALLY y             1, 1    # A = A + Y + FX; FX = CARRYBIT
TALLY z             1, 1    # A = A + Z + FX; FX = CARRYBIT
TALLY $             1, 3    # pop $1, $2; $0 = $1 + $2 + FX; push $0; FX = CARRYBIT

DEBIT <Number>      2, 2    # A = A - I - FX; FX = BORROWBIT
DEBIT x             1, 1    # A = A - X - FX; FX = BORROWBIT
DEBIT y             1, 1    # A = A - Y - FX; FX = BORROWBIT
DEBIT z             1, 1    # A = A - Z - FX; FX = BORROWBIT
DEBIT $             1, 3    # pop $1, $2; $0 = $1 - $2 - FX; push $0; FX = BORROWBIT

MUL <Number>        2, 2    # $0 = A * I; A = LSB($0); FX = MSB($0)
MUL x               1, 1    # $0 = A * X; A = LSB($0); FX = MSB($0)
MUL y               1, 1    # $0 = A * Y; A = LSB($0); FX = MSB($0)
MUL z               1, 1    # $0 = A * Z; A = LSB($0); FX = MSB($0)
MUL $               1, 3    # pop $1, $2; $0 = $1 * $2; push LSB($0); FX = MSB($0)

DIV <Number>        2, 2    # A = A / I; FX = A % I
DIV x               1, 1    # A = A / X; FX = A % X
DIV y               1, 1    # A = A / Y; FX = A % Y
DIV z               1, 1    # A = A / Z; FX = A % Z
DIV $               1, 3    # pop $1, $2; push $1 / $2; FX = $1 % $2;

MOD <Number>        2, 2    # A = A % I; FX = A / I
MOD x               1, 1    # A = A % X; FX = A / I
MOD y               1, 1    # A = A % Y; FX = A / I
MOD z               1, 1    # A = A % Z; FX = A / I
MOD $               1, 3    # pop $1, $2; push $1 % $2; FX = $1 / $2;

### BINARY BITWISE OPERATIONS ###

AND <Number>        2, 2    # A = A & I; FX = A
AND x               1, 1    # A = A & X; FX = A
AND y               1, 1    # A = A & Y; FX = A
AND z               1, 1    # A = A & Z; FX = A
AND $               1, 3    # pop $1, $2; $0 = $1 & $2; push $0; FX = BOOL($0)

OR <Number>         2, 2    # A = A | I; FX = A
OR x                1, 1    # A = A | X; FX = A
OR y                1, 1    # A = A | Y; FX = A
OR z                1, 1    # A = A | Z; FX = A
OR $                1, 3    # pop $1, $2; $0 = $1 | $2; push $0; FX = BOOL($0)

XOR <Number>        2, 2    # A = A ^ I; FX = A
XOR x               1, 1    # A = A ^ X; FX = A
XOR y               1, 1    # A = A ^ Y; FX = A
XOR z               1, 1    # A = A ^ Z; FX = A
XOR $               1, 3    # pop $1, $2; $0 = $1 ^ $2; push $0; FX = BOOL($0)

ZSH <Number>        2, 2    # A = A >> I; FX = BOOL(A) (zero-shift)
ZSH x               1, 1    # A = A >> X; FX = BOOL(A)
ZSH y               1, 1    # A = A >> Y; FX = BOOL(A)
ZSH z               1, 1    # A = A >> Z; FX = BOOL(A)
ZSH $               1, 3    # pop $1, $2; $0 = $1 >> $2; push $0; FX = BOOL($0)

SSH <Number>        2, 2    # A = A +> I; FX = BOOL(A) (sign-shift)
SSH x               1, 1    # A = A +> X; FX = BOOL(A)
SSH y               1, 1    # A = A +> Y; FX = BOOL(A)
SSH z               1, 1    # A = A +> Z; FX = BOOL(A)
SSH $               1, 3    # pop $1, $2; $0 = $1 +> $2; push $0; FX = BOOL($0)

LSH <Number>        2, 2    # A = A << I; FX = BOOL(A) (left-shift)
LSH x               1, 1    # A = A << X; FX = BOOL(A)
LSH y               1, 1    # A = A << Y; FX = BOOL(A)
LSH z               1, 1    # A = A << Z; FX = BOOL(A)
LSH $               1, 3    # pop $1, $2; $0 = $1 << $2; push $0; FX = BOOL($0)

ROT <Number>        2, 2    # A = A >>> (I % 8); FX = BOOL(A) (rotate-right)
ROT x               1, 1    # A = A >>> (X % 8); FX = BOOL(A)
ROT y               1, 1    # A = A >>> (Y % 8); FX = BOOL(A)
ROT z               1, 1    # A = A >>> (Z % 8); FX = BOOL(A)
ROT $               1, 3    # pop $1, $2; $0 = $1 >>> $2; push $0; FX = BOOL($0)

"""

# enumerate_instructions.py

print("\n" * 128, "--{ ZEN_80 Instruction Set }--")
opcode = 0

for instruction in instructions.split("\n"):

    if len(instruction) == 0 or instruction.lstrip()[0] == "#":

        print(instruction)
        continue

    number = hex(opcode).upper()[2:]

    if len(number) == 1: number = "0" + number
    elif len(number) == 3: number = "!! " + number

    print(number, instruction)
    opcode += 1

print("    Opcodes:", str(opcode) + "/256")
print()
print("    TODO: define ASCII character set ")
print("    TODO: check variables exist during references  ")
print("    TODO: unused characters are used in comments and strings ")
print()
