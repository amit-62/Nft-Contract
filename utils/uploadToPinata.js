const pinataSdk = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const pinataApiKey = process.env.PINATA_API_KEY
const pinataSecretKey = process.env.PINATA_API_SECRET
const pinata = pinataSdk(pinataApiKey, pinataSecretKey)

async function storeImages(imageFilePath){
    const fullImagesPath = path.resolve(imageFilePath)
    const files = fs.readdirSync(fullImagesPath)  
    let responses = [] 
    console.log("uploading to ipfs")
    for(fileIndex in files){
        console.log(`working on ${fileIndex}... `)
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
        try{
            const response =await pinata.pinFileToIPFS(readableStreamForFile)
            responses.push(response)
        }
        catch (error){
            console.log(error)
        }
    }

    return {responses, files}
}

async function storeTokenUriMetadata(metadata){
    try {
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (error) {
        console.log(error)
    }
    // return null
}

module.exports = {storeImages, storeTokenUriMetadata}