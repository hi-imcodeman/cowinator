#!/usr/bin/env node

import yargs from 'yargs'
import { getStats, getSlotsFor18Plus } from './api'

const _argv = yargs
    .command('stats <state>', 'To get the stats', (yargsBuilder: any) => {
        yargsBuilder.positional('state', {
            type: 'string',
            demandOption: true,
            describe: 'Name of the states'
        })
    }, getStats)
    .command('slots <state>', 'To get the slots for 18+', (yargsBuilder: any) => {
        yargsBuilder.positional('state', {
            type: 'string',
            demandOption: true,
            describe: 'Name of the states'
        })
    }, getSlotsFor18Plus)
    .option('district', {
        alias: 'dt',
        type: 'string',
        describe: 'Name of the district'
    })
    .option('telegramChannel', {
        alias: 'tgChannel',
        type: 'string',
        describe: 'Name of the Telegram channel Ex. "@channelname"'
    })
    .option('date', {
        alias: 'd',
        type: 'string',
        describe: 'Date in the format of "MM-DD-YYYY" (Ex. "22-05-2021")'
    })
    .argv
