// CONTROLLER DE PEDIDOS
const model = require('../models/pedidosModel');

async function crearPedido(req, res) {
  const carrito = req.body;

  // El usuario autenticado viene del middleware verificarUsuario
  const usuarioId = req.usuario ? req.usuario.id : null;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Necesitás iniciar sesión para comprar' });
  }

  try {
    const { total } = await model.crearPedido(usuarioId, carrito);

    return res.status(201).json({
      exito: true,
      mensaje: '¡Compra registrada con éxito!',
      total,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error al procesar el pedido:', error);
    return res.status(500).json({ error: 'Hubo un error al procesar el pedido' });
  }
}

module.exports = { crearPedido };
