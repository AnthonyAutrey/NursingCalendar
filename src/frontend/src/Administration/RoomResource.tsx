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
	handleCountFocusIn: Function;
	handleCountFocusOut: Function;
	focusOnResourceCount: boolean;
}

export class RoomResource extends React.Component<Props, {}> {
	constructor(props: Props, state: {}) {
		super(props, state);
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
							type="text"
							value={this.props.selectedResource.count}
							autoFocus={this.props.focusOnResourceCount}
							onBlur={() => this.props.handleCountFocusOut()}
							onFocus={(e) => { this.props.handleCountFocusIn(); this.moveCaretAtEnd(e); }}
							onChange={(event) => this.props.handleChangeResourceCount(event, this.props.index)}
						/>
						<button className="btn btn-danger ml-2" onClick={() => this.props.handleDelete(this.props.index)}>&#10006;</button>
					</div>
				</div>
			);
	}

	moveCaretAtEnd(e: any) {
		let tempValue = e.target.value;
		e.target.value = '';
		e.target.value = tempValue;
	}
}

export default RoomResource;