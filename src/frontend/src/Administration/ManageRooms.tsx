import * as React from 'react';
import { RoomResourceSelector } from './RoomResourceSelector';
const uuid = require('uuid/v4');
const request = require('superagent');

export interface Room {
	locationName: string;
	dbLocationName: string;
	selectedLocationIndex: number;
	roomName: string;
	dbRoomName: string;
	capacity: number;
	dbCapacity: number;
	resources: Resource[];
	dbResources: Resource[];
}

export interface Resource {
	name: string;
	isEnumerable: boolean;
	count?: number;
}

interface Props {
	handleShowAlert: Function;
}

interface State {
	rooms: Room[];
	selectedRoomIndex: number;
	locations: string[];
	resources: Resource[];
	selectedResources: Resource[];
	initialized: boolean;
}
// TODO: Finish adding functionality to this class
export class ManageRooms extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			rooms: [],
			selectedRoomIndex: 0,
			locations: [],
			resources: [],
			selectedResources: [],
			initialized: false
		};
	}

	componentWillMount() {
		let getLocationsFromDB: Promise<string[]> = new Promise((resolve, reject) => {
			request.get('/api/locations').end((error: {}, res: any) => {
				if (res && res.body) {
					resolve(this.parseLocations(res.body));
				} else {
					reject();
				}
			});
		});
		let getResourcesFromDB: Promise<Resource[]> = new Promise((resolve, reject) => {
			request.get('/api/resources').end((error: {}, res: any) => {
				if (res && res.body) {
					resolve(this.parseResources(res.body));
				} else {
					reject();
				}
			});
		});
		let getRoomsFromDB: Promise<Room[]> = new Promise((resolve, reject) => {
			request.get('/api/rooms').end((error: {}, res: any) => {
				if (res && res.body)
					resolve(this.parseRooms(res.body));
				else
					reject();
			});
		});

		getLocationsFromDB.then((parsedDBLocations) => {
			this.setState({ locations: parsedDBLocations });
			getResourcesFromDB.then((parsedDBResources) => {
				this.setState({ resources: parsedDBResources });
				getRoomsFromDB.then((parsedDBRooms) => {
					this.setState({ rooms: parsedDBRooms });
					this.mapRoomLocationRelations();
				});
			});
		});
	}

	render() {
		if (!this.state.initialized)
			return null;

		let roomOptions = this.state.rooms.map((room, index) => {
			return (<option key={uuid()} value={index}>{room.locationName + ' - ' + room.roomName}</option>);
		});

		let locationOptions = this.state.locations.map((location, index) => {
			return (<option key={uuid()} value={index}>{location}</option>);
		});

		let selectedLocation = this.state.rooms[this.state.selectedRoomIndex].selectedLocationIndex;

		let roomResourceSelector = (
			<RoomResourceSelector
				room={this.state.rooms[this.state.selectedRoomIndex]}
				allPossibleResources={this.state.resources}
				handleChangeResource={this.handleChangeResource}
				handleChangeResourceCount={this.handleChangeResourceCount}
				handleAddResource={this.handleAddResource}
				handleDeleteResource={this.handleDeleteResource}
			/>);

		return (
			<div>
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<span className="card-title" style={{ fontSize: '1.5em' }}>Manage Rooms</span>
						<button className="btn btn-primary float-right" onClick={this.handleAddRoom}>
							Add Room &nbsp;&nbsp;
							<span className="plusIcon oi oi-size-sm oi-plus" style={{ top: '-1px' }} />
						</button>
						<hr />
						<div className="form-group row">
							<label className="col-lg-4 col-form-label text-left">Room:</label>
							<div className="col-lg-8">
								<select
									className="form-control"
									value={this.state.selectedRoomIndex}
									onChange={(e) => this.handleSelectedRoomChange(e)}
								>
									{roomOptions}
								</select>
							</div>
						</div>
						<hr />
						<div className="form-group row">
							<label className="col-lg-4 col-form-label text-left">Location:</label>
							<div className="col-lg-8">
								<select
									className="form-control"
									value={selectedLocation}
									onChange={(e) => this.handleChangeLocation(e, this.state.selectedRoomIndex)}
								>
									{locationOptions}
								</select>
							</div>
						</div>
						<div className="form-group row">
							<label className="col-lg-4 col-form-label text-left">Room Name:</label>
							<div className="col-lg-8">
								<input
									className="form-control form-control"
									type="text"
									value={this.state.rooms[this.state.selectedRoomIndex].roomName}
									onChange={(e) => this.handleChangeRoomName(e, this.state.selectedRoomIndex)}
								/>
							</div>
						</div>
						<div className="form-group row">
							<label className="col-lg-4 col-form-label text-left">Capacity:</label>
							<div className="col-lg-8">
								<input
									className="form-control form-control"
									type="number"
									value={this.state.rooms[this.state.selectedRoomIndex].capacity}
									onChange={(e) => this.handleChangeCapacity(e, this.state.selectedRoomIndex)}
								/>
							</div>
						</div>
						{roomResourceSelector}
						<div className="form-group row">
							<div className="col-lg-12">
								<button type="button" className="btn btn-danger" onClick={this.needsWork}>
									<span className=" oi oi-trash" />
									<span>&nbsp;&nbsp;</span>
									Delete Room
						</button>
							</div>
						</div>
						<hr />
						<div className="row">
							<button tabIndex={3} className="btn btn-primary btn-block mx-2 mt-2" onClick={this.needsWork}>
								Submit Changes
							</button>
						</div>
						<div className="form-group d-flex">
							<div className="ml-auto" style={{ width: '120px !important' }} />
						</div>
					</div>
				</div>
				<hr />
			</div>
		);
	}

	needsWork = () => { return true; };

	getRoomsFromDB = () => {
		request.get('/api/rooms').end((error: {}, res: any) => {
			if (res && res.body) {
				let parsedRooms = this.parseRooms(res.body);
				if (parsedRooms.length === 0)
					return;
				this.setState({ rooms: parsedRooms, selectedRoomIndex: 0, initialized: true });
			} else {
				alert('Error getting room data! Handle this properly!');
				this.props.handleShowAlert('error', 'Error getting class data.');
			}
		});
	}

	parseRooms = (dbRooms: any[]): Room[] => {
		let parsedRooms: Room[] = [];
		let roomlocationSet = new Set();
		let parsedRoomIndex = -1;
		dbRooms.forEach((dbRoom) => {
			let dbLocationName: string = dbRoom.LocationName;
			let dbRoomName: string = dbRoom.RoomName;

			if (!roomlocationSet.has(dbRoomName + dbLocationName)) {
				let resources: Resource[] = [];
				if (dbRoom.ResourceName)
					if (dbRoom.Count)
						resources.push({ name: dbRoom.ResourceName, isEnumerable: true, count: dbRoom.Count });
					else
						resources.push({ name: dbRoom.ResourceName, isEnumerable: false });

				let room: Room = {
					locationName: dbRoom.LocationName,
					dbLocationName: dbRoom.LocationName,
					selectedLocationIndex: -1,
					roomName: dbRoom.RoomName,
					dbRoomName: dbRoom.RoomName,
					capacity: dbRoom.Capacity,
					dbCapacity: dbRoom.Capacity,
					resources: resources,
					dbResources: resources
				};
				parsedRooms.push(room);
				parsedRoomIndex++;
			} else
				parsedRooms[parsedRoomIndex].resources.push({ name: dbRoom.ResourceName, isEnumerable: dbRoom.IsEnumerable });

			roomlocationSet.add(dbRoomName + dbLocationName);
		});
		return parsedRooms;
	}

	getLocationsFromDB = () => {

		request.get('/api/locations').end((error: {}, res: any) => {
			if (res && res.body) {
				let parsedLocations = this.parseLocations(res.body);
				if (parsedLocations.length === 0)
					return;
				this.setState({ locations: parsedLocations });
			} else {
				alert('Error getting location data! Handle this properly!');
				this.props.handleShowAlert('error', 'Error getting class data.');
			}
		});
	}

	parseLocations = (dbLocations: any[]): string[] => {
		let locations: string[] = [];

		dbLocations.forEach(dbLocation => {
			let location = dbLocation.LocationName;
			locations.push(location);
		});

		return locations;
	}

	getResourcesFromDB = () => {
		request.get('/api/resources').end((error: {}, res: any) => {
			if (res && res.body) {
				let parsedResources = this.parseResources(res.body);
				if (parsedResources.length === 0)
					return;
				let initialResourceIsEnumerableCheckValue = parsedResources[0].isEnumerable;

				this.setState({
					resources: parsedResources,
					selectedResources: []
				});
			} else {
				alert('Error getting resource data! Handle this properly!');
				this.props.handleShowAlert('error', 'Error getting class data.');
			}
		});
	}

	parseResources = (dbResources: any[]): Resource[] => {
		let resources: Resource[] = [];
		dbResources.forEach(dbResource => {
			let resource: Resource = {
				name: dbResource.ResourceName,
				isEnumerable: (dbResource.IsEnumerable > 0)
			};
			resources.push(resource);
		});

		return resources;
	}

	handleAddRoom = () => {
		if (!this.doValidityChecks())
			return;

		let newRoomCount = 0;

		if (this.state.rooms.length !== 0)
			this.state.rooms.forEach(room => {
				if (room.roomName.substr(0, 8) === 'New Room')
					newRoomCount++;
			});

		this.state.rooms.forEach(room => {
			if (room.roomName.trim() === ('New Room ' + ((newRoomCount <= 0) ? '' : newRoomCount)).trim())
				newRoomCount++;
		});

		// TODO: Handle the location selection on this new room effectively.
		let newRoom: Room = {
			locationName: this.state.locations[0],
			dbLocationName: this.state.locations[0],
			selectedLocationIndex: 0,
			roomName: ('New Room ' + ((newRoomCount === 0) ? '' : newRoomCount)).trim(),
			dbRoomName: ('New Room ' + ((newRoomCount === 0) ? '' : newRoomCount)).trim(),
			capacity: 0,
			dbCapacity: 0,
			resources: [],
			dbResources: []
		};

		let rooms = this.state.rooms.slice(0);
		rooms.push(newRoom);

		this.setState({ rooms: rooms, selectedRoomIndex: rooms.length - 1 });
	}

	handleSelectedRoomChange = (event: any) => {

		event.preventDefault();
		if (!this.doValidityChecks())
			return;

		let newRoomIndex = event.target.value;

		this.setState({ selectedRoomIndex: newRoomIndex });
	}
	handleSelectedLocationChange = (event: any, roomIndex: number) => {
		event.preventDefault();

		if (!this.doValidityChecks())
			return;

		let location = event.target.value;
		let locationIndex = this.getSelectedLocationIndex(location);

		let rooms = this.state.rooms.slice(0);
		rooms[roomIndex].selectedLocationIndex = location;
		rooms[roomIndex].locationName = this.state.locations[rooms[roomIndex].selectedLocationIndex];

		this.setState({ rooms: rooms });
	}

	handleChangeRoomName = (event: any, index: number) => {
		if (event.target.value.length <= 60) {
			let rooms = this.state.rooms.slice(0);
			rooms[index].roomName = event.target.value;
			this.setState({ rooms: rooms, selectedRoomIndex: index });
		}
	}

	handleChangeLocation = (event: any, index: number) => {
		let rooms = this.state.rooms.slice(0);
		rooms[index].selectedLocationIndex = event.target.value;
		rooms[index].locationName = this.state.locations[event.target.value];
		this.setState({ rooms: rooms });
	}

	handleChangeCapacity = (event: any, index: number) => {
		let rooms = this.state.rooms.slice(0);
		rooms[index].capacity = event.target.value;
		this.setState({ rooms: rooms });
	}

	handleChangeResource = (event: any, index: number) => {
		let resourceName = event.target.value;
		let resourceIsEnumerable = false;
		let count = -1;
		let selectedResource = this.state.resources.find(resource => {
			return resourceName === resource.name;
		});

		let room = this.state.rooms[this.state.selectedRoomIndex];
		let rooms = this.state.rooms;
		if (room && selectedResource) {
			room.resources[index] = selectedResource;
			if (selectedResource && selectedResource.isEnumerable) {
				room.resources[index].count = 0;
				room.resources[index].isEnumerable = true;
			}
			rooms[this.state.selectedRoomIndex] = room;
			this.setState({ rooms: rooms });
		}
	}

	handleChangeResourceCount = (event: any, index: number) => {
		let resourceCount = event.target.value;
		let room = this.state.rooms[this.state.selectedRoomIndex];
		let selectedResource = room.resources[index];
		let rooms = this.state.rooms;
		if (room && selectedResource && resourceCount) {
			room.resources[index].count = resourceCount;
			rooms[this.state.selectedRoomIndex] = room;
			this.setState({ rooms: rooms });
		}
	}

	handleAddResource = () => {
		let room = this.state.rooms[this.state.selectedRoomIndex];
		let rooms = this.state.rooms;
		let unselectedResources = this.state.resources.filter(resource => {
			let selected = true;
			if (room)
				room.resources.forEach(selectedResource => {
					if (selectedResource.name === resource.name)
						selected = false;
				});

			return selected;
		});
		console.log(unselectedResources);

		if (room && unselectedResources.length > 0) {
			let resource = unselectedResources[0];
			if (resource.isEnumerable)
				resource.count = 0;
			room.resources.push(resource);
			rooms[this.state.selectedRoomIndex] = room;
			this.setState({ rooms: rooms });
		}
	}

	handleDeleteResource = (index: number) => {
		let room = this.state.rooms[this.state.selectedRoomIndex];
		let rooms = this.state.rooms;
		if (room) {
			room.resources.splice(index, 1);
			rooms[this.state.selectedRoomIndex] = room;
			this.setState({ rooms: rooms });
		}
	}

	getSelectedRoomIndex = (locationName: String, roomName: String): number => {
		let index = -1;
		this.state.rooms.forEach((room, roomIndex) => {
			if (roomName === room.roomName && locationName === room.locationName)
				index = roomIndex;
		});

		return index;
	}

	getSelectedLocationIndex = (locationName: String): number => {
		let index = -1;
		this.state.locations.forEach((location, locationIndex) => {
			if (locationName === location)
				index = locationIndex;
		});
		return index;
	}

	mapRoomLocationRelations = () => {
		let rooms = this.state.rooms.slice(0);
		rooms.forEach((room, index) => {
			room.selectedLocationIndex = this.getSelectedLocationIndex(room.locationName);
		});
		this.setState({ rooms: rooms, initialized: true });
	}

	handlePersistChanges = () => {
		if (!this.doValidityChecks())
			return;

		let getRoomsFromDB: Promise<Room[]> = new Promise((resolve, reject) => {
			request.get('/api/rooms').end((error: {}, res: any) => {
				if (res && res.body)
					resolve(this.parseRooms(res.body));
				else
					reject();
			});
		});

		getRoomsFromDB.then((dbRooms) => {
			console.log(dbRooms);
			// let locationNamesToDelete = this.getLocationNamesNotInState(dbLocations);
			// let locationsToCreateInDB = this.getLocationsNotInDB(dbLocations);
			// let locationsNotCreatedInDB = this.filterIdenticalLocations(this.state.locations, locationsToCreateInDB);
			// let locationsToUpdateInDB = this.filterIdenticalLocations(locationsNotCreatedInDB, dbLocations);

			// console.log('To Delete: ');
			// console.log(locationNamesToDelete);
			// console.log('To Create: ');
			// console.log(locationsToCreateInDB);
			// console.log('To Update: ');
			// console.log(locationsToUpdateInDB);

			// let persistToDBPromises = [
			// 	this.deleteLocationsFromDB(locationNamesToDelete),
			// 	this.createLocationsInDB(locationsToCreateInDB),
			// 	this.updateLocationsInDB(locationsToUpdateInDB)
			// ];

			// Promise.all(persistToDBPromises).then(() => {
			// 	this.props.handleShowAlert('success', 'Successfully submitted data!');
			// 	this.resetDBNames();
			// }).catch(() => {
			// 	this.props.handleShowAlert('error', 'Error submitting data.');
			// });
		}).catch(() => {
			this.props.handleShowAlert('error', 'Error submitting data.');
		});
	}

	// TODO: Finish adding necessary checks
	doValidityChecks(): boolean {
		if (this.state.rooms.length === 0)
			return true;

		if (this.roomNameIsTaken()) {
			alert('The room name you\'ve chosen is already being used. Please enter a valid room name before continuing.');
			return false;
		}
		if (this.roomNameIsEmpty()) {
			alert('The current room name is empty. Please enter a valid room name before continuing.');
			return false;
		}

		return true;
	}

	roomNameIsTaken = (): boolean => {
		let selectedRoom: Room = this.getSelectedRoom();
		let roomNameIsTaken: boolean = false;
		this.state.rooms.forEach((room, index) => {
			if (room.locationName === selectedRoom.locationName &&
				room.roomName === selectedRoom.roomName && Number(index) !== Number(this.state.selectedRoomIndex))
				roomNameIsTaken = true;
		});

		return roomNameIsTaken;
	}

	roomNameIsEmpty = (): boolean => {
		let selectedRoom: Room = this.getSelectedRoom();
		return selectedRoom.roomName === '';
	}

	getSelectedRoom = () => {
		return this.state.rooms.slice(0)[this.state.selectedRoomIndex];
	}
}

export default ManageRooms;