describe('Rules API', () => {
  it('CRUD for mapping rules', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(() => {

      cy.apiCall('GET', '/flow-plans').then((res) => {
        const plan = res.body.find((plan: { title: string }) => plan.title === 'TITO Testing')
        const url = `/flow-plans/${plan.id}/rules`

        const card = {
          name: 'OVH',
          kind: 'MAPPING',
          filterView: { conditions: [{ field: 'Saaja/Maksaja', operator: 'equals', value: 'OVHcloud' }, { field: '', operator: 'negative' }] },
          resultView: { action: 'expense', account: 'EXPENSE_SOFTWARE', text: '{Saaja/Maksaja} {Viesti}', tags: ['TR'] },
        }
        const fees = {
          name: 'Fees',
          kind: 'MAPPING',
          filterView: { conditions: [{ field: 'Seliteteksti', operator: 'equals', value: 'Palvelumaksu' }] },
          resultView: { action: 'expense', account: 'EXPENSE_BANKING_FEE', text: 'Bank fees' },
        }

        // Create.
        cy.apiCall('POST', url, card).then((res) => {
          expect(res.status).to.eq(200)
          expect(res.body.origin).to.eq('USER')
          expect(res.body.kind).to.eq('MAPPING')
          expect(res.body.filter).to.eq("lower(str($('Saaja/Maksaja', ''))) == 'ovhcloud' and total < 0")
          expect(res.body.result.account).to.eq("'EXPENSE_SOFTWARE'")
          const cardId = res.body.id

          cy.apiCall('POST', url, fees).then((res) => {
            expect(res.status).to.eq(200)
            const feesId = res.body.id

            // Listed in creation order.
            cy.apiCall('GET', url).then((res) => {
              expect(res.body.map((r: { name: string }) => r.name)).to.deep.eq(['OVH', 'Fees'])
            })

            // Invalid rules and duplicate names are rejected.
            cy.apiCall('POST', url, { ...fees, name: 'Bad', filterView: { conditions: [{ field: 'Viesti', operator: 'regex', value: '(' }] } }).then((res) => {
              expect(res.status).to.eq(400)
              expect(res.body.message).to.contain('Invalid regular expression')
            })
            cy.apiCall('POST', url, fees).then((res) => {
              expect(res.status).to.eq(400)
              expect(res.body.message).to.eq('A rule with the same name already exists.')
            })

            // Update.
            cy.apiCall('PUT', `${url}/${feesId}`, { ...fees, resultView: { action: 'skip' }, enabled: false, notes: 'Later' }).then((res) => {
              expect(res.status).to.eq(200)
              expect(res.body.result).to.deep.eq({ type: "'skip'" })
              expect(res.body.enabled).to.eq(false)
              expect(res.body.notes).to.eq('Later')
            })

            // Reorder.
            cy.apiCall('PUT', `${url}/order`, { ids: [feesId, cardId] }).then((res) => {
              expect(res.status).to.eq(204)
            })
            cy.apiCall('PUT', `${url}/order`, { ids: [feesId] }).then((res) => {
              expect(res.status).to.eq(400)
            })
            cy.apiCall('GET', url).then((res) => {
              expect(res.body.map((r: { name: string }) => r.name)).to.deep.eq(['Fees', 'OVH'])
            })

            // Delete.
            cy.apiCall('DELETE', `${url}/${feesId}`).then((res) => {
              expect(res.status).to.eq(204)
            })
            cy.apiCall('DELETE', `${url}/${feesId}`).then((res) => {
              expect(res.status).to.eq(404)
            })
            cy.apiCall('DELETE', `${url}/${cardId}`)
            cy.apiCall('GET', url).then((res) => {
              expect(res.body).to.deep.eq([])
            })
          })
        })
      })
    })
  })

  it('Replacing the rules keeps the order of the list', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(() => {
      cy.apiCall('POST', '/flow-plans', {
        title: 'Rule Order Testing',
        projectId: 1,
        firstDate: '1900-01-01',
        source: { type: 'TEST_MOCK', settings: { url: 'file:///test.csv' } },
        destination: { type: 'NO_ACTION', settings: {} },
        setup: {},
      }).then((created) => {
        const url = `/flow-plans/${created.body.id}/rules`
        const rule = (name: string) => ({ name, key: '', filter: 'false', result: { type: "'deposit'" } })

        cy.apiCall('GET', url).then((res) => {
          const driverRules = res.body
          // A new rule first, then the driver rules in reverse order.
          cy.apiCall('PATCH', url, [rule('First'), ...[...driverRules].reverse()]).its('status').should('equal', 204)
          cy.apiCall('GET', url).then((res) => {
            expect(res.body.map((r: { name: string }) => r.name)).to.deep.eq(['First', ...[...driverRules].reverse().map((r: { name: string }) => r.name)])
          })

          // Rules with the same name are refused before changing anything.
          cy.apiCall('PATCH', url, [rule('Twice'), rule('Twice')]).then((res) => {
            expect(res.status).to.eq(400)
            expect(res.body.message).to.eq('Each rule must have a different name.')
          })
          cy.apiCall('GET', url).then((res) => {
            expect(res.body.map((r: { name: string }) => r.name)).to.deep.eq(['First', ...[...driverRules].reverse().map((r: { name: string }) => r.name)])
          })
        })
      })
    })
  })
})
