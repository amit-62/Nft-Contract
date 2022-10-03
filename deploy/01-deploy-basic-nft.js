const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { varify } = require ("../utils/veify")

module.exports = async function ({getNamedAccounts, deployments}){
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    log("---------------")
    args = []

    const basicNft = await deploy("BasicNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1 
    })

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("varifying...")
        await varify(basicNft.address, args)

    }

}

module.exports.tags = ["all", "basicnft"]