// ==================== ESTADO Y VARIABLES ====================
const catalogo = {};
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let token = localStorage.getItem('token');
let usuarioEmail = localStorage.getItem('email');
let categoriaActual = null;
let cargandoProductos = false;

// ==================== CATALOGO Y PRODUCTOS ====================
async function cargarProductos(categoriaId) {
  if (cargandoProductos) return;
  cargandoProductos = true;
  categoriaActual = categoriaId || null;
  pintarCategoriaActiva();

  let url = categoriaId ? `/productos?categoria=${categoriaId}` : '/productos';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    pintarProductos(await res.json());
  } catch (error) {
    mostrarMensaje('No se pudieron cargar los productos', 'error');
  } finally {
    cargandoProductos = false;
  }
}

function pintarProductos(lista) {
  const grilla = document.getElementById('productos');
  grilla.replaceChildren();

  if (lista.length === 0) {
    grilla.innerHTML = '<p class="vacio">No hay productos para mostrar.</p>';
    return;
  }

  lista.forEach(p => {
    catalogo[p.id] = p;
    const sinStock = p.stock < 1;
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta';
    tarjeta.innerHTML = `
      <img src="${p.imagen_url || ''}" alt="${p.nombre}">
      <div class="info">
        <span class="categoria">${p.categorias?.nombre || ''}</span>
        <h3>${p.nombre}</h3>
        <p class="descripcion">${p.descripcion || ''}</p>
        <span class="precio">$${p.precio}</span>
        <span class="stock">${sinStock ? 'Sin stock' : 'Quedan ' + p.stock}</span>
        <button class="btn btn-principal" onclick="agregar(${p.id})" ${sinStock ? 'disabled' : ''}>Agregar al carrito</button>
      </div>`;
    grilla.appendChild(tarjeta);
  });
  pintarCarrito();
}

async function cargarCategorias() {
  const res = await fetch('/categorias');
  if (!res.ok) return;
  const categorias = await res.json();
  const nav = document.getElementById('categorias');
  nav.innerHTML = '<button data-id="" onclick="cargarProductos()">Todos</button>';
  categorias.forEach(c => {
    nav.innerHTML += `<button data-id="${c.id}" onclick="cargarProductos(${c.id})">${c.nombre}</button>`;
  });
  pintarCategoriaActiva();
  cargarProductos();
}

function pintarCategoriaActiva() {
  document.querySelectorAll('#categorias button').forEach(b => {
    const id = b.dataset.id ? Number(b.dataset.id) : null;
    b.classList.toggle('activa', id === categoriaActual);
  });
}

// ==================== CARRITO ====================
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
  pintarCarrito();
}

function agregar(id) {
  const item = carrito.find(i => i.producto_id === id);
  if (item) item.cantidad++;
  else carrito.push({ producto_id: id, cantidad: 1 });
  guardarCarrito();
  mostrarMensaje('Producto agregado al carrito', 'ok');
}

function cambiarCantidad(id, cambio) {
  const item = carrito.find(i => i.producto_id === id);
  if (!item) return;
  item.cantidad += cambio;
  if (item.cantidad < 1) carrito = carrito.filter(i => i.producto_id !== id);
  guardarCarrito();
}

function pintarCarrito() {
  const lista = document.getElementById('carrito-lista');
  let total = 0, unidades = 0;
  lista.innerHTML = '';
  
  carrito.forEach(item => {
    const p = catalogo[item.producto_id];
    const nombre = p ? p.nombre : 'Producto ' + item.producto_id;
    const subtotal = p ? p.precio * item.cantidad : 0;
    total += subtotal;
    unidades += item.cantidad;
    lista.innerHTML += `
      <li>
        <span>${nombre}<br><small>$${subtotal}</small></span>
        <span class="cantidad">
          <button onclick="cambiarCantidad(${item.producto_id}, -1)">−</button>
          ${item.cantidad}
          <button onclick="cambiarCantidad(${item.producto_id}, 1)">+</button>
        </span>
      </li>`;
  });
  if (carrito.length === 0) lista.innerHTML = '<li>Tu carrito está vacío</li>';
  document.getElementById('carrito-total').textContent = '$' + total;
  document.getElementById('contador').textContent = unidades;
}

function alternarCarrito() {
  document.getElementById('carrito').classList.toggle('oculto');
}

// ==================== USUARIOS Y SESIÓN ====================
async function registrar(e) {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch('/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrarse');

    mostrarMensaje('¡Cuenta creada con éxito!', 'ok');
    document.getElementById('form-registro').reset();
    mostrarRegistro(false);
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

async function iniciarSesion(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Credenciales incorrectas');

    token = data.token;
    usuarioEmail = email;
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);

    actualizarSesion();
    cerrarModal();
    document.getElementById('form-login').reset();
    mostrarMensaje('¡Bienvenida!', 'ok');
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

function actualizarSesion() {
  const btnIngresar = document.getElementById('btn-ingresar');
  const btnSalir = document.getElementById('btn-salir');
  const saludo = document.getElementById('saludo');

  if (token && usuarioEmail) {
    btnIngresar.classList.add('oculto');
    btnSalir.classList.remove('oculto');
    const nombre = usuarioEmail.split('@')[0];
    saludo.textContent = `Hola ${nombre.charAt(0).toUpperCase() + nombre.slice(1)}`;
    saludo.classList.remove('oculto');
  } else {
    btnIngresar.classList.remove('oculto');
    btnSalir.classList.add('oculto');
    saludo.textContent = '';
    saludo.classList.add('oculto');
  }
}

function cerrarSesion() {
  token = null;
  usuarioEmail = null;
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  actualizarSesion();
  mostrarMensaje('Sesión cerrada', 'ok');
}

// ==================== COMPRA Y PAGO CON TARJETA ====================
function comprar() {
  if (carrito.length === 0) return mostrarMensaje('Tu carrito está vacío', 'error');
  if (!token) { abrirModal(); return mostrarMensaje('Iniciá sesión para comprar', 'error'); }

  abrirModalPago();
}

function abrirModalPago() {
  document.getElementById('modal-pago').classList.remove('oculto');
}

function cerrarModalPago() {
  document.getElementById('modal-pago').classList.add('oculto');
}

async function procesarPago(e) {
  e.preventDefault();

  try {
    const res = await fetch('/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify(carrito)
    });

    if (res.status === 401) { abrirModal(); return mostrarMensaje('Sesión expirada', 'error'); }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al procesar el pago');

    cerrarModalPago();
    document.getElementById('form-pago').reset();
    carrito = [];
    guardarCarrito();
    cargarProductos(categoriaActual);
    alternarCarrito();
    mostrarMensaje('¡Pago y compra realizados con éxito! 🎉', 'ok');

  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

// ==================== UI / MODALES ====================
function mostrarMensaje(texto, tipo) {
  const caja = document.getElementById('mensaje');
  caja.textContent = texto;
  caja.className = 'mensaje ' + tipo;
  clearTimeout(caja.temporizador);
  caja.temporizador = setTimeout(() => caja.classList.add('oculto'), 4000);
}

function abrirModal() { document.getElementById('modal').classList.remove('oculto'); }
function cerrarModal() { document.getElementById('modal').classList.add('oculto'); }
function mostrarRegistro(m) {
  document.getElementById('form-registro').classList.toggle('oculto', !m);
  document.getElementById('form-login').classList.toggle('oculto', m);
}async function procesarPago(e) {
  e.preventDefault();

  const numeroTarjeta = document.getElementById('tarjeta-numero').value;
  const vencimiento = document.getElementById('tarjeta-vencimiento').value;
  const cvv = document.getElementById('tarjeta-cvv').value;

  // Validar cantidades exactas
  if (numeroTarjeta.length !== 16) {
    return mostrarMensaje('El número de tarjeta debe tener exactamente 16 dígitos', 'error');
  }
  if (vencimiento.length !== 4) {
    return mostrarMensaje('El vencimiento debe tener 4 números (MMAA)', 'error');
  }
  if (cvv.length !== 3) {
    return mostrarMensaje('El CVV debe tener exactamente 3 dígitos', 'error');
  }

  try {
    const res = await fetch('/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify(carrito)
    });

    if (res.status === 401) { abrirModal(); return mostrarMensaje('Sesión expirada', 'error'); }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al procesar el pago');

    cerrarModalPago();
    document.getElementById('form-pago').reset();
    carrito = [];
    guardarCarrito();
    cargarProductos(categoriaActual);
    alternarCarrito();
    mostrarMensaje('¡Pago y compra realizados con éxito! 🎉', 'ok');

  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}



// ==================== INICIO ====================
cargarCategorias();
pintarCarrito();
actualizarSesion();