import { React } from 'react'
import { AuthProvider } from '@/components/utils/provider/auth'
const RootLayout = ({ children }: { children: React.Node }) => {
  return (
    <html>
      <head>
        <link rel='stylesheet' href = '/font/Aminute/Web-TT/Aminute.css'/>
      </head>
    <body>
      <AuthProvider>
      { children }
    </AuthProvider>
    </body>
    </html>
  )
}
export default RootLayout;