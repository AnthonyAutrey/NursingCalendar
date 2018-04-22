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

export class RoomResource extends React.Component<Props, {}> {
	constructor(props: Props, state: {}) {
		super(props, state);
	}

	render() {
		let resourceOptions = this.props.resources.map(resource => {
			return (<option key={uuid()} value={this.props.index}>{resource.name}</option>);
		});

		if (!this.props.selectedResource.count)
			return (
				<div className="d-flex mb-3">
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
			);
		else
			return (
				<div className="d-flex mb-3">
					<div className="col-lg-8 d-flex mr-3">
						<select
							key={uuid()}
							className="form-control"
							value={this.props.selectedResource.name}
							onChange={(event) => this.props.handleChangeResource(event, this.props.index)}
						>
							{resourceOptions}
						</select>
					</div>
					<div className="col-lg-4 d-flex">
						<input
							className="form-control"
							type="number"
							value={this.props.selectedResource.count}
							onChange={(event) => this.props.handleChangeResourceCount(event, this.props.index)}
						/>
						<button className="btn btn-danger ml-2" onClick={() => this.props.handleDelete(this.props.index)}>&#10006;</button>
					</div>
				</div>
			);
	}
}

export default RoomResource;