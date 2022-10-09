const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ?describe.skip
    : describe("Random Ipfs NFT Unit Tests", function(){
        let basicNft, deployer
        beforeEach(async function(){
            accounts = await ethers.getSigners()
            deployer = accounts[0]
            // console.log(deployer.address)
            // deployer = (await getNamedAccounts()).deployer
            // console.log(deployer)
            await deployments.fixture(["mocks", "randomipfs"])  
            randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer) 
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        })

        describe("constructor", function(){
            it("Intializes the randomIpfsNft correctly", async function(){
                const dogTokenUriatZero =await randomIpfsNft.getDogTokenUris(0)
                assert(dogTokenUriatZero.includes("ipfs://"))
            })
        })

        describe("requestNft", function () { 
            it("fails if enough mint fee is not sent", async function(){
                await expect(randomIpfsNft.requestNft()).to.be.revertedWith("RandomIpfsNft__needMoreEthSent") 
            })
            it("emit an event and kick off requestId", async function (){
                const fee = await randomIpfsNft.getMintFee()
                // console.log(fee.toString())
                await expect(randomIpfsNft.requestNft({value: fee.toString()})).to.emit(
                    randomIpfsNft,
                    "NftRequested"
                )
            })
        })

        describe("fulfillRandomWords", function () {
            it("mints NFT after random number is returned", async function () {
                await new Promise(async (resolve, reject) =>{
                    randomIpfsNft.once("NftMinted", async () =>{
                        try {
                            const tokenUri = await randomIpfsNft.getDogTokenUris(1)
                            console.log(tokenUri.toString())
                            const tokenCounter = await randomIpfsNft.getTokenCounter()
                            console.log(tokenCounter)
                            assert.equal(tokenUri.toString().includes("ipfs://"), true)
                            asssert.equal(tokenCounter.toString(), "1")
                            resolve()
                        } catch (e) {
                            console.log(e)
                            reject(e)
                        }
                    })
                    try {
                        const fee = await randomIpfsNft.getMintFee()
                        const requestNftResponse = await randomIpfsNft.requestNft(
                        {value: fee.toString()}
                        )
                        const requestNftReceipt = await requestNftResponse.wait(1)
                        await vrfCoordinatorV2Mock.fulfillRandomWords(
                        requestNftReceipt.events[1].args.requestId,
                        randomIpfsNft.address
                        )
                        resolve()

                    } catch (e) {
                        console.log(e)
                        reject(e)
                    }
                })
            })
        })

        describe("getBreedFromModdedRng", function() {
            let moddedRng
            it("should return pug if moddedRng < 10", async () =>{
                const expectedValue = await randomIpfsNft.getBreedFromModdedRng(7)
                assert.equal(0, expectedValue)
            })
            it("should return 1 if moddedRng 10-39", async () =>{
                const expectedValue = await randomIpfsNft.getBreedFromModdedRng(23)
                assert.equal(1, expectedValue)
            })
            it("should return 1 if moddedRng 40-99", async () =>{
                const expectedValue = await randomIpfsNft.getBreedFromModdedRng(82)
                assert.equal(2, expectedValue)
            })
            it("should be reverted if moddedRng >= 100", async () =>{
                if(randomIpfsNft.getBreedFromModdedRng(moddedRng) > 99){
                    await expect(randomIpfsNft.getBreedFromModdedRng(100)).to.be.revertedWith("RandomIpfsNft__RangeOutOfBound")
                }
            })
        })
    })    