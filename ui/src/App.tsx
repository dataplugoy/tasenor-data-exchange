import { Box, Container } from '@mui/material'
import React, { useEffect } from 'react'
import { IndexPage } from './Pages/IndexPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from './Pages/LoginPage'
import { Messages } from './Components/Messages'
import { HomePage } from './Pages/HomePage'
import { Menu } from './Components/Menu'

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
          <Menu/>
          <Messages/>
          <Box sx={{ pt: 2 }}>
            <Routes>
              <Route path="/" element={<IndexPage/>}/>
              <Route path="/login" element={<LoginPage/>}/>
              <Route path="/home" element={<HomePage/>}/>
            </Routes>
          </Box>
        </Box>
      </Container>
    </BrowserRouter>
  </>

}
