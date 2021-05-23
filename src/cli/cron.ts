import cron from 'node-cron'
import { getStats } from './api'
import moment from 'moment'

cron.schedule('*/5 * * * *', () => {
    [0,1,2,3].forEach(i=>{
        getStats({
            state:'tamil nadu',
            district: 'chennai',
            tgChannel: '@cowinatortest',
            d: moment().add(i,'days').format('MM-DD-YYYY')
        })
    })
});

// cron.schedule('5,20,35,50 * * * *', () => {
//     getStats({
//         state:'tamil nadu',
//         district: 'nagapattinam',
//         tgChannel: '@cowinator_tamilnadu'
//     })
// });

// cron.schedule('10,25,40,55 * * * *', () => {
//     getStats({
//         state:'tamil nadu',
//         district: 'chennai',
//         tgChannel: '@cowinator_tamilnadu'
//     })
// });

// cron.schedule('11,26,41,56 * * * *', () => {
//     getStats({
//         state:'tamil nadu',
//         district: 'Kanchipuram',
//         tgChannel: '@cowinator_tamilnadu'
//     })
// });

// cron.schedule('0,30 * * * *', () => {
//     getStats({
//         state:'tamil nadu',
//         tgChannel: '@cowinator_tamilnadu'
//     })
// });

// cron.schedule('12,27,42,57 * * * *', () => {
//     getStats({
//         state:'karnataka',
//         district: 'bbmp',
//         tgChannel: '@cowinator_karnataka'
//     })
// });

// cron.schedule('5,35 * * * *', () => {
//     getStats({
//         state:'karnataka',
//         tgChannel: '@cowinator_karnataka'
//     })
// });