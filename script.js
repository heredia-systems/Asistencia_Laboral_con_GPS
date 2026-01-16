let map;
let marker;
let ubicacionConfirmada = false;

// 🔗 URL del Web App de Google Apps Script
const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbyEqwE8Bj-g5mU45I_0bIv-bB_XYiMkPCwyvb3LvOlq9_n6isTe2UmwkAtuOIL8OWWg/exec";

function obtenerUbicacion() {

    if (!navigator.geolocation) {
        alert("Tu navegador no soporta geolocalización");
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
                L…
[13:03, 16/1/2026] Ing. Carlos Heredia: ---
[13:03, 16/1/2026] Ing. Carlos Heredia: let map;
let marker;
let ubicacionConfirmada = false;

// 🔗 URL del Web App de Google Apps Script
const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbyEqwE8Bj-g5mU45I_0bIv-bB_XYiMkPCwyvb3LvOlq9_n6isTe2UmwkAtuOIL8OWWg/exec";

function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById("mensaje");
    mensajeDiv.style.display = "block";
    mensajeDiv.className = tipo; // "error" o "exito"
    if(tipo === "exito"){
        mensajeDiv.innerHTML = <span>✔</span>${texto};
    } else {
        mensajeDiv.innerHTML = <span>❌</span>${texto};
    }
}

function obtenerUbicacion() {
    if (!navigator.geolocation) {
        mostrarMensaje("Tu navegador no soporta geolocalización", "error");
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
            mostrarMensaje("Ubicación obtenida correctamente", "exito");
        },
        function () {
            mostrarMensaje("No se pudo obtener la ubicación GPS", "error");
        }
    );
}

function enviarMarcacion() {

    if (!ubicacionConfirmada) {
        mostrarMensaje("Debe obtener la ubicación GPS antes de registrar.", "error");
        return;
    }

    const responsable = document.getElementById("responsable").value;
    const institucion = document.getElementById("institucion").value;
    const tipo = document.getElementById("tipo_marcacion").value;
    const lat = document.getElementById("latitud").value;
    const lon = document.getElementById("longitud").value;
    const correo = document.getElementById("correo").value;

    if (!responsable || !institucion || !tipo || !correo) {
        mostrarMensaje("Complete todos los campos obligatorios.", "error");
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
            mostrarMensaje("Marcación registrada correctamente.", "exito");
        } else if (respuesta === "DUPLICADO") {
            mostrarMensaje("Ya existe una marcación de este tipo hoy.", "error");
        } else if (respuesta === "DOMINIO_NO_AUTORIZADO") {
            mostrarMensaje("Correo no autorizado.", "error");
        } else if (respuesta === "DATOS_INCOMPLETOS") {
            mostrarMensaje("Faltan datos obligatorios.", "error");
        } else {
            mostrarMensaje("Error: " + respuesta, "error");
        }

    })
    .catch(error => {
        mostrarMensaje("Error de conexión con el servidor.", "error");
        console.error(error);
    });
}

// 🔒 Función para manejar Google Sign-In y validar dominios autorizados
function handleCredentialResponse(response) {
    const data = JSON.parse(atob(response.credential.split('.')[1]));
    const email = data.email.toLowerCase();

    // Validar dominios permitidos
    if (!email.endsWith("@docentes.educacion.edu.ec") && !email.endsWith("@minedec.gob.ec")) {
        mostrarMensaje("Correo no autorizado", "error");
        return;
    }

    document.getElementById("correo").value = email;
    mostrarMensaje("Sesión iniciada como: " + email, "exito");
}