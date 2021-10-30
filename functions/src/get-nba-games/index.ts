import {Request, Response} from "express";
import axios from "axios";
import cheerio, {Element, Cheerio} from "cheerio";
import {DateTime} from "luxon";

export const getUrl = (dateTime: DateTime = DateTime.fromJSDate(new Date())): string => {
    const date = dateTime.toFormat("yyyy-MM-dd")
    const season = dateTime.month > 7 ?
        `${dateTime.year}-${dateTime.year +1}` :
        `${dateTime.year-1}-${dateTime.year}`
    return `https://sportsdata.usatoday.com/basketball/nba/scores?date=${date}&season=${season}`
}

enum GameState {
    'upcoming' = 'upcoming',
    'live' = 'live',
    'finished' = 'finished'
}

interface GameData {
    state: GameState
    awayTeam: {
        name: string
        record: string
        points: number
    }
    homeTeam: {
        name: string
        record: string
        points: number
    }
    time: string
}

const getGameDataFromGameHtml = (node: Cheerio<Element>): Omit<GameData, 'state'> => {
    let time = node.find('a p').text()
    console.log('time', time) //eslint-disable-line
    if (time.includes("GMT")) {
        const timeNoGmt = time.replace(" GMT", "")
        const dateTime = DateTime
            .fromFormat(timeNoGmt, "ccc t", {
                zone: 'GMT'
            })
        time = dateTime.toISO()
        console.log('time after conversion', time) //eslint-disable-line

    } else if (time.toLowerCase().includes('final')) {
        time = 'Final'
    }
    const teams = node.find('ul').children()
    const awayTeamLi = teams[0]
    const homeTeamLi = teams[1]

    const [_, awayTeamNameAndRecord, __, awayTeamPoints] = cheerio(awayTeamLi).find('span').map((i, el) => cheerio(el).text().trim()).toArray()
    const [___, homeTeamNameAndRecord, ____, homeTeamPoints] = cheerio(homeTeamLi).find('span').map((i, el) => cheerio(el).text().trim()).toArray()
    return {
        awayTeam: {
            name: awayTeamNameAndRecord.replace(/[0-9]+-[0-9]+/, ''),
            record: awayTeamNameAndRecord.replace(/[a-zA-Z]+/, ''),
            points: Number(awayTeamPoints?.length ? awayTeamPoints : 0)
        },
        homeTeam: {
            name: homeTeamNameAndRecord.replace(/[0-9]+-[0-9]+/, ''),
            record: homeTeamNameAndRecord.replace(/[a-zA-Z]+/, ''),
            points: Number(homeTeamPoints?.length ? homeTeamPoints : 0)
        },
        time
    }
}

export const main = async (req: Request, res: Response): Promise<unknown> => {
    const dateTime: DateTime = req.query?.date ?
        DateTime.fromFormat(req.query?.date as string, 'yyyy-MM-dd') :
        DateTime.fromJSDate(new Date())
    const url = getUrl(dateTime)
    const response = await axios.get(url)
    const $ = cheerio.load(response.data);
    const html = $.html()
    const items: GameData[] = [
        ...$('h3:contains("Live")')
            .parent()
            .children('div:not(.ad-wrapper)')
            .children('div')
            .map((i, el) => ({
                state: GameState.live,
                ...getGameDataFromGameHtml(cheerio(el)),
            }))
            .toArray(),
        ...$('h3:contains("Upcoming")')
            .parent()
            .children('div:not(.ad-wrapper)')
            .children('div')
            .map((i, el) => ({
                state: GameState.upcoming,
                ...getGameDataFromGameHtml(cheerio(el)),
            }))
            .toArray(),
        ...$('h3:contains("Finished")')
            .parent()
            .children('div:not(.ad-wrapper)')
            .children('div')
            .map((i, el) => ({
                state: GameState.finished,
                ...getGameDataFromGameHtml(cheerio(el)),
            }))
            .toArray(),
    ]
    return res.json(items)
}
