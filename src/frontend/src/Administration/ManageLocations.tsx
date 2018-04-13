import * as React from 'react';
const uuid = require('uuid/v4');
const request = require('superagent');

interface Location {
	dbName: string;
	name: string;
}

interface Props { }

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
			return (<option key={uuid()}>{location.name}</option>);
		});

		return (
			<div>
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<div className="row">
							<h4 className="card-title">{'Manage Locations'}</h4>
							<button className="btn btn-primary col-form-label text-mid ml-auto" onClick={this.handleAddLocation}>
								Add Location &nbsp;&nbsp;
									<span className="plusIcon oi oi-size-sm oi-plus" />
							</button>
						</div>
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

	needsWork = () => { return true; };

	getLocationsFromDB = () => {
		request.get('/api/locations').end((error: {}, res: any) => {
			if (res && res.body)
				this.parseLocations(res.body);
			// else
			// this.props.handleShowAlert('error', 'Error getting class data.');
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
		this.setState({ locations: locations, selectedLocation: locations[0].name });

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
				// this.props.handleShowAlert('success', 'Successfully submitted data!');
				this.resetDBNames();
			}).catch(() => {
				// this.props.handleShowAlert('error', 'Error submitting data.');
			});
		}).catch(() => {
			// this.props.handleShowAlert('error', 'Error submitting data.');
		});
	}

	getLocationNamesNotInState = (locations: Location[]): string[] => {
		let locationsNotInState = locations.filter(location => {
			return !this.state.locations.map(stateLocation => {
				return stateLocation.name;
			}).includes(location.name);
		});

		return locationsNotInState.map(location => {
			return location.name;
		});
	}

	getLocationsNotInDB = (dbLocations: Location[]): Location[] => {
		let locationsNotInDB = this.state.locations.filter(stateLocation => {
			return !dbLocations.map(dbLocation => {
				return dbLocation.name;
			}).includes(stateLocation.name);
		});

		return locationsNotInDB;
	}

	filterIdenticalLocations = (locations: Location[], filterLocations: Location[]): Location[] => {
		return locations.filter(stateLocation => {
			let isIdentical = false;
			filterLocations.forEach(dbLocation => {
				if (dbLocation.name === stateLocation.name)
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
		console.log(locationName);
		this.setState({ selectedLocation: locationName});
	}

	handleChangeLocationName = (event: any, index: number) => {
		if (event.target.value.length <= 60) {
			let locations = this.state.locations.slice(0);
			locations[index].name = event.target.value;
			this.setState({ locations: locations , selectedLocation: event.target.value, selectedLocationIndex: index});
		}
	}

	getSelectedLocation = () => {
		return this.state.locations.slice(0)[this.state.selectedLocationIndex];
	}

	handleAddLocation = () => {
		if (!this.doValidityChecks())
			return;

		let newLocationCount = 0;
		this.state.locations.forEach(location => {
			if (location.name.substr(0, 12) === 'New Location')
				newLocationCount++;
		});

		let newLocation: Location = {
			dbName: ('New Location ' + ((newLocationCount === 0) ? '' : newLocationCount)).trim(),
			name: ('New Location ' + ((newLocationCount === 0) ? '' : newLocationCount)).trim()
		};

		let locations = this.state.locations.slice(0);
		locations.push(newLocation);

		this.setState({ locations: locations, selectedLocation: newLocation.name, selectedLocationIndex: locations.length - 1});
	}

	handleDeleteLocation = (index: number) => {
		if (!confirm('Are you sure you want to delete this location?'))
			return;

		let locations = this.state.locations.slice(0);
		locations.splice(index, 1);

		this.setState({ locations: locations, selectedLocation: this.state.locations[0].name, selectedLocationIndex: 0 });
	}

	doValidityChecks(): boolean {
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