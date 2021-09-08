import Web3 from "web3";
import volcanoCoinArtifact from "../../build/contracts/VolcanoCoin.json";

const App = {
  web3: null,
  account: null,
  volcano: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = volcanoCoinArtifact.networks[networkId];
      this.volcano = new web3.eth.Contract(
        volcanoCoinArtifact.abi,
        deployedNetwork.address,
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];

      this.refreshBalance();      
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  refreshBalance: async function() {
    const { getBalance } = this.volcano.methods;
    const balance = await getBalance(this.account).call();

    const balanceElement = document.getElementsByClassName("balance")[0];
    balanceElement.innerHTML = balance;
  },

  sendCoin: async function() {
    const amount = parseInt(document.getElementById("amount").value);
    const receiver = document.getElementById("receiver").value;

    this.setStatus("Initiating transaction... (please wait)");

    const { transfer } = this.volcano.methods;
    let transHash = null;
    await transfer(amount, receiver).send({ from: this.account, gas : 1000000 }).on('transactionHash', function(hash){
      transHash = hash;
    });

    this.setStatus("Transaction complete!");

    this.listenToTransfer(transHash);
  },

  listenToTransfer: async function(transHash) {
    const options = {
      filter: {
        _from: this.account,
      },
      fromBlock: 0,
      address: [this.account]
    };

    this.volcano.getPastEvents('Transfer', options, (err, event) => {
      if (err) {
        console.log("transfer event error!", err);
        return;
      }
      var obj=JSON.parse(JSON.stringify(event));
      var array = Object.keys(obj)

      for (var i = 0; i < array.length; i++) {
        if (obj[array[i]].transactionHash === transHash)
          this.setStatus("You have spent " + obj[array[i]].returnValues._amount + " tokens");
      }
    });
  },

 setStatus: function(message) {
   const status = document.getElementById("status");
   status.innerHTML = message;
 },
};

window.App = App;

window.addEventListener("load", function() {
  // if (window.ethereum) {
  //   // use MetaMask's provider
  //   App.web3 = new Web3(window.ethereum);
  //   window.ethereum.enable(); // get permission to access accounts
  // } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
    );
  // }

  App.start();
});
