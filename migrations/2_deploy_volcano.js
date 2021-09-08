const Volcano = artifacts.require("VolcanoCoin");

module.exports = function(deployer) {
  deployer.deploy(Volcano);
};
