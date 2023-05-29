const express = require("express");
const Blockchain = require("../blockchain");
const { v4: uuidv4 } = require("uuid");
const rp = require("request-promise");
const request = require("request");
const requestPromise = require("request-promise");
const Wallet = require("../wallet");

const wallet = new Wallet();

const nodeAddress = uuidv4();

const router = express.Router();

const Ethereum = new Blockchain();

async function generateWallet() {
  return await wallet.createWallet();
}

router.get("/get-chain", async (req, res) => {
  try {
    res.send(Ethereum);
    console.log(wallet);
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

router.post("/transaction", function (req, res) {
  try {
    const newTransaction = req.body;
    const blockIndex =
      Ethereum.addTransactionToPendingTransaction(newTransaction);
    res.json({ note: `Transaction will be added in block ${blockIndex}.` });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

router.post("/transaction/broadcast", function (req, res) {
  try {
    if (
      req.body.sender === "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" &&
      wallet.privatekey !== null
    ) {
      const newTransaction = Ethereum.createNewTransaction(
        req.body.amount,
        req.body.sender,
        req.body.recipient
      );
      wallet.balance += req.body.amount;

      Ethereum.addTransactionToPendingTransaction(newTransaction);

      const requestPromises = [];
      Ethereum.networkNodes.forEach((networkNodeUrl) => {
        const requestOptions = {
          uri: networkNodeUrl + "/blockchain/transaction",
          method: "POST",
          body: newTransaction,
          json: true,
        };

        requestPromises.push(rp(requestOptions));
      });
    }

    if (
      wallet.privatekey !== null &&
      req.body.sender !== "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" &&
      wallet.balance >= req.body.amount
    ) {
      const newTransaction = Ethereum.createNewTransaction(
        req.body.amount,
        req.body.sender,
        req.body.recipient
      );
      wallet.balance -= req.body.amount;

      Ethereum.addTransactionToPendingTransaction(newTransaction);

      const requestPromises = [];
      Ethereum.networkNodes.forEach((networkNodeUrl) => {
        const requestOptions = {
          uri: networkNodeUrl + "/blockchain/transaction",
          method: "POST",
          body: newTransaction,
          json: true,
        };

        requestPromises.push(rp(requestOptions));
      });

      Promise.all(requestPromises).then((data) => {
        res.json({ note: "Transaction created and broadcast successfully." });
      });
    } else {
      res.json({
        error: "Low balance!!!",
      });
    }
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

router.get("/mine", function (req, res) {
  try {
    const lastBlock = Ethereum.getLastBlock();
    const previousBlockHash = lastBlock["hash"];
    const currentBlockData = {
      transactions: Ethereum.pendingTransactions,
      index: lastBlock["index"] + 1,
    };
    const nonce = Ethereum.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = Ethereum.hashBlock(
      previousBlockHash,
      currentBlockData,
      nonce
    );
    const newBlock = Ethereum.createNewBlock(
      nonce,
      previousBlockHash,
      blockHash
    );

    const requestPromises = [];
    Ethereum.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + "/blockchain/receive-new-block",
        method: "POST",
        body: { newBlock: newBlock },
        json: true,
      };

      requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
      .then((data) => {
        const requestOptions = {
          uri: Ethereum.currentNodeUrl + "/blockchain/transaction/broadcast",
          method: "POST",
          body: {
            amount: 12.5,
            sender: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
            recipient: wallet.publickey,
          },
          json: true,
        };

        return rp(requestOptions);
      })
      .then((data) => {
        res.json({
          note: "New block mined & broadcast successfully",
          block: newBlock,
        });
      });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

router.get("/receive-new-block", function (req, res) {
  try {
    const newBlock = req.body.newBlock;
    const lastBlock = Ethereum.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock["index"] + 1 === newBlock["index"];

    if (correctHash && correctIndex) {
      Ethereum.chain.push(newBlock);
      Ethereum.pendingTransactions = [];
      res.json({
        note: "New block received and accepted.",
        newBlock: newBlock,
      });
    } else {
      res.json({
        note: "New block rejected.",
        newBlock: newBlock,
      });
    }
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

router.get("/consensus", async (req, res) => {
  try {
    const requestPromises = [];
    Ethereum.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + "/blockchain/get-chain",
        method: "GET",
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises).then((blockchains) => {
      const currentChainLenght = Ethereum.chain.length;
      let maxChainLength = currentChainLenght;
      let newLongestChain = null;
      let newPendingTransactions = null;
      blockchains.forEach((blockchain) => {
        // checking for longest blockchain
        if (blockchain.chain.length > maxChainLength) {
          maxChainLength = blockchain.chain.length;
          newLongestChain = blockchain.chain;
          newPendingTransactions = blockchain.pendingTransactions;
        }
      });

      if (
        !newLongestChain ||
        (newLongestChain && !Ethereum.chainIsValid(newLongestChain))
      ) {
        res.json({
          note: `Current chain has not been replaced`,
          chain: Ethereum.chain,
        });
      } else if (newLongestChain && Ethereum.chainIsValid(newLongestChain)) {
        Ethereum.chain = newLongestChain;
        Ethereum.pendingTransaction = newPendingTransactions;
        res.json({
          note: `This chain has been replaced`,
          chain: Ethereum.chain,
        });
      }
    });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

router.get("/block/:blockhash", async (req, res) => {
  try {
    const blockhash = req.params.blockhash;
    const correctBlock = Ethereum.getBlock(blockhash);

    res.json({
      block: correctBlock,
    });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

router.get("/transaction/:transactionId", async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    const transactionData = Ethereum.getTransaction(transactionId);

    res.json({
      transactionData: transactionData.transaction,
      block: transactionData.block,
    });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

router.get("/address/:address", async (req, res) => {
  try {
    const address = req.params.address;

    const result = Ethereum.getAddressData(address);

    res.json(result);
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

router.get("/get-my-wallet", async (req, res) => {
  try {
    if (wallet.privatekey === null) {
      await generateWallet();
    }
    res.json({
      note: `Do not share your private key with any one`,
      wallet: wallet,
    });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

router.get("/get-address", (req, res) => {
  try {
    const userAddress = wallet.publickey;

    res.json({
      address: userAddress,
    });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});
module.exports = router;
