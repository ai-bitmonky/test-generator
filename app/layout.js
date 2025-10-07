export const metadata = {
  title: 'JEE Advanced Test Generator',
  description: 'Interactive test generator for JEE Advanced Mathematics',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
