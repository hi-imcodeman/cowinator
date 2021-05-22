#!/usr/bin/env node

import yargs from 'yargs'
import { getStats } from './api'

const _argv = yargs
    .command('$0 <state>', 'To get the stats', (yargsBuilder: any) => {
        yargsBuilder.positional('state', {
            type: 'string',
            demandOption: true,
            describe: 'Name of the state'
        })
    }, getStats)
    .option('district', {
        type: 'string',
        describe: 'Name of the district'
    })
    .option('telegramChannel', {
        alias: 'tgChannel',
        type: 'string',
        describe: 'Name of the Telegram channel Ex. "@channelname"'
    })
    .argv