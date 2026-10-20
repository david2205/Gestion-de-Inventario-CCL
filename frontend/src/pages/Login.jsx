import { useState } from 'react';
import { Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CompanyLogo from '../components/CompanyLogo';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(!err.response
        ? 'No se pudo conectar con la API. Verifica que el backend esté disponible y permita el acceso desde este sitio.'
        : err.response.data?.detail
          || err.response.data?.message
          || err.response.data?.title
          || (err.response.status === 401
            ? 'Credenciales incorrectas. Verifica tu usuario y contraseña.'
            : 'No se pudo iniciar sesión. Inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Card.Body>
          <div className="login-logo">
            <CompanyLogo className="company-logo--auth" />
            <h4>Gestión de Inventario</h4>
            <p>Inicia sesión para continuar</p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3" style={{ fontSize: '0.88rem' }}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Usuario</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </Form>

          <div className="login-footer">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Login;
