const Blockchain = require("./blockchain");

const bitCoin = new Blockchain();

const previousBlockHash =
  "ef7797e13d3a75526946a3bcf00daec9fc9c9c4d51ddc7cc5df888f74dd434d1";

const currentBlockData = [
  {
    amount: 1.224554,
    sender: "0xfnuq4wktbarfewfcrs",
    recipient: "0xcaebskrbvrduwba",
  },
  {
    amount: 4.235,
    sender: "0xfnuq4wktbarfewfcrs",
    recipient: "0xcaebskrbvrduwba",
  },
  {
    amount: 0.564554,
    sender: "0xfnuq4wktbarfewfcrs",
    recipient: "0xcaebskrbvrduwba",
  },
];
console.log(bitCoin.hashBlock(previousBlockHash, currentBlockData, 16522));
