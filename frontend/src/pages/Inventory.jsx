import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Container, Form, Spinner, Table } from 'react-bootstrap';
import axios from '../api/axios';

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value) {
  if (!value) {
    return 'Sin registros';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : dateFormatter.format(date);
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadInventory() {
      try {
        const { data } = await axios.get('/inventory/current', { signal: controller.signal });

        if (!controller.signal.aborted) {
          setItems(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error.response?.data?.detail
              || error.response?.data?.title
              || error.message
              || 'No se pudo cargar el inventario.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadInventory();

    return () => controller.abort();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');

    return items.filter((item) => (
      item.productName.toLocaleLowerCase('es').includes(query)
        || item.productCode.toLocaleLowerCase('es').includes(query)
    ));
  }, [items, search]);

  return (
    <main className="bg-light flex-grow-1 text-start">
      <Container className="py-4 py-md-5">
        <h1 className="h3 text-dark mt-0 mb-2">Inventario</h1>
        <p className="text-secondary mb-4">Consulta las existencias y el estado de tus productos.</p>

        <Form.Group className="mb-4" controlId="inventory-search">
          <Form.Label>Buscar por nombre o código</Form.Label>
          <Form.Control
            type="search"
            placeholder="Escribe el nombre o código del producto"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={loading || Boolean(error)}
          />
        </Form.Group>

        {loading ? (
          <div className="text-center py-5" role="status">
            <Spinner animation="border" variant="primary" aria-hidden="true" />
            <p className="text-secondary mt-3">Cargando inventario…</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <Table responsive striped hover bordered className="align-middle bg-white">
            <caption className="visually-hidden">Existencias actuales de productos</caption>
            <thead className="table-dark">
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Nombre</th>
                <th scope="col">Descripción</th>
                <th scope="col" className="text-end">Stock Actual</th>
                <th scope="col" className="text-end">Stock Mínimo</th>
                <th scope="col">Estado</th>
                <th scope="col">Última Entrada</th>
                <th scope="col">Última Salida</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-secondary py-4">
                    {items.length === 0
                      ? 'No hay productos en el inventario.'
                      : 'No se encontraron productos con ese nombre o código.'}
                  </td>
                </tr>
              ) : filteredItems.map((item) => (
                <tr key={item.productId}>
                  <td>{item.productCode}</td>
                  <td>{item.productName}</td>
                  <td>{item.description || 'Sin descripción'}</td>
                  <td className="text-end">{item.currentStock}</td>
                  <td className="text-end">{item.minStock}</td>
                  <td>
                    <Badge bg={item.isLowStock ? 'danger' : 'success'}>
                      {item.isLowStock ? 'Bajo' : 'OK'}
                    </Badge>
                  </td>
                  <td className="text-nowrap">{formatDate(item.lastEntryDate)}</td>
                  <td className="text-nowrap">{formatDate(item.lastExitDate)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Container>
    </main>
  );
}
