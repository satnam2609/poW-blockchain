const Wallet = require("./wallet");

const wallet = new Wallet();

const userWallet = wallet
  .createWallet()
  .then(() => console.log("MY WALLET ----->>", wallet));
