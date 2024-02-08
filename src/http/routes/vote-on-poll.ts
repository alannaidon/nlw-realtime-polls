import { FastifyInstance } from "fastify"
import { randomUUID } from 'node:crypto'
import { prisma } from "../../lib/prisma"
import { z } from 'zod'

export async function voteOnPoll(app: FastifyInstance) {
  app.post('/polls/:pollId/votes', async (request, reply) => {
    const voteOnPollBody = z.object({ pollOptionId: z.string().uuid() })
    const voteOnPollParams = z.object({ pollId: z.string().uuid() })


    const { pollId } = voteOnPollParams.parse(request.params)
    const { pollOptionId } = voteOnPollBody.parse(request.body)
    let { sessionId } = request.cookies

    // Users can try to vote more than once on the same Poll
    // Instead of passing the business rules to database, our application should handle this
    if (sessionId) {
      const userAlreadyVotedOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: { // prisma is beautiful! This is the relation index. better performance
            sessionId,
            pollId
          }
        }
      })

      // User can change the OPTION for the same Poll...
      console.log('USER ALREADY VOTED', userAlreadyVotedOnPoll);
      console.log('pollOptionId: ', pollOptionId)
      if (userAlreadyVotedOnPoll && userAlreadyVotedOnPoll.pollOptionId !== pollOptionId) {
        console.log('ENTROU NO IF')
        // If voting on different option
        await prisma.vote.delete({
          where: { id: userAlreadyVotedOnPoll.id }
        })
      } else if (userAlreadyVotedOnPoll) {
        return reply.status(400).send({ message: 'You already voted on this Poll!' })
      }
    }


    // Check if cookie already exists
    if (!sessionId) {
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/', // which endpoints this cookie will be available
        maxAge: 60 * 60 * 24 * 30, //this cookie will last a month o.O
        signed: true, // My backend will make sure this information is valid
        httpOnly: true, // This cookie will be accessible only from my backend. Not today browser extensions!
      })
    }

    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId
      }
    })

    return reply.status(201).send()
  })
}
