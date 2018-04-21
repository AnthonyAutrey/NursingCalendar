import * as React from 'react';
import { CSSProperties } from 'react';
const uuid = require('uuid/v4');

interface Props {
	show: boolean;
	closeHandler: Function;
	creationHandler: Function;
}

interface State {
	name: string;
}

export class CreateLocationModal extends React.Component<Props, State> {
	private defaultName: string = 'New Location';
	public nameInput: any = null;

	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			name: ''
		};
	}

	render() {
		if (!this.props.show)
			return null;

		let backdropStyle: CSSProperties = {
			zIndex: Number.MAX_SAFE_INTEGER,
			position: 'fixed',
			overflow: 'auto',
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
			backgroundColor: 'rgba(0,0,0,0.3)',
			padding: 'auto'
		};

		return (
			<div onKeyPress={this.handleKeyPress} style={backdropStyle}>
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<input
								autoFocus={true}
								tabIndex={1}
								type="text"
								placeholder="New Location"
								value={this.state.name}
								onChange={this.handleNameChange}
								className="modal-title form-control mx-0 px-0"
								id="exampleModalLabel"
							/>
							<button type="button" className="close" onClick={this.close} aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	handleNameChange = (location: any) => {
		this.setState({ name: location.target.value });
	}

	handleKeyPress = (event: any) => {
		if (event.key === 'Enter')
			this.save();
	}

	close = () => {
		this.resetFields();
		this.props.closeHandler();
	}

	save = () => {
		let name = this.state.name;
		if (name === '')
			name = this.defaultName;
		this.props.creationHandler(name);
		this.resetFields();
	}

	resetFields = () => {
		this.setState({ name: '' });
	}
}

export default CreateLocationModal;