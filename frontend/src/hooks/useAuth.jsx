import { createContext, useContext } from 'react'

const mockUser = { id: 1, name: 'Admin', email: 'admin@onelab.com', role: 'admin', avatar: null }

const AuthContext = createContext({
  user: mockUser,
  loading: false,
  logout: () => {},
  setUser: () => {}
})

export function AuthProvider({ children }) {
  return (
    <AuthContext.Provider value={{ user: mockUser, loading: false, logout: () => {}, setUser: () => {} }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
