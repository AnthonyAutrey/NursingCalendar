import * as React from 'react';
import { Resource } from './ManageRooms';
const uuid = require('uuid/v4');

interface Props {
	index: number;
	resources: Resource[];
	selectedResource: Resource;
	handleChangeResource: Function;
	handleChangeResourceCount: Function;
	handleDelete: Function;
}

interface State {
	resourceCount: number;
}

export class RoomResource extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = { resourceCount: this.props.selectedResource.count || 0 };
	}

	render() {
		let resourceOptions = this.props.resources.map(resource => {
			return (<option key={uuid()} value={resource.name}>{resource.name}</option>);
		});

		if (!this.props.selectedResource.isEnumerable)
			return (
				<div className="d-flex row mb-3">
					<div className="col d-flex">
						<select
							key={uuid()}
							className="form-control"
							value={this.props.selectedResource.name}
							onChange={(event) => this.props.handleChangeResource(event, this.props.index)}
						>
							{resourceOptions}
						</select>
						<button className="btn btn-danger ml-2" onClick={() => this.props.handleDelete(this.props.index)}>&#10006;</button>
					</div>
				</div>
			);
		else
			return (
				<div className="d-flex row mb-3">
					<div className="col d-flex">
						<select
							key={uuid()}
							className="form-control"
							value={this.props.selectedResource.name}
							onChange={(event) => this.props.handleChangeResource(event, this.props.index)}
						>
							{resourceOptions}
						</select>
						<input
							className="form-control ml-2"
							style={{ width: 90 }}
							type="number"
							value={this.state.resourceCount}
							onChange={(event) => this.handleChangeLocalResourceCount(event)}
							onBlur={() => this.props.handleChangeResourceCount(this.state.resourceCount, this.props.index)}

						/>
						<button className="btn btn-danger ml-2" onClick={() => this.props.handleDelete(this.props.index)}>&#10006;</button>
					</div>
				</div>
			);
	}

	handleChangeLocalResourceCount = (event: any) => {
		this.setState({ resourceCount: event.target.value });
	}
}

export default RoomResource;