import { Backdrop, Box, CircularProgress, Container } from '@mui/material'
import React, { useEffect } from 'react'
import { IndexPage } from './Pages/IndexPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from './Pages/LoginPage'
import { Messages } from './Components/Messages'
import { HomePage } from './Pages/HomePage'
import { Menu } from './Components/Menu'
import { FlowPlanPage } from './Pages/FlowPlanPage'
import { RegisterPage } from './Pages/RegisterPage'
import { CreateFlowPlanPage } from './Pages/CreateFlowPlanPage'
import { ResultsPage } from './Pages/ResultsPage'
import { SettingsPage } from './Pages/SettingsPage'
import { EditSettingsPage } from './Pages/EditSettingsPage'
import { RulesPage } from './Pages/RulesPage'
import { EditRulesPage } from './Pages/EditRulesPage'
import { FlowPlansPage } from './Pages/FlowPlansPage'
import { useApp } from './Hooks/useApp'

export const App = (): React.JSX.Element => {

  const app = useApp()

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
          <Box sx={{ pt: 2, pb: 5 }}>
            <Routes>
              <Route path="/" element={<IndexPage/>}/>
              <Route path="/login" element={<LoginPage/>}/>
              <Route path="/:lang/login" element={<LoginPage/>}/>
              <Route path="/home/:id" element={<HomePage/>}/>
              <Route path="/home" element={<HomePage/>}/>
              <Route path="/register" element={<RegisterPage/>}/>
              <Route path="/:lang/register" element={<RegisterPage/>}/>
              <Route path="/results/:id" element={<ResultsPage/>}/>
              <Route path="/results" element={<ResultsPage/>}/>
              <Route path="/rules/:id" element={<EditRulesPage/>}/>
              <Route path="/rules" element={<RulesPage/>}/>
              <Route path="/settings/:id" element={<EditSettingsPage/>}/>
              <Route path="/settings" element={<SettingsPage/>}/>
              <Route path="/flow-plans/new" element={<CreateFlowPlanPage/>}/>
              <Route path="/flow-plans/:id" element={<FlowPlanPage/>}/>
              <Route path="/flow-plans" element={<FlowPlansPage/>}/>
            </Routes>
          </Box>
        </Box>

        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1000 }}
          open={app.dimming}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Container>
    </BrowserRouter>
  </>
}
