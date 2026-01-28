let map;
let marker;
let ubicacionConfirmada = false;
let imagenBase64 = ""; 
let watchId = null;

const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbxC6dpPrLwdB0hwdhM6ybKiKcBefkl2QeeGQ2TXaRQdb5yNZHmroIJrkqiDVSJlnFI/exec";

function mostrarMensaje(texto, exito) {
    const div = document.getElementById("mensaje");
    div.style.display = "block";
    div.textContent = "";

    const span = document.createElement("span");
    span.textContent = exito ? "✔" : "✖";
    div.appendChild(span);
    div.appendChild(document.createTextNode(texto));

    div.className = exito ? "exito" : "error";
}

// ==== GPS ====
function obtenerUbicacion() {
    if (!navigator.geolocation) {
        mostrarMensaje("Tu navegador no soporta geolocalización", false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function(pos) {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            document.getElementById("latitud").value = lat;
            document.getElementById("longitud").value = lon;

            if (!map) {
                map = L.map("map").setView([lat, lon], 17);
                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: "© OpenStreetMap"
                }).addTo(map);
            }

            if (marker) map.removeLayer(marker);
            marker = L.marker([lat, lon]).addTo(map);
            map.setView([lat, lon], 17);

            ubicacionConfirmada = true;
            mostrarMensaje("Ubicación obtenida correctamente", true);
        },
        function() {
            mostrarMensaje("No se pudo obtener la ubicación GPS", false);
        }
    );
}

function obtenerUbicacionPrecisa() {
    if (!navigator.geolocation) {
        mostrarMensaje("Tu navegador no soporta geolocalización", false);
        return;
    }

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    ubicacionConfirmada = false;
    mostrarMensaje("Mejorando precisión de ubicación...", true);

    watchId = navigator.geolocation.watchPosition(
        function(pos) {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;

            document.getElementById("latitud").value = lat;
            document.getElementById("longitud").value = lon;

            if (!map) {
                map = L.map("map").setView([lat, lon], 17);
                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: "© OpenStreetMap"
                }).addTo(map);
            }

            if (marker) map.removeLayer(marker);
            marker = L.marker([lat, lon]).addTo(map);
            map.setView([lat, lon], 17);

            if (accuracy <= 10) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
                ubicacionConfirmada = true;
                mostrarMensaje("Ubicación precisa obtenida (" + Math.round(accuracy) + " m)", true);
            }
        },
        function() {
            mostrarMensaje("No se pudo obtener la ubicación GPS", false);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 20000
        }
    );
}

// ==== CÁMARA ====
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    const video = document.getElementById("video");
    video.srcObject = stream;
})
.catch(err => {
    mostrarMensaje("No se puede acceder a la cámara: " + err, false);
});

function tomarFoto() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");

    const MAX_WIDTH = 200;
    const MAX_HEIGHT = 200;

    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > height) {
        if (width > MAX_WIDTH) {
            height = Math.round(height * MAX_WIDTH / width);
            width = MAX_WIDTH;
        }
    } else {
        if (height > MAX_HEIGHT) {
            width = Math.round(width * MAX_HEIGHT / height);
            height = MAX_HEIGHT;
        }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    imagenBase64 = canvas.toDataURL("image/jpeg", 0.8);
    mostrarMensaje("Imagen capturada correctamente", true);
}

// ==== ENVÍO ====
function enviarMarcacion() {
    if (!ubicacionConfirmada) {
        mostrarMensaje("Debe obtener la ubicación GPS antes de registrar.", false);
        return;
    }

    if (!imagenBase64) {
        mostrarMensaje("Debe capturar la imagen antes de registrar.", false);
        return;
    }

    const responsable = document.getElementById("responsable").value;
    const institucion = document.getElementById("institucion").value;
    const tipo = document.getElementById("tipo_marcacion").value;
    const lat = document.getElementById("latitud").value;
    const lon = document.getElementById("longitud").value;
    const correo = document.getElementById("correo").value;

    if (!responsable || !institucion || !tipo || !correo) {
        mostrarMensaje("Complete todos los campos obligatorios.", false);
        return;
    }

    const formData = new FormData();
    formData.append("responsable", responsable);
    formData.append("institucion", institucion);
    formData.append("tipo_marcacion", tipo);
    formData.append("latitud", lat);
    formData.append("longitud", lon);
    formData.append("correo", correo);
    formData.append("imagen", imagenBase64);

    fetch(URL_WEB_APP, {
        method: "POST",
        body: formData
    })
    .then(res => res.text())
    .then(respuesta => {
        if (respuesta === "OK") {
            mostrarMensaje("Marcación registrada correctamente", true);
        } else if (respuesta === "DUPLICADO") {
            mostrarMensaje("Ya existe una marcación de este tipo hoy", false);
        } else if (respuesta === "DOMINIO_NO_AUTORIZADO") {
            mostrarMensaje("Correo no autorizado", false);
        } else if (respuesta === "DATOS_INCOMPLETOS") {
            mostrarMensaje("Faltan datos obligatorios", false);
        } else {
            mostrarMensaje("Error: " + respuesta, false);
        }
    })
    .catch(error => {
        mostrarMensaje("Error de conexión con el servidor", false);
        console.error(error);
    });
}

// ==== GOOGLE SIGN-IN ====
function handleCredentialResponse(response) {
    const data = JSON.parse(atob(response.credential.split('.')[1]));
    const email = data.email.toLowerCase();

    if (!email.endsWith("@docentes.educacion.edu.ec") && !email.endsWith("@minedec.gob.ec")) {
        mostrarMensaje("Correo no autorizado", false);
        return;
    }

    document.getElementById("correo").value = email;
    mostrarMensaje("Sesión iniciada como: " + email, true);

    // Verificar usuario en la hoja Usuarios
    fetch(URL_WEB_APP + "?accion=verificarUsuario&correo=" + encodeURIComponent(email))
    .then(res => res.text())
    .then(respuesta => {
        if (respuesta === "NO_REGISTRADO") {
            mostrarMensaje("Usuario nuevo: complete su registro", true);
            // Mostrar formulario de registro inicial
            document.getElementById("registroInicial").style.display = "block";
            document.getElementById("correo_registro").value = email;
            document.getElementById("fecha_registro").value = new Date().toISOString().split('T')[0];
            // Ocultar formulario de marcación hasta completar registro
            document.getElementById("gpsForm").style.display = "none";
        } else if (respuesta === "REGISTRADO") {
            mostrarMensaje("Usuario existente: puede registrar su marcación", true);
            // Mostrar formulario GPS
            document.getElementById("gpsForm").style.display = "block";
            document.getElementById("registroInicial").style.display = "none";
        } else {
            mostrarMensaje("Error al verificar usuario: " + respuesta, false);
        }
    });
}

// ==== GUARDAR REGISTRO INICIAL ====
function guardarRegistroInicial() {
    const correo = document.getElementById("correo_registro").value;
    const nombres = document.getElementById("nombres_registro").value;
    const zona = document.getElementById("zona_registro").value;
    const distrito = document.getElementById("distrito_registro").value;
    const institucion = document.getElementById("institucion_registro").value;
    const fecha = document.getElementById("fecha_registro").value;

    if (!nombres || !zona || !distrito || !institucion || !fecha) {
        mostrarMensaje("Complete todos los campos del registro inicial.", false);
        return;
    }

    const formData = new FormData();
    formData.append("accion", "registrarUsuario");
    formData.append("correo", correo);
    formData.append("nombres", nombres);
    formData.append("zona", zona);
    formData.append("distrito", distrito);
    formData.append("institucion", institucion);
    formData.append("fecha", fecha);

    fetch(URL_WEB_APP, {
        method: "POST",
        body: formData
    })
    .then(res => res.text())
    .then(respuesta => {
        if (respuesta === "OK") {
            mostrarMensaje("Registro inicial guardado correctamente", true);
            // Mostrar formulario GPS
            document.getElementById("gpsForm").style.display = "block";
            document.getElementById("registroInicial").style.display = "none";
            // Autocompletar campos GPS con datos del registro
            document.getElementById("correo").value = correo;
            document.getElementById("responsable").value = nombres;
            document.getElementById("institucion").value = institucion;
        } else {
            mostrarMensaje("Error al guardar registro: " + respuesta, false);
        }
    })
    .catch(error => {
        mostrarMensaje("Error de conexión al guardar registro", false);
        console.error(error);
    });
}