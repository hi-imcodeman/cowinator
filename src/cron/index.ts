import cron from 'node-cron'
import { Cowinator } from '../index'
import { getSlotsFor18Plus } from '../cli/api'

const client = new Cowinator()

const sleep = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

const sendStats = async (stateName: string, tgChannel: string) => {
    const state = await client.findStateByName(stateName)
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
            await sleep(10000)
        }
        console.log(`Done for ${state_name}`);
    }
}

console.log('Cron initiated.');

cron.schedule('0,30 * * * *', () => {
    console.log('Cron job running.')
    const tgChannel = '@cowinator_tamilnadu'
    sendStats('tamil nadu',tgChannel)
});

cron.schedule('15,45 * * * *', async () => {
    console.log('Cron job running.')
    const tgChannel = '@cowinator_karnataka'
    sendStats('karnataka',tgChannel)
});