import { Cowinator, addToExisting, groupedStats } from './index'
import notifier from 'node-notifier'

jest.setTimeout(999999)

describe('class: Cowinator', () => {
    const client = new Cowinator()
    test('getStates', async (done) => {
        const states = await client.getStates()
        expect(states.length).toBe(37)
        done()
    })
    test('getDistricts', async (done) => {
        const districts = await client.getDistricts(31)
        console.log(districts);

        expect(districts.length).toBe(45)
        done()
    })
    test('findByDistrict', async (done) => {
        const sessions = await client.findByDistrict(576)
        expect(sessions.length).toBeGreaterThan(10)
        done()
    })
    
    test.only('getStatsByDistrict', async (done) => {
        const districts = (await client.getDistricts(31)).filter((_, i) => i < 100)
        const promisses = districts.map(async ({ district_id }) => {
            return client.getStatsByDistrict(district_id)
        })
        const results = await Promise.all(promisses)
        const stats: any = {
            date: '',
            state: '',
            slotsAvailable: 0,
            byDistrict: {},
            byFeeType: {},
            byAge: {},
            noOfCentersByAge: {},
            byVaccine: {}
        }
        results.forEach(result => {
            console.log(result)
            stats.date = result.date
            stats.state = result.state
            stats.slotsAvailable += result.slotsAvailable
            stats.byDistrict = addToExisting(stats.byDistrict, result.district, {
                slotsAvailable: result.slotsAvailable,
                noOfCentersByAge: result.noOfCentersByAge
            })
            groupedStats(stats.byFeeType, result.byFeeType)
            groupedStats(stats.byAge, result.byAge)
            groupedStats(stats.noOfCentersByAge, result.noOfCentersByAge)
            groupedStats(stats.byVaccine, result.byVaccine)
        })
        notifier.notify({
            title: 'CoWiNator - Alert',
            message:`State: ${stats.state}\n`+ 
            `No. Of centers for 18+: ${stats.noOfCentersByAge['18+']}`,
            sound: true,
          });
        console.log(stats);
        done()
    })
})