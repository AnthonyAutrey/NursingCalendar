import * as React from 'react';
import { CreateLocationModal } from './CreateLocationModal';
const uuid = require('uuid/v4');
const request = require('superagent');

interface Location {
	name: string;
}

interface Props { }

interface State {
	locations: Location[];
	showCreateModal: boolean;
}

export class ManageLocations extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			locations: [],
			showCreateModal: false
		};
	}

	componentWillMount() {
		this.getLocationsFromDB();
	}

	render() {
		let locationOptions = this.state.locations.map(location => {
			return (<option key={uuid()}>{location.name}</option>);
		});
		return (
			<div>
				<CreateLocationModal
					show={this.state.showCreateModal}
					creationHandler={this.handleLocationCreation}
					closeHandler={this.closeLocationCreationModal}
				/>
				<div className="w-100 px-5">
					<div className="card-body">
						<h4 className="card-title">{'Manage Locations'}</h4>
						<hr />
						<div className="form-group d-flex">
							<div className="w-100 mr-2">
								<select
									className="form-control"
									value={'this.state.selectedUserCWID'}
								>
									{locationOptions}
								</select>
							</div>
							<div className="ml-auto" style={{ width: '120px !important' }}>
								<button className="btn btn-primary col-form-label text-mid btn-block">
									Edit Location
								</button>
							</div>
						</div>
						<div className="form-group d-flex">
							<div className="w-100 mr-2" />
							<div className="ml-auto" style={{ width: '120px !important' }}>
								<button className="btn btn-primary col-form-label text-mid ml-auto" onClick={this.handleShowCreateLocationModal}>
									Add Location &nbsp;&nbsp;
								<span className="plusIcon oi oi-size-sm oi-plus" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	getLocationsFromDB = () => {
		request.get('/api/locations').end((error: {}, res: any) => {
			if (res && res.body)
				this.parseLocations(res.body);
			// else
			// this.props.handleShowAlert('error', 'Error getting class data.');
		});
	}
	parseLocations = (dbLocations: any[]) => {
		let locations: Location[] = [];
		dbLocations.forEach(dbLocation => {
			let location: Location = {
				name: dbLocation.LocationName
			};
			locations.push(location);
		});

		this.setState({ locations: locations });
	}

	persistLocationToDB = (LocationName: string) => {
		let locations = this.state.locations;
		let addingNewLocation = true;
		this.state.locations.forEach(location => {
			if (location.name === LocationName) {
				addingNewLocation = false;
				alert('This Location already exists!');
			}
		});
		if (addingNewLocation) {
			let queryData = {
				insertValues: {
					'LocationName': LocationName
				}
			};
			let queryDataString = JSON.stringify(queryData);
			request.put('/api/locations').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (!res || !res.body)
					alert('Adding New Location Failed! Handle this properly!');
			});
			locations.push({ name: LocationName });
		}
		this.setState({ locations: locations }, () => this.closeLocationCreationModal());
	}

	handleShowCreateLocationModal = () => {
		this.setState({ showCreateModal: !this.state.showCreateModal });
	}

	handleLocationCreation = (locationName: string) => {
		console.log(locationName);
		let locations = this.state.locations;
		let addingNewLocation = true;
		this.state.locations.forEach(location => {
			if (location.name === locationName) {
				addingNewLocation = false;
				alert('This Location already exists!');
			}
		});
		if (addingNewLocation) {
			let queryData = {
				insertValues: {
					'LocationName': locationName
				}
			};
			let queryDataString = JSON.stringify(queryData);
			request.put('/api/locations').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (!res || !res.body)
					alert('Adding New Location Failed! Handle this properly!');
				else
					locations.push({ name: locationName });
			});

		}
		this.setState({ locations: locations }, () => this.closeLocationCreationModal());
	}

	closeLocationCreationModal = () => {
		this.setState({ showCreateModal: false });
	}
}

export default ManageLocations;