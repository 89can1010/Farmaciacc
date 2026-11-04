// MODEL DE USUARIOS: registro y login con Supabase Auth
const supabase = require('../config/supabaseClient');

// Registro: Auth crea el usuario y nosotros guardamos su perfil
async function registrar(email, password, nombre) {
  // 1. Verificar si el usuario ya existe en nuestra tabla 'usuarios'
  const { data: usuarioExistente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single();

  if (usuarioExistente) {
    throw new Error('El correo electrónico ya está registrado');
  }

  // 2. Creamos el usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const user = authData.user;

  // 3. Guardamos el perfil en la tabla 'usuarios'
  if (user) {
    const { error: perfilError } = await supabase
      .from('usuarios')
      .insert([{ id: user.id, email, nombre }]);

    if (perfilError && perfilError.code !== '23505') { 
      // 23505 es clave duplicada
      console.error('Error insertando en tabla usuarios:', perfilError);
    }
  }

  return { id: user ? user.id : null, email };
}

// Login: devuelve el token, o lanza/devuelve el motivo de error
async function iniciarSesion(email, password) {
  // 1. Iniciamos sesión con Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Si Supabase devuelve un error (ej. Email not confirmed o credenciales inválidas)
    throw new Error(error.message);
  }

  if (!data.session) {
    return null;
  }

  // 2. Retornamos el token de acceso
  return data.session.access_token;
}

module.exports = { registrar, iniciarSesion };