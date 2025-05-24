const data = null;

const xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener('readystatechange', function () {
	if (this.readyState === this.DONE) {
		console.log(this.responseText);
	}
});

xhr.open('GET', 'https://forecast9.p.rapidapi.com/');
xhr.setRequestHeader('x-rapidapi-key', '966b66366fmsheb36c2bf39b9088p1a3d94jsn85dac70b7362');
xhr.setRequestHeader('x-rapidapi-host', 'forecast9.p.rapidapi.com');

xhr.send(data);