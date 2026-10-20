import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Container, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from '../api/axios';

const emptyForm = { code: '', name: '', description: '', minStock: '0' };

function errorMessage(error, fallback) {
  const problem = error.response?.data;
  const validationErrors = problem?.errors
    ? Object.values(problem.errors).flat().join(' ')
    : '';

  return problem?.detail || validationErrors || problem?.title || error.message || fallback;
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const busy = saving || deleting;

  const loadProducts = useCallback(async (signal) => {
    try {
      const { data } = await axios.get('/products', { signal });
      if (!signal?.aborted) {
        setProducts(data);
      }
    } catch (error) {
      if (!signal?.aborted) {
        const message = errorMessage(error, 'No se pudieron cargar los productos.');
        setLoadError(message);
        toast.error(message);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function initialize() {
      await loadProducts(controller.signal);
    }

    initialize();
    return () => controller.abort();
  }, [loadProducts]);

  async function reloadProducts() {
    setLoading(true);
    setLoadError('');
    await loadProducts();
  }

  function openProductForm(product = null) {
    setEditingProduct(product);
    setForm(product ? {
      code: product.code,
      name: product.name,
      description: product.description ?? '',
      minStock: String(product.minStock),
    } : { ...emptyForm });
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (busy) return;

    const minStock = Number(form.minStock);
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('El código y el nombre son obligatorios.');
      return;
    }
    if (form.minStock === '' || !Number.isInteger(minStock) || minStock < 0 || minStock > 2147483647) {
      toast.error('El stock mínimo debe ser un entero entre 0 y 2147483647.');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      minStock,
    };

    try {
      if (editingProduct) {
        await axios.put(`/products/${editingProduct.id}`, payload);
      } else {
        await axios.post('/products', { ...payload, code: form.code.trim() });
      }

      setShowForm(false);
      toast.success(editingProduct ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
      await reloadProducts();
    } catch (error) {
      toast.error(errorMessage(error, 'No se pudo guardar el producto.'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct() {
    if (busy || !productToDelete) return;
    setDeleting(true);

    try {
      await axios.delete(`/products/${productToDelete.id}`);
      setProductToDelete(null);
      toast.success('Producto eliminado correctamente.');
      await reloadProducts();
    } catch (error) {
      toast.error(errorMessage(error, 'No se pudo eliminar el producto.'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="bg-light flex-grow-1 text-start">
      <Container className="py-4 py-md-5">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
          <div>
            <h1 className="h3 text-dark mt-0 mb-2">Productos</h1>
            <p className="text-secondary">Administra el catálogo y el stock mínimo de tus productos.</p>
          </div>
          <Button onClick={() => openProductForm()} disabled={loading || busy}>
            Nuevo Producto
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5" role="status">
            <Spinner animation="border" variant="primary" aria-hidden="true" />
            <p className="text-secondary mt-3">Cargando productos…</p>
          </div>
        ) : loadError ? (
          <Alert variant="danger">
            <p className="mb-3">{loadError}</p>
            <Button variant="outline-danger" onClick={reloadProducts} disabled={busy}>
              Reintentar
            </Button>
          </Alert>
        ) : (
          <Table responsive striped hover bordered className="align-middle bg-white">
            <caption className="visually-hidden">Catálogo de productos activos</caption>
            <thead className="table-dark">
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Nombre</th>
                <th scope="col">Descripción</th>
                <th scope="col" className="text-end">Stock Mínimo</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-secondary py-4">No hay productos registrados.</td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id}>
                  <td>{product.code}</td>
                  <td>{product.name}</td>
                  <td>{product.description || 'Sin descripción'}</td>
                  <td className="text-end">{product.minStock}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => openProductForm(product)}
                        disabled={busy}
                        aria-label={`Editar ${product.name}`}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => setProductToDelete(product)}
                        disabled={busy}
                        aria-label={`Eliminar ${product.name}`}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Container>

      <Modal
        show={showForm}
        onHide={() => { if (!saving) setShowForm(false); }}
        backdrop={saving ? 'static' : true}
        keyboard={!saving}
        centered
        aria-labelledby="product-form-title"
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title id="product-form-title">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={saveProduct} aria-busy={saving}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="product-code">
              <Form.Label>Código</Form.Label>
              <Form.Control name="code" value={form.code} onChange={updateField} maxLength={50} required disabled={saving || Boolean(editingProduct)} />
              {editingProduct && <Form.Text>El código se conserva al editar el producto.</Form.Text>}
            </Form.Group>
            <Form.Group className="mb-3" controlId="product-name">
              <Form.Label>Nombre</Form.Label>
              <Form.Control name="name" value={form.name} onChange={updateField} maxLength={150} required disabled={saving} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="product-description">
              <Form.Label>Descripción (opcional)</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={form.description} onChange={updateField} disabled={saving} />
            </Form.Group>
            <Form.Group controlId="product-min-stock">
              <Form.Label>Stock Mínimo</Form.Label>
              <Form.Control type="number" min={0} max={2147483647} step={1} name="minStock" value={form.minStock} onChange={updateField} required disabled={saving} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={Boolean(productToDelete)}
        onHide={() => { if (!deleting) setProductToDelete(null); }}
        backdrop={deleting ? 'static' : true}
        keyboard={!deleting}
        centered
        aria-labelledby="delete-product-title"
      >
        <Modal.Header closeButton={!deleting}>
          <Modal.Title id="delete-product-title">Eliminar Producto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Deseas eliminar el producto <strong>{productToDelete?.name}</strong> ({productToDelete?.code})?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setProductToDelete(null)} disabled={deleting}>Cancelar</Button>
          <Button variant="danger" onClick={deleteProduct} disabled={deleting}>
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}
