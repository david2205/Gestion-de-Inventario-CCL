import { useState } from 'react';
import { Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import CompanyLogo from '../components/CompanyLogo';

function Register() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'operator',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', form);
      toast.success('¡Cuenta creada exitosamente! Inicia sesión.');
      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Error al registrar. Intenta con otro usuario.'
      );
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
            <h4>Crear Cuenta</h4>
            <p>Regístrate para acceder al sistema</p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3" style={{ fontSize: '0.88rem' }}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre completo</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                placeholder="Ej: David Pérez"
                value={form.fullName}
                onChange={handleChange}
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Usuario</Form.Label>
              <Form.Control
                type="text"
                name="username"
                placeholder="Nombre de usuario"
                value={form.username}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Rol</Form.Label>
              <Form.Select name="role" value={form.role} onChange={handleChange}>
                <option value="operator">Operador</option>
                <option value="admin">Administrador</option>
              </Form.Select>
            </Form.Group>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Registrando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </Form>

          <div className="login-footer">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Register;
