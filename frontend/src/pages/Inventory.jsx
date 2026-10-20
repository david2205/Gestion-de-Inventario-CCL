import { useEffect, useState } from 'react';
import { Table, Form, InputGroup, Row, Col, Spinner, Card } from 'react-bootstrap';
import api from '../api/axios';

function Inventory() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(items);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        items.filter(
          (i) =>
            i.productName.toLowerCase().includes(q) ||
            i.productCode.toLowerCase().includes(q)
        )
      );
    }
  }, [search, items]);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory/current');
      setItems(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const totalProducts = items.length;
  const totalStock = items.reduce((sum, i) => sum + i.currentStock, 0);
  const lowStockCount = items.filter((i) => i.isLowStock).length;

  return (
    <div className="container py-4 fade-in">
      <div className="page-header">
        <h2>Inventario Actual</h2>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <div className="stat-card">
            <div className="stat-card-info">
              <h3>{totalProducts}</h3>
              <p>Productos</p>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <div className="stat-card">
            <div className="stat-card-info">
              <h3>{totalStock.toLocaleString()}</h3>
              <p>Unidades totales</p>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <div className="stat-card">
            <div className="stat-card-info">
              <h3>{lowStockCount}</h3>
              <p>Stock bajo</p>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <div className="stat-card">
            <div className="stat-card-info">
              <h3>{totalProducts - lowStockCount}</h3>
              <p>Stock normal</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Search */}
      <Card className="mb-0">
        <Card.Header className="d-flex align-items-center justify-content-between">
          <span>Lista de Inventario</span>
          <InputGroup style={{ maxWidth: 320 }}>
            <Form.Control
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="sm"
            />
          </InputGroup>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--ccl-blue)' }} />
              <p className="mt-2 text-muted">Cargando inventario...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <h5>No se encontraron productos</h5>
              <p>Intenta con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Descripción</th>
                    <th className="text-center">Stock</th>
                    <th className="text-center">Mínimo</th>
                    <th className="text-center">Estado</th>
                    <th>Última Entrada</th>
                    <th>Última Salida</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.productId}
                      className={item.isLowStock ? 'low-stock-row' : ''}
                    >
                      <td>
                        <code style={{ fontSize: '0.82rem', color: 'var(--ccl-blue)' }}>
                          {item.productCode}
                        </code>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--ccl-black)' }}>
                        {item.productName}
                      </td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description || '—'}
                      </td>
                      <td className="text-center" style={{ fontWeight: 600 }}>
                        {item.currentStock}
                      </td>
                      <td className="text-center">{item.minStock}</td>
                      <td className="text-center">
                        {item.isLowStock ? (
                          <span className="badge bg-danger">Stock bajo</span>
                        ) : (
                          <span className="badge bg-success">Normal</span>
                        )}
                      </td>
                      <td>
                        {item.lastEntryDate
                          ? new Date(item.lastEntryDate).toLocaleDateString('es-CO')
                          : '—'}
                      </td>
                      <td>
                        {item.lastExitDate
                          ? new Date(item.lastExitDate).toLocaleDateString('es-CO')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default Inventory;
