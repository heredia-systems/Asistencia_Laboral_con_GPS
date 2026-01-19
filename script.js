let map;
let marker;
let watchId = null;

let ubicacionConfirmada = false;
let mejorAccuracy = Infinity;
let imagenBase64 = "";

const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbzVbc7o8oixOV3PBciCFlCrYmqDDi-zceWGGsVpk7T1sBtYKkfUWANtLUDaF45KLr6p/exec";

// ==========================
// 📍 GPS MEJORADO
// ==========================
function obtenerUbicacion() {

    if (!navigator.geolocation) {
        mostrarMensaje("Tu navegador no soporta geolocalización", false);
        return;
    }

    ubicacionConfirmada = false;
    mejorAccuracy = Infinity;
    document.getElementById("estadoGPS").innerText = "Buscando ubicación…";

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }

    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const acc = pos.coords.accuracy;

            if (acc < mejorAccuracy) {
                mejorAccuracy = acc;

                document.getElementById("latitud").value = lat;
                document.getElementById("longitud").value = lon;

                if (!map) {
                    map = L.map("map").setView([lat, lon], 17);
                    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
                }

                if (marker) map.removeLayer(marker);

                marker = L.marker([lat, lon]).addTo(map);
                map.setView([lat, lon], 17);

                document.getElementById("estadoGPS").innerText =
                    Precisión actual: ±${Math.round(acc)} m;
            }

            if (acc <= 20) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
                ubicacionConfirmada = true;
                document.getElementById("estadoGPS").innerText = "Ubicación precisa obtenida ✅";
                mostrarMensaje("Ubicación GPS confirmada", true);
            }
        },
        () => {
            mostrarMensaje("No se pudo obtener la ubicación GPS", false);
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
// 📷 FOTO REDUCIDA
// ==========================
function tomarFoto() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");

    const MAX = 200;
    let w = video.videoWidth;
    let h = video.videoHeight;

    if (w > h && w > MAX) {
        h = h * MAX / w; w = MAX;
    } else if (h > MAX) {
        w = w * MAX / h; h = MAX;
    }

    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(video, 0, 0, w, h);

    imagenBase64 = canvas.toDataURL("image/jpeg", 0.7);
    mostrarMensaje("Imagen capturada correctamente", true);
}

// ==========================
// 📤 ENVÍO
// ==========================
function enviarMarcacion() {

    if (!ubicacionConfirmada) {
        mostrarMensaje("Ubicación no confirmada", false);
        return;
    }

    if (!imagenBase64) {
        mostrarMensaje("Debe capturar la imagen", false);
        return;
    }

    const data = new FormData();
    data.append("responsable", responsable.value);
    data.append("institucion", institucion.value);
    data.append("tipo_marcacion", tipo_marcacion.value);
    data.append("latitud", latitud.value);
    data.append("longitud", longitud.value);
    data.append("correo", correo.value);
    data.append("imagen", imagenBase64);

    fetch(URL_WEB_APP, { method: "POST", body: data })
    .then(r => r.text())
    .then(res => mostrarMensaje(res === "OK" ? "Marcación registrada" : res, res === "OK"))
    .catch(() => mostrarMensaje("Error de conexión", false));
}

// ==========================
// 🧾 MENSAJES
// ==========================
function mostrarMensaje(texto, exito) {
    const d = document.getElementById("mensaje");
    d.style.display = "block";
    d.className = exito ? "exito" : "error";
    d.innerHTML = <span>${exito ? "✔" : "✖"}</span>${texto};
}