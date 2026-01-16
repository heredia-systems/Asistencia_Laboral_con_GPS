let map;
let marker;
let ubicacionConfirmada = false;

// 🔗 PEGA AQUÍ LA URL DE TU WEB APP
const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbwBgqPAvcf-BLDpn2mfQhkTVy3sBftRFXjtEAZxGDUO2S7B6SQ_TdFgnpdtCHyuRYUm/exec";

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

            if (marker) map.removeLayer(marker);

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

    const correo = document.getElementById("correo").value;
    const responsable = document.getElementById("responsable").value;
    const institucion = document.getElementById("institucion").value;
    const tipo = document.getElementById("tipo_marcacion").value;
    const lat = document.getElementById("latitud").value;
    const lon = document.getElementById("longitud").value;

    if (!correo || !responsable || !institucion || !tipo) {
        alert("Complete todos los campos obligatorios.");
        return;
    }

    const formData = new FormData();
    formData.append("correo", correo);
    formData.append("responsable", responsable);
    formData.append("institucion", institucion);
    formData.append("tipo_marcacion", tipo);
    formData.append("latitud", lat);
    formData.append("longitud", lon);

    fetch(URL_WEB_APP, {
        method: "POST",
        body: formData
    })
    .then(res => res.text())
    .then(respuesta => {

        if (respuesta === "OK") {
            alert("✅ Marcación registrada correctamente.");
        } else if (respuesta === "DUPLICADO") {
            alert("⚠️ Ya existe una marcación de este tipo hoy.");
        } else if (respuesta === "DOMINIO_NO_AUTORIZADO") {
            alert("❌ Correo institucional no autorizado.");
        } else {
            alert("❌ Error: " + respuesta);
        }

    })
    .catch(error => {
        alert("❌ Error de conexión con el servidor.");
        console.error(error);
    });
}