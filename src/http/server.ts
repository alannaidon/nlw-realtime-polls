import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { createPoll } from './routes/create-polls'
import { getPoll } from './routes/get-poll'
import { voteOnPoll } from './routes/vote-on-poll'

const app = fastify()
app.register(cookie, {
  secret: 'my-secret-super-secret',
  hook: 'onRequest',
  parseOptions: {}
})

app.register(createPoll)
app.register(getPoll)
app.register(voteOnPoll)

app.listen({ port: 3000 }).then(() => {
  console.log('HTTP Server Running!')
})
