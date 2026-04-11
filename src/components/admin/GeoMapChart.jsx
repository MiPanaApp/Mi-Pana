import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/main/world-countries.json";

const colorScale = scaleLinear()
  .domain([0, 100]) // Esto se actualizará dinámicamente
  .range(["#FFFBEB", "#FFB400"]);

const GeoMapChart = ({ data }) => {
  // data format: [{ id: 'ES', value: 50 }, { id: 'CO', value: 100 }]
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const dynamicScale = colorScale.domain([0, maxValue]);

  return (
    <div className="w-full h-full relative" style={{ minHeight: '300px' }}>
      <ComposableMap
        projectionConfig={{
          rotate: [-10, 0, 0],
          scale: 147
        }}
        width={800}
        height={400}
        style={{ width: "100%", height: "100%" }}
      >
        <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
        <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              // Buscar si el pais actual está en la data de usuarios
              // geo.id usualmente es el ISO Alpha-3 ("ESP", "COL")
              // Convertiremos ISO2 a ISO3 o buscaremos coincidencia.
              const iso2 = geo.properties["Alpha-2"] || geo.id; // Puede variar dependiendo del topojson
              
              const d = data.find((s) => s.id === geo.id.slice(0,2) || s.id === geo.id || (geo.properties.name && s.countryName === geo.properties.name));
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={d ? dynamicScale(d.value) : "#F3F4F6"}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  style={{
                    default: {
                      outline: "none",
                    },
                    hover: {
                      fill: "#FFD700",
                      outline: "none",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    },
                    pressed: {
                      outline: "none",
                    }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Leyenda minimalista */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm text-[10px] font-black uppercase text-gray-500 border border-white/50 flex flex-col gap-2">
        <span className="mb-1 text-center w-full block">Nivel de Presencia</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#F3F4F6] border border-gray-200"></div> Poca/Nula
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FFD700]"></div> Media
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#D97706]"></div> Alta
        </div>
      </div>
    </div>
  );
};

export default GeoMapChart;
