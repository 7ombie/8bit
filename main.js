import { assemble } from "./zen80.js";









const source = `
loop: add -3, add x, loop: add y
add []
sub +128, sub z, sub y
loop: sub [], sub loop
spam: fork, fork spam, fork [], fork [+150]
done, halt, reset, return
race, race loop, race [spam], nop, race [+10]
set, set x, set z, set pc, set sp, set fx
clear x, clear fx, clear
copy x, copy pc, copy sp
sync fx, sync y
load 4, load loop
load [x], load [y], load [9]
load [spam x], load [#3E y]
load y 6, load z #CC, load y [6], load z [#CC]
store [x], store [y], store [9], store [spam]
store [spam x], store [#3E y]
store y [6], store z [#CC]
inc, inc y, dec x, dec []
eq 3, neq x, gt #DD, lt +100, nlt y
not [], truthy [], falsey
ctz, nsa, clz, lock [], free 1, lock, free [#90]
push, push x, pop y, pop fx, push pc, pop sp
drop, peek, dupe, databank, copyio
queue 1, queue [], queue x
flush, drain, array
load [spam]
`;

for (let byte of assemble(source)) console.log(byte);

/*
    X  Y  Z      PC SP FX     $0 $1 $2
    0  1  2       3  4  5      6  7  8
*/

const STATE = new Uint8Array(9);

const [X, Y, Z] = [0, 1, 2];
const [PC, SP, FX] = [3, 4, 5];
const [$0, $1, $2] = [6, 7, 8]

const bool = (x) => x === 0 ? 0 : 1;

const div = (x, y) => Math.floor(x / y);

const carrybit = (x) => bool(div(x, 256));

const add = function() {

    const sum = STATE[$0] + STATE[$1];

    [STATE[$0], STATE[FX]] = [sum, carrybit(sum)];
};

const addfx = function() {

    const sum = STATE[$0] + STATE[$1] + STATE[FX];

    [STATE[$0], STATE[FX]] = [sum, carrybit(sum)];
};

const sub = function() {

    const difference = STATE[$0] - STATE[$1];

    [STATE[$0], STATE[FX]] = [difference, borrowbit(sum)];
};

const subfx = function() {

    const sum = STATE[$0] + STATE[$1] + STATE[FX];

    [STATE[$0], STATE[FX]] = [sum, carrybit(sum)];
};
