import * as React from 'react';
import { Room, Resource } from './ManageRooms';
import { RoomResource } from './RoomResource';
const uuid = require('uuid/v4');

interface Props {
	room: Room;
	allPossibleResources: Resource[];
	handleChangeResource: Function;
	handleChangeResourceCount: Function;
	handleAddResource: Function;
	handleDeleteResource: Function;
	handleCountFocusIn: Function;
	handleCountFocusOut: Function;
	focusOnResourceCount: boolean;
}

export class RoomResourceSelector extends React.Component<Props, {}> {
	constructor(props: Props, state: {}) {
		super(props, state);
	}

	render() {

		let unselectedResources = this.props.allPossibleResources.filter(resource => {
			let unselected = true;
			this.props.room.resources.forEach(selectedResource => {
				if (selectedResource.name === resource.name)
					unselected = false;
			});
			return unselected;
		});

		let selectedResources: Resource[] = [];
		let selectors = this.props.room.resources.map((resource, index) => {
			let resourceOptions = unselectedResources;
			resourceOptions.unshift(resource);

			selectedResources.push(resource);
			unselectedResources = unselectedResources.filter(unselectedResource => {
				return !selectedResources.includes(unselectedResource);
			});

			return (
				<RoomResource
					key={uuid()}
					index={index}
					resources={resourceOptions}
					selectedResource={resource}
					handleChangeResource={this.props.handleChangeResource}
					handleChangeResourceCount={this.props.handleChangeResourceCount}
					handleDelete={this.props.handleDeleteResource}
					handleCountFocusIn={this.props.handleCountFocusIn}
					handleCountFocusOut={this.props.handleCountFocusOut}
					focusOnResourceCount={this.props.focusOnResourceCount}
				/>
			);
		});

		let addButton = null;
		if (this.props.room.resources.length < this.props.allPossibleResources.length)
			addButton = (
				<span className="addButton btn btn-primary cursor-p float-right" onClick={() => this.props.handleAddResource()}>
					Add Resource &nbsp;&nbsp;
					<span className="plusIcon oi oi-size-sm oi-plus" />
				</span>
			);

		if (selectors.length === 0)
			return (
				<div>
					<div className="form-group row">
						<div className="col-lg-12">
							{addButton}
						</div>
					</div>
				</div>
			);

		return (
			<div>
				<div className="form-group row">
					<label className="col-lg-4 col-form-label text-left">Resources:</label>
					<div className="col-lg-8 float-left">
						{selectors}
						{addButton}
					</div>
				</div>
			</div>
		);
	}
}

export default RoomResourceSelector;