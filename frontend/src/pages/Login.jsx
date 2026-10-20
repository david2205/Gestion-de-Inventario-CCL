import { useContext, useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.detail
          || error.response?.data?.title
          || error.message
          || 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container
      as="main"
      fluid
      className="d-flex align-items-center justify-content-center bg-light px-3 py-5"
      style={{ minHeight: '100svh' }}
    >
      <Card className="login-card w-100 border-0 shadow-sm text-start" style={{ maxWidth: '440px' }}>
        <Card.Body className="p-4 p-sm-5">
          <p className="small text-secondary mb-2">Gestión de Inventario</p>
          <Card.Title as="h1" className="h3 text-dark mt-0 mb-2">
            Iniciar Sesión
          </Card.Title>
          <p className="text-secondary mb-4">Ingresa tus credenciales para continuar.</p>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit} aria-busy={loading}>
            <Form.Group className="mb-3" controlId="login-username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                autoComplete="username"
                maxLength={50}
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="login-password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Button type="submit" className="w-100" disabled={loading}>
              {loading ? 'Iniciando sesión…' : 'Iniciar Sesión'}
            </Button>
          </Form>

          <div className="text-center mt-4">
            <Link to="/register">¿No tienes cuenta? Regístrate</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
