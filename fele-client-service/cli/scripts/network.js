const { createDatabase, deleteDatabase, insertToDatabase } = require('../../utils/db')
const path = require("path");
const fs = require('fs');
const { createNetwork, deleteNetwork } = require('../../client-api/scripts/network')

const USER_WORKSPACE = "../../../tmpworkspaceforuser/"

async function createNetworkCLI(networkConfig, networkName) {
    
    if(networkConfig.includes(".json")) { //When networkConfig is a file
        const fileName = USER_WORKSPACE+networkConfig;
        networkConfig = require(fileName); //Get contents of file as object
        networkConfig = JSON.stringify(networkConfig) //Convert object to string
    } else {
        networkConfig = networkConfig.replace(/\\/g,'')
    }
    console.log("after removing chars"+networkConfig)
    createNetwork(networkConfig, networkName)
} 

async function deleteNetworkCLI(networkName) {
    deleteNetwork(networkName)
}

module.exports = {
    createNetworkCLI,
    deleteNetworkCLI
}
