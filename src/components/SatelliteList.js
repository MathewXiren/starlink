import React, { Component } from "react";
import { List, Avatar, Button, Checkbox, Spin } from "antd";
import satellite from "../assets/images/satellite.svg";


class SatelliteList extends Component {
    constructor() {
        super();
        this.state = {
            selected: [],
            isLoad: false
        }
    }
    render() {
        const { isLoad } = this.props;
        const satList = this.props.satInfo ? this.props.satInfo.above : [];
        const { selected } = this.state;
        return (
            <div className="sat-list-box">
                <Button className="sat-list-btn"
                        size="large"
                        disabled={selected.length === 0}
                        onClick={this.onShowSatMap}
                >Track on the map
                </Button>
                <hr/>
                {
                    isLoad
                        ?
                        <div className="spin-box">
                            <Spin size="large" tip="Loading..."/>
                        </div>
                        :
                        <div>
                            <List
                                className="sat-list"
                                itemLayout="horizontal"
                                size="small"
                                dataSource={satList}
                                renderItem={item => (
                                <List.Item
                                    actions={[
                                    <Checkbox dataInfo={item} onChange={this.onChange} />
                                    ]}
                                >
                                    <List.Item.Meta
                                    avatar={<Avatar size={50} src={satellite} />}
                                    title={<p>{item.satname}</p>}
                                    description={`Launch Date: ${item.launchDate}`}
                                    />
                                </List.Item>
                                )}
                            />
                        </div>
                }
            </div>
        );
    }

    onShowSatMap = () => {
        // pass selected sat list to the main
        this.props.onShowMap(this.state.selected)
    }

    onChange = e => {
        // console.log("clicked", e.target);
        const { checked, dataInfo } = e.target;
        // processing the satllite data
        const { selected } = this.state;

        // add or remove selected satellite to/from the satList
        const list = this.addOrRemove(dataInfo, checked, selected);
        this.setState({selected: list});
    }

    addOrRemove = (sat, status, list) => {
        // check whether current satellite is in the satellite list
        const found = list.some(item => item.satid === sat.satid);
        // case1: check is true
        // -> sat not in the list, add to list
        // -> sat is in list -> do nothing
        if (status && !found) {
            list = [...list, sat];
        }
        // case2: check is false
        // -> sat in the list, remove from the list
        // -> sat not in the list, do nothing
        if (!status && found) {
            list = list.filter(item => item.satid !== sat.satid);
        }
        // console.log(list);
        return list;
        // 删filter, 访map, 加...
    }
}

export default SatelliteList;

