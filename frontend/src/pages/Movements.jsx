import { useEffect, useState } from 'react';
import {
  Table, Form, Button, Row, Col, Card, Spinner, Modal,
} from 'react-bootstrap';
import api from '../api/axios';
import { toast } from 'react-toastify';

function Movements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    productId: '',
    movementType: '',
    dateFrom: '',
    dateTo: '',
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('entry'); // 'entry' or 'exit'
  const [movForm, setMovForm] = useState({ productId: '', quantity: '', note: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchMovements();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch { /* interceptor */ }
  };

  const fetchMovements = async (f = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (f.productId) params.productId = f.productId;
      if (f.movementType) params.movementType = f.movementType;
      if (f.dateFrom) params.dateFrom = f.dateFrom;
      if (f.dateTo) params.dateTo = f.dateTo;
      const res = await api.get('/inventory/movements', { params });
      setMovements(res.data);
    } catch { /* interceptor */ }
    finally { setLoading(false); }
  };

  const handleFilterChange = (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
  };

  const applyFilters = () => fetchMovements(filters);

  const clearFilters = () => {
    const empty = { productId: '', movementType: '', dateFrom: '', dateTo: '' };
    setFilters(empty);
    fetchMovements(empty);
  };

  // Register entry/exit
  const openModal = (type) => {
    setModalType(type);
    setMovForm({ productId: '', quantity: '', note: '' });
    setShowModal(true);
  };

  const handleMovSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const endpoint = modalType === 'entry' ? '/inventory/entries' : '/inventory/exits';
    try {
      await api.post(endpoint, {
        productId: Number(movForm.productId),
        quantity: Number(movForm.quantity),
        note: movForm.note,
      });
      toast.success(
        modalType === 'entry'
          ? 'Entrada registrada correctamente'
          : 'Salida registrada correctamente'
      );
      setShowModal(false);
      fetchMovements();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al registrar movimiento');
    } finally { setSaving(false); }
  };

  const entryCount = movements.filter(m => m.movementType === 'IN').length;
  const exitCount = movements.filter(m => m.movementType === 'OUT').length;

  return (
    <div className="container py-4 fade-in">
      <div className="page-header">
        <h2>Movimientos de Inventario</h2>
        <div className="d-flex gap-2">
          <Button variant="success" onClick={() => openModal('entry')}>
            Registrar Entrada
          </Button>
          <Button variant="danger" onClick={() => openModal('exit')}>
            Registrar Salida
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={4}>
          <div className="stat-card">
            <div className="stat-card-info">
              <h3>{movements.length}</h3>
              <p>Total movimientos</p>
            </div>
          </div>
        </Col>
        <Col xs={6} md={4}>
          <div className="stat-card">
            <div className="stat-card-info">
              <h3>{entryCount}</h3>
              <p>Entradas</p>
            </div>
          </div>
        </Col>
        <Col xs={6} md={4}>
          <div className="stat-card">
            <div className="stat-card-info">
              <h3>{exitCount}</h3>
              <p>Salidas</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>Filtros de búsqueda</Card.Header>
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xs={12} md={3}>
              <Form.Label>Producto</Form.Label>
              <Form.Select name="productId" value={filters.productId} onChange={handleFilterChange} size="sm">
                <option value="">Todos</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={2}>
              <Form.Label>Tipo</Form.Label>
              <Form.Select name="movementType" value={filters.movementType} onChange={handleFilterChange} size="sm">
                <option value="">Todos</option>
                <option value="IN">Entrada</option>
                <option value="OUT">Salida</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Label>Desde</Form.Label>
              <Form.Control type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} size="sm" />
            </Col>
            <Col xs={6} md={2}>
              <Form.Label>Hasta</Form.Label>
              <Form.Control type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} size="sm" />
            </Col>
            <Col xs={12} md={3} className="d-flex gap-2">
              <Button variant="primary" size="sm" onClick={applyFilters} className="flex-grow-1">
                Filtrar
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                Limpiar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Movements Table */}
      <Card>
        <Card.Header>Historial de Movimientos</Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--ccl-blue)' }} />
            </div>
          ) : movements.length === 0 ? (
            <div className="empty-state">
              <h5>No hay movimientos registrados</h5>
              <p>Registra tu primera entrada o salida con los botones de arriba</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Código</th>
                    <th>Producto</th>
                    <th className="text-center">Tipo</th>
                    <th className="text-center">Cantidad</th>
                    <th className="text-center">Stock Ant.</th>
                    <th className="text-center">Stock Nuevo</th>
                    <th>Nota</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.movementId}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                        {new Date(m.createdAt).toLocaleString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <code style={{ fontSize: '0.82rem', color: 'var(--ccl-blue)' }}>
                          {m.productCode}
                        </code>
                      </td>
                      <td style={{ fontWeight: 500 }}>{m.productName}</td>
                      <td className="text-center">
                        <span className={`badge ${m.movementType === 'IN' ? 'movement-entry' : 'movement-exit'}`}>
                          {m.movementType === 'IN' ? 'Entrada' : 'Salida'}
                        </span>
                      </td>
                      <td className="text-center" style={{ fontWeight: 600 }}>{m.quantity}</td>
                      <td className="text-center">{m.previousStock}</td>
                      <td className="text-center" style={{ fontWeight: 600 }}>{m.newStock}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.note || '—'}
                      </td>
                      <td>{m.username}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal Entry/Exit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'entry' ? 'Registrar Entrada' : 'Registrar Salida'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleMovSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Producto</Form.Label>
              <Form.Select
                value={movForm.productId}
                onChange={(e) => setMovForm({ ...movForm, productId: e.target.value })}
                required
              >
                <option value="">Selecciona un producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cantidad</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={movForm.quantity}
                onChange={(e) => setMovForm({ ...movForm, quantity: e.target.value })}
                placeholder="Cantidad de unidades"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nota (opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={movForm.note}
                onChange={(e) => setMovForm({ ...movForm, note: e.target.value })}
                placeholder="Ej: Compra a proveedor, Despacho cliente..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={modalType === 'entry' ? 'success' : 'danger'}
              disabled={saving}
            >
              {saving ? (
                <Spinner size="sm" animation="border" />
              ) : modalType === 'entry' ? (
                'Registrar Entrada'
              ) : (
                'Registrar Salida'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Movements;
