// MODEL DE PEDIDOS: la compra
// Valida el stock real contra Supabase, calcula el total y lo descuenta.
const supabase = require('../config/supabaseClient');

// Un error que es culpa del cliente: el controller lo responde con 400
function errorCliente(mensaje) {
  const e = new Error(mensaje);
  e.status = 400;
  return e;
}

// Registra una compra:
// valida que haya stock suficiente, calcula el total y descuenta el stock.
// items = [ { producto_id, cantidad }, ... ]
async function crearPedido(usuarioId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw errorCliente('El carrito está vacío o es inválido');
  }

  // Normalizamos y validamos los datos que llegan del front
  const normalizados = items.map((it) => ({
    producto_id: Number(it.producto_id),
    cantidad: Number(it.cantidad),
  }));

  for (const it of normalizados) {
    if (!Number.isInteger(it.producto_id) || !Number.isInteger(it.cantidad) || it.cantidad <= 0) {
      throw errorCliente('El carrito contiene datos inválidos');
    }
  }

  // Si el mismo producto viene repetido, sumamos las cantidades
  const cantidades = new Map();
  for (const it of normalizados) {
    cantidades.set(it.producto_id, (cantidades.get(it.producto_id) || 0) + it.cantidad);
  }

  const ids = [...cantidades.keys()];

  // Traemos el stock actual de la base (no confiamos en el front)
  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, nombre, precio, stock, activo')
    .in('id', ids);

  if (error) throw error;

  const porId = new Map(productos.map((p) => [p.id, p]));

  // Primera pasada: validar todo antes de tocar nada
  let total = 0;
  for (const [productoId, cantidad] of cantidades) {
    const p = porId.get(productoId);
    if (!p) throw errorCliente('Uno de los productos ya no existe');
    if (p.activo === false) throw errorCliente(`"${p.nombre}" no está disponible`);
    if (cantidad > p.stock) {
      throw errorCliente(`No hay stock suficiente de "${p.nombre}". Quedan ${p.stock}.`);
    }
    total += Number(p.precio) * cantidad;
  }

  // Segunda pasada: descontar stock. Controlamos que el stock no haya cambiado
  // entre la lectura y la escritura (evita sobreventa si compran al mismo tiempo).
  const aplicados = [];
  try {
    for (const [productoId, cantidad] of cantidades) {
      const p = porId.get(productoId);
      const nuevoStock = p.stock - cantidad;

      const { data: actualizado, error: updateError } = await supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', productoId)
        .eq('stock', p.stock)
        .select('id');

      if (updateError) throw updateError;
      if (!actualizado || actualizado.length === 0) {
        throw errorCliente(`El stock de "${p.nombre}" cambió mientras comprabas. Intentá de nuevo.`);
      }

      aplicados.push({ id: productoId, stock: p.stock });
    }
  } catch (e) {
    // Si algo falló, devolvemos el stock que ya habíamos descontado
    for (const a of aplicados.reverse()) {
      await supabase.from('productos').update({ stock: a.stock }).eq('id', a.id);
    }
    throw e;
  }

  return { total, usuarioId };
}

module.exports = { crearPedido };
