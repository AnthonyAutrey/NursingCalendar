import * as React from 'react';
// import { Room } from '../Scheduler/Scheduler';
const uuid = require('uuid/v4');
const request = require('superagent');

// TODO: Discuss the implementation of this interface with Tony.
// Do we want to add extra fields to the Room interface from Scheduler or keep this new one?
interface Room {
	locationName: string;
	dbLocationName: string;
	selectedLocationIndex: number;
	roomName: string;
	dbRoomName: string;
	capacity: number;
	dbCapacity: number;
	resources: { name: string, count: number }[];
	dbResources: { name: string, count: number }[];
}

interface Resource {
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
		this.getRoomsFromDB();
		this.getLocationsFromDB();
		this.getResourcesFromDB();
	}

	render() {
		if (!this.state.initialized)
			return null;

		console.log(this.state);
		let roomOptions = this.state.rooms.map((room, index) => {
			return (<option key={uuid()} value={index}>{room.locationName + ' - ' + room.roomName}</option>);
		});
		let locationOptions = this.state.locations.map((location, index) => {
			return (<option key={uuid()} value={index}>{location}</option>);
		});

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
							<label className="col-lg-4 col-form-label text-left">Location:</label>
							<div className="col-lg-8">
								<select
									className="form-control"
									value={this.state.locations[this.state.rooms[this.state.selectedRoomIndex].selectedLocationIndex]}
									onChange={(e) => this.handleChangeLocation(e, this.state.selectedRoomIndex)}
								>
									{locationOptions}
								</select>
							</div>
						</div>
						<div className="form-group row">
							<label className="col-lg-4 col-form-label text-left">Capacity:</label>
							<div className="col-lg-8">
								<input
									className="form-control form-control"
									type="text"
									value={this.state.rooms[this.state.selectedRoomIndex].capacity}
									onChange={this.needsWork}
								/>
							</div>
						</div>
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
				let resources: { name: string, count: number }[] = [];
				resources.push({ name: dbRoom.ResourceName, count: dbRoom.Count });
				let locationIndex = this.getSelectedLocationIndex(dbRoom.LocationName);
				let room: Room = {
					locationName: dbRoom.LocationName,
					dbLocationName: dbRoom.LocationName,
					selectedLocationIndex: locationIndex,
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
				parsedRooms[parsedRoomIndex].resources.push({ name: dbRoom.ResourceName, count: dbRoom.Count });

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
				this.setState({ locations: parsedLocations});
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
				isEnumerable: (dbResource.IsEnumerable > 0),
				count: 0
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
			locationName: '',
			dbLocationName: '',
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
		console.log(event.target.value);
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