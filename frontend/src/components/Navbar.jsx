import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import CompanyLogo from './CompanyLogo';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.fullName) return user?.username?.charAt(0).toUpperCase() || 'U';
    return user.fullName
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <BsNavbar variant="light" expand="lg" className="navbar">
      <Container fluid className="px-0">
        <BsNavbar.Brand as={Link} to="/">
          <CompanyLogo className="company-logo--navbar" />
          <div className="ccl-brand-text">
            <span className="ccl-brand-title">Gestión de Inventario</span>
            <span className="ccl-brand-subtitle">Sistema de Control</span>
          </div>
        </BsNavbar.Brand>

        <BsNavbar.Toggle aria-controls="main-nav" />

        <BsNavbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className={isActive('/')}>
              Inventario
            </Nav.Link>
            <Nav.Link as={Link} to="/products" className={isActive('/products')}>
              Productos
            </Nav.Link>
            <Nav.Link as={Link} to="/movements" className={isActive('/movements')}>
              Movimientos
            </Nav.Link>
          </Nav>

          <div className="d-flex align-items-center gap-2">
            <div className="navbar-user-info d-none d-md-flex">
              <div className="navbar-user-avatar">{getInitials()}</div>
              <span>{user?.fullName || user?.username}</span>
            </div>
            <Button variant="outline-primary" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}

export default Navbar;
