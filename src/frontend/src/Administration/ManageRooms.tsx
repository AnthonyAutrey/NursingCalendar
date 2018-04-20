import * as React from 'react';
// import { Room } from '../Scheduler/Scheduler';
const uuid = require('uuid/v4');
const request = require('superagent');

// TODO: Discuss the implementation of this interface with Tony.
// Do we want to add extra fields to the Room interface from Scheduler or keep this new one?
interface TempRoom {
	locationName: string;
	dbLocationName: string;
	roomName: string;
	dbRoomName: string;
	capacity: number;
	dbCapacity: number;
	resources: { name: string, count: number }[];
	dbResources: { name: string, count: number }[];
}

interface Props {
	handleShowAlert: Function;
}

interface State {
	rooms: TempRoom[];
	selectedRoomIndex: number;
	initialized: boolean;
}
// TODO: Finish adding functionality to this class
export class ManageRooms extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			rooms: [],
			selectedRoomIndex: 0,
			initialized: false
		};
	}

	componentWillMount() {
		this.getRoomsFromDB();
	}

	render() {
		if (!this.state.initialized)
			return null;

		let roomOptions = this.state.rooms.map(room => {
			return (<option key={uuid()} value={room.roomName}>{room.locationName + ' - ' + room.roomName}</option>);
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
									value={this.state.rooms[this.state.selectedRoomIndex].roomName}
									onChange={this.handleSelectedRoomChange}
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
									onChange={this.needsWork}
								/>
							</div>
						</div>
						<div className="form-group row">
							<label className="col-lg-4 col-form-label text-left">Location:</label>
							<div className="col-lg-8">
								<input
									className="form-control form-control"
									type="text"
									value={this.state.rooms[this.state.selectedRoomIndex].locationName}
									onChange={this.needsWork}
								/>
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
				this.setState({ rooms: parsedRooms, selectedRoomIndex: 0, initialized: true });
			} else {
				alert('Error getting room data! Handle this properly!');
				this.props.handleShowAlert('error', 'Error getting class data.');
			}
		});
	}

	parseRooms = (dbRooms: any[]): TempRoom[] => {
		let rooms: TempRoom[] = [];
		dbRooms.forEach(dbRoom => {
			let room: TempRoom = {
				locationName: dbRoom.LocationName,
				dbLocationName: dbRoom.LocationName,
				roomName: dbRoom.RoomName,
				dbRoomName: dbRoom.RoomName,
				capacity: dbRoom.Capacity,
				dbCapacity: dbRoom.Capacity,
				resources: dbRoom.Resources,
				dbResources: dbRoom.Resources
			};
			rooms.push(room);
		});
		if (rooms.length === 0) {
			let newRoom: TempRoom = {
				locationName: '',
				dbLocationName: '',
				roomName: 'New Room',
				dbRoomName: 'New Room',
				capacity: 0,
				dbCapacity: 0,
				resources: [],
				dbResources: []
			};
			rooms.push(newRoom);
		}
		console.log(rooms);
		return rooms;
	}

	handleAddRoom = () => {
		if (!this.doValidityChecks())
			return;

		let newRoomCount = 0;
		this.state.rooms.forEach(room => {
			if (room.roomName.substr(0, 8) === 'New Room')
				newRoomCount++;
		});

		// TODO: Handle the location selection on this new room effectively.
		let newRoom: TempRoom = {
			locationName: '',
			dbLocationName: '',
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
		console.log(event.target.value);

		if (!this.doValidityChecks())
			return;

		let roomName = event.target.value;
		let roomIndex = this.getSelectedRoomIndex(roomName);
		this.setState({selectedRoomIndex: roomIndex });
	}

	getSelectedRoomIndex = (roomName: String): number => {
		let index = -1;
		this.state.rooms.forEach((room, roomIndex) => {
			if (roomName === room.roomName)
				index = roomIndex;
		});

		return index;
	}

	doValidityChecks(): boolean {
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
		let selectedRoom: TempRoom = this.getSelectedRoom();
		let roomNameIsTaken: boolean = false;
		this.state.rooms.forEach((room, index) => {
			if (room.locationName === selectedRoom.locationName && 
				room.roomName === selectedRoom.roomName && Number(index) !== Number(this.state.selectedRoomIndex))
				roomNameIsTaken = true;
		});

		return roomNameIsTaken;
	}

	roomNameIsEmpty = (): boolean => {
		let selectedRoom: TempRoom = this.getSelectedRoom();
		return selectedRoom.roomName === '';
	}

	getSelectedRoom = () => {
		return this.state.rooms.slice(0)[this.state.selectedRoomIndex];
	}
}

export default ManageRooms;