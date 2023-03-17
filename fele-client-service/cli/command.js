#! /usr/bin/env node
const commander = require('commander')
const { createNetworkCLI, deleteNetworkCLI, useNetworkCLI } = require('./scripts/network')
const { createChaincodeCLI, invokeChaincodeCLI } = require('./scripts/chaincode');
const { createChannelCLI, deleteChannelCLI } = require('./scripts/channel');

const readline = require('readline');
const defaultLocalOrg = require('../../conf/localorg.json');

const { getDocumentByID } = require('../utils/db');
const { authenticateUser } = require('../utils/auth');
const logger = require('../utils/logger');
const { sha256 } = require('../utils/helpers');
const { GLOBAL_STATE } = require('../utils/constants');
const { async } = require('node-couchdb/dist/node-couchdb');

const program = new commander.Command();
const userCommand = program.command('user');

const interpreter = new commander.Command();
const networkCommand = interpreter.command('network');
const chaincodeCommand = interpreter.command('chaincode');
const channelCommand = interpreter.command('channel');

/************************Network Commands*********************/
networkCommand
    .command('use')
    .description('uses a network that is available')
    .action(async(options) => {
        GLOBAL_STATE.feleUser = await useNetworkCLI(GLOBAL_STATE.localUser.username, GLOBAL_STATE.localOrg, options.networkName);
        // if(GLOBAL_STATE.feleUser.user) GLOBAL_STATE.network = GLOBAL_STATE.feleUser.network.felenetId;
    });

networkCommand
    .command('create')
    .description('Creates a network')
    .option('-nc, --networkConfig <networkConfig>', 'Network config json filename to be passed')
    .action((options) => {
        return createNetworkCLI(options.networkConfig , options.networkName);
    });

networkCommand
    .command('delete')
    .action((options) => {
        return deleteNetworkCLI(options.networkName);
    });

networkCommand
    .command('changeDefault')
    .argument('<newFeleNetwork>', 'New fele network to use')
    .action((newFeleNetwork) => {
        //Set the gateway object to new updated value
    });

networkCommand
    .command('update')
    .action((networkName) => {
        console.log('update subcommand');
    });

networkCommand.commands.forEach((cmd) => {
    cmd.option('-nn, --networkName <networkName>', 'Name of the network')
});

/************************Channel Commands*********************/
channelCommand
.command('create')
.option('-cc, --channelConfig <channelConfig>', 'Channel config json filename to be passed')
.action(async(options) => {
	return createChannelCLI(options.networkName, options.channelConfig);
})

channelCommand
.command('delete')
.option('-cn, --channelName <channelName>', 'Channel name to be passed')
.action(async(options) => {
    return deleteChannelCLI(options.networkName, options.channelName);
});

channelCommand.commands.forEach((cmd) => {
	cmd.option('-nn, --networkName <networkName>', 'Name of the network')
});
//************************Chaincode Commands******************** */
const registerCommand = chaincodeCommand.command('register')

registerCommand
    .command('create')
    .action(options => {
        return createChaincodeCLI(options.networkName, options.channelName, options.chaincodeName)
    })

registerCommand
    .command('update')

registerCommand
    .command('remove')

registerCommand.commands.forEach((cmd) => {
        cmd.option('-nn, --networkName <networkName>', 'Name of the network')
        cmd.option('-cn, --channelName <channelName>', 'Name of the channel')
        cmd.option('-ccn, --chaincodeName <chaincodeName>', 'Name of the chaincode')
    });

chaincodeCommand
    .command('invoke')
    .option('-nn, --networkName <networkName>', 'Name of the network')
    .option('-cn, --channelName <channelName>', 'Name of the channel')
    .option('-ccn, --chaincodeName <chaincodeName>', 'Name of the chaincode')
    .option('-ca, --chaincodeArgument <chaincodeArgument>', 'Argument passed to the chaincode')
    .action(async(options) => {
        var json = options.chaincodeArgument;
        json = JSON.parse(json);
        return invokeChaincodeCLI(options.networkName, options.channelName, options.chaincodeName, json); 
    });
    

/************************User Commands*********************/
userCommand
    .option('-o, --mspId <mspId>', 'mspId to be passed')
    .option('-u, --username <username>', 'feleUser to be passed')
    .option('-p, --password <password>', 'password to be passed')
    //Add un, pw and insert to wallet
    .action(async(options) => {
        //authentication
        const hashedPassword = sha256(options.password);
        GLOBAL_STATE.localOrg = await getDocumentByID("fele_localorg", "localOrg-nasa")
        //localOrg gets its value from couchdb or from the default localorg.json file
        GLOBAL_STATE.localOrg = GLOBAL_STATE.localOrg || defaultLocalOrg
        
        GLOBAL_STATE.localUser = authenticateUser(options.username, hashedPassword, options.mspId, GLOBAL_STATE.localOrg)
        
        if(GLOBAL_STATE.localUser.authenticated) {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            logger.info("User authenticated successfully!");
            
            const waitForUserInput = () => {
                const gateway = {
                    "feleUser" : GLOBAL_STATE.feleUser.user,
                    "feleNetwork": GLOBAL_STATE.network,
                    "mspId" : options.mspId
                }
                const info = Object.values(gateway).filter(gatewayItems => gatewayItems).join('.');
                const question = `fele [ ${info} ] > `
                rl.question(question, async(command) => {
                    if (command === "quit") {
                        rl.close();
                    } else {
                        const commandArr = command.split(" ");
                        await interpreter.parse(commandArr, { from : 'user'});
                        waitForUserInput();
                    }
                });
            }
            waitForUserInput()
        } else {
            console.log("Authentication Failed. Try again");
            logger.error(`Failed to authenticate username ${options.username}`);
        }
    })

module.exports = {
  program,
  interpreter
}