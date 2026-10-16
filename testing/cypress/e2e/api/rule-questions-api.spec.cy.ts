import RuleQuestionsResponse from './schema/projects/RuleQuestionsResponse.json'

describe('Rule questions API', () => {
  it('CRUD for questions and rules asking them', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(() => {

      cy.apiCall('GET', '/flow-plans').then((res) => {
        const plan = res.body.find((plan: { title: string }) => plan.title === 'TITO Testing')
        const questionsUrl = `/projects/${plan.projectId}/questions`
        const rulesUrl = `/flow-plans/${plan.id}/rules`

        const members = { name: 'members', kind: 'TAGS', label: 'Who', options: [{ label: 'Tommi', tags: ['TR'] }, { label: 'Both', tags: ['TR', 'KR'] }] }

        // Invalid questions are rejected.
        cy.apiCall('POST', questionsUrl, { ...members, options: [] }).then((res) => {
          expect(res.status).to.eq(400)
          expect(res.body.message).to.eq('The question needs at least one option.')
        })
        cy.apiCall('POST', questionsUrl, { name: 'Bad name', kind: 'TEXT', label: 'Bad' }).then((res) => {
          expect(res.status).to.eq(400)
        })

        cy.apiCall('POST', questionsUrl, members).then((res) => {
          expect(res.status).to.eq(200)
          const questionId = res.body.id

          // Names are unique in the project.
          cy.apiCall('POST', questionsUrl, members).then((res) => {
            expect(res.status).to.eq(400)
            expect(res.body.message).to.contain('already used')
          })

          // A rule can ask the question, but not a question that does not exist.
          const bus = {
            name: 'Bus',
            kind: 'MAPPING',
            filterView: { conditions: [{ field: 'Saaja/Maksaja', operator: 'equals', value: 'Onnibus' }] },
            resultView: { action: 'expense', account: 'ACCOUNT_7800', text: 'Bus ticket', ask: [questionId] },
          }
          cy.apiCall('POST', rulesUrl, { ...bus, resultView: { ...bus.resultView, ask: [questionId + 1000] } }).then((res) => {
            expect(res.status).to.eq(400)
            expect(res.body.message).to.contain('does not exist')
          })
          cy.apiCall('POST', rulesUrl, bus).then((res) => {
            expect(res.status).to.eq(200)
            const ruleId = res.body.id
            expect(res.body.resultView.ask).to.deep.eq([questionId])

            // Listing tells the rules using the question.
            cy.apiCall('GET', questionsUrl).should('validatesAs', RuleQuestionsResponse).then((res) => {
              expect(res.body.find((q: { id: number }) => q.id === questionId).usedBy).to.deep.eq(['Bus'])
            })

            // A question in use cannot be deleted.
            cy.apiCall('DELETE', `${questionsUrl}/${questionId}`).then((res) => {
              expect(res.status).to.eq(400)
              expect(res.body.message).to.contain('Bus')
            })

            // Update.
            cy.apiCall('PUT', `${questionsUrl}/${questionId}`, { ...members, label: 'Whose' }).then((res) => {
              expect(res.status).to.eq(200)
              expect(res.body.label).to.eq('Whose')
            })

            // Clean up.
            cy.apiCall('DELETE', `${rulesUrl}/${ruleId}`).then((res) => {
              expect(res.status).to.eq(204)
              cy.apiCall('DELETE', `${questionsUrl}/${questionId}`).then((res) => {
                expect(res.status).to.eq(204)
              })
            })
          })
        })
      })
    })
  })
})
