import axios from 'axios'
import moment from 'moment'
import lunr from 'lunr'

export interface State {
    state_id: number
    state_name: string
}

export interface District {
    district_id: number
    district_name: string
}

export interface Session {
    center_id: number
    name: string
    address: string
    state_name: string
    district_name: string
    block_name: string
    pincode: number
    from: string
    to: string
    lat: number
    long: number
    fee_type: string
    session_id: string
    date: string
    available_capacity_dose1: number
    available_capacity_dose2: number
    available_capacity: number
    fee: string
    min_age_limit: number
    vaccine: string
    slots: string[]
}

const addToExisting = (obj: any, key: any, value: any) => {
    if (obj[key] && !isNaN(obj[key]))
        obj[key] += value
    else
        obj[key] = value
    return obj
}

const groupedStats = (obj: any, data: any) => {
    Object.entries(data).forEach(([key, value]) => {
        obj = addToExisting(obj, key, value as number)
    })
}
export class Cowinator {
    baseUrl = 'https://cdn-api.co-vin.in'
    locale = 'en_US'
    async getData(endpoint: string) {
        const { data } = await axios.get(`${this.baseUrl}${endpoint}`, {
            headers: {
                'accept': 'application/json',
                'Accept-Language': this.locale,
                'User-Agent': `axios-${Math.random() * 999999}`
            }
        })
        return data
    }
    async getStates(): Promise<State[]> {
        const { states } = await this.getData('/api/v2/admin/location/states')
        return states
    }

    async getDistricts(stateId: number): Promise<District[]> {
        const { districts } = await this.getData(`/api/v2/admin/location/districts/${stateId}`)
        return districts
    }

    async findByDistrict(districtId: number, date: Date = new Date()): Promise<Session[]> {
        const dateStr = moment(date).format('DD-MM-YYYY')
        const { sessions } = await this.getData(
            `/api/v2/appointment/sessions/public/findByDistrict?district_id=${districtId}&date=${dateStr}`)
        return sessions
    }

    async findCalenderByDistrict(districtId: number, date: Date = new Date()): Promise<any[]> {
        const dateStr = moment(date).format('DD-MM-YYYY')
        const { centers } = await this.getData(
            `/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${dateStr}`)
        return centers
    }

    async getAvailabilityFor18Plus(districtId: number, date: Date = new Date()) {
        const centers = await this.findCalenderByDistrict(districtId, date)
        const centerFor18Plus = centers.filter(center => {
            const sessionsFor18Plus = center.sessions.filter((session: { min_age_limit: number }) => session.min_age_limit === 18)
            if (sessionsFor18Plus.length)
                return true
        })
        const availableCentersFor18Plus = centerFor18Plus.filter(center => {
            const availableSessions = center.sessions.filter((session: { min_age_limit: number; available_capacity: number }) => session.min_age_limit === 18 && session.available_capacity > 0)
            if (availableSessions.length)
                return true
        })
        return {
            totalCenters: centers.length,
            centerFor18Plus,
            availableCentersFor18Plus
        }
    }

    async findStateByName(query: string) {
        const states = await this.getStates()
        const idx = lunr(function () {
            this.field('state_name')
            this.field('state_id')
            states.forEach((state, id) => {
                this.add({ ...state, id })
            })
        })
        const result = idx.search(query)
        if (result.length) {
            const { ref } = result[0]
            return states[Number(ref)]
        }
        return null
    }

    async findDistrictByName(stateId: number, query: string) {
        const districts = await this.getDistricts(stateId)
        const idx = lunr(function () {
            this.field('district_name')
            this.field('district_id')
            districts.forEach((district, id) => {
                this.add({ ...district, id })
            })
        })
        const result = idx.search(query)
        if (result.length) {
            const { ref } = result[0]
            return districts[Number(ref)]
        }
        return null
    }

    async getStatsByDistrict(districtId: number, date: Date = new Date()) {
        const sessions = await this.findByDistrict(districtId, date)
        const stats: any = {
            date,
            state: '',
            districtId,
            district: '',
            slotsAvailable: 0,
            byBlock: {},
            byFeeType: {},
            byAge: {},
            noOfCentersByAge: {},
            noOfCentersWithSlotsByAge: {},
            byVaccine: {},
            centersFor18Plus: {}
        }

        sessions.forEach(session => {
            const {
                center_id,
                name,
                address,
                state_name,
                district_name,
                block_name,
                pincode,
                fee_type,
                fee,
                available_capacity_dose1,
                available_capacity_dose2,
                min_age_limit,
                vaccine
            } = session
            let available_capacity = session.available_capacity > 0 ? session.available_capacity : 0
            if (available_capacity === 0) {
                if (available_capacity_dose1 > 0) {
                    available_capacity += available_capacity_dose1
                }
                if (session.available_capacity_dose2 > 0) {
                    available_capacity += available_capacity_dose2
                }
            }

            stats.date = date
            stats.state = state_name
            stats.district = district_name
            stats.slotsAvailable += available_capacity
            stats.byBlock = addToExisting(stats.byBlock, block_name, available_capacity)
            stats.byFeeType = addToExisting(stats.byFeeType, fee_type, available_capacity)
            stats.byAge = addToExisting(stats.byAge, `${min_age_limit}+`, available_capacity)
            stats.noOfCentersByAge = addToExisting(stats.noOfCentersByAge, `${min_age_limit}+`, 1)
            stats.noOfCentersWithSlotsByAge = addToExisting(stats.noOfCentersWithSlotsByAge, `${min_age_limit}+`, available_capacity > 0 ? 1 : 0)
            stats.byVaccine = addToExisting(stats.byVaccine, vaccine, available_capacity)
            if (min_age_limit === 18) {
                stats.centersFor18Plus = addToExisting(stats.centersFor18Plus, center_id, {
                    fee_type,
                    fee,
                    name,
                    address,
                    block_name,
                    district_name,
                    state_name,
                    pincode,
                    available_capacity,
                    available_capacity_dose1,
                    available_capacity_dose2
                })
            }
        })
        return stats
    }

    async getStatsByState(stateId: number, date: Date = new Date()) {
        const districts = await this.getDistricts(stateId)
        const promises = districts.map(async ({ district_id }) => {
            return this.getStatsByDistrict(district_id, date)
        })
        const results = await Promise.all(promises)

        const stats: any = {
            date: '',
            state: '',
            slotsAvailable: 0,
            byDistrict: {},
            byFeeType: {},
            byAge: {},
            noOfCentersByAge: {},
            noOfCentersWithSlotsByAge: {},
            byVaccine: {},
            districtsFor18Plus: null
        }
        const districtsFor18Plus: any = {}
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
                    districtsFor18Plus[result.district] = result.noOfCentersWithSlotsByAge['18+']
                }

                groupedStats(stats.byFeeType, result.byFeeType)
                groupedStats(stats.byAge, result.byAge)
                groupedStats(stats.noOfCentersByAge, result.noOfCentersByAge)
                groupedStats(stats.noOfCentersWithSlotsByAge, result.noOfCentersWithSlotsByAge)
                groupedStats(stats.byVaccine, result.byVaccine)
            }
        })
        stats.districtsFor18Plus = districtsFor18Plus
        return stats
    }
}
