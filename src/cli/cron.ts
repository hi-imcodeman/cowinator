import cron from 'node-cron'
import { Cowinator } from '../index'
import { getStats, getSlotsFor18Plus } from './api'
// import moment from 'moment'

const client = new Cowinator()

const sleep = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

cron.schedule('0 * * * *', async () => {
    console.log('Cron started.')
    const tgChannel='@cowinator_tamilnadu'
    const state = await client.findStateByName('tamil nadu')
    if (state) {
        const { state_id, state_name } = state
        const districtsList = (await client.getDistricts(state_id))
        let i = 0;
        while (i < districtsList.length) {
            const { district_name } = districtsList[i]
            getSlotsFor18Plus({
                state: state_name,
                district: district_name,
                tgChannel
            })
            i++
            await sleep(15000)
        }
        getStats({
            state: state_name,
            tgChannel
        })
    }
});

cron.schedule('30 * * * *', async () => {
    console.log('Cron started.')
    const tgChannel='@cowinator_karnataka'
    const state = await client.findStateByName('karnataka')
    if (state) {
        const { state_id, state_name } = state
        const districtsList = (await client.getDistricts(state_id))
        let i = 0;
        while (i < districtsList.length) {
            const { district_name } = districtsList[i]
            getSlotsFor18Plus({
                state: state_name,
                district: district_name,
                tgChannel
            })
            i++
            await sleep(15000)
        }
        getStats({
            state: state_name,
            tgChannel
        })
    }
});

