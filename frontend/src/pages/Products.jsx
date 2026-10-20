import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Spinner, Card, Row, Col,
} from 'react-bootstrap';
import api from '../api/axios';
import { toast } from 'react-toastify';

const emptyProduct = { code: '', name: '', description: '', stock: 0, minStock: 0 };

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch { /* interceptor */ }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: ['stock', 'minStock'].includes(name) ? Number(value) : value });
  };

  const openCreate = () => { setEditing(null); setForm(emptyProduct); setShow(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ code: p.code, name: p.name, description: p.description || '', stock: p.stock, minStock: p.minStock });
    setShow(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
        toast.success('Producto actualizado correctamente');
      } else {
        await api.post('/products', form);
        toast.success('Producto creado correctamente');
      }
      setShow(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar el producto');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Producto eliminado');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al eliminar');
    }
  };

  return (
    <div className="container py-4 fade-in">
      <div className="page-header">
        <h2>Gestión de Productos</h2>
        <Button variant="primary" onClick={openCreate}>
          + Nuevo Producto
        </Button>
      </div>

      <Card>
        <Card.Header>
          <span>Productos registrados ({products.length})</span>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--ccl-blue)' }} />
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <h5>No hay productos registrados</h5>
              <p>Crea tu primer producto con el botón de arriba</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th className="text-center">Stock</th>
                    <th className="text-center">Mínimo</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <code style={{ fontSize: '0.82rem', color: 'var(--ccl-blue)' }}>
                          {p.code}
                        </code>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--ccl-black)' }}>{p.name}</td>
                      <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.description || '—'}
                      </td>
                      <td className="text-center" style={{ fontWeight: 600 }}>{p.stock}</td>
                      <td className="text-center">{p.minStock}</td>
                      <td className="text-center">
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => openEdit(p)}>
                          Editar
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p.id, p.name)}>
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal Create/Edit */}
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Editar Producto' : 'Nuevo Producto'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Código (SKU)</Form.Label>
              <Form.Control
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="Ej: PROD-011"
                required
                disabled={!!editing}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nombre del producto"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Descripción opcional"
              />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Stock inicial</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    min={0}
                    disabled={!!editing}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Stock mínimo</Form.Label>
                  <Form.Control
                    type="number"
                    name="minStock"
                    value={form.minStock}
                    onChange={handleChange}
                    min={0}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShow(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : editing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Products;
