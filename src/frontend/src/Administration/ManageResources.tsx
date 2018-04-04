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

	render() {
		let resourceOptions = this.state.resources.map(resource => {
			return (<option key={uuid()}>{resource.name}</option>);
		});
		return (
			<div>
				<div className="w-100 px-5">
					<div className="card-body">
						<h4 className="card-title">{'Manage Resources'}</h4>
						<hr />
						<div className="form-group d-flex">
							<div className="w-100 mr-2">
								<select
									className="form-control"
									value={'this.state.selectedUserCWID'}
								>
									{resourceOptions}
								</select>
							</div>
							<div className="ml-auto" style={{ width: '120px !important' }}>
								<button className="btn btn-primary col-form-label text-mid btn-block">
									Edit Resource
								</button>
							</div>
						</div>
						<div className="form-group d-flex">
							<div className="w-100 mr-2" />
							<div className="ml-auto" style={{ width: '120px !important' }}>
								<button className="btn btn-primary col-form-label text-mid ml-auto">
									Add Resource &nbsp;&nbsp;
								<span className="plusIcon oi oi-size-sm oi-plus" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

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