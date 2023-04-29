export const displayMap = function (locations) {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiaGFzc2FuYXR0YXIiLCJhIjoiY2xncjgycGI0MDF3NzNjcXRmazhhMHdzZSJ9.W_OIeV6hkSVX7Nqt9qySMg';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/hassanattar/clgrg1l99001u01p8hm50d5vv',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();
  const routeCoordinates = [];
  locations.forEach((loc) => {
    const el = document.createElement('div');
    el.classList.add('marker');
    routeCoordinates.push(loc.coordinates);

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .setPopup(
        new mapboxgl.Popup({ offset: 30, focusAfterOpen: false }).setHTML(
          `<p>Day ${loc.day}: ${loc.description}</p>`
        )
      )
      .addTo(map);

    new mapboxgl.Popup({ offset: 30, focusAfterOpen: false })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      left: 100,
      right: 100,
      bottom: 150,
      top: 150,
    },
  });

  map.on('load', () => {
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates,
        },
      },
    });
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#28b487',
        'line-width': 8,
      },
    });
  });
};
