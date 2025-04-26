import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { environment } from '../../../../environments/environment';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-map-view',
  standalone: true,
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements AfterViewInit {
  mapa!: mapboxgl.Map;

  eventos = [
    { nombre: 'Mascota perdida', lat: 4.533, lng: -75.681 },
    { nombre: 'Robo armado', lat: 4.535, lng: -75.683 },
    { nombre: 'Venta empanadas', lat: 4.537, lng: -75.685 },
    { nombre: 'Venta zapatos', lat: 4.539, lng: -75.687 },
    { nombre: 'Comunicado armenia', lat: 4.541, lng: -75.689 }
  ];

  ngAfterViewInit() {
    this.mapa = new mapboxgl.Map({
      accessToken: environment.mapboxToken,
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-75.681, 4.533],
      zoom: 13
    });

    this.eventos.forEach(evento => {
      new mapboxgl.Marker()
        .setLngLat([evento.lng, evento.lat])
        .addTo(this.mapa);
    });
  }

  search(query: string) {
    alert(`Buscando: ${query}`);
    // Aquí puedes agregar lógica de búsqueda en el mapa
  }
}


