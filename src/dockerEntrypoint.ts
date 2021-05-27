import { Telegraf } from 'telegraf'

import './cron'

if (process.env.TELEGRAM_BOT_TOKEN) {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
    bot.start((ctx) => ctx.reply('Welcome'))
    bot.help((ctx) => ctx.reply('Send me a sticker'))
    bot.on('sticker', (ctx) => ctx.reply('👍'))
    bot.hears('hi', (ctx) => ctx.reply('Hey there'))
    bot.hears(/echo (.*)/, (ctx) => {
        if(ctx.match[1]){
            ctx.reply(ctx.match[1])
        }
    })
    bot.launch()
    console.log('Telegram Bot initiated.');

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
}
