let map;
let marker;
let watchId = null; // Para poder cancelar lecturas anteriores

let ubicacionConfirmada = false;
let mejorAccuracy = Infinity;
let imagenBase64 = ""; // Variable global para la imagen

const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbzVbc7o8oixOV3PBciCFlCrYmqDDi-zceWGGsVpk7T1sBtYKkfUWANtLUDaF45KLr6p/exec";

// ==========================
// 📍 OBTENER UBICACIÓN GPS (MEJORADO)
// ==========================
function obtenerUbicacion() {
    if (!navigator.geolocation) {
        mostrarMensaje("Tu navegador no soporta geolocalización", false);
        return;
    }

    // Reiniciar estado cada vez que se pulsa el botón
    ubicacionConfirmada = false;
    mejorAccuracy = Infinity;
    document.getElementById("estadoGPS").innerText = "Buscando ubicación…";

    // Cancelar escucha anterior si existe
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    // Iniciar nueva escucha
    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const acc = pos.coords.accuracy; // metros

            // Guardar solo la mejor lectura
            if (acc < mejorAccuracy) {
                mejorAccuracy = acc;

                document.getElementById("latitud").value = lat;
                document.getElementById("longitud").value = lon;

                if (!map) {
                    map = L.map("map").setView([lat, lon], 17);
                    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        attribution: "© OpenStreetMap"
                    }).addTo(map);
                }

                if (marker) {
                    map.removeLayer(marker);
                }

                marker = L.marker([lat, lon]).addTo(map);
                map.setView([lat, lon], 17);

                document.getElementById("estadoGPS").innerText =
                    Precisión actual: ±${Math.round(acc)} m;
            }

            // Si la precisión es buena (<20 m), confirmamos y detenemos
            if (acc <= 20) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
                ubicacionConfirmada = true;
                document.getElementById("estadoGPS").innerText = "Ubicación precisa obtenida ✅";
                mostrarMensaje("Ubicación GPS confirmada", true);
            }

        },
        (error) => {
            mostrarMensaje("No se pudo obtener la ubicación GPS. Active el GPS.", false);
            document.getElementById("estadoGPS").innerText = "";
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );
}

// ==========================
// 📸 CÁMARA
// ==========================
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    const video = document.getElementById("video");
    video.srcObject = stream;
    video.onloadedmetadata = () => video.play();
})
.catch(err => {
    mostrarMensaje("No se puede acceder a la cámara: " + err, false);
});

// ==========================
// 📷 CAPTURA DE FOTO
// ==========================
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

// ==========================
// 📤 ENVIAR MARCACIÓN
// ==========================
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

// ==========================
// GOOGLE SIGN-IN
// ==========================
function handleCredentialResponse(response) {
    const data = JSON.parse(atob(response.credential.split('.')[1]));
    const email = data.email.toLowerCase();

    if (!email.endsWith("@docentes.educacion.edu.ec") && !email.endsWith("@minedec.gob.ec")) {
        mostrarMensaje("Correo no autorizado", false);
        return;
    }

    document.getElementById("correo").value = email;
    mostrarMensaje("Sesión iniciada como: " + email, true);
}

// ==========================
// MENSAJES
// ==========================
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