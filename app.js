const ecc = require("eosjs-ecc");

const privateKey = async () => {
  return await ecc.randomKey();
};

privateKey().then((res) => console.log("PRIVATE KEY", res));

// const privateKey = "5JN5PdS5NvL54KYCQCC1adA4R4YY9Xa4EiUuFmAvHgg7QhafLwB";
const publicKey = ecc.privateToPublic(
  "5JVd5ShcbJWYhdjAeALue1mj9KT7qhAJCBR9u6rKYHBQAeJByWR"
);
console.log("PUBLIC KEY", publicKey); // Output: 'EOS5qpywFj5aLbRPRVK7Ycd2b4C4Ji22X4HrcV7UuF6LwVSC1Th2Q'

const private = "5JN5PdS5NvL54KYCQCC1adA4R4YY9Xa4EiUuFmAvHgg7QhafLwB";
const message = "hello world";
const signature = ecc.sign(
  message,
  "5JVd5ShcbJWYhdjAeALue1mj9KT7qhAJCBR9u6rKYHBQAeJByWR"
);
console.log(signature);

const isValid = ecc.verify(signature, message, publicKey);
console.log(isValid); // Output: true
