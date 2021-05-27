import { Telegraf } from 'telegraf'
import { getSlotsFor18Plus } from './cli/api'

// import './cron'

if (process.env.TELEGRAM_BOT_TOKEN) {
    const helpCallback = (ctx: any) => {
        const responses = []
        responses.push('Please provide state and district like below.\n')
        responses.push('slots {state name},{district name}\n')
        responses.push('Ex.: "slots tamil nadu,chennai"')
        ctx.reply(responses.join('\n'), { parse_mode: 'HTML' })
    }
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
    bot.start((ctx) => ctx.reply('Welcome to Cowinator Bot.'))
    bot.help(helpCallback)
    bot.on('sticker', (ctx) => ctx.reply('👍'))
    bot.hears('/slots', helpCallback)
    bot.hears(/slots ([a-z\s]+),\s*([a-z\s]+)/i, async (ctx) => {
        const { match } = ctx
        setInterval(async () => {
            const msg = await getSlotsFor18Plus({
                state: match[1], district: match[2]
            })
            if (msg)
                ctx.reply(msg, { parse_mode: 'HTML' })
            else
                ctx.reply('Something went wrong.')
        }, 10000)

    })

    bot.launch()
    console.log('Telegram Bot initiated.');

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
}
