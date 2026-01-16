let map;
let marker;
let ubicacionConfirmada = false;

// 🔗 URL del Web App de Google Apps Script
const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbyEqwE8Bj-g5mU45I_0bIv-bB_XYiMkPCwyvb3LvOlq9_n6isTe2UmwkAtuOIL8OWWg/exec";

// Función para mostrar mensajes en el div con X roja o ✔ verde
function mostrarMensaje(texto, exito) {
    const div = document.getElementById("mensaje");
    div.style.display = "block";
    div.textContent = ""; // limpiar

    const span = document.createElement("span");
    span.textContent = exito ? "✔" : "✖";
    div.appendChild(span);
    div.appendChild(document.createTextNode(texto));

    div.className = exito ? "exito" : "error";
}

function obtenerUbicacion() {
    if (!navigator.geolocation) {
        mostrarMensaje("Tu navegador no soporta geolocalización", false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (pos) {
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

            if (marker) {
                map.removeLayer(marker);
            }

            marker = L.marker([lat, lon]).addTo(map);
            map.setView([lat, lon], 17);

            ubicacionConfirmada = true;
            mostrarMensaje("Ubicación obtenida correctamente", true);
        },
        function () {
            mostrarMensaje("No se pudo obtener la ubicación GPS", false);
        }
    );
}

function enviarMarcacion() {

    if (!ubicacionConfirmada) {
        mostrarMensaje("Debe obtener la ubicación GPS antes de registrar.", false);
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

// 🔒 Función para manejar Google Sign-In y validar dominios autorizados
function handleCredentialResponse(response) {
    const data = JSON.parse(atob(response.credential.split('.')[1]));
    const email = data.email.toLowerCase();

    // Validar dominios permitidos
    if (!email.endsWith("@docentes.educacion.edu.ec") && !email.endsWith("@minedec.gob.ec")) {
        mostrarMensaje("Correo no autorizado", false);
        return;
    }

    document.getElementById("correo").value = email;
    mostrarMensaje("Sesión iniciada como: " + email, true);
}