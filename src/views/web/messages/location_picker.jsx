/*global google*/
import React, { Component } from 'react';
import { withScriptjs, withGoogleMap, GoogleMap, Marker } from "react-google-maps"
import DrawingManager from "react-google-maps/lib/components/drawing/DrawingManager";
import SearchBox from "react-google-maps/lib/components/places/SearchBox";
import style from './style.scss';
import { compose, lifecycle } from "recompose";
import _ from "lodash";
import QuickReplies from './quick_replies'

const MapComponent = compose(
    lifecycle({
        componentWillMount() {
            const refs = {};
            this.setState({
                searchPlaceholder: this.props.searchPlaceholder,
                zoom: 15,
                defaultPos: true,
                bounds: null,
                center: this.props.defPos,
                places: [],
                markers: [],
                searchBoxInput: null,
                onMapMounted: ref => {
                    refs.map = ref;
                    // if this is a first map mounted - add in markers[] new marker with position
                    if(this.state.defaultPos) {
                        let newMarker = {};
                        newMarker.type = "place";
                        newMarker.lat = this.props.defPos.lat;
                        newMarker.lng = this.props.defPos.lng;
                        if(this.state.places && this.state.places.length === 0) newMarker.id = 0;
                        else newMarker.id = this.state.places.length;
                        const inputNode = refs.searchBox.containerElement.children[0];
                        this.setState({searchBoxInput: inputNode});
                        this.state.geolocate(newMarker.lat, newMarker.lng, newMarker, (address) => {
                            inputNode.value = address;
                        });
                        this.state.defaultPos = true;
                    }
                },
                setPlace: (e) => {
                    e.setMap(null);
                    let newMarker = {};
                    newMarker.type = "marker";
                    newMarker.lat = e.position.lat();
                    newMarker.lng = e.position.lng();
                    this.setState({defPos: {lat: e.position.lat(), lng: e.position.lng()}});
                    if(this.state.places && this.state.places.length === 0) newMarker.id = 0;
                    else newMarker.id = this.state.places.length;
                    this.state.geolocate(newMarker.lat, newMarker.lng, newMarker, (address) => {
                        this.state.searchBoxInput.value = address;
                    })
                },
                geolocate: (lat, lng, newMarker, callback) => {
                    this.state.defaultPos = false;
                    new google.maps.Geocoder().geocode({'location': {lat: lat, lng: lng}}, (results, status) => {
                        switch(status) {
                            case('ZERO_RESULTS'):
                                newMarker.info = null;
                                this.state.places.push(newMarker);
                                if(this.props.hasOwnProperty('onMarkerPlaced')) this.props.onMarkerPlaced(newMarker);
                                if(callback) callback("");
                                break;
                            case('OK'):
                                newMarker.info = results;
                                this.state.places.push(newMarker);
                                if(this.props.hasOwnProperty('onMarkerPlaced')) this.props.onMarkerPlaced(newMarker);
                                if(callback) callback(results[0].formatted_address);
                                break;
                            default:
                                if(callback) callback("");
                                break;
                        }
                    });
                },
                onBoundsChanged: () => {
                    this.setState({
                        bounds: refs.map.getBounds(),
                        center: refs.map.getCenter(),
                    })
                },
                onSearchBoxMounted: ref => {
                    refs.searchBox = ref;
                },
                onPlacesChanged: () => {
                    let newMarker = {};
                    const places = refs.searchBox.getPlaces();
                    const bounds = new google.maps.LatLngBounds();
                    newMarker.lat = places[places.length - 1].geometry.location.lat();
                    newMarker.lng = places[places.length - 1].geometry.location.lng();
                    newMarker.type = "place";
                    if(this.state.places && this.state.places.length === 0) newMarker.id = 0;
                    else newMarker.id = this.state.places.length;
                    this.state.geolocate(newMarker.lat, newMarker.lng, newMarker);
                    this.state.places.push(newMarker);
                    if(this.props.hasOwnProperty('onMarkerPlaced')) this.props.onMarkerPlaced(newMarker);
                    places.forEach(place => {
                        if (place.geometry.viewport) {
                            bounds.union(place.geometry.viewport)
                        } else {
                            bounds.extend(place.geometry.location)
                        }
                    });

                    const nextMarkers = places.map(place => ({
                        position: place.geometry.location,
                    }));

                    const nextCenter = _.get(nextMarkers, '0.position', this.state.center);
                    this.setState({
                        center: nextCenter,
                        markers: nextMarkers,
                    });
                    // refs.map.fitBounds(bounds);
                },
            });
        }
    }),
    withScriptjs,
    withGoogleMap
)(props => {
    return (
        <GoogleMap
            ref={props.onMapMounted}
            defaultZoom={props.zoom}
            center={props.center}
            defaultClickableIcons={true}
            onBoundsChanged={props.onBoundsChanged}
        >
        <Marker key={0} position={props.defPos} />
        <SearchBox
            ref={props.onSearchBoxMounted}
            bounds={props.bounds}
            controlPosition={google.maps.ControlPosition.TOP}
            onPlacesChanged={props.onPlacesChanged}
        >
            <input
                type="text"
                placeholder={props.searchPlaceholder}
                className={style.mapSearchBox}
            />
        </SearchBox>
        <DrawingManager
            onMarkerComplete={props.setPlace}
            defaultDrawingMode="marker"
            defaultOptions={{drawingControl: false}}
        />
    </GoogleMap>)
    }
);



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