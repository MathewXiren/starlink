import React, { Component } from 'react';
import axios from 'axios';
import SatSetting from './SatSetting';
import SatelliteList from './SatelliteList';
import WorldMap from './WorldMap';

import {NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY} from "../constants";


 class Main extends Component {

    constructor() {
        super();
        this.state = {
            satInfo: null,
            settings: null,
            satList: null,
            isLoadingList: false
        };
    }
    render() {
        const { satInfo, isLoadingList, satList, settings } = this.state;
        return (
            <div className="main">
                <div className="left-side">
                    <SatSetting onShow={this.showNearbySatellite}/>
                    <SatelliteList isLoad={isLoadingList}
                                   satInfo={satInfo}
                                   onShowMap={this.showMap} />
                </div>
                <div className="right-side">
                    <WorldMap satData={satList} observerData={settings} />
                </div>
            </div>
        );

    }

    showNearbySatellite = (setting) => {
        this.setState({
            isLoadingList: true,
            settings: setting
        })
        this.fetchSatellite(setting);
    }

    showMap = selectedSatList => {
        console.log('satList -> ', selectedSatList);
        this.setState(preState => ({
            ...preState,
            satList: [...selectedSatList]
        }))

    }

    fetchSatellite = setting => {
        // console.log(setting);
        //fetch data from the server
        // step1: get the setting
        const {latitude, longitude, elevation, altitude} = setting;

        // step2: config 
        const url = `/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`;
        
        // step3: send
        //show spin and send request
        this.setState({isLoadingList: true});

        axios.get(url)
            .then(response => {
                console.log(response);
                // when fetching data succeed, hide spin and update data
                this.setState({
                    satInfo: response.data,
                    isLoadingList: false
                });
            }).catch(err => {
                console.log('error in fetching satellite:', err)
                // when catching data field, hide spin
                this.setState({
                    isLoadingList: false
                })
            })

    }

}


export default Main;

// 1. pareent define fn
// 2. pass the fn to child
// 3. in child, use this fn -> pass data to this fn