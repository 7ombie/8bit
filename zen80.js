import {parse} from "./parse.js";
import {tokenize} from "./tokenize.js";

import {
    assemble, get, num, reg, register,
    registerBranchOperation, registerSimpleOperation,
    registerUnaryOperation, registerBinaryOperation
} from "./assemble.js";

//// EXPOSE THE THREE AVAILABLE FUNCTIONS OF PUBLIC API...

export { assemble, parse, tokenize };

//// REGISTER ALL OF THE INSTRUCTION GRAMMARS WITH THEIR HANDLERS...

register("done", 0x00);
register("halt", 0x01);
register("reset", 0x02);
register("return", 0x03);
register("nop", 0x04);

registerBranchOperation("race", 0x05);
registerBranchOperation("nudge", 0x09);
registerBranchOperation("jump", 0x0D);
registerBranchOperation("fork", 0x11);
registerBranchOperation("call", 0x15);
registerBranchOperation("lock", 0x1A);
registerBranchOperation("free", 0x1D);

register("set", 0x21);
registerSimpleOperation("set", 0x22);
register("clear", 0x28);
registerSimpleOperation("clear", 0x29);
registerSimpleOperation("copy", 0x2F);
registerSimpleOperation("sync", 0x35);

register("load [<Index>]", i => [reg(0x3B, get(i, 0, 0))]);
register("load <Number>", i => [0x3E, num(get(i, 0))]);
register("load [<Number>]", i => [0x3F, num(get(i, 0, 0))]);
register("load [<Number> <Index>]", i => [reg(0x40, get(i, 0, 1)), num(get(i, 0, 0))]);
register("load <Index> <Number>", i => [reg(0x43, get(i, 0)), num(get(i, 1))]);
register("load <Index> [<Number>]", i => [reg(0x46, get(i, 0)), num(get(i, 1, 0))]);

register("store [<Index>]", i => [reg(0x49, get(i, 0, 0))]);
register("store [<Number>]", i => [0x4C, num(get(i, 0, 0))]);
register("store [<Number> <Index>]", i => [reg(0x4D, get(i, 0, 1)), num(get(i, 0, 0))]);
register("store <Index> [<Number>]", i => [reg(0x50, get(i, 0)), num(get(i, 1, 0))]);

register("inc", 0x53);
register("inc <Index>", i => [reg(0x54, get(i, 0))]);
register("inc []", 0x57);
register("dec", 0x58);
register("dec <Index>", i => [reg(0x59, get(i, 0))]);
register("dec []", 0x5C);

registerBinaryOperation("add", 0x5D);
registerBinaryOperation("sub", 0x62);
registerBinaryOperation("addfx", 0x67);
registerBinaryOperation("subfx", 0x6C);
registerBinaryOperation("mul", 0x71);
registerBinaryOperation("div", 0x76);
registerBinaryOperation("mod", 0x7B);

registerBinaryOperation("eq", 0x80);
registerBinaryOperation("gt", 0x85);
registerBinaryOperation("lt", 0x8A);
registerBinaryOperation("neq", 0x8F);
registerBinaryOperation("ngt", 0x94);
registerBinaryOperation("nlt", 0x99);

registerBinaryOperation("and", 0x9E);
registerBinaryOperation("or", 0xA3);
registerBinaryOperation("xor", 0xA8);

registerBinaryOperation("zsh", 0xAD);
registerBinaryOperation("ssh", 0xB2);
registerBinaryOperation("lsh", 0xB7);
registerBinaryOperation("rot", 0xBC);

registerUnaryOperation("clz", 0xC1);
registerUnaryOperation("ctz", 0xC3);
registerUnaryOperation("nsa", 0xC5);

registerUnaryOperation("not", 0xC7);
registerUnaryOperation("truthy", 0xC9);
registerUnaryOperation("falsey", 0xCB);

register("push", 0xCD);
registerSimpleOperation("push", 0xCE);
register("pop", 0xD5);
registerSimpleOperation("pop", 0xD6);

register("drop", 0xDC);
register("dupe", 0xDD);
register("swap", 0xDE);
register("peek", 0xDF);
register("void", 0xE0);

register("queue", 0xE1);
registerSimpleOperation("queue", 0xE2);
register("queue <Number>", i => [0xE8, num(get(i, 0))]);
register("queue []", 0xE9);

register("flush", 0xEA);
register("drain", 0xEB);
register("array", 0xEC);

register("databank", 0xED);
register("codebank", 0xEE);
register("stackbank", 0xEF);
register("iobank", 0xF0)

register("copydata", 0xF1);
register("copycode", 0xF2);
register("copystack", 0xF3);
register("copyio", 0xF4);
