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
				{
					this.props.selectedResource.count &&
					<input
						className="form-control ml-2"
						style={{ width: 90 }}
						type="number"
						value={this.props.selectedResource.count}
						onChange={(event) => this.props.handleChangeResourceCount(event, this.props.index)}
					/>
				}
				<button className="btn btn-danger ml-2" onClick={() => this.props.handleDelete(this.props.index)}>&#10006;</button>
			</div>
		);
	}
}

export default RoomResource;