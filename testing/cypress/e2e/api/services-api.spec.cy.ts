describe('Services API', () => {
  it('CRUD for services without revealing secrets', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(() => {

      cy.apiCall('POST', '/services', { name: 'Rates', driver: 'TASENOR', url: 'http://localhost:7205', user: 'me', password: 'secret' }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body.capabilities).to.deep.eq(['CURRENCY_RATES', 'CRYPTO_RATES'])
        expect(res.body.hasPassword).to.eq(true)
        expect(JSON.stringify(res.body)).not.to.contain('secret')
        const id = res.body.id

        // Missing password keeps the old one, empty removes it.
        cy.apiCall('PATCH', `/services/${id}`, { name: 'Rates 2', driver: 'TASENOR', url: 'http://localhost:7205', user: 'me' }).then((res) => {
          expect(res.status).to.eq(200)
          expect(res.body.name).to.eq('Rates 2')
          expect(res.body.hasPassword).to.eq(true)
        })
        cy.apiCall('PATCH', `/services/${id}`, { name: 'Rates 2', driver: 'TASENOR', url: 'http://localhost:7205', user: 'me', password: '' }).then((res) => {
          expect(res.body.hasPassword).to.eq(false)
        })

        cy.apiCall('GET', '/services').then((res) => {
          expect(res.body.map((s: { name: string }) => s.name)).to.deep.eq(['Test Files', 'Rates 2'])
        })

        // The test reports each capability separately.
        cy.apiCall('GET', '/services').then((res) => {
          const files = res.body.find((s: { name: string }) => s.name === 'Test Files')
          cy.apiCall('POST', `/services/${files.id}/test`).then((res) => {
            expect(res.status).to.eq(200)
            expect(res.body.map((r: { capability: string }) => r.capability)).to.deep.eq(['CURRENCY_RATES', 'CRYPTO_RATES'])
          })
        })

        cy.apiCall('POST', '/services', { name: '', driver: 'NONE', url: '' }).then((res) => {
          expect(res.status).to.eq(400)
        })

        cy.apiCall('DELETE', `/services/${id}`).then((res) => {
          expect(res.status).to.eq(204)
        })
        cy.apiCall('DELETE', `/services/${id}`).then((res) => {
          expect(res.status).to.eq(404)
        })
      })
    })
  })
})
