import { React } from 'react'
import { AuthProvider } from '@/components/utils/provider/auth'
const RootLayout = ({ children }: { children: React.Node }) => {
  return (
    <AuthProvider>
      { children }
    </AuthProvider>
  )
}
export default RootLayout;