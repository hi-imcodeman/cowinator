import { Telegram } from 'telegraf'

export const testChannelId = '@cowinatortest'

export const sendTgHtmlMessage = async (chatId: string, message: string) => {
    if (process.env.TELEGRAM_BOT_TOKEN) {
        const tgClient = new Telegram(process.env.TELEGRAM_BOT_TOKEN)
        try {
            await tgClient.sendMessage(chatId, message, { parse_mode: 'HTML' })
        } catch (error) {
            tgClient.sendMessage(testChannelId, error.message, { parse_mode: 'HTML' })
        }
    }
}