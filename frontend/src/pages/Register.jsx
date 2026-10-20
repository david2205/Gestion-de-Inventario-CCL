import { useContext, useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('operator');
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
      await register(username, password, fullName, role);
      toast.success('Cuenta creada correctamente. Inicia sesión para continuar.');
      navigate('/login', { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.detail
          || error.response?.data?.title
          || (error.response?.status === 409 ? 'El nombre de usuario ya existe.' : null)
          || error.message
          || 'No se pudo crear la cuenta. Inténtalo de nuevo.',
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
            Crear cuenta
          </Card.Title>
          <p className="text-secondary mb-4">Completa tus datos para registrarte.</p>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit} aria-busy={loading}>
            <Form.Group className="mb-3" controlId="register-username">
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

            <Form.Group className="mb-3" controlId="register-password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="register-full-name">
              <Form.Label>Nombre Completo</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                autoComplete="name"
                maxLength={100}
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="register-role">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                name="role"
                required
                value={role}
                onChange={(event) => setRole(event.target.value)}
                disabled={loading}
              >
                <option value="admin">admin</option>
                <option value="operator">operator</option>
              </Form.Select>
            </Form.Group>

            <Button type="submit" className="w-100" disabled={loading}>
              {loading ? 'Registrando…' : 'Registrarse'}
            </Button>
          </Form>

          <div className="text-center mt-4">
            <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
