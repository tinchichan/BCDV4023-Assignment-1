// jQuery is a JS library designed to simplify working with the DOM (Document Object Model) and event handling.
// This code runs the function createBugList() only after the DOM has completely loaded, ensuring safe DOM element interaction.
$(document).ready(createBugList());

//auto focus on input of add task modal
$('#add-bug-container').on('shown.bs.modal', function () {
	$('#new-bug').trigger('focus');
});

async function createBugList() {
	// Get first account provided by Ganache
	try {
		await getAccount();
		contract = new web3.eth.Contract(contractABI, contractAddress);

		try {
			bugNum = await contract.methods
				.getBugCount()
				.call({
					from: web3.eth.defaultAccount
				});
			// If there is at least one bug present...
			if (bugNum != 0) {
				// fetch all of the bugs and create the list to display
				let bugIndex = 0;
				while (bugIndex < bugNum) {
					try {
						let bug = await contract.methods
							.getTask(bugIndex)
							.call({
								from: web3.eth.defaultAccount
							});
						if (bug[0] != '') {
							// addBugToList adds a bug as a child of the <ul> tag
							addBugToList(bugIndex, bug[0], bug[1]);
						} else {
							console.log('The index is empty: ' + bugIndex);
						}
					} catch {
						console.log('Failed to get bug: ' + bugIndex);
					}
					bugIndex++;
				}
				// update the bug count
				console.log('Bug Count: ' + await contract.methods.getBugCount().call({
					from: web3.eth.defaultAccount
				}))
				
			}
		} catch {
			console.log('Failed to retrieve bug count from blockchain.');
		}
	} catch {
		console.log('Failed to retrieve default account from blockchain.');
	}
}

function addBugToList(id, name, status) {
	// get the id of the <ul> then append children to it
	let list = document.getElementById('list');
	let item = document.createElement('li');
	item.classList.add(
		'list-group-item',
		'border-0',
		'd-flex',
		'justify-content-between',
		'align-items-center'
	);
	item.id = 'item-' + id;
	// add text to the <li> element
	let bug = document.createTextNode(name);
	// create a checkbox and set its id and status
	var checkbox = document.createElement('INPUT');
	checkbox.setAttribute('type', 'checkbox');
	checkbox.setAttribute('id', 'item-' + id + '-checkbox');
	checkbox.checked = status;
	// if status is true then add bug-done class to <li> element so that the text font has a line through
	if (status) {
		item.classList.add('bug-done');
	}
	list.appendChild(item);
	item.appendChild(bug);
	item.appendChild(checkbox);
	checkbox.onclick = function () {
		changeBugStatus(checkbox.id, id);
	};
}

// change the status of the bug stored on the blockchain
async function changeBugStatus(id, bugIndex) {
	// get checkbox element
	let checkbox = document.getElementById(id);
	// get the id of the <li> element
	let textId = id.replace('-checkbox', '');
	// get the <li> element
	let text = document.getElementById(textId);
	try {
		await contract.methods
			.UpdateBugStatus(bugIndex, checkbox.checked)
			.send({
				from: web3.eth.defaultAccount
			});
		if (checkbox.checked) {
			text.classList.add('bug-done');
		} else {
			text.classList.remove('bug-done');
		}
	} catch (error) {
		console.log('Failed to change status of bug. Index: ' + bugIndex);
	}
}

async function addBug(id, des, critical) {
	let form = document.getElementById('add-bug-container');
	document.getElementById('new-bug1').value = '';
	document.getElementById('new-bug2').value = '';
	document.getElementById('new-bug3').value = '';
	form.classList.remove('was-validated');
	contract.methods
		.getBugCount()
		.call({
			from: web3.eth.defaultAccount
		})
		.then(
			(bugNum) => {
				addBugToList(bugNum, name, false);
			},
			(err) => {
				console.log('Failed to retrieve the number of bugs from Ganache.');
			}
		);
	try {
		let bugNum = await contract.methods.getBugCount().call({from: web3.eth.defaultAccount});
        addBugToList(bugNum, id, false);
		await contract.methods
			.addBug(name, id, critical)
			.send({
				from: web3.eth.defaultAccount
			});
	} catch {
		console.log('Failed to save bug to blockchain.');
	}
}