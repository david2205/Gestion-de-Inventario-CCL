import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from '../api/axios';

function errorMessage(error, fallback) {
  const problem = error.response?.data;
  const validationErrors = problem?.errors ? Object.values(problem.errors).flat().join(' ') : '';
  return problem?.detail || validationErrors || problem?.title || fallback;
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? dateFormatter.format(date) : 'Sin fecha';
}

function MovementForm({ type, products, productsLoading, productsError, onRegistered }) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isEntry = type === 'IN';
  const prefix = isEntry ? 'entry' : 'exit';
  const title = isEntry ? 'Registrar Entrada' : 'Registrar Salida';
  const disabled = submitting || productsLoading || Boolean(productsError) || products.length === 0;

  async function handleSubmit(event) {
    event.preventDefault();
    if (disabled) return;

    const selectedProductId = Number(productId);
    const amount = Number(quantity);
    if (!products.some((product) => product.id === selectedProductId)) {
      toast.error('Selecciona un producto válido.');
      return;
    }
    if (!Number.isInteger(amount) || amount < 1 || amount > 2147483647) {
      toast.error('La cantidad debe ser un entero entre 1 y 2147483647.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(isEntry ? '/inventory/entries' : '/inventory/exits', {
        productId: selectedProductId,
        quantity: amount,
        note: note.trim() || null,
      });

      toast.success(isEntry ? 'Entrada registrada correctamente.' : 'Salida registrada correctamente.');
      setQuantity('1');
      setNote('');
      onRegistered();
    } catch (error) {
      toast.error(errorMessage(error, error.response?.status === 409
        ? 'No se pudo registrar el movimiento. Verifica el stock disponible y el estado del producto.'
        : 'No se pudo registrar el movimiento. Inténtalo de nuevo.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card as="section" className="h-100 shadow-sm" aria-labelledby={`${prefix}-title`}>
      <Card.Body className="p-4">
        <Card.Title as="h2" id={`${prefix}-title`} className="h5 text-dark mb-4">
          {title}
        </Card.Title>
        <Form onSubmit={handleSubmit} aria-busy={submitting}>
          <fieldset disabled={disabled} className="border-0 p-0 m-0">
            <Form.Group className="mb-3" controlId={`${prefix}-product`}>
              <Form.Label>Producto</Form.Label>
              <Form.Select value={productId} onChange={(event) => setProductId(event.target.value)} required>
                <option value="">{productsLoading ? 'Cargando productos…' : 'Selecciona un producto'}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.code} — {product.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId={`${prefix}-quantity`}>
              <Form.Label>Cantidad</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={2147483647}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId={`${prefix}-note`}>
              <Form.Label>Nota (opcional)</Form.Label>
              <Form.Control as="textarea" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
            </Form.Group>
            <Button type="submit" variant={isEntry ? 'success' : 'danger'} className="w-100" disabled={disabled}>
              {submitting ? 'Registrando…' : title}
            </Button>
          </fieldset>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default function Movements() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [movements, setMovements] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const { data } = await axios.get('/products', { signal: controller.signal });
        if (!controller.signal.aborted) setProducts(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = errorMessage(error, 'No se pudieron cargar los productos.');
          setProductsError(message);
          toast.error(message);
        }
      } finally {
        if (!controller.signal.aborted) setProductsLoading(false);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      try {
        const { data } = await axios.get('/inventory/movements', {
          signal: controller.signal,
          params: {
            productId: productFilter ? Number(productFilter) : undefined,
            movementType: typeFilter || undefined,
          },
        });
        if (!controller.signal.aborted) setMovements(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = errorMessage(error, 'No se pudo cargar el historial de movimientos.');
          setHistoryError(message);
          toast.error(message);
        }
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    }

    loadHistory();
    return () => controller.abort();
  }, [productFilter, typeFilter, refresh]);

  function refreshHistory() {
    setHistoryLoading(true);
    setHistoryError('');
    setRefresh((previous) => previous + 1);
  }

  function changeFilter(setFilter, value) {
    setHistoryLoading(true);
    setHistoryError('');
    setFilter(value);
  }

  return (
    <main className="bg-light flex-grow-1 text-start">
      <Container className="py-4 py-md-5">
        <h1 className="h3 text-dark mt-0 mb-2">Movimientos de Inventario</h1>
        <p className="text-secondary mb-4">Registra entradas y salidas, y consulta el historial.</p>

        {productsError && <Alert variant="danger">{productsError}</Alert>}
        {!productsLoading && !productsError && products.length === 0 && (
          <Alert variant="info">Crea un producto antes de registrar movimientos.</Alert>
        )}

        <Row className="g-4 mb-5">
          {['IN', 'OUT'].map((type) => (
            <Col key={type} xs={12} md={6}>
              <MovementForm
                type={type}
                products={products}
                productsLoading={productsLoading}
                productsError={productsError}
                onRegistered={refreshHistory}
              />
            </Col>
          ))}
        </Row>

        <section aria-labelledby="movement-history-title">
          <h2 id="movement-history-title" className="h4 text-dark mb-4">Historial de movimientos</h2>
          <Row className="g-3 mb-4">
            <Form.Group as={Col} xs={12} md={6} controlId="movement-product-filter">
              <Form.Label>Filtrar por producto</Form.Label>
              <Form.Select
                value={productFilter}
                onChange={(event) => changeFilter(setProductFilter, event.target.value)}
                disabled={productsLoading || Boolean(productsError)}
              >
                <option value="">Todos los productos</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.code} — {product.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group as={Col} xs={12} md={6} controlId="movement-type-filter">
              <Form.Label>Filtrar por tipo</Form.Label>
              <Form.Select value={typeFilter} onChange={(event) => changeFilter(setTypeFilter, event.target.value)}>
                <option value="">Todos los tipos</option>
                <option value="IN">Entrada</option>
                <option value="OUT">Salida</option>
              </Form.Select>
            </Form.Group>
          </Row>

          {historyLoading ? (
            <div className="text-center py-5" role="status">
              <Spinner animation="border" variant="primary" aria-hidden="true" />
              <p className="text-secondary mt-3">Cargando movimientos…</p>
            </div>
          ) : historyError ? (
            <Alert variant="danger">
              <p className="mb-3">{historyError}</p>
              <Button variant="outline-danger" onClick={refreshHistory}>Reintentar</Button>
            </Alert>
          ) : (
            <Table responsive striped hover bordered className="align-middle bg-white">
              <caption className="visually-hidden">Historial de entradas y salidas de inventario</caption>
              <thead className="table-dark">
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Producto</th>
                  <th scope="col">Tipo</th>
                  <th scope="col" className="text-end">Cantidad</th>
                  <th scope="col" className="text-end">Stock Anterior</th>
                  <th scope="col" className="text-end">Stock Nuevo</th>
                  <th scope="col">Nota</th>
                  <th scope="col">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-secondary py-4">No hay movimientos para los filtros seleccionados.</td>
                  </tr>
                ) : movements.map((movement) => (
                  <tr key={movement.movementId}>
                    <td className="text-nowrap">{formatDate(movement.createdAt)}</td>
                    <td>
                      {movement.productName}
                      <div className="small text-secondary">{movement.productCode}</div>
                    </td>
                    <td>
                      <Badge bg={movement.movementType === 'IN' ? 'success' : 'danger'}>
                        {movement.movementType === 'IN' ? 'Entrada' : 'Salida'}
                      </Badge>
                    </td>
                    <td className="text-end">{movement.quantity}</td>
                    <td className="text-end">{movement.previousStock}</td>
                    <td className="text-end">{movement.newStock}</td>
                    <td>{movement.note || 'Sin nota'}</td>
                    <td>{movement.username}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </section>
      </Container>
    </main>
  );
}
