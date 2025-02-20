const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Deploy", (m) => {
  const doodles = m.contract("Doodles", []);

  return { doodles };
});
