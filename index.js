/* 
   Ejemplo de autenticación basada en sesiones. Se tiene una ruta
   pública a la raíz, otra de acceso restringido para usuarios validados
   a '/protegido', y otra restringida a usuarios administradores a
   '/protegidoAdmin'. Se incluye también un formulario de login
*/

// Cargamos los módulos, incluido express-session
const express = require('express');
const session = require('express-session');
const nunjucks = require('nunjucks');

// Simulamos así la base de datos de usuarios registrados
const usuarios = [
    { usuario: 'nacho', password: '12345', rol: 'admin' },
    { usuario: 'pepe', password: 'pepe111', rol: 'normal' }
];

// Middleware que se aplicará para autenticar usuarios en rutas protegidas
let autenticacion = (req, res, next) => {
    if (req.session && req.session.usuario)
        return next();
    else
        res.render('login');
};

// Middleware que se aplicará para verificar rol de usuario en rutas protegidas con rol
let rol = (rol) => {
    return (req, res, next) => {
        if (rol === req.session.rol)
            next();
        else
            res.render('login');
    }
}

let app = express();

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.set('view engine', 'njk');

app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use(express.urlencoded({ extended: false }));

// Configuración de la sesión en la aplicación
app.use(session({
    secret: '1234',
    resave: true,
    saveUninitialized: false
}));

// Este middleware se emplea para poder acceder a la sesión desde las vistas
// como una variable "session". Es útil para poder mostrar unos contenidos u
// otros en función de los atributos guardados en la sesión. La utilizaremos
// para mostrar el botón de Login o el de Logout en la vista "base.njk"
// según si el usuario está validado o no.
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Vista de login
app.get('/login', (req, res) => {
    res.render('login');
});

// Proceso de login (obtener credenciales y cotejar)
app.post('/login', (req, res) => {
    let login = req.body.login;
    let password = req.body.password;

    let existeUsuario = usuarios.filter(usuario => usuario.usuario == login && usuario.password == password);
    if (existeUsuario.length > 0)
    {
        req.session.usuario = existeUsuario[0].usuario;
        req.session.rol = existeUsuario[0].rol;
        res.render('index');
    } else {
        res.render('login', {error: "Usuario o contraseña incorrectos"});
    }
});

// Ruta para logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

/* Rutas de la aplicación */

// Ruta pública
app.get('/', (req, res) => {
    res.render('index');
});

// Ruta protegida para usuarios registrados
app.get('/protegido', autenticacion, (req, res) => {
    res.render('protegido');
});

// Ruta protegida para usuarios administradores
app.get('/protegidoAdmin', autenticacion, rol('admin'), (req, res) => {
    res.render('protegido_admin');
})

app.listen(8080);