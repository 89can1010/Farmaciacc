// CONTROLLER DE USUARIOS
const model = require('../models/authModel');

async function registro(req, res) {
  const { email, password, nombre } = req.body;
  if (!email || !password || !nombre || password.length < 6) {
    return res.status(400).json({ error: 'Faltan datos o la contraseña es menor a 6 caracteres' });
  }
  try {
    const usuario = await model.registrar(email, password, nombre);
    return res.status(201).json({ id: usuario.id, email: usuario.email, mensaje: 'Usuario registrado con éxito' });
  } catch (error) {
    let mensajeError = error.message;

    // Traducimos mensajes típicos de Supabase en registro
    if (mensajeError.includes('User already registered')) {
      mensajeError = 'El usuario ya se encuentra registrado';
    } else if (mensajeError.includes('Password should be at least')) {
      mensajeError = 'La contraseña debe tener al menos 6 caracteres';
    }

    return res.status(400).json({ error: mensajeError });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan email o contraseña' });
  }
  try {
    const token = await model.iniciarSesion(email, password);
    if (!token) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    return res.status(200).json({ token });
  } catch (error) {
    let mensajeError = error.message;

    // Traducimos los mensajes en inglés de Supabase a español
    if (mensajeError.includes('Invalid login credentials')) {
      mensajeError = 'Email o contraseña incorrectos';
    } else if (mensajeError.includes('Email not confirmed')) {
      mensajeError = 'Debes confirmar tu correo electrónico para ingresar';
    }

    return res.status(400).json({ error: mensajeError });
  }
}

module.exports = { registro, login };