import {main} from './index'
import {Request, Response} from "express";
import {DateTime, Duration} from "luxon";

describe('get-nba-games', () => {
    const baseExpectedGameResult = {
        state: expect.stringMatching(/upcoming|live|finished/),
        time: expect.any(String),
        awayTeam: {
            name: expect.any(String),
            record: expect.stringMatching(/[0-9]{1,2}-[0-9]{1,2}/),
            points: expect.any(Number)
        },
        homeTeam: {
            name: expect.any(String),
            record: expect.stringMatching(/[0-9]{1,2}-[0-9]{1,2}/),
            points: expect.any(Number)
        },
    };

    test('resolves to expected response, no query params', async () => {
        let mainError: Error
        let mainResult: unknown
        const json = jest.fn(x => x)
        await main({} as Request, { json } as unknown as Response)
            .then((result) => mainResult = result)
            .catch(error => mainError = error)
        expect(mainError).toBeUndefined()
        expect(mainResult).not.toBeUndefined()
        expect(mainResult).toEqual(expect.arrayContaining([{
            ...baseExpectedGameResult
        }]))
    })
    test('resolves to expected response, yesterday', async () => {
        let mainError: Error
        let mainResult: unknown
        const json = jest.fn(x => x)
        const dateString: string = DateTime
            .fromJSDate(new Date())
            .minus(Duration.fromObject({ days: 1}))
            .toFormat("yyyy-MM-dd")
        await main({ query: {date: dateString} } as unknown as Request, { json } as unknown as Response)
            .then((result) => mainResult = result)
            .catch(error => mainError = error)
        expect(mainError).toBeUndefined()
        expect(mainResult).not.toBeUndefined()
        expect(mainResult).toEqual(expect.arrayContaining([{
            ...baseExpectedGameResult,
            time: 'Final',
            state: 'finished',
        }]))
    })
    test('resolves to expected response, tomorrow', async () => {
        let mainError: Error
        let mainResult: unknown
        const json = jest.fn(x => x)
        const dateString: string = DateTime
            .fromJSDate(new Date())
            .plus(Duration.fromObject({ days: 1}))
            .toFormat("yyyy-MM-dd")
        await main({ query: {date: dateString} } as unknown as Request, { json } as unknown as Response)
            .then((result) => mainResult = result)
            .catch(error => mainError = error)
        expect(mainError).toBeUndefined()
        expect(mainResult).not.toBeUndefined()
        expect(mainResult).toEqual(expect.arrayContaining([{
            ...baseExpectedGameResult,
            time: expect.stringMatching(/[0-9]+:[0-9]+/),
            state: 'upcoming',
        }]))
    })
});
