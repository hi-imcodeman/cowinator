import { Context, Telegraf, session } from 'telegraf'
import ImageCharts from 'image-charts'
import { Cowinator } from './index'
import { getSlotsFor18Plus } from './cli/api'

interface SessionData {
    messageCount: number
    state: string
    district: string
    interval: any
    // ... more session data go here
}

interface LocationInfo {
    state: string
    district: string
}

interface MyContext extends Context {
    session?: SessionData
    // ... more props go here
}

const helpCallback = (ctx: MyContext) => {
    const responses = []
    responses.push('<b>Use the following commands</b>\n')
    responses.push('/slots - To get the available slots for 18+ age group. You will recieve alerts for every 5 mins\n')
    responses.push('Ex.: "/slots tamil nadu,chennai"\n')
    responses.push('/stats - To get today\'s stats.\n')
    responses.push('Ex.: "/stats tamil nadu,chennai"\n')
    responses.push('/off - To unsubscribe the alerts.')
    ctx.reply(responses.join('\n'), { parse_mode: 'HTML' })
}

const sendSlotsFor18Plus = async (ctx: MyContext) => {
    let isSuccess = false
    if (ctx.session) {
        const { state, district } = ctx.session
        const response = await getSlotsFor18Plus({
            state,
            district
        })
        if (response?.message) {
            isSuccess = true
            ctx.reply(response?.message, { parse_mode: 'HTML' })
        }
        else if (response?.matchedDistrict) {
            isSuccess = true
            const { matchedDistrict, matchedState } = response
            ctx.reply(`No data available for 18+ in ${matchedDistrict.district_name}, ${matchedState.state_name}`)
        }
        else if (response?.errorMsg) {
            ctx.reply(response.errorMsg)
        }
    }
    return isSuccess
}
const defaultSeriesColors = ['A8C69F', 'CCE2A3', '654F6F', '5C5D8D', '99A1A6']
const generatePieChart = (stats: any, title: string, locationInfo: LocationInfo, seriesColors: string[] = defaultSeriesColors) => {
    const available = Object.entries(stats).filter(([_key, value]) => value as number > 0)
    if (available.length) {
        const values = available.map(item => item[1]).join(',')
        const labels = available.map(item => `${item[0]} (${item[1]})`).join('|')
        const legends = available.map(item => item[0]).join('|')
        const pie = new ImageCharts()
            .chtt(`${title} - ${locationInfo.district}, ${locationInfo.state}`)
            .cht('p')
            .chd(`a:${values}`)
            .chl(labels)
            .chdl(legends)
            .chco(seriesColors.join('|'))
            .chs('500x500');
        return pie.toURL()
    }
    return null
}

if (process.env.TELEGRAM_BOT_TOKEN) {
    const bot = new Telegraf<MyContext>(process.env.TELEGRAM_BOT_TOKEN)
    const cowin = new Cowinator()
    bot.use(session())
    bot.start(async (ctx) => {
        await ctx.reply('Welcome to Cowinator Bot.\n')
        helpCallback(ctx)
    })
    bot.help(helpCallback)
    bot.on('sticker', (ctx) => ctx.reply('👍'))
    bot.hears(/slots ([a-z\s]+),\s*([a-z\s]+)/i, async (ctx) => {
        ctx.session ??= { messageCount: 0, state: '', district: '', interval: null }
        ctx.session.messageCount++
        const { match } = ctx
        const [_inputText, state, district] = match
        ctx.session.state = state
        ctx.session.district = district
        const isSuccess = await sendSlotsFor18Plus(ctx)
        if (isSuccess) {
            ctx.reply(`You have subscribed for ${state},${district}`)
            if (ctx.session.interval) {
                clearInterval(ctx.session.interval)
                ctx.session.interval = null
            }
            ctx.session.interval = setInterval(() => {
                sendSlotsFor18Plus(ctx)
            }, 1 * 10 * 1000)

        }
    })
    bot.hears('/slots', helpCallback)
    bot.command(['off'], (ctx) => {
        if (ctx.session?.interval) {
            clearInterval(ctx.session.interval)
            ctx.session.interval = null
        }
        ctx.reply(`You have disabled the subscription.`)
    })
    bot.hears(/stats ([a-z\s]+),\s*([a-z\s]+)/i, async (ctx) => {
        console.log('Pulling stats');
        const { match } = ctx
        const [_inputText, state, district] = match
        ctx.reply('Pulling stats... Please wait...')
        const matchedState = await cowin.findStateByName(state)
        if (matchedState) {
            const matchedDistrict = await cowin.findDistrictByName(matchedState.state_id, district)
            if (matchedDistrict) {
                const stats = await cowin.getStatsByDistrict(matchedDistrict.district_id)
                console.log(stats)
                const locationInfo: LocationInfo = {
                    state: matchedState.state_name,
                    district: matchedDistrict.district_name
                }
                const byAgePie = generatePieChart(stats.byAge, 'Slots available by Age Group', locationInfo)
                const noOfCentersByAgePie = generatePieChart(stats.noOfCentersByAge, 'No. of centers by Age Group', locationInfo)
                const byVaccinePie = generatePieChart(stats.byVaccine, 'Slots by by Vaccine', locationInfo, ['ffe66d', '4ecdc4'])
                const byFeeTypePie = generatePieChart(stats.byFeeType, 'Slots by Fee Type', locationInfo, ['ffa62b', '82c0cc'])
                const byDosePie = generatePieChart(stats.byDose, 'Slots by Dose', locationInfo, ['b9faf8', 'b298dc'])
                if (byAgePie)
                    await ctx.replyWithPhoto(byAgePie)
                if (noOfCentersByAgePie)
                    await ctx.replyWithPhoto(noOfCentersByAgePie)
                if (byVaccinePie)
                    await ctx.replyWithPhoto(byVaccinePie)
                if (byFeeTypePie)
                    await ctx.replyWithPhoto(byFeeTypePie)
                if (byDosePie)
                    await ctx.replyWithPhoto(byDosePie)
            }
        }
    })
    bot.launch()
    console.log('Telegram Bot initiated.');

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
}
