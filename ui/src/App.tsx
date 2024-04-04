import { Box, Container } from '@mui/material'
import React, { useEffect } from 'react'
import { IndexPage } from './Pages/IndexPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from './Pages/LoginPage'

export const App = (): React.JSX.Element => {

  useEffect(() => {
    if (window.location.pathname === '/') {
      window.location.replace('/app')
    }
  }, [])

  return <>
    <BrowserRouter basename="app">
      <Container component="main" maxWidth="lg">
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<IndexPage/>}/>
            <Route path="/login" element={<LoginPage/>}/>
          </Routes>
        </Box>
      </Container>
    </BrowserRouter>
  </>

}
