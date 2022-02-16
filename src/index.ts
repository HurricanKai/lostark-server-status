import { handleRequest, ServerStatus, Status } from './handler'

addEventListener('scheduled', (event) => {
  event.waitUntil(handleRequest());
})
