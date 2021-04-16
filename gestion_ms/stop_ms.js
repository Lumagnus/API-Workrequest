const exec = require('child_process').exec;

// to terminate the different started microservices...
exec('tasklist', (error, stdout, stderr) => {
	if (error) {
		console.error(`exec error: ${error}`);
		return;
	}
	//console.log(`stdout\n: ${stdout}`);
	// find node processes from ps output
	var lines = stdout.split("\n")
	lines.forEach(function(line) {
		if (line.indexOf("node.exe") >= 0) {
			var items = line.split(" ");
			var killcmd = 'taskkill /IM ' + items[0] + ' /F';
			exec(killcmd, (error, stdout, stderr) => {
				if (error) {
					console.error(`exec error: ${error}`);
					return;
				}
				if (stderr.length != 0) {
					console.log(`stderr: ${stderr}`);
				}
			})
		}
	})
});