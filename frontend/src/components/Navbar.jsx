import { useContext } from 'react';
import { Navbar as BootstrapNavbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return null;
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <BootstrapNavbar expand="lg" variant="dark" bg="dark" collapseOnSelect>
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          Gestión de Inventario
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle
          aria-controls="inventory-navbar"
          aria-label="Mostrar u ocultar navegación"
        />

        <BootstrapNavbar.Collapse id="inventory-navbar">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end eventKey="inventory">
              Inventario
            </Nav.Link>
            <Nav.Link as={NavLink} to="/products" eventKey="products">
              Productos
            </Nav.Link>
            <Nav.Link as={NavLink} to="/movements" eventKey="movements">
              Movimientos
            </Nav.Link>
          </Nav>

          <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3 py-2 py-lg-0">
            <BootstrapNavbar.Text>{user.username}</BootstrapNavbar.Text>
            <Button variant="outline-light" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}
