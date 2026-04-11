import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode?: number
}

function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>{statusCode ? `Error ${statusCode}` : 'An error occurred'}</h1>
      <p>{statusCode === 404 ? 'Page not found' : 'Something went wrong'}</p>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default ErrorPage
