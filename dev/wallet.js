const ecc = require("eosjs-ecc");

function Wallet() {
  this.privatekey = null;
  this.publickey = null;
  this.balance = 0;
}

Wallet.prototype.createWallet = async function () {
  this.privatekey = await ecc.randomKey();

  let privateResult = this.privatekey;
  this.publickey = "0x" + (await ecc.privateToPublic(privateResult));
  let publicResult = this.publickey;

  this.balance = 0;
  return {
    privateKey: privateResult,
    publicKey: publicResult,
    balance: this.balance,
  };
};

// need to update the wallet whenever the user does any transaction

module.exports = Wallet;
