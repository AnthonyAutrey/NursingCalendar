import * as React from 'react';
import { Room } from '../Scheduler/Scheduler';
const uuid = require('uuid/v4');
const request = require('superagent');

interface Props {

}
interface State {
	rooms: Room[];
}

export class ManageRooms extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			rooms: []
		};
	}

	componentWillMount() {
		this.getAllRoomsFromDB();
	}

	// render() {
	// 	let roomOptions = this.state.rooms.map(room => {
	// 		return (<option key={uuid()}>{room.locationName + ' - ' + room.roomName}</option>);
	// 	});
	// 	return (
	// 		<div>
	// 			<div className="w-100 px-5">
	// 				<div className="card-body">
	// 					<h4 className="card-title">{'Manage Rooms'}</h4>
	// 					<hr />
	// 					<div className="form-group d-flex">
	// 						<div className="w-100 mr-2">
	// 							<select
	// 								className="form-control"
	// 							>
	// 								{roomOptions}
	// 							</select>
	// 						</div>
	// 						<div className="ml-auto" style={{ width: '120px !important' }}>
	// 							<button className="btn btn-primary col-form-label text-mid btn-block">
	// 								Edit Room
	// 							</button>
	// 						</div>
	// 					</div>
	// 					<div className="form-group d-flex">
	// 						<div className="w-100 mr-2" />
	// 						<div className="ml-auto" style={{ width: '120px !important' }}>
	// 							<button className="btn btn-primary col-form-label text-mid ml-auto">
	// 								Add Room &nbsp;&nbsp;
	// 							<span className="plusIcon oi oi-size-sm oi-plus" />
	// 							</button>
	// 						</div>
	// 					</div>
	// 				</div>
	// 			</div>
	// 		</div>
	// 	);
	// }

	render() {

		let roomOptions = this.state.rooms.map(room => {
			return (<option key={uuid()}>{room.locationName + ' - ' + room.roomName}</option>);
		});

		return (
			<div>
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<div className="row">
							<h4 className="card-title">{'Manage Rooms'}</h4>
							<button className="btn btn-primary col-form-label text-mid ml-auto" onClick={this.needsWork}>
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
									value={'Room Info should go here'}
									onChange={this.needsWork}
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
									value={'Room Name here'}
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
									value={'Location here'}
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
									value={'Capacity here'}
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

	getAllRoomsFromDB() {
		request.get('/api/rooms').end((error: {}, res: any) => {
			if (res && res.body) {
				let rooms: any[] = res.body;
				let parsedRooms = this.parseRoomsFromDB(rooms);
				this.setState({ rooms: parsedRooms });
			}
		});
	}

	parseRoomsFromDB(rooms: any[]): Room[] {
		let parsedRooms: Room[] = [];
		let roomMap: Map<string, Room> = new Map<string, Room>();
		rooms.forEach((room: any) => {
			if (!roomMap.has(room.RoomName + room.LocationName)) {
				let resources: { name: string, count: number }[] = [];
				if (room.ResourceName && room.Count)
					resources = [{ name: room.ResourceName, count: room.Count }];

				let newRoom: Room = {
					locationName: room.LocationName,
					roomName: room.RoomName,
					capacity: room.Capacity,
					resources: resources
				};
				roomMap.set(room.RoomName + room.LocationName, newRoom);
			} else {
				let alreadySetRoom = roomMap.get(room.RoomName + room.LocationName);
				if (alreadySetRoom)
					alreadySetRoom.resources.push({ name: room.ResourceName, count: room.Count });
			}
		});

		roomMap.forEach(parsedRoom => {
			parsedRooms.push(parsedRoom);
		});

		return parsedRooms;
	}
}

export default ManageRooms;