import axios from "axios"

import {getUrl, main} from './index'
import {Request, Response} from "express";
import {DateTime} from "luxon";

jest.mock('axios', () => ({
  get: jest.fn()
}))

describe('get-nba-games', () => {
    test('can be called with no error', async () => {
        expect.assertions(2)
        let mainError: Error
        let success: boolean
        await main({} as Request, {} as Response)
            .then(() => success = true)
            .catch(error => mainError = error)
        expect(mainError).toBeUndefined()
        expect(success).toBe(true)
    })
    test('calls axios get', async () => {
        let mainError: Error
        let success: boolean
        await main({} as Request, {} as Response)
            .then(() => success = true)
            .catch(error => mainError = error)
        expect(axios.get).toHaveBeenCalledWith(expect.any(String))
    })
});

describe('getUrl', () => {
    it('gets url from datetime first half of the year', () => {
        const dateTime = DateTime.fromFormat( '2021-07-15', 'yyyy-MM-dd')
        expect(getUrl(dateTime)).toBe('https://sportsdata.usatoday.com/basketball/nba/scores?date=2021-07-15&season=2020-2021')
    })
    it('gets url from datetime second half of the year', () => {
        const dateTime = DateTime.fromFormat( '2021-08-15', 'yyyy-MM-dd')
        expect(getUrl(dateTime)).toBe('https://sportsdata.usatoday.com/basketball/nba/scores?date=2021-08-15&season=2021-2022')
    })
    it('gets url from todays date if not passed', () => {
        expect(getUrl()).toEqual(expect.any(String))
    })
})
