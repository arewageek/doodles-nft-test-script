const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Doodles Smart Contract Test", function () {
  let Doodles, addrs, addr1, addr2, addr3, owner, doodleContract;
  beforeEach(async function () {
    Doodles = await ethers.getContractFactory("Doodles");
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    doodleContract = await Doodles.deploy();
  });

  describe("Contract Deployment", async function () {
    it("Should set the right contract owner", async function () {
      expect(await doodleContract.owner()).to.equal(owner.address);
    });
  });

  describe("Set Allowlist Active", async function () {
    it("Should allow admin set whitelist to active", async function () {
      const expectedState = true;

      await doodleContract.connect(owner).setIsAllowListActive(expectedState);

      expect(await doodleContract.isAllowListActive()).to.equals(expectedState);
    });

    it("Should revert when caller is not admin", async function () {
      await expect(doodleContract.connect(addr3).setIsAllowListActive(true)).to
        .be.revertedWithCustomError;
    });
  });

  describe("Whitelist addresses", async function () {
    const allowedMint = 3;
    it("Should allow admin whitelist addresses", async function () {
      await doodleContract
        .connect(owner)
        .setAllowList([addr1.address, addr2.address], allowedMint);

      expect(await doodleContract.numAvailableToMint(addr1.address)).to.equal(
        allowedMint
      );
      expect(await doodleContract.numAvailableToMint(addr2.address)).to.equal(
        allowedMint
      );
    });

    it("Should revert when caller is not admin", async function () {
      await expect(
        doodleContract
          .connect(addr3)
          .setAllowList([addr1.address, addr2.address], allowedMint)
      ).to.revertedWithCustomError;
    });
  });

  describe("Should mint a token", async function () {
    let payment = { value: ethers.parseEther("0.123") };

    it("Should revert when not in allowlist", async function () {
      await expect(
        doodleContract.connect(addr1).mintAllowList(1, payment)
      ).to.be.revertedWith("Allow list is not active");
    });

    it("Should whitelist an address and mint token from that address", async function () {
      await doodleContract.connect(owner).setIsAllowListActive(true);
      await doodleContract.connect(owner).setAllowList([addr1], 2);

      await doodleContract.connect(addr1).mintAllowList(1, payment);

      expect(await doodleContract.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should revert when not enough fee", async function () {
      await doodleContract.connect(owner).setIsAllowListActive(true);
      await doodleContract.connect(owner).setAllowList([addr1], 2);

      await expect(
        doodleContract
          .connect(addr1)
          .mintAllowList(1, { value: ethers.parseEther("0.04") })
      ).to.be.revertedWith("Ether value sent is not correct");
    });

    it("Should revert when mint amount exceeds allowed quantity", async function () {
      await doodleContract.connect(owner).setIsAllowListActive(true);
      await doodleContract.connect(owner).setAllowList([addr1], 2);

      await expect(
        doodleContract.connect(addr1).mintAllowList(3, payment)
      ).to.be.revertedWith("Exceeded max available to purchase");
    });
  });

  describe("Public mint of tokens", async function () {
    let payment = { value: ethers.parseEther("0.123") };

    // let maxSupply = await doodleContract.MAX_SUPPLY();
    let baseUrl = "ipfs://test.io";

    it("Should revert if sales is not active", async function () {
      await doodleContract.connect(owner).setIsAllowListActive(true);
      await doodleContract.connect(owner).setAllowList([addr3], 2);

      await expect(doodleContract.connect(addr2).mint(1)).to.be.revertedWith(
        "Sale must be active to mint tokens"
      );
    });

    it("Should revert if mint exceed max token purchase allowed", async function () {
      await doodleContract.connect(owner).setSaleState(true);
      await doodleContract.connect(owner).setIsAllowListActive(true);
      await doodleContract.connect(owner).setAllowList([addr3], 2);

      await expect(doodleContract.connect(addr2).mint(6)).to.be.revertedWith(
        "Exceeded max token purchase"
      );
    });

    it("Should mint token", async function () {
      await doodleContract.connect(owner).setSaleState(true);
      await doodleContract.connect(owner).setIsAllowListActive(true);
      await doodleContract.connect(owner).setAllowList([addr3], 2);

      await doodleContract.connect(addr3).mint(1, payment);

      expect(await doodleContract.connect(addr3).ownerOf(0)).to.be.equals(
        addr3.address
      );
    });
  });

  describe("Set base URI for collection", async function () {
    const baseUri = "ipfs://tst.com";
    const payment = { value: ethers.parseEther("0.123") };

    it("Should set the base uri", async function () {
      await doodleContract.connect(owner).setSaleState(true);
      await doodleContract.connect(owner).setBaseURI(baseUri);
      await doodleContract.connect(owner).setIsAllowListActive(true);
      await doodleContract.connect(owner).setAllowList([addr2], 1);

      await doodleContract.connect(addr2).mint(1, payment);
      expect(await doodleContract.connect(addr2).tokenURI(0)).to.equal(
        baseUri + "0"
      );
    });

    it("Should revert if non admin sets base uri", async function () {
      await expect(doodleContract.connect(addr1).setBaseURI(baseUri)).to.be
        .revertedWithCustomError;
    });
  });
});
