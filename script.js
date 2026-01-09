let map;
let marker;
let ubicacionConfirmada = false;

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

    if (!responsable || !institucion || !tipo) {
        alert("Complete todos los campos obligatorios.");
        return;
    }

    const url = "https://script.google.com/macros/s/AKfycbyDXeHOmL3h3k2gwsyP3JBrjkHQ52CI2Hns1uqLkYBZirtY_rALw-EGEAjeUnv5Zbro/exec";

    const formData = new FormData();
    formData.append("responsable", responsable);
    formData.append("institucion", institucion);
    formData.append("tipo_marcacion", tipo);
    formData.append("latitud", lat);
    formData.append("longitud", lon);

    fetch(url, {
        method: "POST",
        body: formData,
        mode: "no-cors"
    });

    alert("Marcación enviada correctamente. Verifique en la hoja.");

    // opcional: limpiar formulario
    // document.getElementById("gpsForm").reset();
}