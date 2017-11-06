import React from 'react';
import style from './style.scss';
import { compose, lifecycle } from "recompose";
import { withScriptjs, withGoogleMap, GoogleMap, Marker } from "react-google-maps"
import DrawingManager from "react-google-maps/lib/components/drawing/DrawingManager";
import SearchBox from "react-google-maps/lib/components/places/SearchBox";
import _ from "lodash";

const MapComponent = props => {
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
};

const lifeCycleMethods = {
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
            },
        });
    }
};

const enhance = compose(
    lifecycle(lifeCycleMethods),
    withScriptjs,
    withGoogleMap
);

export default enhance(MapComponent);
