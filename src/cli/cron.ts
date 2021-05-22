import cron from 'node-cron'
import { getStats } from './api'

cron.schedule('5,20,35,50 * * * *', () => {
    getStats({
        state:'tamil nadu',
        district: 'nagapattinam',
        tgChannel: '@cowinator_tamilnadu'
    })
});

cron.schedule('10,25,40,55 * * * *', () => {
    getStats({
        state:'tamil nadu',
        district: 'chennai',
        tgChannel: '@cowinator_tamilnadu'
    })
});

cron.schedule('11,26,41,56 * * * *', () => {
    getStats({
        state:'tamil nadu',
        district: 'Kanchipuram',
        tgChannel: '@cowinator_tamilnadu'
    })
});

cron.schedule('0,30 * * * *', () => {
    getStats({
        state:'tamil nadu',
        tgChannel: '@cowinator_tamilnadu'
    })
});

cron.schedule('12,27,42,57 * * * *', () => {
    getStats({
        state:'bbmp',
        district: 'karnataka',
        tgChannel: '@cowinator_karnataka'
    })
});

cron.schedule('5,35 * * * *', () => {
    getStats({
        state:'karnataka',
        tgChannel: '@cowinator_karnataka'
    })
});