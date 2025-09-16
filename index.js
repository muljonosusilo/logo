document.addEventListener('DOMContentLoaded', function() {
  // Data lokasi
  alert('ok');
  const locations = [
    //{"item":"3275","latitude":-7.755300,"longitude":112.751773,"timestamp":1757747769012},
    {"item":"3275","latitude":-7.754707,"longitude":112.751103,"timestamp":1757747769012},
    //{"item":"3240","latitude":-7.7551242,"longitude":112.7518157,"timestamp":1757747826012},
    //{"item":"3120","latitude":-7.7551035,"longitude":112.7518185,"timestamp":1757903007028},
  ];

  // Variabel global
  let userLocation = null;
  const scene = document.querySelector('a-scene');
  const statusElement = document.getElementById('status');
  const locationsElement = document.getElementById('locations');
  const loadingProgress = document.getElementById('loadingProgress');

  // Fungsi untuk menghitung jarak antara dua koordinat GPS (dalam meter)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius bumi dalam km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000; // Jarak dalam meter
    return distance;
  }

  // Fungsi untuk memperbarui UI dengan status lokasi
  function updateLocationStatus() {
    if (!userLocation) return;
   
    locationsElement.innerHTML = '';
   
    locations.forEach(loc => {
      const distance = calculateDistance(
        userLocation.latitude, 
        userLocation.longitude,
        loc.latitude,
        loc.longitude
      );
    
      const locElement = document.createElement('div');
      locElement.innerHTML = `
        <span class="location-marker"></span>
        Lokasi ${loc.item}: ${distance.toFixed(1)} meter
        ${distance <= 10 ? '<strong>(Dalam jangkauan)</strong>' : ''}
      `;
    
      locationsElement.appendChild(locElement);
    });
   
    statusElement.textContent = `Posisi Anda: ${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`;
  }

  // Fungsi untuk membuat entity AR
  function createLocationEntity(loc) {
    const entity = document.createElement('a-entity');
    entity.setAttribute('gps-entity-place', {
      latitude: loc.latitude,
      longitude: loc.longitude
    });
    
    const plane = document.createElement('a-plane');
    plane.setAttribute('src', './logo.png');
    plane.setAttribute('width', 1);
    plane.setAttribute('height', 1);
    plane.setAttribute('position', '0 1.6 0');
    plane.setAttribute('rotation', '0 0 0');
    plane.setAttribute('scale', '1 1 1');
    plane.setAttribute('material', {
      side: 'double',
      transparent: true,
      alphaTest: 0.5
    });
    plane.setAttribute('animation', {
      property: 'rotation',
      to: '0 360 0',
      loop: true,
      dur: 3000,
      easing: 'linear'
    });
    plane.setAttribute('visible', 'false');
   
    entity.appendChild(plane);
    entity.setAttribute('data-item', loc.item);
   
    return entity;
  }

  // Fungsi untuk memperbarui visibilitas entity berdasarkan jarak
  function updateEntityVisibility() {
    if (!userLocation) return;
   
    const entities = scene.querySelectorAll('[gps-entity-place]');
   
    entities.forEach(entity => {
      const lat = parseFloat(entity.getAttribute('gps-entity-place').latitude);
      const lon = parseFloat(entity.getAttribute('gps-entity-place').longitude);
    
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lon
      );
    
      const plane = entity.querySelector('a-plane');
      if (plane) {
        if (distance <= 5) {
          plane.setAttribute('visible', 'true');
        } else {
          plane.setAttribute('visible', 'false');
        }
      }
    });
   
    updateLocationStatus();
  }

  // Event listener saat kamera siap
  scene.addEventListener('loaded', function() {
    // Sembunyikan loader
    document.querySelector('.arjs-loader').style.display = 'none';
   
    // Tambahkan entity untuk setiap lokasi
    locations.forEach(loc => {
      const entity = createLocationEntity(loc);
      scene.appendChild(entity);
    });
   
    // Simulasi kemajuan loading
    let progress = 0;
    const loadingInterval = setInterval(() => {
      progress += 5;
      loadingProgress.style.width = `${progress}%`;
    
      if (progress >= 100) {
       clearInterval(loadingInterval);
      }
    }, 100);
  });

  // Dapatkan posisi pengguna
  if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(
      position => {
        userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        console.log(userLocation);
        updateEntityVisibility();
      },
      error => {
        console.error('Error getting location:', error);
        statusElement.textContent = 'Error mendapatkan lokasi: ' + error.message;
     
        // Fallback untuk development (gunakan lokasi pertama sebagai simulasi)
        userLocation = {
          latitude: locations[0].latitude,
          longitude: locations[0].longitude
        };
        updateEntityVisibility();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 5000
      }
    );
  } else {
    statusElement.textContent = 'Geolocation tidak didukung oleh browser Anda';
  }

  // Perbarui visibilitas secara berkala
  setInterval(updateEntityVisibility, 3000);
}, false);
