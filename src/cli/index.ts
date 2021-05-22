#!/usr/bin/env node

import yargs from 'yargs'
import { Cowinator } from '../index'
import { TelegramClient } from 'messaging-api-telegram'
import { ParseMode } from 'messaging-api-telegram/dist/TelegramTypes'

const objToMessage = (title: string, obj: any, messages: string[]) => {
    messages.push(`\n<u><b>${title}:</b></u>`)
    Object.entries(obj).forEach(([key, value]) => {
        messages.push(`<b>${key}:</b> ${value}`)
    })
}

const cowin = new Cowinator()

const getStats = async (argv: any) => {
    console.time()
    try {
        const { state, district, tgChannel } = argv
        const matchedState = await cowin.findStateByName(state)
        if (matchedState) {
            let matchedDistrict = null
            if (district) {
                matchedDistrict = await cowin.findDistrictByName(matchedState.state_id, district)
                if (matchedDistrict === null) {
                    console.log(`Entered district "${district}" not matched with CoWin distict list of "${matchedState.state_name}".`);
                }
            }
            let stats = null
            let tgMessages: string[] = ['<b>Cowin Stats</b>\n']
            if (matchedDistrict) {
                stats = await cowin.getStatsByDistrict(matchedDistrict.district_id)
                tgMessages.push(`<b>Date:</b> ${new Date(stats.date).toLocaleDateString()}`)
                tgMessages.push(`<b>State:</b> ${stats.state}`)
                tgMessages.push(`<b>District:</b> ${stats.district}`)
                tgMessages.push(`<b>Total Slots available:</b> ${stats.slotsAvailable}`)
                objToMessage('Slots by Vaccine Name', stats.byVaccine, tgMessages)
                objToMessage('Slots available by Fee Type', stats.byFeeType, tgMessages)
                objToMessage('Slots available by Age', stats.byAge, tgMessages)
                objToMessage('No. of centers by Age', stats.noOfCentersByAge, tgMessages)
                objToMessage('No. of centers(availablity) by Age', stats.noOfCentersWithSlotsByAge, tgMessages)
                objToMessage('Availability by Block', stats.byBlock, tgMessages)
            } else {
                stats = await cowin.getStatsByState(matchedState.state_id)
                tgMessages.push(`<b>Date:</b> ${new Date(stats.date).toLocaleDateString()}`)
                tgMessages.push(`<b>State:</b> ${stats.state}`)
                tgMessages.push(`<b>Total Slots available:</b> ${stats.slotsAvailable}`)
                objToMessage('Slots by Vaccine Name', stats.byVaccine, tgMessages)
                objToMessage('Slots available by Fee Type', stats.byFeeType, tgMessages)
                objToMessage('Slots available by Age', stats.byAge, tgMessages)
                objToMessage('No. of centers by Age', stats.noOfCentersByAge, tgMessages)
                objToMessage('No. of centers(availablity) by Age', stats.noOfCentersWithSlotsByAge, tgMessages)
                objToMessage('18+ slots available by Districts', stats.districtsFor18Plus, tgMessages)
                tgMessages.push(`\n<b><u>District wise stats:</u></b>\n`)
                Object.entries(stats.byDistrict).forEach(([districtName, value]) => {
                    const districtStats = value as any
                    const is18Plus = districtStats.noOfCentersByAge['18+'] !== undefined
                    const for18Plus = is18Plus ? ` (&#9989;18+)` : ''
                    tgMessages.push(`<b>${districtName}:</b> ${districtStats.slotsAvailable}${for18Plus}`)
                })
            }

            console.log(stats)
            if (stats && tgChannel) {
                if (process.env.TELEGRAM_BOT_TOKEN) {
                    tgMessages.push(`\n\n<i>Pulled at: ${new Date()}</i>`)
                    const tgClient = new TelegramClient({ accessToken: process.env.TELEGRAM_BOT_TOKEN })
                    await tgClient.sendMessage(tgChannel, tgMessages.join('\n'), { parseMode: ParseMode.HTML })
                    console.log(`Message sent to telegram channel "${tgChannel}".`);
                } else {
                    console.log(`"TELEGRAM_BOT_TOKEN" environmental variable not available.`);
                }
            }
        } else {
            console.log(`Entered state "${state}" not matched with CoWin state list.`);
        }
    } catch (error) {
        console.error(error.message)
        console.log('Try after sometime.')
    }
    console.timeEnd()
}

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