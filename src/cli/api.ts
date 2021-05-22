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

export const getStats = async (argv: any) => {
    try {
        const { state, district, tgChannel, d } = argv
        let date=new Date()
        if(d){
            date = new Date(d)
        }
        const symbolFor18Plus = '&#9989;'
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
            const tgMessages: string[] = []
            if (matchedDistrict) {
                stats = await cowin.getStatsByDistrict(matchedDistrict.district_id,date)
                tgMessages.push(`&#128137;<b>Cowin Stats - ${stats.district}, ${stats.state}</b>\n`)
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
                tgMessages.push(`\n<b><u>List of centers slots available for 18+</u></b>`)
                Object.entries(stats.centersFor18Plus).forEach(([_, value]) => {
                    const centerStats = value as any
                    if (centerStats.available_capacity > 0) {
                        tgMessages.push(`\n${symbolFor18Plus}<b>${centerStats.name}</b>`)
                        tgMessages.push(`${centerStats.address}`)
                        tgMessages.push(`${centerStats.block_name}`)
                        tgMessages.push(`${centerStats.district_name}`)
                        tgMessages.push(`${centerStats.pincode}`)
                        tgMessages.push(`<b>Available Slots:</b> ${centerStats.available_capacity}`)
                        tgMessages.push(`<b>Fee Type:</b> ${centerStats.fee_type}`)
                    }
                })
                tgMessages.push(`\n${symbolFor18Plus} - Has slots for 18+\n`)
            } else {
                stats = await cowin.getStatsByState(matchedState.state_id,date)
                tgMessages.push(`&#128137;<b>Cowin Stats - ${stats.state}</b>\n`)
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
                    const for18Plus = is18Plus ? ` ${symbolFor18Plus}` : ''
                    tgMessages.push(`<b>${districtName}:</b> ${districtStats.slotsAvailable}${for18Plus}`)
                })
                tgMessages.push(`\n${symbolFor18Plus} - Has centers for 18+\n`)
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
}