import { Context, Telegraf, session } from 'telegraf'
import { getSlotsFor18Plus } from './cli/api'

interface SessionData {
    messageCount: number
    state: string
    district: string
    // ... more session data go here
}

interface MyContext extends Context {
    session?: SessionData
    // ... more props go here
}

const helpCallback = (ctx: MyContext) => {
    const responses = []
    responses.push('Please provide state and district like below.\n')
    responses.push('slots {state name},{district name}\n')
    responses.push('Ex.: "slots tamil nadu,chennai"')
    ctx.reply(responses.join('\n'), { parse_mode: 'HTML' })
}

const sendSlotsFor18Plus = async (ctx: MyContext) => {
    if (ctx.session) {
        const { state, district } = ctx.session
        const response = await getSlotsFor18Plus({
            state,
            district
        })
        if (response?.message)
            ctx.reply(response?.message, { parse_mode: 'HTML' })
        else if (response?.errorMsg)
            ctx.reply(response.errorMsg)
        else if (response?.matchedDistrict) {
            const { matchedDistrict, matchedState } = response
            ctx.reply(`No data available for 18+ in ${matchedDistrict.district_name}, ${matchedState.state_name}`)
        }
    }
}


if (process.env.TELEGRAM_BOT_TOKEN) {
    const bot = new Telegraf<MyContext>(process.env.TELEGRAM_BOT_TOKEN)
    bot.use(session())
    bot.start((ctx) => ctx.reply('Welcome to Cowinator Bot.'))
    bot.help(helpCallback)
    bot.on('sticker', (ctx) => ctx.reply('👍'))
    bot.hears('/slots', helpCallback)
    bot.hears(/slots ([a-z\s]+),\s*([a-z\s]+)/i, async (ctx) => {
        ctx.session ??= { messageCount: 0, state: '', district: '' }
        ctx.session.messageCount++
        const { match } = ctx
        const [_inputText, state, district] = match
        ctx.session.state = state
        ctx.session.district = district
        // ctx.reply(`MessageCounter:${ctx.session.messageCount}`)
        await sendSlotsFor18Plus(ctx)
        ctx.reply(`You have subscribed for ${state},${district}`)
        if (ctx.session.messageCount === 1){
            // ctx.reply('Substriction initiated.')
            setInterval(() => sendSlotsFor18Plus(ctx), 5 * 60 * 1000)
        }    
    })

    bot.launch()
    console.log('Telegram Bot initiated.');

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
}
