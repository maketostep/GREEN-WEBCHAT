import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { Messenger } from './components/Messenger'
import { clearSession, loadCredentials, saveCredentials } from './lib/storage'
import type { Credentials } from './types'

function App() {
  const [credentials, setCredentials] = useState(loadCredentials)

  const login = (value: Credentials) => {
    saveCredentials(value)
    setCredentials(value)
  }

  const logout = () => {
    if (credentials) clearSession(credentials.idInstance)
    setCredentials(null)
  }

  return credentials ? (
    <Messenger key={credentials.idInstance} credentials={credentials} onLogout={logout} />
  ) : (
    <LoginScreen onLogin={login} />
  )
}

export default App
