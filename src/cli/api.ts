import { Cowinator } from '../index'
import { sendTgHtmlMessage, testChannelId } from '../telegram'
import moment from 'moment'

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
        let date = new Date()
        if (d) {
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
                stats = await cowin.getStatsByDistrict(matchedDistrict.district_id, date)
                tgMessages.push(`&#128137;<b>Cowin Stats - ${matchedDistrict.district_name}, ${stats.state}</b>\n`)
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
                stats = await cowin.getStatsByState(matchedState.state_id, date)
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
                    sendTgHtmlMessage(tgChannel, tgMessages.join('\n'))
                    console.log(`Message sent to telegram channel "${tgChannel}".`);
                } else {
                    console.log(`"TELEGRAM_BOT_TOKEN" environmental variable not available.`);
                }
            }
        } else {
            console.log(`Entered state "${state}" not matched with CoWin state list.`);
        }
    } catch (error) {
        console.error(error)
        sendTgHtmlMessage(testChannelId, `&#10060; <b>Error - Get Stats\n\nError:</b> ${error.message}\n\n${JSON.stringify(argv)}`)
    }
}
export const formatMessage18Plus = (for18Plus: any) => {
    const tgMessages: string[] = []
    const symbolFor18Plus = '&#9989;'
    if (for18Plus.availableCentersFor18Plus.length) {
        tgMessages.push(`${symbolFor18Plus}<b>Vaccine availability (18+) - ${for18Plus.centerFor18Plus[0].district_name}, ${for18Plus.centerFor18Plus[0].state_name}</b>\n`)
        tgMessages.push(`There is <b><u>${for18Plus.centerFor18Plus.length} / ${for18Plus.totalCenters} centers</u></b> for 18+, but only <b><u>${for18Plus.availableCentersFor18Plus.length} center</u></b> having slots as of now.`)
        for18Plus.availableCentersFor18Plus.forEach((center: any) => {
            tgMessages.push(`\n&#128073;<b><u>${center.name}</u></b>`)
            tgMessages.push(`${center.address}`)
            tgMessages.push(`${center.block_name} - ${center.pincode}`)
            if (center.vaccine_fees && center.vaccine_fees.length && center.fee_type === 'Paid') {
                tgMessages.push(`<b>Fees:</b> ${center.vaccine_fees.map((item: { vaccine: string; fee: string }) => item.vaccine + ' - Rs.' + item.fee).join(', ')}`)
            } else {
                tgMessages.push(`<b>Type:</b> ${center.fee_type}`)
            }

            center.sessions.forEach((session: any) => {
                if (session.available_capacity > 0) {
                    tgMessages.push(`\n<b><u>${session.date}:</u></b> ${session.available_capacity} | ${session.vaccine}`)
                    if (session.available_capacity_dose1 > 0) {
                        tgMessages.push(`<b>1st Dose:</b> ${session.available_capacity_dose1}`)
                    }
                    if (session.available_capacity_dose2 > 0) {
                        tgMessages.push(`<b>2nd Dose:</b> ${session.available_capacity_dose2}`)
                    }
                }
            })

        })
    }
    else if (for18Plus.centerFor18Plus.length) {
        tgMessages.push(`&#10060;<b>Vaccine availability (18+) - ${for18Plus.centerFor18Plus[0].district_name}, ${for18Plus.centerFor18Plus[0].state_name}</b>\n`)
        tgMessages.push(`There is <b><u>${for18Plus.centerFor18Plus.length} / ${for18Plus.totalCenters} centers</u></b> for 18+, but no slots are available now.`)
    }
    if (tgMessages.length)
        tgMessages.push(`\n<i>Pulled at: ${moment().format('hh:mm a')}</i>`)
    
    return tgMessages.join('\n')
}
export const getSlotsFor18Plus = async (argv: any) => {
    try {
        const { state, district, tgChannel, d } = argv
        let date = new Date()
        if (d) {
            date = new Date(d)
        }
        let errorMsg=null
        const matchedState = await cowin.findStateByName(state)
        if (matchedState) {
            let matchedDistrict = null
            let messageForTg = ''
            if (district) {
                matchedDistrict = await cowin.findDistrictByName(matchedState.state_id, district)
                if (matchedDistrict === null) {
                    errorMsg = `Entered district "${district}" not matched with CoWin district list of "${matchedState.state_name}".`
                    console.log(errorMsg);
                }
            }
            if (matchedDistrict) {
                const for18Plus = await cowin.getAvailabilityFor18Plus(matchedDistrict.district_id, date)
                messageForTg=formatMessage18Plus(for18Plus)
                console.log({
                    district: matchedDistrict?.district_name,
                    noOfCenters: for18Plus?.centerFor18Plus.length,
                    noOfAvalableCenters: for18Plus?.availableCentersFor18Plus.length
                })
            }
            if (messageForTg && tgChannel) {
                if (process.env.TELEGRAM_BOT_TOKEN) {
                    sendTgHtmlMessage(tgChannel, messageForTg)
                    console.log(`Message sent to telegram channel "${tgChannel}".`);
                } else {
                    console.log(`"TELEGRAM_BOT_TOKEN" environmental variable not available.`);
                }
            }
            return {
                message: messageForTg,
                errorMsg,
                matchedDistrict,
                matchedState
            }
        } else {
            errorMsg=`Entered state "${state}" not matched with CoWin state list.`
            console.log(errorMsg);
            return {
                message: '',
                errorMsg
            }
        }
    } catch (error) {
        console.error(error)
        sendTgHtmlMessage(testChannelId, `&#10060; <b>Error - Get Stats\n\nError:</b> ${error.message}\n\n${JSON.stringify(argv)}`)
    }
}
