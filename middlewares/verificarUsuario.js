const supabase = require('../config/supabaseClient');

async function verificarUsuario(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'No se proporcionó un token de autenticación' });
  }

  try {
    // Verificamos el token con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Adjuntamos los datos del usuario a la petición para usarlos luego
    req.usuario = user;
    next();
  } catch (err) {
    console.error('Error en middleware verificarUsuario:', err);
    return res.status(500).json({ error: 'Error interno de autenticación' });
  }
}

module.exports = verificarUsuario;