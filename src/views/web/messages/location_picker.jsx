import React, { Component } from 'react';
import style from './style.scss';
import MapComponent from "./map_component";
import QuickReplies from './quick_replies';

class LocationPickerForm extends Component {

    componentWillMount() {
        this.setState({
            defaultPosLat: null,
            defaultPosLng: null,
            hide: false,
            places: []
        });
        this.getLocation();
    }

    /**
     * Returns the default location. If not found default param "default_location"
     * we get's the current user position via HTML5 navigator.geolocation
     */
    getLocation() {
        if(this.props.default_location) {
            this.setState({
                defaultPosLat: this.props.default_location[0],
                defaultPosLng: this.props.default_location[1]
            });
        } else {
            if(navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    this.setState({
                        defaultPosLat: position.coords.latitude,
                        defaultPosLng: position.coords.longitude
                    });
                });
            } else {
                alert("Geolocation API is not supported");
            }
        }
    }

    handleSubmit(event) {
        event.preventDefault();
        if (this.props.onLocationSend) {
            this.props.onLocationSend({ places: this.state.places}, this.props.locationId, this.props.shadowMessage)
        }
    }

    handleNewMarker(place) {
        this.state.places.push(place);
    }

    handleClose(event) {
        this.setState({hide:true});
    }

    render() {
        if(this.state.hide) return null;
        return <div className={style.formOverlay}>
            <form className={style.formContainer} onSubmit={this.handleSubmit.bind(this)}>
                <div onClick={this.handleClose.bind(this)} className={style.formClose}>
                    <svg version="1.1" width="15" height="15"
                         xmlns="http://www.w3.org/2000/svg">
                        <line x1="1" y1="15"
                              x2="15" y2="1"
                              stroke="grey"
                              stroke-width="2"/>
                        <line x1="1" y1="1"
                              x2="15" y2="15"
                              stroke="grey"
                              stroke-width="2"/>
                    </svg>
                </div>
                <div className={style.formTitle}>
                    {this.props.title}
                </div>
                {
                    this.state.defaultPosLat ?
                        <MapComponent
                            isMarkerShown={true}
                            googleMapURL="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=AIzaSyBqz07ZjD5nsh6iNtniW07GIts8vYbCXpA"
                            loadingElement={<div style={{ height: `100%` }} />}
                            containerElement={<div style={{ height: `400px`, padding: `15px 0px` }} />}
                            mapElement={<div style={{ height: `100%` }} />}
                            defPos={{lat: this.state.defaultPosLat, lng: this.state.defaultPosLng}}
                            searchPlaceholder={this.props.searchPlaceholder}
                            onMarkerPlaced={this.handleNewMarker.bind(this)}
                        />
                        :
                        <div>Loading...</div>
                }
                <div className={style.buttonLayer}>
                    <input className={style.formSubmit} type="submit" value="Submit"/>
                </div>
            </form>
        </div>
    }
}

export default class LocationPicker extends Component {

    componentWillMount() {
        this.setState({
            isQuickReply: true,
            quick_replies: [{payload: "LOCATION_PICKER_SHOW", title: this.props.options.button_title}]
        });
    }

    onClick(title) {
        this.setState({
            isQuickReply: false
        })
    }

    render() {
        return this.state.isQuickReply ?
            <QuickReplies
                quick_replies={this.state.quick_replies}
                fgColor={this.props.fgColor}
                onQuickReplySend={this.onClick.bind(this)}
            /> :
            <LocationPickerForm
                searchPlaceholder={this.props.options.search_placeholder}
                locationId={this.props.options.id}
                title={this.props.options.title}
                default_location={this.props.options.default_location}
                onLocationSend={this.props.onLocationSend}
                shadowMessage={this.props.options.button_title}
            />
    }
}