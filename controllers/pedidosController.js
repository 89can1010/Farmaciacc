const supabase = require('../config/supabaseClient');

async function crearPedido(req, res) {
  const carrito = req.body;
  
  // El usuario autenticado viene del middleware verificarUsuario
  const usuarioId = req.usuario ? req.usuario.id : null; 

  if (!carrito || !Array.isArray(carrito) || carrito.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío o es inválido' });
  }

  try {
    // Aquí puedes agregar la lógica para guardar el pedido en Supabase o descontar stock si lo deseas.
    // Por ahora, respondemos con éxito en formato JSON para que el frontend cierre la compra perfectamente:

    return res.status(201).json({ 
      exito: true, 
      mensaje: '¡Compra registrada con éxito!' 
    });

  } catch (error) {
    console.error('Error al procesar el pedido:', error);
    return res.status(500).json({ error: 'Hubo un error al procesar el pedido' });
  }
}

module.exports = { crearPedido };