import axios from 'axios'
import moment from 'moment'
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

export const addToExisting = (obj: any, key: any, value: any) => {
    if (obj[key] && !isNaN(obj[key]))
        obj[key] += value
    else
        obj[key] = value
    return obj
}

export const groupedStats = (obj: any, data: any) => {
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
            noOfCentersWithSlotsByAge:{},
            byVaccine: {}
        }
        sessions.forEach(session => {
            const {
                state_name,
                district_name,
                block_name,
                fee_type,
                min_age_limit,
                vaccine
            } = session
            let available_capacity = session.available_capacity > 0 ? session.available_capacity : 0
            if (available_capacity === 0) {
                if (session.available_capacity_dose1 > 0) {
                    available_capacity += session.available_capacity_dose1
                }
                if (session.available_capacity_dose2 > 0) {
                    available_capacity += session.available_capacity_dose2
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
        })
        return stats
    }
}