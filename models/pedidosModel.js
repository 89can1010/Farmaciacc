// MODEL DE PEDIDOS: la compra
const supabase = require('../config/supabaseClient');
const { faltaImplementar } = require('../utils/errores');

// Un error que es culpa del cliente: el controller lo responde con 400
function errorCliente(mensaje) {
  const e = new Error(mensaje);
  e.status = 400;
  return e;
}

// Registra una compra completa:
// busca productos, controla stock, calcula el total, guarda pedido e items
// y descuenta el stock. items = [ { producto_id, cantidad }, ... ]
async function crearPedido(usuarioId, items) {
  // TODO (Clase 2 · Paso 8): completar con el código de la práctica.
  throw faltaImplementar('crearPedido', 'Clase 2 · Paso 8');
}

module.exports = { crearPedido };
