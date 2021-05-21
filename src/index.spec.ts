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
        const districts = (await client.getDistricts(31))
        const promisses = districts.map(async ({ district_id }) => {
            return client.getStatsByDistrict(district_id, new Date('05-21-2021'))
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
            noOfCentersWithSlotsByAge: {},
            byVaccine: {}
        }
        const districtsFor18Plus: any[] = []
        results.forEach(result => {
            if (result.district) {
                stats.date = result.date
                stats.state = result.state
                stats.slotsAvailable += result.slotsAvailable
                stats.byDistrict = addToExisting(stats.byDistrict, result.district, {
                    slotsAvailable: result.slotsAvailable,
                    noOfCentersByAge: result.noOfCentersByAge,
                    noOfCentersWithSlotsByAge: result.noOfCentersWithSlotsByAge
                })
                if (result.noOfCentersWithSlotsByAge['18+']) {
                    districtsFor18Plus.push({
                        district: result.district,
                        count: result.noOfCentersWithSlotsByAge['18+']
                    })
                }

                groupedStats(stats.byFeeType, result.byFeeType)
                groupedStats(stats.byAge, result.byAge)
                groupedStats(stats.noOfCentersByAge, result.noOfCentersByAge)
                groupedStats(stats.noOfCentersWithSlotsByAge, result.noOfCentersWithSlotsByAge)
                groupedStats(stats.byVaccine, result.byVaccine)
            }
        })
        if (stats.noOfCentersByAge['18+']) {
            notifier.notify({
                title: 'CoWiNator - Alert',
                message: `State: ${stats.state}\n` +
                    `No. Of centers for 18+: ${stats.noOfCentersByAge['18+']}`,
                sound: true,
            });
        }

        if (districtsFor18Plus.length) {
            setTimeout(() => {
                notifier.notify({
                    title: 'CoWiNator - Alert',
                    message: `Districs for 18+: ${districtsFor18Plus.map(o => `${o.district} (${o.count})`).join(', ')}`,
                    sound: true,
                });
            }, 5000)
        }
        console.log(stats);
        console.log(`Districts for 18+: ${districtsFor18Plus.map(o => `${o.district} (${o.count})`).join(', ')}`);
        done()
    })
})