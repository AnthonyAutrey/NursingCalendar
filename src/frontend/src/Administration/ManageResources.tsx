import * as React from 'react';
const uuid = require('uuid/v4');
const request = require('superagent');

interface Resource {
	name: string;
	isEnumerable: boolean;
}

interface Props { }

interface State {
	resources: Resource[];
}

export class ManageResources extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			resources: []
		};
	}

	componentWillMount() {
		this.getResourcesFromDB();
	}

	// render() {
	// 	let resourceOptions = this.state.resources.map(resource => {
	// 		return (<option key={uuid()}>{resource.name}</option>);
	// 	});
	// 	return (
	// 		<div>
	// 			<div className="w-100 px-5">
	// 				<div className="card-body">
	// 					<h4 className="card-title">{'Manage Resources'}</h4>
	// 					<hr />
	// 					<div className="form-group d-flex">
	// 						<div className="w-100 mr-2">
	// 							<select
	// 								className="form-control"
	// 							>
	// 								{resourceOptions}
	// 							</select>
	// 						</div>
	// 						<div className="ml-auto" style={{ width: '120px !important' }}>
	// 							<button className="btn btn-primary col-form-label text-mid btn-block">
	// 								Edit Resource
	// 							</button>
	// 						</div>
	// 					</div>
	// 					<div className="form-group d-flex">
	// 						<div className="w-100 mr-2" />
	// 						<div className="ml-auto" style={{ width: '120px !important' }}>
	// 							<button className="btn btn-primary col-form-label text-mid ml-auto">
	// 								Add Resource &nbsp;&nbsp;
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

		let resourceOptions = this.state.resources.map(resource => {
			return (<option key={uuid()}>{resource.name}</option>);
		});

		return (
			<div>
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<div className="row">
							<h4 className="card-title">{'Manage Resources'}</h4>
							<button className="btn btn-primary col-form-label text-mid ml-auto" onClick={this.needsWork}>
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
									value={'dummy val'}
									onChange={this.needsWork}
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
									value={'Resource Name goes Here'}
									onChange={this.needsWork}
								/>
							</div>
						</div>
						<div className="form-group row">
							<label className="col-lg-4 col-form-label text-left">Is Enumerable:</label>
							<div className="col-lg-8">
								<input
									className="form-control form-control"
									type="text"
									value={'should be true or false, or yes or no'}
									onChange={this.needsWork}
								/>
							</div>
						</div>
						<div className="form-group row">
							<div className="col-lg-12">
								<button type="button" className="btn btn-danger" onClick={this.needsWork}>
									<span className=" oi oi-trash" />
									<span>&nbsp;&nbsp;</span>
									Delete Resource
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

	needsWork = () => {return true; };
	getResourcesFromDB = () => {
		request.get('/api/resources').end((error: {}, res: any) => {
			if (res && res.body)
				this.parseResources(res.body);
			// else
			// this.props.handleShowAlert('error', 'Error getting class data.');
		});
	}
	parseResources = (dbResources: any[]) => {
		let resources: Resource[] = [];
		dbResources.forEach(dbResource => {
			let resource: Resource = {
				name: dbResource.ResourceName,
				isEnumerable: dbResource.IsEnumerable
			};
			resources.push(resource);
		});

		this.setState({ resources: resources });
	}
}

export default ManageResources;