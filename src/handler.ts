import * as cheerio from 'cheerio'
declare const historyKv : KVNamespace;

export enum Status {
  Unknown = "UNKNOWN",
  Good = "GOOD",
  Busy = "BUSY",
  Full = "FULL",
  Maintenance = "MAINTENANCE",
}

export class ServerStatus {
  name!: string
  status!: string

  constructor(name: string, status: string) {
    this.name = name
    this.status = status
  }
}

async function getStatuses() : Promise<ServerStatus[]> {
  const $ = cheerio.load(
    await (
      await fetch('https://www.playlostark.com/en-us/support/server-status')
    ).text(),
  )

  const servers: ServerStatus[] = []
  $('.ags-ServerStatus-content-responses-response-server').each(function (_) {
    const statusWrapper = $(this)
      .find(
        '.ags-ServerStatus-content-responses-response-server-status-wrapper',
      )
      .first()
      .children()
      .first()
    const name = $(this)
      .find('.ags-ServerStatus-content-responses-response-server-name')
      .first()
      .text()
      .trim()

    if (
      statusWrapper.hasClass(
        'ags-ServerStatus-content-responses-response-server-status--good',
      )
    )
      servers.push(new ServerStatus(name, Status.Good))
    else if (
      statusWrapper.hasClass(
        'ags-ServerStatus-content-responses-response-server-status--busy',
      )
    )
      servers.push(new ServerStatus(name, Status.Busy))
    else if (
      statusWrapper.hasClass(
        'ags-ServerStatus-content-responses-response-server-status--full',
      )
    )
      servers.push(new ServerStatus(name, Status.Full))
    else if (
      statusWrapper.hasClass(
        'ags-ServerStatus-content-responses-response-server-status--maintenance',
      )
    )
      servers.push(new ServerStatus(name, Status.Maintenance))
    else servers.push(new ServerStatus(name, Status.Unknown))
  })

  return servers;
}

export async function handleRequest(): Promise<void> {
  const statuses = await getStatuses();

  for (const status of statuses) {
    const key = 'server-status-' + status.name
    const last = await historyKv.get(key)
    if (last == null) {
      // notify new server


      await historyKv.put(key, status.status)
    }

    if (last == null || last != status.status) {
      // notify state changed

  
      await historyKv.put(key, status.status)
    }
  }

  console.log(`Updated ${statuses.length} servers`)
}
