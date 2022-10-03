const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ?describe.skip
    : describe("Basic NFT Unit Tests", function(){
        let basicNft, deployer
        beforeEach(async function(){
            // accounts = await ethers.getSigners()
            // deployer = accounts[0]
            // console.log(deployer.address)
            deployer = (await getNamedAccounts()).deployer
            // console.log(deployer)
            await deployments.fixture(["mocks", "basicnft"])  
            basicNft = await ethers.getContract("BasicNft", deployer) 
        })
        it("Allows users to mint an NFT, and updates appropriately", async function () {
            const txResponse = await basicNft.mintNft()
            await txResponse.wait(1)
            const tokenUri = await basicNft.tokenURI(0)
            const tokenCounter = await basicNft.getTokenCounter()

            assert("1", tokenCounter.toString())
            assert(tokenUri, await basicNft.TOKEN_URI)
        })    

    })