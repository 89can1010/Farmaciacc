// MODEL DE PRODUCTOS: el catalogo
const supabase = require('../config/supabaseClient');
const { faltaImplementar } = require('../utils/errores');

// Las categorias para el filtro del front (ya resuelto)
async function obtenerCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre')
    .order('nombre');
  if (error) throw error;
  return data;
}

// Los productos activos, con el nombre de su categoria.
// Si llega categoriaId, filtra por esa categoria.
async function obtenerProductos(categoriaId) {
  let query = supabase
    .from('productos')
    .select('id, nombre, descripcion, precio, stock, imagen_url, categoria_id, categorias(nombre)');

  if (categoriaId) {
    query = query.eq('categoria_id', categoriaId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

module.exports = { obtenerCategorias, obtenerProductos };