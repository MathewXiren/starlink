import React, { Component } from "react";
import axios from "axios";
import { Spin } from "antd";
import { feature } from "topojson-client";
import { geoKavrayskiy7 } from "d3-geo-projection";
import { geoGraticule, geoPath } from "d3-geo";
import { select as d3Select } from "d3-selection";
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";


import { WORLD_MAP_URL, SATELLITE_POSITION_URL, SAT_API_KEY} from "../constants";

const width = 960;
const height = 600;

class WorldMap extends Component {
    constructor(){
        super();
        this.state = {
          isLoading: false,
          isDrawing: false
        };
        this.map = null;
        this.color = d3Scale.scaleOrdinal(schemeCategory10);
        this.refMap = React.createRef();
        this.refTrack = React.createRef();
        
    }

    componentDidMount() {
        axios
        .get(WORLD_MAP_URL) // send the request
        .then(res => {  // get the response
          const { data } = res; // get the topoJson file
          const land = feature(data, data.objects.countries).features; // land is the GeoJson file
          this.generateMap(land); // generate the map
        })
        .catch(e => {
          console.log("err in fetch map data ", e.message);
        });
  
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.satData !== this.props.satData) {
            // step1 : get setting and select satlist
            const {
                latitude,
                longitude,
                elevation,
                altitude,
                duration
              } = this.props.observerData;
            
              const endTime = duration * 60;

            //set the load the satellite path status
            this.setState({
                isLoading: true
            });
        

            // step2: prepare for hte url
            const { satData } = this.props;

            const urls = satData.map(sat => {
                const { satid } = sat;
                const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;
                // console.log("url", url);
                return axios.get(url);
            });

            // step3: parse sat position data
            Promise.all(urls)
            .then(res => {
              const arr = res.map(sat => sat.data);
              this.setState({
                isLoading: false,
                isDrawing: true
              });
              
              // step 4 track
              if (!prevState.isDrawing) {
                this.track(arr);
              } else {
                const oHint = document.getElementsByClassName("hint")[0];
                oHint.innerHTML =
                  "Please wait for these satellite animation to finish before selection new ones!";
              }
            })
            .catch(e => {
              console.log("err in fetch satellite position -> ", e.message);
            });
        }

    }

    track = data => {
      // console.log("data", data)
      if (!data[0].hasOwnProperty('positions')) {
          throw new Error('no position data');
          return;
      }

      // step1: total number of position
      const len = data[0].positions.length;

      // step2: duration
      const { duration } = this.props.observerData;
      
      // step3: where to draw
      const { context2 } = this.map;

      let now = new Date();
      let i = 0;
      let timer = setInterval(() => {
        let ct = new Date();
  
        let timePassed = i === 0 ? 0 : ct - now;
        let time = new Date(now.getTime() + 60 * timePassed);
  
        context2.clearRect(0, 0, width, height);
  
        context2.font = "bold 14px sans-serif";
        context2.fillStyle = "#333";
        context2.textAlign = "center";
        context2.fillText(d3TimeFormat(time), width / 2, 10);
  
        if (i >= len) {
          clearInterval(timer);
          this.setState({ isDrawing: false });
          const oHint = document.getElementsByClassName("hint")[0];
          oHint.innerHTML = "";
          return;
        }
  
        data.forEach(sat => {
          const { info, positions } = sat;
          this.drawSat(info, positions[i]);
        });
  
        i += 60;
      }, 1000);
  
  }

    generateMap = land => {
        const projection = geoKavrayskiy7()
            .scale(170)
            .translate([width / 2, height / 2])
            .precision(.1);

        const graticule = geoGraticule(); //longtitude and langtidude

        const canvas = d3Select(this.refMap.current) // select the location (DOM) to place to draw
        .attr("width", width)
        .attr("height", height);
  
        const canvas2 = d3Select(this.refTrack.current)
        .attr("width", width)
        .attr("height", height);
  
        const context = canvas.node().getContext("2d");
        const context2 = canvas2.node().getContext("2d");
  


        let path = geoPath()
            .projection(projection)
            .context(context);

        land.forEach(ele => {
            context.fillStyle = '#B3DDEF';
            context.strokeStyle = '#000';
            context.globalAlpha = 0.7;
            context.beginPath();
            path(ele); // draw lands
            context.fill();
            context.stroke(); // start draw

            context.strokeStyle = 'rgba(220, 220, 220, 0.1)'; // draw  longtitude and latidude
            context.beginPath();
            path(graticule());
            context.lineWidth = 0.1;
            context.stroke();

            context.beginPath();
            context.lineWidth = 0.5;
            path(graticule.outline()); // draw outline
            context.stroke();
        })

        this.map = {
            projection: projection,
            graticule: graticule,
            context: context,
            context2: context2
          };
      
    }



    drawSat = (sat, pos) => {
      const { satlongitude, satlatitude } = pos;
  
      if (!satlongitude || !satlatitude) return;
  
      const { satname } = sat;
      const nameWithNumber = satname.match(/\d+/g).join("");
  
      const { projection, context2 } = this.map;
      const xy = projection([satlongitude, satlatitude]);
  
      context2.fillStyle = this.color(nameWithNumber);
      context2.beginPath();
      context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);
      context2.fill();
  
      context2.font = "bold 11px sans-serif";
      context2.textAlign = "center";
      context2.fillText(nameWithNumber, xy[0], xy[1] + 14);
    };
  
    
    render() {
      const { isLoading } = this.state;
      return (
        <div className="map-box">
          {isLoading ? (
            <div className="spinner">
              <Spin tip="Loading..." size="large" />
            </div>
          ) : null}
          <canvas className="map" ref={this.refMap} />
          <canvas className="track" ref={this.refTrack} />
          <div className="hint" />
        </div>
      );
    }
  
    
}

export default WorldMap;
