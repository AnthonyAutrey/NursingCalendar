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
	initialized: boolean;
	focusOnResourceCount: boolean;
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
			initialized: false,
			focusOnResourceCount: false
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

		if (this.state.locations.length === 0) {
			return (
				<div>
					<hr />
					<div className="w-100 px-5">
						<div className="card-body">
							<div className="row">
								<h4 className="card-title">Manage Rooms</h4>
							</div>
							<hr />
							There are currently no locations. Please add a location in order to manage rooms.
						</div>
					</div>
					<div className="form-group d-flex">
						<div className="ml-auto" style={{ width: '120px !important' }} />
					</div>
					<hr />
				</div>
			);
		}
		if (this.state.rooms.length === 0)
			return (
				<div>
					<hr />
					<div className="w-100 px-5">
						<div className="card-body">
							<div className="row">
								<h4 className="card-title">Manage Rooms</h4>
								<button className="btn btn-primary col-form-label text-mid ml-auto" onClick={this.handleAddRoom}>
									Add Room &nbsp;&nbsp;
									<span className="plusIcon oi oi-size-sm oi-plus" />
								</button>
							</div>
							<hr />
						</div>
					</div>
					<hr />
					<div className="row">
						<button tabIndex={3} className="btn btn-primary btn-block mx-2 mt-2" onClick={() => this.handlePersistChanges()}>
							Submit Changes
							</button>
					</div>
					<div className="form-group d-flex">
						<div className="ml-auto" style={{ width: '120px !important' }} />
					</div>
					<hr />
				</div>
			);

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
				handleCountFocusIn={this.handleResourceCountFocusIn}
				handleCountFocusOut={this.handleResourceCountFocusOut}
				focusOnResourceCount={this.state.focusOnResourceCount}
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
								<button type="button" className="btn btn-danger" onClick={() => this.handleDeleteRoom(this.state.selectedRoomIndex)}>
									<span className=" oi oi-trash" />
									<span>&nbsp;&nbsp;</span>
									Delete Room
						</button>
							</div>
						</div>
						<hr />
						<div className="row">
							<button tabIndex={3} className="btn btn-primary btn-block mx-2 mt-2" onClick={this.handlePersistChanges}>
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
					resources: parsedResources
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

		if (this.state.locations.length === 0) {
			alert('There are currently no locations to choose from! Please add a location before adding rooms!');
			return;
		}

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

	handleDeleteRoom = (index: number) => {
		if (!confirm('Are you sure you want to delete this room? Doing so will delete the room and all associated events! ' +
			'This action cannot be reverted after clicking \'Submit Changes\'!'))
			return;

		let rooms = this.state.rooms.slice(0);
		rooms.splice(index, 1);

		this.setState({ rooms: rooms, selectedRoomIndex: 0 });
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
		let resourceCount = Number(event.target.value);

		let room: Room = this.state.rooms[this.state.selectedRoomIndex];
		let selectedResource = room.resources[index];
		let rooms = this.state.rooms;

		if (room && selectedResource && resourceCount && Number.isInteger(resourceCount)) {

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
			let roomNamesToDelete = this.getRoomsNotInState(dbRooms);
			let roomsToCreateInDB = this.getRoomsNotInDB(dbRooms);
			let roomsNotCreatedInDB = this.filterIdenticalRooms(this.state.rooms, roomsToCreateInDB);
			let roomsToUpdateInDB = this.filterIdenticalRooms(roomsNotCreatedInDB, dbRooms);

			console.log('To Delete: ');
			console.log(roomNamesToDelete);
			console.log('To Create: ');
			console.log(roomsToCreateInDB);
			console.log('To Update: ');
			console.log(roomsToUpdateInDB);

			let persistToDBPromises = [
				this.deleteRoomsFromDB(roomNamesToDelete),
				// this.createRoomsInDB(roomsToCreateInDB),
				// this.updateRoomsInDB(roomsToUpdateInDB)
			];

			Promise.all(persistToDBPromises).then(() => {
				this.props.handleShowAlert('success', 'Successfully submitted data!');
				this.resetDBNames();
			}).catch(() => {
				this.props.handleShowAlert('error', 'Error submitting data.');
			});
		}).catch(() => {
			this.props.handleShowAlert('error', 'Error submitting data.');
		});
	}

	getRoomsNotInState = (rooms: Room[]): Room[] => {
		let roomsNotInState = rooms.filter(room => {
			return !this.state.rooms.map(stateRoom => {
				return stateRoom.dbLocationName + stateRoom.dbRoomName;
			}).includes(room.dbLocationName + room.dbRoomName);
		});

		return roomsNotInState;
	}

	getRoomsNotInDB = (dbRooms: Room[]): Room[] => {
		let roomsNotInDB = this.state.rooms.filter(stateRoom => {
			return !dbRooms.map(dbRoom => {
				return dbRoom.dbLocationName + dbRoom.dbRoomName;
			}).includes(stateRoom.dbLocationName + stateRoom.dbRoomName);
		});
		return roomsNotInDB;
	}

	filterIdenticalRooms = (rooms: Room[], filterRooms: Room[]): Room[] => {
		return rooms.filter(stateRoom => {
			let isIdentical = false;
			filterRooms.forEach(dbRoom => {
				if (dbRoom.dbLocationName === stateRoom.dbLocationName &&
					dbRoom.dbRoomName === stateRoom.dbRoomName &&
					dbRoom.locationName === stateRoom.locationName &&
					dbRoom.roomName === stateRoom.roomName &&
					dbRoom.capacity === stateRoom.capacity &&
					dbRoom.dbCapacity === stateRoom.dbCapacity)
					if (this.compareResources(dbRoom.dbResources, stateRoom.dbResources) && this.compareResources(dbRoom.resources, stateRoom.resources))
						isIdentical = true;
			});

			return !isIdentical;
		});
	}

	compareResources = (dbRoomResources: Resource[], stateRoomResources: Resource[]): boolean => {
		let resourcesAreTheSame = true;
		let testSet = new Set();
		dbRoomResources.forEach(dbRoomResource => {
			testSet.add(dbRoomResource.name + dbRoomResource.count);
		});
		stateRoomResources.forEach(stateRoomResource => {
			if (!testSet.has(stateRoomResource.name + stateRoomResource.count))
				resourcesAreTheSame = false;
		});
		return resourcesAreTheSame;
	}

	deleteRoomsFromDB = (rooms: Room[]) => {
		console.log(rooms);
		return new Promise((resolve, reject) => {
			if (rooms.length <= 0) {
				resolve();
				return;
			}
			let queryData: {}[] = [];
			for (let i = 0; i < rooms.length; i++)
				queryData.push({
					where: {
						LocationName: rooms[i].dbLocationName,
						RoomName: rooms[i].dbRoomName
					}
				});

			let queryDataString = JSON.stringify(queryData);
			console.log(queryDataString);
			request.delete('/api/rooms').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	createRoomsInDB = (rooms: Room[]) => {
		return true;
	}

	resetDBNames = () => {
		let resetRooms: Room[] = this.state.rooms.map(room => {
			return {
				dbLocationName: room.locationName,
				locationName: room.locationName,
				dbRoomName: room.roomName,
				roomName: room.roomName,
				selectedLocationIndex: room.selectedLocationIndex,
				dbCapacity: room.capacity,
				capacity: room.capacity,
				dbResources: room.resources,
				resources: room.resources
			};
		});

		this.setState({ rooms: resetRooms });
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

	// Resource Count Focus ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	handleResourceCountFocusIn = () => {
		if (!this.state.focusOnResourceCount)
			this.setState({ focusOnResourceCount: true });
	}
	handleResourceCountFocusOut = () => {
		if (this.state.focusOnResourceCount)
			this.setState({ focusOnResourceCount: false });
	}
}

export default ManageRooms;