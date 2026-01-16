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
        },
        function () {
            alert("No se pudo obtener la ubicación GPS");
        }
    );
}

function enviarMarcacion() {

    if (!ubicacionConfirmada) {
        alert("Debe obtener la ubicación GPS antes de registrar.");
        return;
    }

    const responsable = document.getElementById("responsable").value;
    const institucion = document.getElementById("institucion").value;
    const tipo = document.getElementById("tipo_marcacion").value;
    const lat = document.getElementById("latitud").value;
    const lon = document.getElementById("longitud").value;
    const correo = document.getElementById("correo").value;

    if (!responsable || !institucion || !tipo || !correo) {
        alert("Complete todos los campos obligatorios.");
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
            alert("Marcación registrada correctamente.");
        } else if (respuesta === "DUPLICADO") {
            alert("Ya existe una marcación de este tipo hoy.");
        } else if (respuesta === "DOMINIO_NO_AUTORIZADO") {
            alert("Correo no autorizado.");
        } else {
            alert("Error: " + respuesta);
        }

    })
    .catch(error => {
        alert("Error de conexión con el servidor.");
        console.error(error);
    });
}

// 🔒 Función para manejar Google Sign-In y validar dominios autorizados
function handleCredentialResponse(response) {
    const data = JSON.parse(atob(response.credential.split('.')[1]));
    const email = data.email;

    // Validar dominios permitidos
    if (!email.endsWith("@docentes.educacion.edu.ec") && !email.endsWith("@minedec.gob.ec")) {
        alert("Correo no autorizado");
        return;
    }

    document.getElementById("correo").value = email;
    alert("Sesión iniciada como: " + email);
}