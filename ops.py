instructions = """
DONE                1, 1
HALT                1, 1
RESET               1, 1
RETURN              1, 1 if PL == 0 else 2
NOP                 1, 1


RACE                1, 1
RACE <Number>       2, 2
RACE [<Number>]     2, 3
RACE []             1, 2

NUDGE               1, 1
NUDGE <Number>      2, 2
NUDGE [<Number>]    2, 3
NUDGE []            1, 2

JUMP                1, 1
JUMP <Number>       2, 2
JUMP [<Number>]     2, 3
JUMP []             1, 2

FORK                1, 1
FORK <Number>       2, 2
FORK [<Number>]     2, 3
FORK []             1, 2

CALL                1, 1 if PL == 0 else 2
CALL <Number>       2, 2 if PL == 0 else 3
CALL [<Number>]     2, 3 if PL == 0 else 4
CALL []             1, 2 if PL == 0 else 3

LOCK			    1, 2
LOCK <Number>	    2, 3
LOCK [<Number>]	    2, 4
LOCK []			    1, 3

FREE			    1, 2
FREE <Number>	    2, 3
FREE [<Number>]	    2, 4
FREE []			    1, 2

SET                 1, 1
SET x               1, 1
SET y               1, 1
SET z               1, 1
SET pc              1, 1
SET sp              1, 1
SET fx              1, 1

CLEAR               1, 1
CLEAR x             1, 1
CLEAR y             1, 1
CLEAR z             1, 1
CLEAR pc            1, 1
CLEAR sp            1, 1
CLEAR fx            1, 1

COPY x              1, 1
COPY y              1, 1
COPY z              1, 1
COPY pc             1, 1
COPY sp             1, 1
COPY fx             1, 1

SYNC x              1, 1
SYNC y              1, 1
SYNC Z              1, 1
SYNC pc             1, 1
SYNC sp             1, 1
SYNC fx             1, 1

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

LOAD x [<Number>]   2, 3
LOAD y [<Number>]   2, 3
LOAD z [<Number>]   2, 3

STORE [x]           1, 2
STORE [y]           1, 2
STORE [z]           1, 2

STORE [<Number>]    2, 3

STORE [<Number> x]  2, 3
STORE [<Number> y]  2, 3
STORE [<Number> z]  2, 3

STORE x [<Number>]  2, 3
STORE y [<Number>]  2, 3
STORE z [<Number>]  2, 3

INC			        1, 1
INC x 			    1, 1
INC y 			    1, 1
INC z 			    1, 1
INC [] 			    1, 3

DEC			        1, 1
DEC x 			    1, 1
DEC y 			    1, 1
DEC z			    1, 1
DEC [] 			    1, 3

ADD <Number>        2, 2
ADD x               1, 1
ADD y               1, 1
ADD z               1, 1
ADD []              1, 3

SUB <Number>        2, 2
SUB x               1, 1
SUB y               1, 1
SUB z               1, 1
SUB []              1, 3

ADDFX <Number>      2, 2
ADDFX x             1, 1
ADDFX y             1, 1
ADDFX z             1, 1
ADDFX []            1, 3

SUBFX <Number>      2, 2
SUBFX x             1, 1
SUBFX y             1, 1
SUBFX z             1, 1
SUBFX []            1, 3

MUL <Number>        2, 2
MUL x               1, 1
MUL y               1, 1
MUL z               1, 1
MUL []              1, 3

DIV <Number>        2, 2
DIV x               1, 1
DIV y               1, 1
DIV z               1, 1
DIV []              1, 3

MOD <Number>		2, 2
MOD x			    1, 1
MOD y 			    1, 1
MOD z 			    1, 1
MOD [] 			    1, 3

EQ <Number>		    2, 2
EQ x			    1, 1
EQ y			    1, 1
EQ z 			    1, 1
EQ []			    1, 3

GT <Number>		    2, 2
GT x 			    1, 1
GT y 			    1, 1
GT z 			    1, 1
GT []			    1, 3

LT <Number>		    2, 2
LT x			    1, 1
LT y			    1, 1
LT z			    1, 1
LT []			    1, 3

NEQ <Number>		2, 2
NEQ x 			    1, 1
NEQ y 			    1, 1
NEQ z 			    1, 1
NEQ []			    1, 3

NGT <Number>		2, 2
NGT x 			    1, 1
NGT y 			    1, 1
NGT z 			    1, 1
NGT [] 			    1, 3

NLT <Number>		2, 2
NLT x 			    1, 1
NLT y 			    1, 1
NLT z 			    1, 1
NLT [] 			    1, 3

AND <Number>		2, 2
AND x 			    1, 1
AND y 			    1, 1
AND z 			    1, 1
AND []			    1, 3

OR <Number>		    2, 2
OR x			    1, 1
OR y			    1, 1
OR z			    1, 1
OR []			    1, 3

XOR <Number>		2, 2
XOR x			    1, 1
XOR y			    1, 1
XOR z			    1, 1
XOR []			    1, 3

ZSH <Number>	   	2, 2
ZSH x 			    1, 1
ZSH y			    1, 1
ZSH z 			    1, 1
ZSH []			    1, 3

SSH <Number>		2, 2
SSH x 			    1, 1
SSH y 			    1, 1
SSH z 			    1, 1
SSH []			    1, 3

LSH <Number>		2, 2
LSH x 			    1, 1
LSH y 			    1, 1
LSH z 			    1, 1
LSH []			    1, 3

ROT <Number>		2, 2
ROT x 			    1, 1
ROT y 			    1, 1
ROT z 			    1, 1
ROT []			    1, 3

CLZ			        1, 1
CLZ []			    1, 3

CTZ 			    1, 1
CTZ []			    1, 3

NSA 			    1, 1
NSA [] 			    1, 3

NOT			        1, 1
NOT []			    1, 3

TRUTHY			    1, 1
TRUTHY []		    1, 2

FALSEY			    1, 1
FALSEY []		    1, 2

PUSH			    1, 2
PUSH x 			    1, 2
PUSH y 			    1, 2
PUSH z 			    1, 2
PUSH pc			    1, 2
PUSH sp 		    1, 2
PUSH fx 		    1, 2
PUSH <Number>	    2, 2

POP			        1, 2
POP x			    1, 2
POP y 			    1, 2
POP z 			    1, 2
POP pc 			    1, 2
POP sp 			    1, 2
POP fx 			    1, 2

DROP			    1, 1
DUPE			    1, 3
SWAP			    1, 3
PEEK			    1, 2
VOID			    1, 1

QUEUE			    1, 1
QUEUE x			    1, 1
QUEUE y			    1, 1
QUEUE z 		    1, 1
QUEUE pc		    1, 1
QUEUE sp		    1, 1
QUEUE fx		    1, 1
QUEUE <Number> 	    2, 2
QUEUE []		    1, 2

FLUSH               1, 1 if PL == 0 else 2
DRAIN               1, 1
ARRAY               1, 1

DATABANK            1, 1
CODEBANK            1, 1
STACKBANK           1, 1
IOBANK              1, 1

COPYDATA            1, 1 + per 8-byte block
COPYCODE            1, 1 + per 8-byte block
COPYSTACK           1, 1 + per 8-byte block
COPYIO              1, 1 + per 8-byte block
"""

opcode = 0

for instruction in instructions.split("\n"):

    if len(instruction) == 0: continue

    print(hex(opcode).upper()[2:], instruction)
    opcode += 1
