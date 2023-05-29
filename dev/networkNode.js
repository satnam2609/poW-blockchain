const bodyParser = require("body-parser");
const express = require("express");
const Blockchain = require("./blockchain");
const Wallet = require("./wallet");
const { v4: uuidv4 } = require("uuid");
const rp = require("request-promise");
const request = require("request");
const requestPromise = require("request-promise");

const nodeAddress = uuidv4();

const wallet = new Wallet();

const blockRouter = require("./routes/blockRoutes");

const port = process.argv[2];

const Ethereum = new Blockchain();

const app = express();

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use("/blockchain", blockRouter);

app.post("/register-and-broadcast-node", async function (req, res) {
  try {
    const newNodeUrl = req.body.newNodeUrl;

    if (Ethereum.networkNodes.indexOf(newNodeUrl) == -1)
      Ethereum.networkNodes.push(newNodeUrl);

    const regNodesPromises = [];
    Ethereum.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + "/register-node",
        method: "POST",
        body: { newNodeUrl: newNodeUrl },
        json: true,
      };

      regNodesPromises.push(rp(requestOptions));
    });

    Promise.all(regNodesPromises)
      .then((data) => {
        const bulkRegisterOptions = {
          uri: newNodeUrl + "/register-nodes-bulk",
          method: "POST",
          body: {
            allNetworkNodes: [
              ...Ethereum.networkNodes,
              Ethereum.currentNodeUrl,
            ],
          },
          json: true,
        };

        return rp(bulkRegisterOptions);
      })
      .then((data) =>
        res.json({
          note: "New node registered with network successfully.",
        })
      );
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

app.post("/register-node", function (req, res) {
  try {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent =
      Ethereum.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = Ethereum.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode)
      Ethereum.networkNodes.push(newNodeUrl);
    res.json({ note: "New node registered successfully." });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

// register multiple nodes at once
app.post("/register-nodes-bulk", function (req, res) {
  try {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach((networkNodeUrl) => {
      const nodeNotAlreadyPresent =
        Ethereum.networkNodes.indexOf(networkNodeUrl) == -1;
      const notCurrentNode = Ethereum.currentNodeUrl !== networkNodeUrl;
      if (nodeNotAlreadyPresent && notCurrentNode)
        Ethereum.networkNodes.push(networkNodeUrl);
    });

    res.json({ note: "Bulk registration successful." });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

app.get("/block-explorer", async (req, res) => {
  res.sendFile("./block-explorer/index.html", { root: __dirname });
});

// app.post("/create-wallet",)

app.listen(port, () => console.log(`http://localhost:${port} ...`));

module.exports = wallet;
