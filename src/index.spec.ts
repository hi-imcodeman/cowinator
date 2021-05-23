import { Cowinator } from './index'

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
        expect(districts.length).toBe(45)
        done()
    })
    test('findByDistrict', async (done) => {
        const sessions = await client.findByDistrict(576)
        expect(sessions.length).toBeGreaterThan(1)
        done()
    })

    test('getStatsByDistrict', async (done) => {
        const stats = await client.getStatsByDistrict(576)
        expect(stats.state).toBe('Tamil Nadu')
        expect(stats.district).toBe('Nagapattinam')
        expect(stats.slotsAvailable).toBeGreaterThan(0)
        expect(stats.byBlock).toBeDefined()
        expect(stats.byFeeType).toBeDefined()
        expect(stats.byAge).toBeDefined()
        expect(stats.noOfCentersByAge).toBeDefined()
        expect(stats.noOfCentersWithSlotsByAge).toBeDefined()
        expect(stats.byVaccine).toBeDefined()
        done()
    })

    test('findByStateByName and findByDistrictByName', async (done) => {
        const stateMatch = await client.findStateByName('tamil')
        expect(stateMatch!.state_id).toBe(31)
        expect(stateMatch!.state_name).toBe('Tamil Nadu')
        const districtMatch = await client.findDistrictByName(stateMatch!.state_id, 'nagapattinam')
        expect(districtMatch!.district_id).toBe(576)
        expect(districtMatch!.district_name).toBe('Nagapattinam')
        done()
    })
    
    test('get stats for whole state', async (done) => {
        const stateMatch = await client.findStateByName('tamil')
        const stats = await client.getStatsByState(stateMatch!.state_id)
        expect(stats.state).toBe('Tamil Nadu')
        expect(stats.districtsFor18Plus).toBeDefined()
        done()
    })
})
