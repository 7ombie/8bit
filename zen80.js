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

register("set", 0x19);
registerSimpleOperation("set", 0x1A);

register("clear", 0x20);
registerSimpleOperation("clear", 0x21);

registerSimpleOperation("copy", 0x27);

registerSimpleOperation("sync", 0x2D);

register("load <Number>", i => [0x33, num(get(i, 0))]);
register("load [<Index>]", i => [reg(0x34, get(i, 0, 0))]);
register("load [<Number>]", i => [0x37, num(get(i, 0, 0))]);

register("load [<Number> <Index>]", i => {

    return [reg(0x38, get(i, 0, 1)), num(get(i, 0, 0))];
});

register("load <Index> <Number>", i => {

    return [reg(0x3B, get(i, 0)), num(get(i, 1))];
});

register("load <Index> [<Number>]", i => {

    return [reg(0x3E, get(i, 0)), num(get(i, 1, 0))];
});

register("store [<Index>]", i => [reg(0x41, get(i, 0, 0))]);
register("store [<Number>]", i => [0x44, num(get(i, 0, 0))]);

register("store [<Number> <Index>]", i => {

    return [reg(0x45, get(i, 0, 1)), num(get(i, 0, 0))];
});

register("store <Index> [<Number>]", i => {

    return [reg(0x48, get(i, 0)), num(get(i, 1, 0))];
});

registerBinaryOperation("add", 0x4B);
registerBinaryOperation("sub", 0x50);
registerBinaryOperation("mul", 0x55);
registerBinaryOperation("div", 0x5A);
registerBinaryOperation("mod", 0x5F);

register("inc", 0x64);
register("inc <Index>", i => [reg(0x65, get(i, 0))]);
register("inc []", 0x68);

register("dec", 0x69);
register("dec <Index>", i => [reg(0x6A, get(i, 0))]);
register("dec []", 0x6D);

registerBinaryOperation("eq", 0x6E);
registerBinaryOperation("gt", 0x73);
registerBinaryOperation("lt", 0x78);
registerBinaryOperation("neq", 0x7D);
registerBinaryOperation("ngt", 0x82);
registerBinaryOperation("nlt", 0x87);

registerBinaryOperation("and", 0x8C);
registerBinaryOperation("or", 0x91);
registerBinaryOperation("xor", 0x96);

registerBinaryOperation("zsh", 0x9B);
registerBinaryOperation("ssh", 0xA0);
registerBinaryOperation("lsh", 0xA5);
registerBinaryOperation("rot", 0xAA);

registerUnaryOperation("not", 0xAF);
registerUnaryOperation("clz", 0xB1);
registerUnaryOperation("ctz", 0xB3);
registerUnaryOperation("nsa", 0xB5);
registerUnaryOperation("truthy", 0xB7);
registerUnaryOperation("falsey", 0xB9);

registerBranchOperation("lock", 0xBB);
registerBranchOperation("free", 0xBF);

register("push", 0xC3);
registerSimpleOperation("push", 0xC4);

register("pop", 0xCB);
registerSimpleOperation("pop", 0xCC);

register("drop", 0xD2);
register("swap", 0xD3);
register("dupe", 0xD4);

register("databank", 0xD5);
register("codebank", 0xD6);
register("stackbank", 0xD7);
register("iobank", 0xD8);

register("copydata", 0xD9);
register("copycode", 0xDA);
register("copystack", 0xDB);
register("copyio", 0xDC);

register("queue", 0xDE);
registerSimpleOperation("queue", 0xDF);
register("queue <Number>", i => [0xE5, num(get(i, 0))]);
register("queue []", 0xE6);

register("flush", 0xE7);
register("drain", 0xE8);
register("count", 0xE9);
