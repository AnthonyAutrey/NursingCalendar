import * as React from 'react';
const uuid = require('uuid/v4');
const request = require('superagent');

interface Location {
	dbName: string;
	name: string;
}

interface Props {
	handleShowAlert: Function;
}

interface State {
	locations: Location[];
	selectedLocation: string;
	selectedLocationIndex: number;
}

export class ManageLocations extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			locations: [],
			selectedLocation: '',
			selectedLocationIndex: 0
		};
	}

	componentWillMount() {
		this.getLocationsFromDB();
	}

	render() {

		let locationOptions = this.state.locations.map(location => {
			return (<option key={uuid()} value={location.name}>{location.name}</option>);
		});
		if (this.state.locations.length === 0)
			return (
				<div>
					<hr />
					<div className="w-100 px-5">
						<div className="card-body">
							<span className="card-title" style={{ fontSize: '1.5em' }}>Manage Locations</span>
							<button className="btn btn-primary float-right" onClick={this.handleAddLocation}>
								Add Location &nbsp;&nbsp;
							<span className="plusIcon oi oi-size-sm oi-plus" style={{ top: '-1px' }} />
							</button>
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
		else
			return (
				<div>
					<hr />
					<div className="w-100 px-5">
						<div className="card-body">
							<span className="card-title" style={{ fontSize: '1.5em' }}>Manage Locations</span>
							<button className="btn btn-primary float-right" onClick={this.handleAddLocation}>
								Add Location &nbsp;&nbsp;
							<span className="plusIcon oi oi-size-sm oi-plus" style={{ top: '-1px' }} />
							</button>
							<hr />
							<div className="form-group row">
								<label className="col-lg-4 col-form-label text-left">Location:</label>
								<div className="col-lg-8">
									<select
										className="form-control"
										value={this.state.selectedLocation}
										onChange={this.handleSelectedLocationChange}
									>
										{locationOptions}
									</select>
								</div>
							</div>
							<hr />
							<div className="form-group row">
								<label className="col-lg-4 col-form-label text-left">Name:</label>
								<div className="col-lg-8">
									<input
										className="form-control form-control"
										type="text"
										value={this.state.selectedLocation}
										onChange={(e) => this.handleChangeLocationName(e, this.state.selectedLocationIndex)}
									/>
								</div>
							</div>
							<div className="form-group row">
								<div className="col-lg-12">
									<button type="button" className="btn btn-danger" onClick={() => this.handleDeleteLocation(this.state.selectedLocationIndex)}>
										<span className=" oi oi-trash" />
										<span>&nbsp;&nbsp;</span>
										Delete Location
						</button>
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
						</div>
					</div>
					<hr />
				</div>
			);
	}

	getLocationsFromDB = () => {

		request.get('/api/locations').end((error: {}, res: any) => {
			if (res && res.body) {
				let parsedLocations = this.parseLocations(res.body);
				if (parsedLocations.length === 0)
					return;
				this.setState({ locations: parsedLocations, selectedLocation: parsedLocations[0].name, selectedLocationIndex: 0 });
			} else {
				alert('Error getting location data! Handle this properly!');
				this.props.handleShowAlert('error', 'Error getting class data.');
			}
		});
	}

	parseLocations = (dbLocations: any[]): Location[] => {
		let locations: Location[] = [];
		dbLocations.forEach(dbLocation => {
			let location: Location = {
				dbName: dbLocation.LocationName,
				name: dbLocation.LocationName
			};
			locations.push(location);
		});

		return locations;
	}

	handlePersistChanges = () => {
		if (!this.doValidityChecks())
			return;

		let getLocationsFromDB: Promise<Location[]> = new Promise((resolve, reject) => {
			request.get('/api/locations').end((error: {}, res: any) => {
				if (res && res.body)
					resolve(this.parseLocations(res.body));
				else
					reject();
			});
		});

		getLocationsFromDB.then((dbLocations) => {
			let locationNamesToDelete = this.getLocationNamesNotInState(dbLocations);
			let locationsToCreateInDB = this.getLocationsNotInDB(dbLocations);
			let locationsNotCreatedInDB = this.filterIdenticalLocations(this.state.locations, locationsToCreateInDB);
			let locationsToUpdateInDB = this.filterIdenticalLocations(locationsNotCreatedInDB, dbLocations);

			console.log('To Delete: ');
			console.log(locationNamesToDelete);
			console.log('To Create: ');
			console.log(locationsToCreateInDB);
			console.log('To Update: ');
			console.log(locationsToUpdateInDB);

			let persistToDBPromises = [
				this.deleteLocationsFromDB(locationNamesToDelete),
				this.createLocationsInDB(locationsToCreateInDB),
				this.updateLocationsInDB(locationsToUpdateInDB)
			];

			Promise.all(persistToDBPromises).then(() => {
				this.props.handleShowAlert('success', 'Successfully submitted data!');
				this.resetDBNames();
				location.reload();
			}).catch(() => {
				this.props.handleShowAlert('error', 'Error submitting data.');
			});
		}).catch(() => {
			this.props.handleShowAlert('error', 'Error submitting data.');
		});
	}

	getLocationNamesNotInState = (locations: Location[]): string[] => {
		let locationsNotInState = locations.filter(location => {
			return !this.state.locations.map(stateLocation => {
				return stateLocation.dbName;
			}).includes(location.dbName);
		});

		return locationsNotInState.map(location => {
			return location.name;
		});
	}

	getLocationsNotInDB = (dbLocations: Location[]): Location[] => {
		let locationsNotInDB = this.state.locations.filter(stateLocation => {
			return !dbLocations.map(dbLocation => {
				return dbLocation.dbName;
			}).includes(stateLocation.dbName);
		});

		return locationsNotInDB;
	}

	filterIdenticalLocations = (locations: Location[], filterLocations: Location[]): Location[] => {
		return locations.filter(stateLocation => {
			let isIdentical = false;
			filterLocations.forEach(dbLocation => {
				if (dbLocation.dbName === stateLocation.dbName && dbLocation.name === stateLocation.name)
					isIdentical = true;
			});

			return !isIdentical;
		});
	}

	deleteLocationsFromDB = (locationNames: string[]) => {
		return new Promise((resolve, reject) => {
			if (locationNames.length <= 0) {
				resolve();
				return;
			}

			let queryData = {
				where: {
					LocationName: locationNames
				}
			};
			let queryDataString = JSON.stringify(queryData);

			request.delete('/api/locations').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	createLocationsInDB = (locations: Location[]) => {
		return new Promise((resolve, reject) => {
			if (locations.length <= 0) {
				resolve();
				return;
			}

			let queryData: {}[] = locations.map(location => {
				return {
					insertValues: {
						LocationName: location.name
					}
				};
			});

			let queryDataString = JSON.stringify(queryData);
			request.put('/api/locations').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	updateLocationsInDB = (locations: Location[]) => {
		return new Promise((resolve, reject) => {
			if (locations.length <= 0) {
				resolve();
				return;
			}

			let queryData: {}[] = locations.map(location => {
				return {
					setValues: {
						LocationName: location.name
					},
					where: {
						LocationName: location.dbName
					}
				};
			});

			let queryDataString = JSON.stringify(queryData);

			request.post('/api/locations').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	resetDBNames = () => {
		let resetLocations: Location[] = this.state.locations.map(location => {
			return {
				dbName: location.name,
				name: location.name
			};
		});

		this.setState({ locations: resetLocations });
	}

	handleSelectedLocationChange = (event: any) => {
		event.preventDefault();

		if (!this.doValidityChecks())
			return;

		let locationName = event.target.value;
		let locationIndex = this.getSelectedLocationIndex(locationName);
		this.setState({ selectedLocation: locationName, selectedLocationIndex: locationIndex });
	}

	handleChangeLocationName = (event: any, index: number) => {
		console.log('handleChangeLocationName');
		console.log(index);
		if (event.target.value.length <= 60) {
			let locations = this.state.locations.slice(0);
			locations[index].name = event.target.value;
			this.setState({ locations: locations, selectedLocation: event.target.value });
		}
	}

	getSelectedLocation = () => {
		return this.state.locations.slice(0)[this.state.selectedLocationIndex];
	}

	getSelectedLocationIndex = (locationName: String): number => {
		let index = -1;
		this.state.locations.forEach((location, locIndex) => {
			if (locationName === location.name)
				index = locIndex;
		});

		return index;
	}

	handleAddLocation = () => {
		if (!this.doValidityChecks())
			return;

		let newLocationCount = 0;

		if (this.state.locations.length !== 0)
			this.state.locations.forEach(location => {
				if (location.name.substr(0, 12) === 'New Location')
					newLocationCount++;
			});

		this.state.locations.forEach(location => {
			if (location.name.trim() === ('New Location ' + ((newLocationCount <= 0) ? '' : newLocationCount)).trim())
				newLocationCount++;
		});

		let newLocation: Location = {
			dbName: ('New Location ' + ((newLocationCount === 0) ? '' : newLocationCount)).trim(),
			name: ('New Location ' + ((newLocationCount === 0) ? '' : newLocationCount)).trim()
		};

		let locations = this.state.locations.slice(0);
		locations.push(newLocation);

		this.setState({
			locations: locations,
			selectedLocation: newLocation.name,
			selectedLocationIndex: locations.length - 1
		});
	}

	handleDeleteLocation = (index: number) => {
		if (!confirm('Are you sure you want to delete this location? This will delete the location and all of its associated rooms. ' +
			'This action cannot be reverted after clicking \'Submit Changes\'!'))
			return;

		let locations = this.state.locations.slice(0);
		locations.splice(index, 1);
		if (locations.length === 0)
			this.setState({ locations: locations, selectedLocation: '', selectedLocationIndex: 0 });
		else
			this.setState({ locations: locations, selectedLocation: locations[0].name, selectedLocationIndex: 0 });
	}

	doValidityChecks(): boolean {
		if (this.state.locations.length === 0)
			return true;

		if (this.locationNameIsTaken()) {
			alert('The location name you\'ve chosen is already being used. Please enter a valid location name before continuing.');
			return false;
		}
		if (this.locationNameIsEmpty()) {
			alert('The current location name is empty. Please enter a valid location name before continuing.');
			return false;
		}

		return true;
	}

	locationNameIsTaken = (): boolean => {
		let selectedLocation: Location = this.getSelectedLocation();
		let locationNameIsTaken: boolean = false;
		this.state.locations.forEach((location, index) => {
			if (location.name === selectedLocation.name && Number(index) !== Number(this.state.selectedLocationIndex))
				locationNameIsTaken = true;
		});

		return locationNameIsTaken;
	}

	locationNameIsEmpty = (): boolean => {
		let selectedLocation: Location = this.getSelectedLocation();
		return selectedLocation.name === '';
	}
}

export default ManageLocations;