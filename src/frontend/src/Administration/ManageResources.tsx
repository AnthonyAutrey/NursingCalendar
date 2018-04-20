import * as React from 'react';
const uuid = require('uuid/v4');
const request = require('superagent');

interface Resource {
	dbName: string;
	name: string;
	dbIsEnumerable: number;
	isEnumerable: number;
	isEnumerableBoolean: boolean;
}

interface Props {
	handleShowAlert: Function;
}

interface State {
	resources: Resource[];
	selectedResource: string;
	selectedResourceIndex: number;
	selectedResourceIsEnumerable: boolean;
}

// TODO: Finish adding functionality to this class
export class ManageResources extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			resources: [],
			selectedResource: '',
			selectedResourceIndex: 0,
			selectedResourceIsEnumerable: false
		};
	}

	componentWillMount() {
		this.getResourcesFromDB();
	}

	render() {
		let resourceOptions = this.state.resources.map(resource => {
			return (<option key={uuid()} value={resource.name}>{resource.name}</option>);
		});

		if (this.state.resources.length === 0)
			return (
				<div>
					<hr />
					<div className="w-100 px-5">
						<div className="card-body">
							<div className="row">
								<h4 className="card-title">Manage Resources</h4>
								<button className="btn btn-primary col-form-label text-mid ml-auto" onClick={this.handleAddResource}>
									Add Resource &nbsp;&nbsp;
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
		else
			return (
				<div>
					<hr />
					<div className="w-100 px-5">
						<div className="card-body">
							<div className="row">
								<h4 className="card-title">Manage Resources</h4>
								<button className="btn btn-primary col-form-label text-mid ml-auto" onClick={this.handleAddResource}>
									Add Resource &nbsp;&nbsp;
									<span className="plusIcon oi oi-size-sm oi-plus" />
								</button>
							</div>
							<hr />
							<div className="form-group row">
								<label className="col-lg-4 col-form-label text-left">Resource:</label>
								<div className="col-lg-8">
									<select
										className="form-control"
										value={this.state.selectedResource}
										onChange={this.handleSelectedResourceChange}
									>
										{resourceOptions}
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
										value={this.state.selectedResource}
										onChange={(e) => this.handleChangeResourceName(e, this.state.selectedResourceIndex)}
									/>
								</div>
							</div>
							{/*TODO Add a tooltip and fix that shizzle*/}
							<div className="form-group row">
								<label className="col-lg-4 col-form-label text-left">
									This resource should be counted for each room: &nbsp;
							</label>
								<input
									type="checkbox"
									onChange={() => { this.handleChangeResourceIsEnumerable(this.state.selectedResourceIndex); }}
									checked={this.state.selectedResourceIsEnumerable}
								/>
							</div>
							<div className="form-group row">
								<div className="col-lg-12">
									<button type="button" className="btn btn-danger" onClick={() => this.handleDeleteResource(this.state.selectedResourceIndex)}>
										<span className=" oi oi-trash" />
										<span>&nbsp;&nbsp;</span>
										Delete Resource
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

	getResourcesFromDB = () => {

		request.get('/api/resources').end((error: {}, res: any) => {
			if (res && res.body) {
				let parsedResources = this.parseResources(res.body);
				if (parsedResources.length === 0)
					return;
				let initialResourceIsEnumerableCheckValue = parsedResources[0].isEnumerableBoolean;
				this.setState({
					resources: parsedResources,
					selectedResource: parsedResources[0].name,
					selectedResourceIndex: 0,
					selectedResourceIsEnumerable: initialResourceIsEnumerableCheckValue
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
				dbName: dbResource.ResourceName,
				name: dbResource.ResourceName,
				dbIsEnumerable: dbResource.IsEnumerable,
				isEnumerable: dbResource.IsEnumerable,
				isEnumerableBoolean: (dbResource.IsEnumerable > 0)
			};
			resources.push(resource);
		});

		return resources;
	}

	handlePersistChanges = () => {
		if (!this.doValidityChecks())
			return;

		let getResourcesFromDB: Promise<Resource[]> = new Promise((resolve, reject) => {
			request.get('/api/resources').end((error: {}, res: any) => {
				if (res && res.body)
					resolve(this.parseResources(res.body));
				else
					reject();
			});
		});

		getResourcesFromDB.then((dbResources) => {
			let resourceNamesToDelete = this.getResourceNamesNotInState(dbResources);
			let resourcesToCreateInDB = this.getResourcesNotInDB(dbResources);
			let resourcesNotCreatedInDB = this.filterIdenticalResources(this.state.resources, resourcesToCreateInDB);
			let resourcesToUpdateInDB = this.determineResourcesToUpdate();

			console.log('To Delete: ');
			console.log(resourceNamesToDelete);
			console.log('To Create: ');
			console.log(resourcesToCreateInDB);
			console.log('To Update: ');
			console.log(resourcesToUpdateInDB);

			let persistToDBPromises = [
				this.deleteResourcesFromDB(resourceNamesToDelete),
				this.createResourcesInDB(resourcesToCreateInDB),
				this.updateResourcesInDB(resourcesToUpdateInDB)
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

	getResourceNamesNotInState = (resources: Resource[]): string[] => {
		let resourcesNotInState = resources.filter(resource => {
			return !this.state.resources.map(stateResource => {
				return stateResource.dbName;
			}).includes(resource.dbName);
		});

		return resourcesNotInState.map(resource => {
			return resource.name;
		});
	}

	getResourcesNotInDB = (dbResources: Resource[]): Resource[] => {
		let resourcesNotInDB = this.state.resources.filter(stateResource => {
			return !dbResources.map(dbResource => {
				return dbResource.dbName;
			}).includes(stateResource.dbName);
		});

		return resourcesNotInDB;
	}

	filterIdenticalResources = (resources: Resource[], filterResources: Resource[]): Resource[] => {
		return resources.filter(stateResource => {
			let isIdentical = false;
			filterResources.forEach(dbResource => {
				if (dbResource.dbName === stateResource.dbName && dbResource.name === stateResource.name)
					isIdentical = true;
			});

			return !isIdentical;
		});
	}

	determineResourcesToUpdate = (): Resource[] => {
		let resourcesToUpdate: Resource[] = [];
		this.state.resources.forEach(resource => {
			if ((resource.dbName !== resource.name) || (resource.dbIsEnumerable !== resource.isEnumerable))
				resourcesToUpdate.push(resource);
		});
		return resourcesToUpdate;
	}

	deleteResourcesFromDB = (resourceNames: string[]) => {

		return new Promise((resolve, reject) => {
			if (resourceNames.length <= 0) {
				resolve();
				return;
			}

			let queryData = {
				where: {
					ResourceName: resourceNames
				}
			};
			let queryDataString = JSON.stringify(queryData);

			request.delete('/api/resources').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	createResourcesInDB = (resources: Resource[]) => {
		return new Promise((resolve, reject) => {
			if (resources.length <= 0) {
				resolve();
				return;
			}

			let queryData: {}[] = resources.map(resource => {
				return {
					insertValues: {
						ResourceName: resource.name,
						IsEnumerable: resource.isEnumerable
					}
				};
			});

			let queryDataString = JSON.stringify(queryData);
			request.put('/api/resources').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	updateResourcesInDB = (resources: Resource[]) => {
		return new Promise((resolve, reject) => {
			if (resources.length <= 0) {
				resolve();
				return;
			}

			let queryData: {}[] = resources.map(resource => {
				return {
					setValues: {
						ResourceName: resource.name,
						IsEnumerable: resource.isEnumerable
					},
					where: {
						ResourceName: resource.dbName
					}
				};
			});

			let queryDataString = JSON.stringify(queryData);

			request.post('/api/resources').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	resetDBNames = () => {
		let resetResources: Resource[] = this.state.resources.map(resource => {
			return {
				dbName: resource.name,
				name: resource.name,
				dbIsEnumerable: resource.isEnumerable,
				isEnumerable: resource.isEnumerable,
				isEnumerableBoolean: (resource.isEnumerable > 0)
			};
		});

		this.setState({ resources: resetResources });
	}

	handleSelectedResourceChange = (event: any) => {
		event.preventDefault();

		if (!this.doValidityChecks())
			return;

		let resourceName = event.target.value;
		let resourceIndex = this.getSelectedResourceIndex(resourceName);
		let resourceIsEnumerable = this.state.resources[resourceIndex].isEnumerableBoolean;
		this.setState({ selectedResource: resourceName, selectedResourceIndex: resourceIndex, selectedResourceIsEnumerable: resourceIsEnumerable });
	}

	handleChangeResourceName = (event: any, index: number) => {
		if (event.target.value.length <= 60) {
			let resources = this.state.resources.slice(0);
			resources[index].name = event.target.value;
			this.setState({ resources: resources, selectedResource: event.target.value });
		}
	}

	handleChangeResourceIsEnumerable = (index: number) => {
		let resources = this.state.resources.slice(0);
		if (resources[index].isEnumerableBoolean) {
			resources[index].isEnumerable = 0;
			resources[index].isEnumerableBoolean = false;
		} else {
			resources[index].isEnumerable = 1;
			resources[index].isEnumerableBoolean = true;
		}
		this.setState({ resources: resources, selectedResourceIsEnumerable: !this.state.selectedResourceIsEnumerable });
	}

	getSelectedResource = () => {
		return this.state.resources.slice(0)[this.state.selectedResourceIndex];
	}

	getSelectedResourceIndex = (resourceName: String): number => {
		let index = -1;
		this.state.resources.forEach((resource, resIndex) => {
			if (resourceName === resource.name)
				index = resIndex;
		});

		return index;
	}

	handleAddResource = () => {
		if (!this.doValidityChecks())
			return;

		let newResourceCount = 0;
		if (this.state.resources.length !== 0)
			this.state.resources.forEach(resource => {
				if (resource.name.substr(0, 12) === 'New Resource')
					newResourceCount++;
			});

		let newResource: Resource = {
			dbName: ('New Resource ' + ((newResourceCount === 0) ? '' : newResourceCount)).trim(),
			name: ('New Resource ' + ((newResourceCount === 0) ? '' : newResourceCount)).trim(),
			dbIsEnumerable: 1,
			isEnumerable: 1,
			isEnumerableBoolean: true
		};

		let resources = this.state.resources.slice(0);
		resources.push(newResource);

		this.setState({
			resources: resources,
			selectedResource: newResource.name,
			selectedResourceIndex: resources.length - 1,
			selectedResourceIsEnumerable: true
		});
	}

	handleDeleteResource = (index: number) => {
		if (!confirm('Are you sure you want to delete this resource?'))
			return;

		let resources = this.state.resources.slice(0);
		resources.splice(index, 1);
		if (resources.length === 0)
			this.setState({ resources: resources, selectedResource: '', selectedResourceIndex: 0, selectedResourceIsEnumerable: false });
		else
			this.setState({ resources: resources, selectedResource: resources[0].name, selectedResourceIndex: 0 });
	}

	doValidityChecks(): boolean {
		if (this.state.resources.length === 0)
			return true;

		if (this.resourceNameIsTaken()) {
			alert('The resource name you\'ve chosen is already being used. Please enter a valid resource name before continuing.');
			return false;
		}
		if (this.resourceNameIsEmpty()) {
			alert('The current resource name is empty. Please enter a valid resource name before continuing.');
			return false;
		}

		return true;
	}

	resourceNameIsTaken = (): boolean => {
		let selectedResource: Resource = this.getSelectedResource();
		let resourceNameIsTaken: boolean = false;
		this.state.resources.forEach((resource, index) => {
			if (resource.name === selectedResource.name && Number(index) !== Number(this.state.selectedResourceIndex))
				resourceNameIsTaken = true;
		});

		return resourceNameIsTaken;
	}

	resourceNameIsEmpty = (): boolean => {
		let selectedResource: Resource = this.getSelectedResource();
		return selectedResource.name === '';
	}
}

export default ManageResources;