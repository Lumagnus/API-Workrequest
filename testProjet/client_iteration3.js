'use strict'

const {expect} = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Restify = require('restify-clients');

const client = Restify.createJsonClient({
    url: 'http://localhost:3000'
});

// test data...
let paulWR = {
    applicant: "paul",
    work: "PC update",
    dc_date: "05/06/2021"
};

let pierreWR = {
    applicant: "pierre",
    work: "PC configuration",
    dc_date: "07/05/2021"
};

let henriWR = {
    applicant: "henry",
    work: "Hard disk installation",
    dc_date: "21/05/2021"
};

let jacquesWR = {
    applicant: "jacques",
    work: "PC installation",
    dc_date: "21/05/2021"
};

// to make asynchronous calls
function makePromiseRequest(request, route, arg) {
    var args = [route];
    var i = 1;
    // the number of arguments depends on the type of the request (only for POST and PUT)
    if (arg !== undefined) {
        args[1] = arg
        i++;
    }
    return new Promise(resolve => {
        args[i] = (err, req, res, result) => {
            resolve(result);
        };
        request.apply(client, args);
    });
}

// build current date
function currentDate() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;
    return today;
}

lab.experiment('work request app', () => {

    // delay between each test (if necessary)

    lab.beforeEach(() => {

        return new Promise( (resolve) => {
            // Wait 50 ms
            setTimeout( () => { resolve(); }, 50);
        });
    });


    // 1
    lab.test('create a wr from paul', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', paulWR);
        expect(result).to.not.be.null();
        expect(result.success).to.be.true();
        // for creation (post) we use 'include' because fields are added
        expect(result.data[0]).to.include(paulWR);
        expect(result.data[0].id).to.not.be.undefined();
        expect(result.data[0].state).to.be.equals('created');
        // completion date doesn't exist because wr isn't closed
        expect(result.data[0].compl_date).to.not.exist();
        paulWR = result.data[0];
    });

    // 2
    lab.test('get w/ id', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/' + paulWR.id);
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
        // completion date doesn't exist because wr isn't closed
        expect(result.data[0].compl_date).to.not.exist();
    });

    // 3
    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(1);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(0);
    });

    // 4
    lab.test('get user stats for ' + paulWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + paulWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(paulWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(1);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    // 5
    lab.test('update work item', async () => {
        let newWorkItem = 'PC reinstall';
        const result = await makePromiseRequest(client.put, '/api/wr/' + paulWR.id, {"work": newWorkItem});
        expect(result.success).to.be.true();
        paulWR.work = newWorkItem;
        expect(result.data[0]).to.be.equals(paulWR);
        // completion date doesn't exist because wr isn't closed
        expect(result.data[0].compl_date).to.not.exist();
    });

    // 6
    lab.test('update state (closing)', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/' + paulWR.id, {"state": "closed"});
        expect(result.success).to.be.true();
        paulWR.state = 'closed';
        paulWR.compl_date = currentDate();
        expect(result.data[0]).to.be.equals(paulWR);
    });

    // 7
    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(1);
        expect(result.data.global_stats_wr_opened).to.be.equals(0);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

    // 8
    lab.test('get user stats for ' + paulWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + paulWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(paulWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

    // 9
    lab.test('attempt to update a closed wr', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/' + paulWR.id, {"work": "PC reinstall"});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr is already closed');
    });

    // 10
    lab.test('attempt to delete a closed wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr/' + paulWR.id);
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr is already closed');
    });

    // 11
    lab.test('create a wr from pierre', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', pierreWR);
        expect(result.success).to.be.true();
        expect(result.data[0]).to.include(pierreWR);
        // completion date doesn't exist because wr isn't closed
        expect(result.data[0].compl_date).to.not.exist();
        pierreWR = result.data[0];
    });

    // 12
    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(2);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

    // 13
    lab.test('get user stats for ' + pierreWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + pierreWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(pierreWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(1);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    // 14
    lab.test('get all WR (w/o id)', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr');
        expect(result.success).to.be.true();
        // tests inclusion in both directions to determine equality
        expect(result.data).to.include([paulWR, pierreWR]);
        expect([paulWR, pierreWR]).to.include(result.data);
    });

    // 15
    lab.test('delete an opened wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr/' + pierreWR.id);
        expect(result.success).to.be.true();
        expect(result.data[0]).to.be.equals(pierreWR);
    });

    // 16
    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(2);
        expect(result.data.global_stats_wr_opened).to.be.equals(0);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

    // 17
    lab.test('get user stats for ' + pierreWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + pierreWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(pierreWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    // 18
    lab.test('attempt to update a dummy wr', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/_______', {});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr not found');
    });

    // 19
    lab.test('attempt to update a wr w/o id', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr', {});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr id not provided');
    });

    // 20
    lab.test('attempt to delete a dummy wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr/_______');
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr not found');
    });

    // 21
    lab.test('create a wr from henri', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', henriWR);
        expect(result.success).to.be.true();
        expect(result.data[0]).to.include(henriWR);
        // completion date doesn't exist because wr isn't closed
        expect(result.data[0].compl_date).to.not.exist();
        henriWR = result.data[0];
    });

    // 22
    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(3);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

    // 23
    lab.test('get user stats for ' + henriWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + henriWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(henriWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(1);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    // 24
    lab.test('create a wr from jacques', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', jacquesWR);
        expect(result.success).to.be.true();
        expect(result.data[0]).to.include(jacquesWR);
        // completion date doesn't exist because wr isn't closed
        expect(result.data[0].compl_date).to.not.exist();
        jacquesWR = result.data[0];
    });

    // 25
    lab.test('update state (closing)', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/' + jacquesWR.id, {"state": "closed"});
        expect(result.success).to.be.true();
        jacquesWR.state = 'closed';
        jacquesWR.compl_date = currentDate();
        expect(result.data[0]).to.be.equals(jacquesWR);
    });

    // 26
    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(4);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(2);
    });

    // 27
    lab.test('get user stats for ' + jacquesWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + jacquesWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(jacquesWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

    // 28
    // drop all work (not closed) requests
    lab.test('delete all wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr');
        expect(result.success).to.be.true();
    });

    // 29
    lab.test('get all wr (w/o id)', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr');
        expect(result.success).to.be.true();
        //console.log(result)
        // only PaulWR and JacquesWR have not been deleted because there are closed
        expect(result.data).to.include([paulWR, jacquesWR]);
        expect([paulWR, jacquesWR]).to.include(result.data);
    });

    // 30
    lab.test('get global stats after delete', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
            expect(result.success).to.be.true();
            expect(result.data.global_stats_wr_created).to.be.equals(4);
            expect(result.data.global_stats_wr_opened).to.be.equals(0);
            expect(result.data.global_stats_wr_closed).to.be.equals(2);
    });

    // 31
    lab.test('get user stats for ' + paulWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + paulWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(paulWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

    // 32
    lab.test('get user stats for ' + pierreWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + pierreWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(pierreWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    // 33
    lab.test('get user stats for ' + henriWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + henriWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(henriWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    // 34
    lab.test('get user stats for ' + jacquesWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + jacquesWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(jacquesWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

});

