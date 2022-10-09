const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require ("../utils/verify")
const {storeImages, storeTokenUriMetadata} = require("../utils/uploadToPinata")
require("dotenv").config()

const imagesLocation = "./images/randomNft"

const metadataTemplate = {
    name: "",
    description: "",
    images: "",
    attributes:[
        {
            trait_type: "cuteness",
            value: 100,
        }
    ],
}
const FUND_AMOUNT = "1000000000000000000000"
let tokenUris = [
    'ipfs://QmUXtuMVfz9BkQU9uwEu7EEXtLwHtsMCTv6Z9B5EbW21aV',
    'ipfs://QmT9ZrFyBvLo9nQMSaGeXwPoZ3EkZ5jXsysnpm7kjEWmvq',
    'ipfs://QmYGF8X1v4wFV7foiihDPeBJXQ45qeJFtPigQxPAEdknTa'
  ]
module.exports = async function ({getNamedAccounts, deployments}){
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorAddress, subscriptionId, vrfCoordinatorMock
    // let tokenUris

    if(process.env.UPLOAD_TO_PINATA == "true"){
        tokenUris = await handleTokenUris()
    }

    log("---------------")
    if(chainId == 31337){
        vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorAddress = vrfCoordinatorMock.address
        const transactionResponse = await vrfCoordinatorMock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId
        await vrfCoordinatorMock.fundSubscription(subscriptionId, FUND_AMOUNT)

    }
    else{
        vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    // await storeImages(imagesLocation)
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const mintFee = networkConfig[chainId]["mintFee"]

    const args = [vrfCoordinatorAddress, subscriptionId, gasLane, callbackGasLimit, mintFee, tokenUris]

    const randomIpfsNft = await deploy("RandomIpfsNft",{
        from: deployer,
        args: args,
        log: true,
        waitConfimations: network.config.blockConfirmations || 1 
    })

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        console.log("verifying...")
        await verify(raffle.address, args)
    }

    async function handleTokenUris(){
        tokenUris = []
        const {responses: imageUploadResponses, files} = await storeImages(imagesLocation)
        for(imageUploadResponseIndex in imageUploadResponses){
            let tokenUriMetadata = {...metadataTemplate}
            tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
            tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name}`
            tokenUriMetadata.images = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
            console.log(`uploading ${tokenUriMetadata.name}...`)
            const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
            tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
        }
        console.log("uploaded metadata uri")
        console.log(tokenUris)
        return tokenUris
    }
} 

module.exports.tags = ["all", "randomipfs", "main"]