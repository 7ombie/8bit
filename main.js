import { assemble, parse, tokenize } from "./zen80.js";









let source = `
loop: add -3, add x, add test
add []
sub +128, sub z, sub y
sub [], sub loop
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
queue '1', queue [], queue x
test: load 's'
`;

for (let item of assemble(source)) console.log(item);
// console.log(assemble(source));
